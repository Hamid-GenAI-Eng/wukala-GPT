using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;

namespace WukalaGPT.Application.Features.Hearings.CQRS;

// ---------------------------------------------------------------------------------------------------------------- //
// QUERY: GET /hearings — Calendar Feed
// ---------------------------------------------------------------------------------------------------------------- //
public class GetHearingsQuery : IRequest<object>
{
    public Guid FirmId { get; set; }
    public string View { get; set; } = "month"; // month, week, day
    public DateOnly Date { get; set; }
    public Guid? LawyerId { get; set; }
    public string? Status { get; set; }
    public Guid? CaseId { get; set; }
}

public class GetHearingsQueryHandler : IRequestHandler<GetHearingsQuery, object>
{
    private readonly IApplicationDbContext _context;

    public GetHearingsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<object> Handle(GetHearingsQuery request, CancellationToken cancellationToken)
    {
        DateOnly start;
        DateOnly end;

        var inputDateTime = request.Date.ToDateTime(TimeOnly.MinValue);

        switch (request.View.ToLower())
        {
            case "month":
                start = new DateOnly(request.Date.Year, request.Date.Month, 1);
                end = new DateOnly(request.Date.Year, request.Date.Month, DateTime.DaysInMonth(request.Date.Year, request.Date.Month));
                break;
            case "week":
                int diff = (7 + (inputDateTime.DayOfWeek - DayOfWeek.Monday)) % 7;
                start = DateOnly.FromDateTime(inputDateTime.AddDays(-1 * diff).Date);
                end = start.AddDays(6);
                break;
            case "day":
            default:
                start = request.Date;
                end = request.Date;
                break;
        }

        var query = _context.Hearings.AsNoTracking()
            .Include(h => h.Case)
            .Include(h => h.Client)
            .Include(h => h.LeadLawyer)
            .Where(h => h.FirmId == request.FirmId && h.HearingDate >= start && h.HearingDate <= end && !h.IsArchived);

        if (request.LawyerId.HasValue) query = query.Where(h => h.LeadLawyerId == request.LawyerId.Value);
        if (!string.IsNullOrEmpty(request.Status)) query = query.Where(h => h.Status == request.Status);
        if (request.CaseId.HasValue) query = query.Where(h => h.CaseId == request.CaseId.Value);

        var list = await query.ToListAsync(cancellationToken);

        // Pre-fetch Adjournment counts locally to avoid N+1 inside loop
        var hearingIds = list.Select(h => h.Id).ToList();
        var adjournmentCounts = await _context.HearingAdjournments.AsNoTracking()
            .Where(a => hearingIds.Contains(a.OriginalHearingId))
            .GroupBy(a => a.OriginalHearingId)
            .ToDictionaryAsync(g => g.Key, g => g.Count(), cancellationToken);

        var mapped = list.Select(h => new HearingDto
        {
            Id = h.Id,
            CaseId = h.CaseId,
            CaseTitle = h.Case.Title,
            CaseNumber = h.Case.CaseNumber ?? "",
            ClientId = h.ClientId,
            ClientName = h.Client?.FullName,
            HearingType = h.HearingType,
            CourtType = h.CourtType,
            CourtName = h.CourtName,
            CourtRoom = h.CourtRoom,
            JudgeName = h.JudgeName,
            HearingDate = h.HearingDate,
            StartTime = h.StartTime,
            EndTime = h.EndTime,
            DurationMins = h.DurationMins,
            Status = h.Status,
            Priority = h.Priority,
            Notes = h.Notes,
            CreatedAt = h.CreatedAt,
            AdjournmentCount = adjournmentCounts.GetValueOrDefault(h.Id, 0),
            HasConflict = false, // Computation optimized out here unless actively intersecting
            LeadLawyer = new { id = h.LeadLawyerId, name = h.LeadLawyer.FirstName + " " + h.LeadLawyer.LastName }
        }).OrderBy(h => h.HearingDate).ThenBy(h => h.StartTime).ToList();

        return new 
        {
            ViewStart = start,
            ViewEnd = end,
            Total = mapped.Count,
            StatusCounts = new 
            {
                Scheduled = mapped.Count(x => x.Status == "Scheduled"),
                Adjourned = mapped.Count(x => x.Status == "Adjourned"),
                Completed = mapped.Count(x => x.Status == "Completed"),
                Cancelled = mapped.Count(x => x.Status == "Cancelled")
            },
            Items = mapped
        };
    }
}

