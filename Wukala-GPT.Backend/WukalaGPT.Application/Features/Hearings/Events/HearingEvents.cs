using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace WukalaGPT.Application.Features.Hearings.Events;

public class HearingScheduledEvent : INotification
{
    public Guid HearingId { get; }
    public HearingScheduledEvent(Guid hearingId) => HearingId = hearingId;
}

public class HearingAdjournedEvent : INotification
{
    public Guid OriginalHearingId { get; }
    public Guid? NewHearingId { get; }
    public HearingAdjournedEvent(Guid originalHearingId, Guid? newHearingId)
    {
        OriginalHearingId = originalHearingId;
        NewHearingId = newHearingId;
    }
}

public class HearingCompletedEvent : INotification
{
    public Guid HearingId { get; }
    public HearingCompletedEvent(Guid hearingId) => HearingId = hearingId;
}

public class HearingCancelledEvent : INotification
{
    public Guid HearingId { get; }
    public HearingCancelledEvent(Guid hearingId) => HearingId = hearingId;
}

public class HearingAutoCompletedEvent : INotification
{
    public Guid HearingId { get; }
    public HearingAutoCompletedEvent(Guid hearingId) => HearingId = hearingId;
}

// Handlers that will use INotificationService
public class HearingEventHandler : 
    INotificationHandler<HearingScheduledEvent>,
    INotificationHandler<HearingAdjournedEvent>,
    INotificationHandler<HearingCompletedEvent>,
    INotificationHandler<HearingCancelledEvent>,
    INotificationHandler<HearingAutoCompletedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly IApplicationDbContext _context;

    public HearingEventHandler(INotificationService notificationService, IApplicationDbContext context)
    {
        _notificationService = notificationService;
        _context = context;
    }

    public async Task Handle(HearingScheduledEvent notification, CancellationToken cancellationToken)
    {
        var hearing = await _context.Hearings.Include(h => h.Case).FirstOrDefaultAsync(h => h.Id == notification.HearingId, cancellationToken);
        if (hearing != null)
        {
            await _notificationService.SendNotificationAsync(
                userId: hearing.LeadLawyerId,
                title: "New Hearing Scheduled",
                description: $"A new hearing for case '{hearing.Case.Title}' has been scheduled on {hearing.HearingDate:MMM dd} at {hearing.StartTime:HH:mm}.",
                type: "HearingSchedule",
                priority: "Normal",
                actionLabel: null,
                actionType: null,
                relatedCase: hearing.CaseId.ToString(),
                source: $"/hearings/{hearing.Id}",
                firmId: hearing.FirmId,
                skipSignalRPush: false,
                cancellationToken: cancellationToken);
        }
    }

    public async Task Handle(HearingAdjournedEvent notification, CancellationToken cancellationToken)
    {
        var oldHearing = await _context.Hearings.Include(h => h.Case).FirstOrDefaultAsync(h => h.Id == notification.OriginalHearingId, cancellationToken);
        if (oldHearing != null)
        {
            await _notificationService.SendNotificationAsync(
                userId: oldHearing.LeadLawyerId,
                title: "Hearing Adjourned",
                description: $"The hearing for case '{oldHearing.Case.Title}' has been adjourned.",
                type: "HearingAdjourn",
                priority: "High",
                actionLabel: null,
                actionType: null,
                relatedCase: oldHearing.CaseId.ToString(),
                source: $"/hearings/{oldHearing.Id}",
                firmId: oldHearing.FirmId,
                skipSignalRPush: false,
                cancellationToken: cancellationToken);
        }
    }

    public async Task Handle(HearingCompletedEvent notification, CancellationToken cancellationToken)
    {
        var hearing = await _context.Hearings.Include(h => h.Case).FirstOrDefaultAsync(h => h.Id == notification.HearingId, cancellationToken);
        if (hearing != null)
        {
            await _notificationService.SendNotificationAsync(
                userId: hearing.LeadLawyerId,
                title: "Hearing Completed",
                description: $"The hearing for case '{hearing.Case.Title}' has been marked as completed. Please ensure outcomes are recorded.",
                type: "HearingComplete",
                priority: "Normal",
                actionLabel: null,
                actionType: null,
                relatedCase: hearing.CaseId.ToString(),
                source: $"/hearings/{hearing.Id}",
                firmId: hearing.FirmId,
                skipSignalRPush: false,
                cancellationToken: cancellationToken);
        }
    }

    public async Task Handle(HearingCancelledEvent notification, CancellationToken cancellationToken)
    {
        var hearing = await _context.Hearings.Include(h => h.Case).FirstOrDefaultAsync(h => h.Id == notification.HearingId, cancellationToken);
        if (hearing != null)
        {
            await _notificationService.SendNotificationAsync(
                userId: hearing.LeadLawyerId,
                title: "Hearing Cancelled",
                description: $"The hearing for case '{hearing.Case.Title}' scheduled on {hearing.HearingDate:MMM dd} was successfully cancelled.",
                type: "HearingCancel",
                priority: "High",
                actionLabel: null,
                actionType: null,
                relatedCase: hearing.CaseId.ToString(),
                source: $"/hearings/{hearing.Id}",
                firmId: hearing.FirmId,
                skipSignalRPush: false,
                cancellationToken: cancellationToken);
        }
    }

    public async Task Handle(HearingAutoCompletedEvent notification, CancellationToken cancellationToken)
    {
        var hearing = await _context.Hearings.Include(h => h.Case).FirstOrDefaultAsync(h => h.Id == notification.HearingId, cancellationToken);
        if (hearing != null)
        {
            await _notificationService.SendNotificationAsync(
                userId: hearing.LeadLawyerId,
                title: "Hearing Auto-Completed",
                description: $"The hearing for case '{hearing.Case.Title}' has passed and was auto-completed by the system.",
                type: "HearingComplete",
                priority: "Normal",
                actionLabel: null,
                actionType: null,
                relatedCase: hearing.CaseId.ToString(),
                source: $"/hearings/{hearing.Id}",
                firmId: hearing.FirmId,
                skipSignalRPush: false,
                cancellationToken: cancellationToken);
        }
    }
}
