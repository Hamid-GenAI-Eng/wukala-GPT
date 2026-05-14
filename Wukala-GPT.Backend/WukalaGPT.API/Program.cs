using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using StackExchange.Redis;
using Microsoft.Extensions.Caching.Distributed;
using WukalaGPT.API.Extensions;
using WukalaGPT.API.Middleware;
using WukalaGPT.API.Hubs;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Infrastructure;
using Hangfire;
using Hangfire.PostgreSql;
using WukalaGPT.Application.Features.Clients.Jobs;
using WukalaGPT.Application.Features.Hearings.Jobs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddInfrastructureServices(builder.Configuration);

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "WukalaGPT_";
});

builder.Services.AddSingleton<IConnectionMultiplexer>(sp => 
    ConnectionMultiplexer.Connect(builder.Configuration.GetConnectionString("Redis")!));

builder.Services.AddSignalR()
    .AddStackExchangeRedis(builder.Configuration.GetConnectionString("Redis")!);

builder.Services.AddCors(options =>
{
    options.AddPolicy("StrictProductionPolicy", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
            ?? new[] { "https://wukala-gpt.app", "http://localhost:3000", "http://localhost:3001" };
            
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); 
    });
});

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(config => 
        config.UseNpgsqlConnection(WukalaGPT.API.Extensions.InfrastructureServiceExtensions.GetPostgresConnectionString(builder.Configuration, "DefaultConnection"))));
builder.Services.AddHangfireServer();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Secret"]!)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["JwtSettings:Audience"]
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var cache = context.HttpContext.RequestServices.GetRequiredService<IDistributedCache>();
                var token = context.SecurityToken as JwtSecurityToken;
                
                if (token != null)
                {
                    var tokenString = token.RawData;
                    var isBlacklisted = await cache.GetStringAsync($"Blacklist_{tokenString}");
                    if (!string.IsNullOrEmpty(isBlacklisted))
                    {
                        context.Fail("Token has been invalidated/logged out.");
                    }
                }
            }
        };
    });

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
    if (dbContext is DbContext efContext)
    {
        try 
        {
            // Safely apply pending migrations instead of EnsureCreated which breaks schema sync on Docker restarts
            efContext.Database.Migrate();
            Console.WriteLine("Database migrations applied successfully.");
        } 
        catch (Exception ex) 
        {
            Console.WriteLine("Database initialization error: " + ex.Message);
        }
    }
}

// Configure the HTTP request pipeline.
app.ConfigureExceptionHandler();
app.UseMiddleware<RedisRateLimitingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts(); // Enforce HTTP Strict Transport Security in Prod
}

//app.UseHttpsRedirection();
app.UseCors("StrictProductionPolicy"); // Ensure only whitelisted domains can hit API

// Add UseAuthentication if you have Auth configured
app.UseAuthentication();
app.UseAuthorization();

// Expose Hangfire Dashboard locally
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    // Real deployments need authorization logic here
    Authorization = new [] { new Hangfire.Dashboard.LocalRequestsOnlyAuthorizationFilter() }
});

app.MapControllers();
app.MapHub<ChatHub>("/chathub");
app.MapHub<CaseHub>("/casehub"); // Added Real Time Case Hub
app.MapHub<NotificationHub>("/notificationhub"); // Unified Notification Socket

// Register Recurring Jobs

// Hearing Module Jobs
RecurringJob.AddOrUpdate<HearingReminderJob>("HearingReminders15m", job => job.CheckAndSendRemindersAsync(), "*/15 * * * *");
RecurringJob.AddOrUpdate<HearingAutoCompleteJob>("HearingAutoCompleteDaily", job => job.AutoCompletePastHearingsAsync(), "59 23 * * *");
RecurringJob.AddOrUpdate<HearingConflictScanJob>("HearingConflictScanDaily", job => job.ScanForConflictsAsync(), "0 6 * * *");

app.Run();
