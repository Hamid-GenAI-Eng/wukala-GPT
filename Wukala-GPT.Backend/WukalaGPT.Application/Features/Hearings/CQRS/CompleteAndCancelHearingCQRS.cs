using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Features.Hearings.Events;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;

namespace WukalaGPT.Application.Features.Hearings.CQRS;

// ---------------------------------------------------------------------------------------------------------------- //
// COMMAND: PATCH /hearings/:id/complete
// ---------------------------------------------------------------------------------------------------------------- //
public class CompleteHearingCommand : IRequest<bool>
{
    public Guid HearingId { get; set; }
    public Guid FirmId { get; set; }
    public Guid UserId { get; set; }
    public string? Outcome { get; set; }
    public DateOnly? NextDate { get; set; }
    public TimeOnly? NextTime { get; set; }
    public string? NextHearingType { get; set; }
}

public class CompleteHearingCommandHandler : IRequestHandler<CompleteHearingCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly IMediator _mediator;

    public CompleteHearingCommandHandler(IApplicationDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task<bool> Handle(CompleteHearingCommand request, CancellationToken cancellationToken)
    {
        await using var transaction = await ((DbContext)_context).Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var hearing = await _context.Hearings.Include(h => h.Case)
                .FirstOrDefaultAsync(h => h.Id == request.HearingId && h.FirmId == request.FirmId, cancellationToken);
            
            if (hearing == null) throw new KeyNotFoundException("Hearing not found");

            hearing.Status = "Completed";
            hearing.UpdatedAt = DateTimeOffset.UtcNow;

            if (request.NextDate.HasValue)
            {
                var nextHearing = new Hearing
                {
                    FirmId = hearing.FirmId,
                    CaseId = hearing.CaseId,
                    ClientId = hearing.ClientId,
                    LeadLawyerId = hearing.LeadLawyerId,
                    HearingType = request.NextHearingType ?? hearing.HearingType,
                    CourtType = hearing.CourtType,
                    CourtName = hearing.CourtName,
                    CourtRoom = hearing.CourtRoom,
                    JudgeName = hearing.JudgeName,
                    HearingDate = request.NextDate.Value,
                    StartTime = request.NextTime ?? hearing.StartTime,
                    DurationMins = hearing.DurationMins,
                    Priority = hearing.Priority,
                    Status = "Scheduled",
                    Notes = hearing.Notes,
                    CreatedById = request.UserId
                };
                _context.Hearings.Add(nextHearing);

                hearing.Case.NextDate = request.NextDate.Value;
                hearing.Case.UpdatedAt = DateTime.UtcNow;
            }

            _context.CaseTimelineEvents.Add(new CaseTimelineEvent
            {
                CaseId = hearing.CaseId,
                EventType = WukalaGPT.Domain.Enums.CaseEventType.Hearing,
                Title = "Hearing completed",
                Description = request.Outcome,
                EventDate = DateTime.UtcNow,
                CreatedById = request.UserId
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await _mediator.Publish(new HearingCompletedEvent(hearing.Id), cancellationToken);
            return true;
        }
        catch(Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}

// ---------------------------------------------------------------------------------------------------------------- //
// COMMAND: DELETE /hearings/:id - SOFT CANCEL
// ---------------------------------------------------------------------------------------------------------------- //
public class DeleteHearingCommand : IRequest<bool>
{
    public Guid HearingId { get; set; }
    public Guid FirmId { get; set; }
    public Guid UserId { get; set; }
    public string? CancellationReason { get; set; }
}

public class DeleteHearingCommandHandler : IRequestHandler<DeleteHearingCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly IMediator _mediator;

    public DeleteHearingCommandHandler(IApplicationDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task<bool> Handle(DeleteHearingCommand request, CancellationToken cancellationToken)
    {
        var hearing = await _context.Hearings.FirstOrDefaultAsync(h => h.Id == request.HearingId && h.FirmId == request.FirmId, cancellationToken);
        if (hearing == null) return false;

        hearing.Status = "Cancelled";
        hearing.IsArchived = true;
        hearing.UpdatedAt = DateTimeOffset.UtcNow;

        _context.CaseTimelineEvents.Add(new CaseTimelineEvent
        {
            CaseId = hearing.CaseId,
            EventType = WukalaGPT.Domain.Enums.CaseEventType.Hearing,
            Title = "Hearing cancelled",
            Description = request.CancellationReason,
            EventDate = DateTime.UtcNow,
            CreatedById = request.UserId
        });

        // Cancel pending Hangfire Jobs internally is typically handled in Event Handlers over MediatR
        await _context.SaveChangesAsync(cancellationToken);
        await _mediator.Publish(new HearingCancelledEvent(hearing.Id), cancellationToken);

        return true;
    }
}