// ---------------------------------------------------------------------------------------------------------------- //
// QUERY: GET /hearings/conflicts — Conflict Detection (Mode A Slot / Mode B Range)
// ---------------------------------------------------------------------------------------------------------------- //
public class GetConflictsQuery : IRequest<List<object>>
{
    public Guid FirmId { get; set; }
    public Guid LawyerId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public TimeOnly? StartTime { get; set; }
    public int? DurationMins { get; set; }
    public Guid? ExcludeHearingId { get; set; }
}

public class GetConflictsQueryHandler : IRequestHandler<GetConflictsQuery, List<object>>
{
    private readonly IApplicationDbContext _context;

    public GetConflictsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<object>> Handle(GetConflictsQuery request, CancellationToken cancellationToken)
    {
        var result = new List<object>();

        // Mode B: Range Scan (e.g. Daily Schedule Check)
        if (request.EndDate.HasValue)
        {
            var rangeHearings = await _context.Hearings.AsNoTracking()
                .Include(h => h.Case)
                .Where(h => h.FirmId == request.FirmId && h.LeadLawyerId == request.LawyerId
                         && h.HearingDate >= request.StartDate && h.HearingDate <= request.EndDate.Value
                         && h.Status == "Scheduled" && !h.IsArchived)
                .OrderBy(h => h.HearingDate).ThenBy(h => h.StartTime)
                .ToListAsync(cancellationToken);

            var grouped = rangeHearings.GroupBy(h => h.HearingDate);
            foreach (var day in grouped)
            {
                var dailyList = day.ToList();
                for (int i = 0; i < dailyList.Count; i++)
                {
                    for (int j = i + 1; j < dailyList.Count; j++)
                    {
                        var h1 = dailyList[i];
                        var h2 = dailyList[j];

                        if (h1.StartTime < h2.EndTime && h1.EndTime > h2.StartTime)
                        {
                            result.Add(new {
                                existingHearingId = h2.Id,
                                caseTitle = h2.Case.Title,
                                courtName = h2.CourtName,
                                hearingDate = h2.HearingDate,
                                startTime = h2.StartTime,
                                endTime = h2.EndTime,
                                conflictType = h1.StartTime == h2.StartTime ? "SameTime" : "Overlap"
                            });
                        }
                    }
                }
            }
        }
        else if (request.StartTime.HasValue && request.DurationMins.HasValue)
        {
            // Mode A: Single Slot Check (e.g. Schedule form validation)
            var targetEnd = request.StartTime.Value.AddMinutes(request.DurationMins.Value);
            
            var existing = await _context.Hearings.AsNoTracking()
                .Include(h => h.Case)
                .Where(h => h.FirmId == request.FirmId && h.LeadLawyerId == request.LawyerId
                         && h.HearingDate == request.StartDate
                         && h.Status == "Scheduled" && !h.IsArchived)
                .ToListAsync(cancellationToken);

            foreach (var h in existing)
            {
                if (request.ExcludeHearingId == h.Id) continue;

                if (request.StartTime.Value < h.EndTime && targetEnd > h.StartTime)
                {
                    var overlapStart = request.StartTime.Value > h.StartTime ? request.StartTime.Value : h.StartTime;
                    var overlapEnd = targetEnd < h.EndTime ? targetEnd : h.EndTime;
                    var duration = (overlapEnd - overlapStart).TotalMinutes;

                    string type = "Overlap";
                    if (request.StartTime.Value == h.StartTime) type = "SameTime";
                    else if (request.StartTime.Value == h.EndTime || targetEnd == h.StartTime) type = "BackToBack"; // Edge overlap logic precision

                    result.Add(new {
                        existingHearingId = h.Id,
                        caseTitle = h.Case.Title,
                        courtName = h.CourtName,
                        hearingDate = h.HearingDate,
                        startTime = h.StartTime,
                        endTime = h.EndTime,
                        overlapMinutes = duration > 0 ? duration : 0,
                        conflictType = type
                    });
                }
            }
        }

        return result;
    }
}
