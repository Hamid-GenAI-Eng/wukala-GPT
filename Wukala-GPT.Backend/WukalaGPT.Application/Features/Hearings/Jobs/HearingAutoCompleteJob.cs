using Hangfire;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using WukalaGPT.Application.Features.Hearings.Events;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.Application.Features.Hearings.Jobs;

public class HearingAutoCompleteJob
{
    private readonly IApplicationDbContext _context;
    private readonly IMediator _mediator;

    public HearingAutoCompleteJob(IApplicationDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task AutoCompletePastHearingsAsync()
    {
        // Scheduled natively to run Daily at 11:59PM
        var yesterday = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));

        var hearingsToComplete = await _context.Hearings
            .Where(h => h.Status == "Scheduled" && !h.IsArchived && h.HearingDate <= yesterday)
            .ToListAsync();

        foreach (var hearing in hearingsToComplete)
        {
            hearing.Status = "Completed";
            hearing.UpdatedAt = DateTimeOffset.UtcNow;
            
            _context.CaseTimelineEvents.Add(new WukalaGPT.Domain.Entities.CaseTimelineEvent
            {
                CaseId = hearing.CaseId,
                EventType = WukalaGPT.Domain.Enums.CaseEventType.Hearing,
                Title = "Hearing completed (Auto-closed)",
                EventDate = DateTime.UtcNow,
                CreatedById = hearing.LeadLawyerId
            });
        }

        await _context.SaveChangesAsync(default);

        // Nudge lawyers about the completion async outside of db transaction bounds
        foreach(var hearing in hearingsToComplete)
        {
            await _mediator.Publish(new HearingAutoCompletedEvent(hearing.Id));
        }
    }
}
