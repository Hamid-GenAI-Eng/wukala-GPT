using Asp.Versioning;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
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

var redisHost = builder.Configuration["REDIS_HOST"];
var redisConnectionString = !string.IsNullOrEmpty(redisHost) 
    ? $"{redisHost}:6379,abortConnect=false" 
    : builder.Configuration.GetConnectionString("Redis");

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = redisConnectionString;
    options.InstanceName = "WukalaGPT_";
});

builder.Services.AddSingleton<IConnectionMultiplexer>(sp => 
    ConnectionMultiplexer.Connect(redisConnectionString!));

builder.Services.AddSignalR()
    .AddStackExchangeRedis(redisConnectionString!);

builder.Services.AddCors(options =>
{
    options.AddPolicy("StrictProductionPolicy", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
            ?? new[] { "https://wukala-gpt.app", "http://localhost:3000", "http://localhost:3001", "http://localhost:8080", "http://localhost:8081", "http://localhost:5173" };
            
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); 
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options => 
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
// ... (other using statements are at the top)

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new HeaderApiVersionReader("x-api-version"),
        new MediaTypeApiVersionReader("x-api-version"));
    }).AddMvc().AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("AiLimiter", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 2;
    });
});

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
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];

                // If the request is for our hubs...
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) &&
                    (path.StartsWithSegments("/chathub") || 
                     path.StartsWithSegments("/casehub") || 
                     path.StartsWithSegments("/notificationhub")))
                {
                    // Read the token out of the query string for WebSocket connections
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            },
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

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("NotJuniorLawyer", policy =>
        policy.RequireAssertion(context =>
            !context.User.HasClaim(c => c.Type == "StaffRole" && c.Value == "JuniorLawyer")));
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
app.UseCors("StrictProductionPolicy"); // Ensure only whitelisted domains can hit API
app.UseRateLimiter(); // Add Rate Limiter early in pipeline
app.UseMiddleware<RedisRateLimitingMiddleware>();
app.UseMiddleware<TokenValidationMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts(); // Enforce HTTP Strict Transport Security in Prod
}

app.UseWebSockets();
// app.UseCors moved to the top of the pipeline

// Add UseAuthentication if you have Auth configured
app.UseAuthentication();
app.UseAuthorization();

// Expose Hangfire Dashboard locally
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    // Real deployments need authorization logic here
    Authorization = new [] { new AllowAllAuthorizationFilter() }
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

public class AllowAllAuthorizationFilter : Hangfire.Dashboard.IDashboardAuthorizationFilter
{
    public bool Authorize(Hangfire.Dashboard.DashboardContext context)
    {
        return true;
    }
}
