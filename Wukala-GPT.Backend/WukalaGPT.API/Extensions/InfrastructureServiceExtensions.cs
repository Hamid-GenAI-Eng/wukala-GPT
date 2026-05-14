using Microsoft.EntityFrameworkCore;
using Resend;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Infrastructure.Persistence;
using WukalaGPT.Infrastructure.Services;

namespace WukalaGPT.API.Extensions;

public static class InfrastructureServiceExtensions
{
    public static string GetPostgresConnectionString(IConfiguration config, string name)
    {
        var connectionString = config.GetConnectionString(name);
        if (string.IsNullOrEmpty(connectionString)) return string.Empty;

        if (connectionString.StartsWith("postgres://"))
        {
            var uri = new Uri(connectionString);
            var userInfo = uri.UserInfo.Split(':');
            return $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true;";
        }

        return connectionString;
    }

    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration config)
    {
        var dbConnectionString = GetPostgresConnectionString(config, "DefaultConnection");

        services.AddDbContext<WukalaDbContext>(options =>
        {
            options.UseNpgsql(dbConnectionString);
        });

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<WukalaDbContext>());
        services.AddScoped<IAIChatService, OpenAiService>();
        services.AddScoped<IDocumentStorage, CloudStorage>();
        
        // Added for Auth
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IFileStorageService, CloudinaryService>();
        services.AddScoped<IEmailService, ResendEmailService>();
        
        services.AddHttpClient<IMizanAiClient, MizanAiClient>();
        
        services.AddOptions();
        services.AddHttpClient<ResendClient>();
        services.Configure<ResendClientOptions>(o =>
        {
            o.ApiToken = config["Resend:ApiKey"] ?? string.Empty;
        });
        services.AddTransient<IResend, ResendClient>();

        return services;
    }
}
