using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Features.Hearings.Events;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.Features.Hearings.CQRS;

public class HearingDto
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public string CaseTitle { get; set; } = string.Empty;
    public string CaseNumber { get; set; } = string.Empty;
    public Guid? ClientId { get; set; }
    public string? ClientName { get; set; }
    public string? HearingType { get; set; }
    public string CourtType { get; set; } = string.Empty;
    public string CourtName { get; set; } = string.Empty;
    public string? CourtRoom { get; set; }
    public string? JudgeName { get; set; }
    public DateOnly HearingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int DurationMins { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public object LeadLawyer { get; set; } = null!;
    public int AdjournmentCount { get; set; }
    public bool HasConflict { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public List<string>? Warnings { get; set; }
}

public class AdjournmentDto
{
    public Guid Id { get; set; }
    public Guid OriginalHearingId { get; set; }
    public Guid? NewHearingId { get; set; }
    public DateOnly OriginalDate { get; set; }
    public TimeOnly OriginalTime { get; set; }
    public DateOnly? NewDate { get; set; }
    public TimeOnly? NewTime { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? ReasonDetail { get; set; }
    public string? CourtOrderRef { get; set; }
    public bool AdjournedByCourt { get; set; }
    public object AdjournedBy { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
}

public class AdjournmentResponseDto
{
    public AdjournmentDto Adjournment { get; set; } = null!;
    public HearingDto? NewHearing { get; set; }
    public List<string>? Warnings { get; set; }
}

// ---------------------------------------------------------------------------------------------------------------- //
// COMMAND: POST /hearings
// ---------------------------------------------------------------------------------------------------------------- //
public class CreateHearingCommand : IRequest<HearingDto>
{
    public Guid FirmId { get; set; }
    public Guid CaseId { get; set; }
    public Guid? ClientId { get; set; }
    public string? HearingType { get; set; }
    public string CourtType { get; set; } = string.Empty;
    public string CourtName { get; set; } = string.Empty;
    public string? CourtRoom { get; set; }
    public string? JudgeName { get; set; }
    public DateOnly HearingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public int DurationMins { get; set; } = 60;
    public string Priority { get; set; } = "Medium";
    public string? Notes { get; set; }
    public Guid LeadLawyerId { get; set; }
}

public class CreateHearingCommandHandler : IRequestHandler<CreateHearingCommand, HearingDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IMediator _mediator;

    public CreateHearingCommandHandler(IApplicationDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task<HearingDto> Handle(CreateHearingCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify case exists and belongs to firm
        var legalCase = await _context.LegalCases
            .Include(c => c.Client)
            .FirstOrDefaultAsync(c => c.Id == request.CaseId && c.FirmId == request.FirmId, cancellationToken);
        
        if (legalCase == null) throw new UnauthorizedAccessException("Case not found or permission denied.");

        // 2. Build mathematical intersection bounding for Conflict Checks
        var overlapStartTime = request.StartTime;
        var overlapEndTime = request.StartTime.AddMinutes(request.DurationMins);
        
        var conflicts = await _context.Hearings.AsNoTracking()
            .Where(h => h.LeadLawyerId == request.LeadLawyerId 
                     && h.HearingDate == request.HearingDate 
                     && h.Status == "Scheduled" 
                     && !h.IsArchived)
            .ToListAsync(cancellationToken);

        var warnings = new List<string>();
        foreach(var c in conflicts)
        {
            var endT = c.StartTime.AddMinutes(c.DurationMins);
            if (overlapStartTime < endT && overlapEndTime > c.StartTime)
            {
                warnings.Add($"Conflict detected: Overlaps with existing scheduled hearing at {c.CourtName} between {c.StartTime} - {endT}");
            }
        }

        // 3. Create Event
        var hearing = new Hearing
        {
            FirmId = request.FirmId,
            CaseId = request.CaseId,
            ClientId = request.ClientId,
            LeadLawyerId = request.LeadLawyerId,
            HearingType = request.HearingType,
            CourtType = request.CourtType,
            CourtName = request.CourtName,
            CourtRoom = request.CourtRoom,
            JudgeName = request.JudgeName,
            HearingDate = request.HearingDate,
            StartTime = request.StartTime,
            DurationMins = request.DurationMins,
            Priority = request.Priority,
            Notes = request.Notes,
            Status = "Scheduled",
            CreatedById = request.LeadLawyerId
        };
        _context.Hearings.Add(hearing);

        // 4. Case Cascades
        if (!legalCase.NextDate.HasValue || request.HearingDate > legalCase.NextDate.Value)
        {
            legalCase.NextDate = request.HearingDate;
            legalCase.UpdatedAt = DateTime.UtcNow;
        }

        _context.CaseTimelineEvents.Add(new CaseTimelineEvent
        {
            CaseId = request.CaseId,
            EventType = WukalaGPT.Domain.Enums.CaseEventType.Hearing, // Assuming Hearing exists in Enum or use 'Note'
            Title = $"Hearing scheduled at {request.CourtName}",
            EventDate = DateTime.UtcNow,
            CreatedById = request.LeadLawyerId
        });

        await _context.SaveChangesAsync(cancellationToken);

        // 5. Fire MediatR Notification Event out of bounds
        await _mediator.Publish(new HearingScheduledEvent(hearing.Id), cancellationToken);

        // Build Response
        var user = await _context.Users.Where(u => u.Id == request.LeadLawyerId).FirstOrDefaultAsync(cancellationToken);
        var lawyerName = user != null ? user.FirstName + " " + user.LastName : "";
        
        return new HearingDto
        {
            Id = hearing.Id,
            CaseId = hearing.CaseId,
            CaseTitle = legalCase.Title,
            CaseNumber = legalCase.CaseNumber ?? "",
            ClientId = hearing.ClientId,
            ClientName = legalCase.Client?.FullName,
            HearingType = hearing.HearingType,
            CourtType = hearing.CourtType,
            CourtName = hearing.CourtName,
            CourtRoom = hearing.CourtRoom,
            JudgeName = hearing.JudgeName,
            HearingDate = hearing.HearingDate,
            StartTime = hearing.StartTime,
            EndTime = hearing.EndTime,
            DurationMins = hearing.DurationMins,
            Status = hearing.Status,
            Priority = hearing.Priority,
            Notes = hearing.Notes,
            CreatedAt = hearing.CreatedAt,
            HasConflict = warnings.Any(),
            Warnings = warnings,
            LeadLawyer = new { id = request.LeadLawyerId, name = lawyerName }
        };
    }
}

// ---------------------------------------------------------------------------------------------------------------- //
// COMMAND: POST /hearings/:id/adjourn (THE CASCADE TRANSACTION)
// ---------------------------------------------------------------------------------------------------------------- //
public class AdjournHearingCommand : IRequest<AdjournmentResponseDto>
{
    public Guid HearingId { get; set; }
    public Guid FirmId { get; set; }
    public Guid AdjournedById { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? ReasonDetail { get; set; }
    public string? CourtOrderRef { get; set; }
    public bool AdjournedByCourt { get; set; }
    
    // Future New Slots
    public DateOnly? NewDate { get; set; }
    public TimeOnly? NewTime { get; set; }
}

public class AdjournHearingCommandHandler : IRequestHandler<AdjournHearingCommand, AdjournmentResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IMediator _mediator;

    public AdjournHearingCommandHandler(IApplicationDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task<AdjournmentResponseDto> Handle(AdjournHearingCommand request, CancellationToken cancellationToken)
    {
        // 1. Transaction wrapping the 7 Step Cascade (User Constraint)
        await using var transaction = await ((DbContext)_context).Database.BeginTransactionAsync(cancellationToken);

        try 
        {
            var original = await _context.Hearings
                .Include(h => h.Case)
                .Include(h => h.Client)
                .FirstOrDefaultAsync(h => h.Id == request.HearingId && h.FirmId == request.FirmId, cancellationToken);
            
            if (original == null) throw new KeyNotFoundException("Hearing Not Found.");

            // Step 1: Update original hearing
            original.Status = "Adjourned";
            original.UpdatedAt = DateTimeOffset.UtcNow;

            // Step 2: Insert into Adjournments Immutable Graph
            var adjournment = new HearingAdjournment
            {
                OriginalHearingId = original.Id,
                FirmId = original.FirmId,
                AdjournedById = request.AdjournedById,
                OriginalDate = original.HearingDate,
                OriginalTime = original.StartTime,
                NewDate = request.NewDate,
                NewTime = request.NewTime,
                Reason = request.Reason,
                ReasonDetail = request.ReasonDetail,
                CourtOrderRef = request.CourtOrderRef,
                AdjournedByCourt = request.AdjournedByCourt
            };
            _context.HearingAdjournments.Add(adjournment);

            Hearing? newHearingEntity = null;
            var warnings = new List<string>();

            // Step 3 & 4 & 5: New Hearing generation and overlap check
            if (request.NewDate.HasValue && request.NewTime.HasValue)
            {
                var overlapEndTime = request.NewTime.Value.AddMinutes(original.DurationMins);
                var conflicts = await _context.Hearings.AsNoTracking()
                    .Where(h => h.LeadLawyerId == original.LeadLawyerId 
                            && h.HearingDate == request.NewDate.Value 
                            && h.Status == "Scheduled" && !h.IsArchived)
                    .ToListAsync(cancellationToken);
                
                foreach(var c in conflicts)
                {
                    if (request.NewTime.Value < c.StartTime.AddMinutes(c.DurationMins) && overlapEndTime > c.StartTime)
                        warnings.Add($"Conflict: Matches another hearing for {c.CourtName}");
                }

                newHearingEntity = new Hearing
                {
                    FirmId = original.FirmId,
                    CaseId = original.CaseId,
                    ClientId = original.ClientId,
                    LeadLawyerId = original.LeadLawyerId,
                    HearingType = original.HearingType,
                    CourtType = original.CourtType,
                    CourtName = original.CourtName,
                    CourtRoom = original.CourtRoom,
                    JudgeName = original.JudgeName,
                    HearingDate = request.NewDate.Value,
                    StartTime = request.NewTime.Value,
                    DurationMins = original.DurationMins,
                    Priority = original.Priority,
                    Notes = original.Notes,
                    Status = "Scheduled",
                    CreatedById = request.AdjournedById
                };
                
                _context.Hearings.Add(newHearingEntity);
                await _context.SaveChangesAsync(cancellationToken); // Ensure ID manifests

                adjournment.NewHearingId = newHearingEntity.Id;
            }

            // Step 6: Case Target patch
            if (request.NewDate.HasValue)
            {
                original.Case.NextDate = request.NewDate.Value;
                original.Case.UpdatedAt = DateTime.UtcNow;
            }

            // Step 7: Incident Graph Audit Log
            _context.CaseTimelineEvents.Add(new CaseTimelineEvent
            {
                CaseId = original.CaseId,
                EventType = WukalaGPT.Domain.Enums.CaseEventType.Hearing,
                Title = $"Hearing adjourned to {(request.NewDate.HasValue ? request.NewDate.Value.ToString() : "TBD")}",
                Description = request.Reason,
                EventDate = DateTime.UtcNow,
                CreatedById = request.AdjournedById
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken); // COMMIT ALL

            // POST TRANSACTION PUBLISH EVENT
            await _mediator.Publish(new HearingAdjournedEvent(original.Id, newHearingEntity?.Id), cancellationToken);

            var adUserEntity = await _context.Users.Where(u => u.Id == request.AdjournedById).FirstOrDefaultAsync(cancellationToken);
            var adUser = adUserEntity != null ? adUserEntity.FirstName + " " + adUserEntity.LastName : "";

            // Payload Mapping
            var res = new AdjournmentResponseDto
            {
                Warnings = warnings,
                Adjournment = new AdjournmentDto
                {
                    Id = adjournment.Id,
                    OriginalHearingId = adjournment.OriginalHearingId,
                    NewHearingId = adjournment.NewHearingId,
                    OriginalDate = adjournment.OriginalDate,
                    OriginalTime = adjournment.OriginalTime,
                    NewDate = adjournment.NewDate,
                    NewTime = adjournment.NewTime,
                    Reason = adjournment.Reason,
                    ReasonDetail = adjournment.ReasonDetail,
                    CourtOrderRef = adjournment.CourtOrderRef,
                    AdjournedByCourt = adjournment.AdjournedByCourt,
                    CreatedAt = adjournment.CreatedAt,
                    AdjournedBy = new { id = request.AdjournedById, name = adUser }
                }
            };

            if (newHearingEntity != null)
            {
                res.NewHearing = new HearingDto
                {
                    Id = newHearingEntity.Id,
                    CaseId = newHearingEntity.CaseId,
                    CaseTitle = original.Case.Title,
                    CaseNumber = original.Case.CaseNumber ?? "",
                    ClientId = newHearingEntity.ClientId,
                    ClientName = original.Client?.FullName,
                    HearingDate = newHearingEntity.HearingDate,
                    StartTime = newHearingEntity.StartTime,
                    EndTime = newHearingEntity.EndTime,
                    CourtName = newHearingEntity.CourtName,
                    CourtType = newHearingEntity.CourtType,
                    Status = newHearingEntity.Status,
                    Priority = newHearingEntity.Priority,
                    HasConflict = warnings.Any()
                };
            }

            return res;
        }
        catch(Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
