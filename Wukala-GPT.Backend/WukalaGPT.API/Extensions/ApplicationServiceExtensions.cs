using WukalaGPT.Application.Features.Auth;
using WukalaGPT.Application.Features.AiChat;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.API.Extensions;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration config)
    {
        // Add Application layer services, MediatR, AutoMapper, etc.
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IMizanAiChatService, WukalaGPT.Application.Features.AiChat.MizanAiChatService>();
        services.AddScoped<ILawyerProfileService, WukalaGPT.Application.Features.Lawyer.LawyerProfileService>();
        services.AddScoped<IAdminService, WukalaGPT.Application.Features.Admin.AdminService>();
        services.AddScoped<ILawyerSearchService, WukalaGPT.Application.Features.Search.LawyerSearchService>();
        services.AddScoped<ISavedProfileService, WukalaGPT.Application.Features.Search.SavedProfileService>();
        services.AddScoped<IMessagingService, WukalaGPT.Application.Features.Messaging.MessagingService>();
        services.AddScoped<IDocumentService, WukalaGPT.Application.Features.Documents.DocumentService>();
        services.AddScoped<IAiContextCacheService, AiContextCacheService>();
        
        services.AddScoped<ICaseUpdateService, WukalaGPT.API.Hubs.CaseUpdateService>();
        services.AddScoped<INotificationService, WukalaGPT.API.Services.NotificationService>();
        services.AddScoped<IBillingService, WukalaGPT.Application.Features.Billing.BillingService>();
        services.AddScoped<IDashboardService, WukalaGPT.Application.Features.Dashboard.DashboardService>();
        services.AddScoped<IAnalyticsService, WukalaGPT.Application.Features.Analytics.AnalyticsService>();
        services.AddScoped<ITeamService, WukalaGPT.Application.Features.Team.TeamService>();

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblies(System.Reflection.Assembly.GetExecutingAssembly(), typeof(IApplicationDbContext).Assembly));


        return services;
    }
}
