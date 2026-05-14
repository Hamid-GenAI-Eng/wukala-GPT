using Microsoft.EntityFrameworkCore;
using Resend;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Infrastructure.Persistence;
using WukalaGPT.Infrastructure.Services;

namespace WukalaGPT.API.Extensions;

public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<WukalaDbContext>(options =>
        {
            options.UseNpgsql(config.GetConnectionString("DefaultConnection"));
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
