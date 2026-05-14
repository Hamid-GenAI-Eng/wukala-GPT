using Hangfire;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;

namespace WukalaGPT.Application.Features.Hearings.Jobs;

public class HearingReminderJob
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public HearingReminderJob(IApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task CheckAndSendRemindersAsync()
    {
        var now = DateTimeOffset.UtcNow;
        var upcomingWindow24hStart = now.AddHours(23);
        var upcomingWindow24hEnd = now.AddHours(25);
        
        var upcomingWindow2hStart = now.AddHours(1.75);
        var upcomingWindow2hEnd = now.AddHours(2.25);

        // Fetch candidates for 24h
        var tomorrowHearings = await _context.Hearings
            .Include(h => h.Case)
            .Where(h => h.Status == "Scheduled" && !h.IsArchived && h.Reminder24hSentAt == null)
            .ToListAsync();

        foreach (var hearing in tomorrowHearings)
        {
            var hearingTimeDto = new DateTimeOffset(hearing.HearingDate, hearing.StartTime, TimeSpan.Zero); // Assuming UTC mapping for logic
            
            if (hearingTimeDto >= upcomingWindow24hStart && hearingTimeDto <= upcomingWindow24hEnd)
            {
                await _notificationService.SendNotificationAsync(
                    userId: hearing.LeadLawyerId,
                    title: $"Upcoming Hearing Tomorrow: {hearing.Case.Title}",
                    description: $"You have a hearing scheduled tomorrow at {hearing.StartTime:HH:mm} at {hearing.CourtName}.",
                    type: "HearingReminder",
                    priority: "High",
                    actionLabel: null,
                    actionType: null,
                    relatedCase: hearing.Case.Id.ToString(),
                    source: $"/hearings/{hearing.Id}",
                    firmId: hearing.FirmId,
                    skipSignalRPush: false);

                hearing.Reminder24hSentAt = now;
            }
        }

        // Fetch candidates for 2h
        var soonHearings = await _context.Hearings
            .Include(h => h.Case)
            .Where(h => h.Status == "Scheduled" && !h.IsArchived && h.Reminder2hSentAt == null)
            .ToListAsync();

        foreach (var hearing in soonHearings)
        {
            var hearingTimeDto = new DateTimeOffset(hearing.HearingDate, hearing.StartTime, TimeSpan.Zero);
            
            if (hearingTimeDto >= upcomingWindow2hStart && hearingTimeDto <= upcomingWindow2hEnd)
            {
                await _notificationService.SendNotificationAsync(
                    userId: hearing.LeadLawyerId,
                    title: $"Hearing Starts in 2 Hours: {hearing.Case.Title}",
                    description: $"Head to {hearing.CourtName} {hearing.CourtRoom} for your hearing.",
                    type: "HearingReminder",
                    priority: "Critical",
                    actionLabel: null,
                    actionType: null,
                    relatedCase: hearing.Case.Id.ToString(),
                    source: $"/hearings/{hearing.Id}",
                    firmId: hearing.FirmId,
                    skipSignalRPush: false);

                hearing.Reminder2hSentAt = now;
            }
        }

        await _context.SaveChangesAsync(default);
    }
}
