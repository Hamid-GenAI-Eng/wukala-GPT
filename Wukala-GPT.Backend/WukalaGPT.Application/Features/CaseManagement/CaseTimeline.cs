using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.Features.CaseManagement;

// ----------------------------------------------------
// COMMAND: Add Timeline Event
// ----------------------------------------------------
public class AddTimelineEventCommand : IRequest<CaseTimelineEventDto>
{
    public Guid CaseId { get; set; }
    public Guid RequesterUserId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime EventDate { get; set; }
}

public class AddTimelineEventCommandHandler : IRequestHandler<AddTimelineEventCommand, CaseTimelineEventDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICaseUpdateService _caseUpdateService;

    public AddTimelineEventCommandHandler(IApplicationDbContext context, ICaseUpdateService caseUpdateService)
    {
        _context = context;
        _caseUpdateService = caseUpdateService;
    }

    public async Task<CaseTimelineEventDto> Handle(AddTimelineEventCommand request, CancellationToken cancellationToken)
    {
        var legalCase = await _context.LegalCases.FirstOrDefaultAsync(c => c.Id == request.CaseId, cancellationToken);
        if (legalCase == null || legalCase.IsArchived) throw new Exception("Case not found.");

        var rawEventType = request.EventType?.Trim() ?? string.Empty;
        if (rawEventType.Equals("filing", StringComparison.OrdinalIgnoreCase))
        {
            rawEventType = "Filed";
        }

        if (!Enum.TryParse<CaseEventType>(rawEventType, true, out var parsedEventType))
        {
            throw new ArgumentException($"Invalid EventType: '{request.EventType}'. Supported types are: {string.Join(", ", Enum.GetNames<CaseEventType>())}");
        }

        var newEvent = new CaseTimelineEvent
        {
            CaseId = request.CaseId,
            CreatedById = request.RequesterUserId,
            EventType = parsedEventType,
            Title = request.Title,
            Description = request.Description,
            EventDate = request.EventDate,
            CreatedAt = DateTime.UtcNow
        };

        if (newEvent.EventType == CaseEventType.Hearing)
        {
            legalCase.NextDate = DateOnly.FromDateTime(request.EventDate);
            legalCase.UpdatedAt = DateTime.UtcNow;
        }

        _context.CaseTimelineEvents.Add(newEvent);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new CaseTimelineEventDto
        {
            Id = newEvent.Id,
            EventType = newEvent.EventType,
            Title = newEvent.Title,
            Description = newEvent.Description,
            EventDate = newEvent.EventDate,
            CreatedAt = newEvent.CreatedAt
        };

        // REAL-TIME HOOK: Broadcast to connected users in the case group securely via Redis backplane
        await _caseUpdateService.BroadcastTimelineEventAsync(request.CaseId, dto, cancellationToken);
        
        return dto;
    }
}

// ----------------------------------------------------
// QUERY: Get Timeline Events
// ----------------------------------------------------
public class GetCaseTimelineQuery : IRequest<List<CaseTimelineEventDto>>
{
    public Guid CaseId { get; set; }
}

public class GetCaseTimelineQueryHandler : IRequestHandler<GetCaseTimelineQuery, List<CaseTimelineEventDto>>
{
    private readonly IApplicationDbContext _context;
    public GetCaseTimelineQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<CaseTimelineEventDto>> Handle(GetCaseTimelineQuery request, CancellationToken cancellationToken)
    {
        return await _context.CaseTimelineEvents
            .AsNoTracking()
            .Where(t => t.CaseId == request.CaseId)
            .OrderByDescending(t => t.EventDate)
            .Select(t => new CaseTimelineEventDto
            {
                Id = t.Id, EventType = t.EventType, Title = t.Title, Description = t.Description, EventDate = t.EventDate, CreatedAt = t.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
