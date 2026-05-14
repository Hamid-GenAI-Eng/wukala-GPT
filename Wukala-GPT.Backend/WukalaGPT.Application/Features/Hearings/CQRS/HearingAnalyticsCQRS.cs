using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.Application.Features.Hearings.CQRS;

public class GetHearingStatsQuery : IRequest<object>
{
    public Guid FirmId { get; set; }
    public Guid? LawyerId { get; set; }
    public string Period { get; set; } = "3m"; // 3m, 6m, 12m
}

public class GetHearingStatsQueryHandler : IRequestHandler<GetHearingStatsQuery, object>
{
    private readonly IApplicationDbContext _context;

    public GetHearingStatsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<object> Handle(GetHearingStatsQuery request, CancellationToken cancellationToken)
    {
        DateTimeOffset since;
        var now = DateTimeOffset.UtcNow;
        
        switch (request.Period.ToLower())
        {
            case "6m": since = now.AddMonths(-6); break;
            case "12m": since = now.AddMonths(-12); break;
            case "3m":
            default: since = now.AddMonths(-3); break;
        }

        var sinceDate = DateOnly.FromDateTime(since.Date);

        var query = _context.Hearings.AsNoTracking()
            .Where(h => h.FirmId == request.FirmId && h.HearingDate >= sinceDate && !h.IsArchived);

        if (request.LawyerId.HasValue)
        {
            query = query.Where(h => h.LeadLawyerId == request.LawyerId.Value);
        }

        var stats = await query.ToListAsync(cancellationToken);

        var totalScheduled = stats.Count(h => h.Status == "Scheduled");
        var totalCompleted = stats.Count(h => h.Status == "Completed");
        var totalAdjourned = stats.Count(h => h.Status == "Adjourned");
        var totalCancelled = stats.Count(h => h.Status == "Cancelled");
        var totalHearings = stats.Count;

        decimal adjournmentRate = totalHearings == 0 ? 0 : Math.Round((decimal)totalAdjourned / totalHearings * 100, 2);

        var byCourtType = stats
            .GroupBy(h => h.CourtType)
            .Select(g => new
            {
                Court = g.Key,
                Count = g.Count()
            }).ToList();

        var byDayOfWeek = stats
            .GroupBy(h => h.HearingDate.DayOfWeek)
            .Select(g => new
            {
                Day = g.Key.ToString(),
                Count = g.Count()
            }).ToDictionary(x => x.Day, x => x.Count);

        var busiestDay = byDayOfWeek.OrderByDescending(x => x.Value).FirstOrDefault().Key ?? "None";

        var completedHearings = stats.Where(h => h.Status == "Completed").ToList();
        var avgDurationMins = completedHearings.Any() ? Math.Round(completedHearings.Average(h => h.DurationMins), 2) : 0;

        return new
        {
            totalScheduled,
            totalCompleted,
            totalAdjourned,
            totalCancelled,
            adjournmentRate,
            byCourtType,
            byDayOfWeek,
            busiestDay,
            avgDurationMins,
            conflictsDetected = 0 // In real system, conflict history might be queried from a notification log or evaluated at runtime. We'll stub as 0.
        };
    }
}
