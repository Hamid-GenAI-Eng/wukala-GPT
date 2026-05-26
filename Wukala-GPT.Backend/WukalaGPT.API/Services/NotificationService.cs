using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Application.DTOs.Notifications;
using WukalaGPT.Domain.Entities;
using WukalaGPT.API.Hubs;
using Microsoft.Extensions.DependencyInjection;

namespace WukalaGPT.API.Services;

public class NotificationService : INotificationService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(IServiceScopeFactory scopeFactory, IHubContext<NotificationHub> hubContext)
    {
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
    }

    public async Task<AppNotification> SendNotificationAsync(
        Guid userId, 
        string title, 
        string description, 
        string type, 
        string priority = "medium",
        string? actionLabel = null,
        string? actionType = null,
        string? relatedCase = null,
        string? source = null,
        Guid? firmId = null,
        bool skipSignalRPush = false,
        CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        // STEP 1: DB Native Graph Save (Source of truth)
        var notification = new AppNotification
        {
            UserId = userId,
            FirmId = firmId,
            Title = title,
            Description = description,
            Type = type,
            Priority = priority,
            ActionLabel = actionLabel,
            ActionType = actionType,
            RelatedCaseReference = relatedCase,
            Source = source,
            IsRead = false,
            CreatedAt = DateTimeOffset.UtcNow
        };

        context.AppNotifications.Add(notification);
        await context.SaveChangesAsync(cancellationToken);

        // STEP 2: SignalR Fire-And-Forget Push
        if (!skipSignalRPush)
        {
            try
            {
                await _hubContext.Clients.Group($"User_{userId}").SendAsync("ReceiveNotification", new
                {
                    notification.Id,
                    notification.Title,
                    Desc = notification.Description,
                    notification.Type,
                    notification.Priority,
                    notification.ActionLabel,
                    notification.ActionType,
                    RelatedCase = notification.RelatedCaseReference,
                    notification.Source,
                    Read = notification.IsRead,
                    notification.CreatedAt,
                    Time = GetTimeAgo(notification.CreatedAt)
                }, cancellationToken);
            }
            catch
            {
                // Push silently drops if hub errors out (e.g. redis backplane drop), DB persists!
            }
        }

        return notification;
    }

    public async Task<List<NotificationDto>> GetMyNotificationsAsync(Guid userId, string? tab = null)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var query = context.AppNotifications.AsNoTracking()
            .Where(n => n.UserId == userId && !n.IsDismissed);

        if (tab == "unread")
            query = query.Where(n => !n.IsRead);
        else if (tab == "critical")
            query = query.Where(n => n.Priority == "critical" || n.Priority == "high");
        else if (!string.IsNullOrEmpty(tab) && tab != "all")
            query = query.Where(n => n.Type == tab);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(100)
            .ToListAsync();

        return notifications.Select(n => new NotificationDto
        {
            Id = n.Id,
            Title = n.Title,
            Desc = n.Description,
            Detail = n.Detail,
            Type = n.Type,
            Priority = n.Priority,
            ActionLabel = n.ActionLabel,
            ActionType = n.ActionType,
            RelatedCase = n.RelatedCaseReference,
            Source = n.Source,
            Read = n.IsRead,
            CreatedAt = n.CreatedAt,
            Time = GetTimeAgo(n.CreatedAt)
        }).ToList();
    }

    public async Task MarkAsReadAsync(Guid id, Guid userId)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var notification = await context.AppNotifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification != null)
        {
            notification.IsRead = true;
            await context.SaveChangesAsync(default);
        }
    }

    public async Task MarkAllReadAsync(Guid userId)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var unread = await context.AppNotifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var n in unread)
        {
            n.IsRead = true;
        }

        await context.SaveChangesAsync(default);
    }

    public async Task DismissAsync(Guid id, Guid userId)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var notification = await context.AppNotifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification != null)
        {
            notification.IsDismissed = true;
            await context.SaveChangesAsync(default);
        }
    }

    private string GetTimeAgo(DateTimeOffset dateTime)
    {
        var span = DateTimeOffset.UtcNow - dateTime;
        if (span.TotalMinutes < 1) return "just now";
        if (span.TotalHours < 1) return $"{(int)span.TotalMinutes}m ago";
        if (span.TotalDays < 1) return $"{(int)span.TotalHours}h ago";
        if (span.TotalDays < 2) return "yesterday";
        return $"{(int)span.TotalDays}d ago";
    }
}

