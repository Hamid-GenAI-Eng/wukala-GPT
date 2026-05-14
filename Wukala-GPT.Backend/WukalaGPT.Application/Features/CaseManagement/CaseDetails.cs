using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.Features.CaseManagement;

// ----------------------------------------------------
// DTOs
// ----------------------------------------------------
public class CaseDetailsDto : CaseDto
{
    public List<CaseTimelineEventDto> Timeline { get; set; } = new();
    public List<CaseNoteDto> Notes { get; set; } = new();
    public List<CaseAssignmentDto> Assignments { get; set; } = new();
    public List<CaseLinkDto> LinkedCases { get; set; } = new();
    public List<CaseDeadlineDto> Deadlines { get; set; } = new();
}

public class CaseTimelineEventDto
{
    public Guid Id { get; set; }
    public CaseEventType EventType { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime EventDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CaseNoteDto
{
    public Guid Id { get; set; }
    public Guid AuthorId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsPrivate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CaseAssignmentDto
{
    public Guid UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
}

public class CaseLinkDto
{
    public Guid LinkedCaseId { get; set; }
    public CaseLinkType LinkType { get; set; }
    public string Direction { get; set; } = string.Empty; // "Source" or "Target"
}

public class CaseDeadlineDto
{
    public Guid Id { get; set; }
    public Guid? AssignedToId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public bool IsDone { get; set; }
    public CasePriority Priority { get; set; }
}

// ----------------------------------------------------
// QUERY: Get Case Details 
// ----------------------------------------------------
public class GetCaseDetailsQuery : IRequest<CaseDetailsDto>
{
    public Guid CaseId { get; set; }
    public Guid RequesterUserId { get; set; }
}

public class GetCaseDetailsQueryHandler : IRequestHandler<GetCaseDetailsQuery, CaseDetailsDto>
{
    private readonly IApplicationDbContext _context;

    public GetCaseDetailsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CaseDetailsDto> Handle(GetCaseDetailsQuery request, CancellationToken cancellationToken)
    {
        // SECURE & FAST: Use AsNoTracking and SplitQueries for large relational pulls
        var caseEntity = await _context.LegalCases
            .AsNoTracking()
            .Include(c => c.TimelineEvents)
            .Include(c => c.Notes.Where(n => !n.IsPrivate || n.AuthorId == request.RequesterUserId || c.LeadLawyerId == request.RequesterUserId))
            .Include(c => c.Assignments)
            .Include(c => c.Deadlines)
            .Include(c => c.SourceLinks)
            .Include(c => c.TargetLinks)
            .FirstOrDefaultAsync(c => c.Id == request.CaseId && !c.IsArchived, cancellationToken);

        if (caseEntity == null)
            throw new Exception("Case not found or archived.");

        // Security check: Only assigned team members or lead lawyer can view full details
        if (caseEntity.LeadLawyerId != request.RequesterUserId && !caseEntity.Assignments.Any(a => a.UserId == request.RequesterUserId))
        {
            throw new UnauthorizedAccessException("You are not assigned to this case.");
        }

        var dto = new CaseDetailsDto
        {
            Id = caseEntity.Id,
            FirmId = caseEntity.FirmId,
            LeadLawyerId = caseEntity.LeadLawyerId,
            ClientId = caseEntity.ClientId,
            ClientNameRaw = caseEntity.ClientNameRaw,
            CaseNumber = caseEntity.CaseNumber,
            Title = caseEntity.Title,
            CourtName = caseEntity.CourtName,
            CaseType = caseEntity.CaseType,
            Status = caseEntity.Status,
            Priority = caseEntity.Priority,
            FirNumber = caseEntity.FirNumber,
            FilingDate = caseEntity.FilingDate,
            NextDate = caseEntity.NextDate,
            JudgeName = caseEntity.JudgeName,
            OpposingCounsel = caseEntity.OpposingCounsel,
            Description = caseEntity.Description,
            IsArchived = caseEntity.IsArchived,
            CreatedAt = caseEntity.CreatedAt,
            UpdatedAt = caseEntity.UpdatedAt,
            
            Timeline = caseEntity.TimelineEvents.OrderByDescending(t => t.EventDate).Select(t => new CaseTimelineEventDto
            {
                Id = t.Id,
                EventType = t.EventType,
                Title = t.Title,
                Description = t.Description,
                EventDate = t.EventDate,
                CreatedAt = t.CreatedAt
            }).ToList(),
            
            Notes = caseEntity.Notes.OrderByDescending(n => n.CreatedAt).Select(n => new CaseNoteDto
            {
                Id = n.Id,
                AuthorId = n.AuthorId,
                Content = n.Content,
                IsPrivate = n.IsPrivate,
                CreatedAt = n.CreatedAt,
                UpdatedAt = n.UpdatedAt
            }).ToList(),

            Assignments = caseEntity.Assignments.Select(a => new CaseAssignmentDto
            {
                UserId = a.UserId,
                Role = a.Role,
                AssignedAt = a.AssignedAt
            }).ToList(),
            
            Deadlines = caseEntity.Deadlines.Select(d => new CaseDeadlineDto
            {
                Id = d.Id,
                AssignedToId = d.AssignedToId,
                Title = d.Title,
                DueDate = d.DueDate,
                IsDone = d.IsDone,
                Priority = d.Priority
            }).ToList()
        };
        
        // Map Links
        dto.LinkedCases.AddRange(caseEntity.SourceLinks.Select(l => new CaseLinkDto { LinkedCaseId = l.LinkedCaseId, LinkType = l.LinkType, Direction = "Target" }));
        dto.LinkedCases.AddRange(caseEntity.TargetLinks.Select(l => new CaseLinkDto { LinkedCaseId = l.CaseId, LinkType = l.LinkType, Direction = "Source" }));

        return dto;
    }
}
