using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.DTOs.Notifications;
using WukalaGPT.Domain.Entities;

namespace WukalaGPT.Application.Interfaces;

public interface INotificationService
{
    /// <summary>
    /// Implements the exact Architectural Pattern: DB Write -> SignalR Push
    /// </summary>
    Task<AppNotification> SendNotificationAsync(
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
        CancellationToken cancellationToken = default);

    Task<List<NotificationDto>> GetMyNotificationsAsync(Guid userId, string? tab = null);
    Task MarkAsReadAsync(Guid id, Guid userId);
    Task MarkAllReadAsync(Guid userId);
    Task DismissAsync(Guid id, Guid userId);
}

