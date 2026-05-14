using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;

namespace WukalaGPT.Application.Features.CaseManagement;

// ----------------------------------------------------
// COMMAND: Assign Team Member
// ----------------------------------------------------
public class AssignTeamMemberCommand : IRequest<CaseAssignmentDto>
{
    public Guid CaseId { get; set; }
    public Guid RequesterUserId { get; set; }
    public Guid UserIdToAssign { get; set; }
    public string Role { get; set; } = "AssistingLawyer";
}

public class AssignTeamMemberCommandHandler : IRequestHandler<AssignTeamMemberCommand, CaseAssignmentDto>
{
    private readonly IApplicationDbContext _context;

    public AssignTeamMemberCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<CaseAssignmentDto> Handle(AssignTeamMemberCommand request, CancellationToken cancellationToken)
    {
        var legalCase = await _context.LegalCases.FindAsync(new object[] { request.CaseId }, cancellationToken);
        if (legalCase == null) throw new Exception("Case not found.");

        // Security check: Only lead lawyer or firm admin can assign team members
        if (legalCase.LeadLawyerId != request.RequesterUserId)
            throw new UnauthorizedAccessException("Only the lead lawyer can assign team members.");

        var existing = await _context.CaseAssignments
            .FirstOrDefaultAsync(a => a.CaseId == request.CaseId && a.UserId == request.UserIdToAssign, cancellationToken);
            
        if (existing != null) throw new Exception("User is already assigned to this case.");

        var assignment = new CaseAssignment
        {
            CaseId = request.CaseId,
            UserId = request.UserIdToAssign,
            Role = request.Role,
            AssignedAt = DateTime.UtcNow
        };

        _context.CaseAssignments.Add(assignment);
        await _context.SaveChangesAsync(cancellationToken);

        return new CaseAssignmentDto
        {
            UserId = assignment.UserId,
            Role = assignment.Role,
            AssignedAt = assignment.AssignedAt
        };
    }
}

// ----------------------------------------------------
// COMMAND: Remove Team Member
// ----------------------------------------------------
public class RemoveTeamMemberCommand : IRequest<bool>
{
    public Guid CaseId { get; set; }
    public Guid RequesterUserId { get; set; }
    public Guid UserIdToRemove { get; set; }
}

public class RemoveTeamMemberCommandHandler : IRequestHandler<RemoveTeamMemberCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public RemoveTeamMemberCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<bool> Handle(RemoveTeamMemberCommand request, CancellationToken cancellationToken)
    {
        var legalCase = await _context.LegalCases.FindAsync(new object[] { request.CaseId }, cancellationToken);
        if (legalCase == null) return false;

        if (legalCase.LeadLawyerId != request.RequesterUserId)
            throw new UnauthorizedAccessException("Only the lead lawyer can remove team members.");

        var assignment = await _context.CaseAssignments
            .FirstOrDefaultAsync(a => a.CaseId == request.CaseId && a.UserId == request.UserIdToRemove, cancellationToken);

        if (assignment == null) return false;

        _context.CaseAssignments.Remove(assignment);
        await _context.SaveChangesAsync(cancellationToken);
        
        return true;
    }
}

// ----------------------------------------------------
// QUERY: Get Assignments
// ----------------------------------------------------
public class GetCaseAssignmentsQuery : IRequest<List<CaseAssignmentDto>>
{
    public Guid CaseId { get; set; }
}

public class GetCaseAssignmentsQueryHandler : IRequestHandler<GetCaseAssignmentsQuery, List<CaseAssignmentDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCaseAssignmentsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<CaseAssignmentDto>> Handle(GetCaseAssignmentsQuery request, CancellationToken cancellationToken)
    {
        return await _context.CaseAssignments
            .AsNoTracking()
            .Where(a => a.CaseId == request.CaseId)
            .OrderByDescending(a => a.AssignedAt)
            .Select(a => new CaseAssignmentDto
            {
                UserId = a.UserId,
                Role = a.Role,
                AssignedAt = a.AssignedAt
            }).ToListAsync(cancellationToken);
    }
}
