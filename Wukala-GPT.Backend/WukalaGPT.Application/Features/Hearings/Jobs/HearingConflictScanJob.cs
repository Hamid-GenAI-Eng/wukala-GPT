using Hangfire;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.Application.Features.Hearings.Jobs;

public class HearingConflictScanJob
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public HearingConflictScanJob(IApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task ScanForConflictsAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var future30Days = today.AddDays(30);

        var rangeHearings = await _context.Hearings.AsNoTracking()
            .Include(h => h.Case)
            .Where(h => h.HearingDate >= today && h.HearingDate <= future30Days && h.Status == "Scheduled" && !h.IsArchived)
            .OrderBy(h => h.HearingDate).ThenBy(h => h.StartTime)
            .ToListAsync();

        var groupedByLawyerAndDay = rangeHearings
            .GroupBy(h => new { h.LeadLawyerId, h.HearingDate })
            .Where(g => g.Count() > 1);

        foreach (var group in groupedByLawyerAndDay)
        {
            var dailyList = group.ToList();
            for (int i = 0; i < dailyList.Count; i++)
            {
                for (int j = i + 1; j < dailyList.Count; j++)
                {
                    var h1 = dailyList[i];
                    var h2 = dailyList[j];

                    if (h1.StartTime < h2.EndTime && h1.EndTime > h2.StartTime)
                    {
                        var overlapStart = h1.StartTime > h2.StartTime ? h1.StartTime : h2.StartTime;

                        // Call INotificationService for overlapping overlaps. Target User == LeadLawyerId
                        await _notificationService.SendNotificationAsync(
                            userId: group.Key.LeadLawyerId,
                            title: $"Hearing Conflict Detected",
                            description: $"You have an overlapping hearing scheduled on {group.Key.HearingDate:MMM dd} at {overlapStart:HH:mm} between cases '{h1.Case.Title}' and '{h2.Case.Title}'.",
                            type: "HearingConflict",
                            priority: "Urgent", // High priority
                            actionLabel: null,
                            actionType: null,
                            relatedCase: null,
                            source: $"/hearings/conflicts", // deep link to conflicts dashboard widget
                            firmId: h1.FirmId,
                            skipSignalRPush: false);
                    }
                }
            }
        }
    }
}
