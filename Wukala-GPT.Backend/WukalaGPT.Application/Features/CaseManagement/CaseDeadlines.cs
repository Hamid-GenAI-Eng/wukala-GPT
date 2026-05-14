using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.Features.CaseManagement;

// ----------------------------------------------------
// COMMAND: Create Case Deadline
// ----------------------------------------------------
public class CreateCaseDeadlineCommand : IRequest<CaseDeadlineDto>
{
    public Guid CaseId { get; set; }
    public Guid? AssignedToId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public string Priority { get; set; } = "Normal";
}

public class CreateCaseDeadlineCommandHandler : IRequestHandler<CreateCaseDeadlineCommand, CaseDeadlineDto>
{
    private readonly IApplicationDbContext _context;

    public CreateCaseDeadlineCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<CaseDeadlineDto> Handle(CreateCaseDeadlineCommand request, CancellationToken cancellationToken)
    {
        if (!await _context.LegalCases.AnyAsync(c => c.Id == request.CaseId, cancellationToken))
            throw new Exception("Case not found.");

        var deadline = new CaseDeadline
        {
            CaseId = request.CaseId,
            AssignedToId = request.AssignedToId,
            Title = request.Title,
            DueDate = request.DueDate,
            Priority = Enum.Parse<CasePriority>(request.Priority, true),
            IsDone = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.CaseDeadlines.Add(deadline);
        await _context.SaveChangesAsync(cancellationToken);

        return new CaseDeadlineDto
        {
            Id = deadline.Id, AssignedToId = deadline.AssignedToId, Title = deadline.Title, DueDate = deadline.DueDate, IsDone = deadline.IsDone, Priority = deadline.Priority
        };
    }
}

// ----------------------------------------------------
// COMMAND: Update Case Deadline
// ----------------------------------------------------
public class UpdateCaseDeadlineCommand : IRequest<CaseDeadlineDto>
{
    public Guid CaseId { get; set; }
    public Guid DeadlineId { get; set; }
    public bool? IsDone { get; set; }
    public string? Title { get; set; }
    public DateTime? DueDate { get; set; }
}

public class UpdateCaseDeadlineCommandHandler : IRequestHandler<UpdateCaseDeadlineCommand, CaseDeadlineDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateCaseDeadlineCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<CaseDeadlineDto> Handle(UpdateCaseDeadlineCommand request, CancellationToken cancellationToken)
    {
        var d = await _context.CaseDeadlines.FirstOrDefaultAsync(x => x.Id == request.DeadlineId && x.CaseId == request.CaseId, cancellationToken);
        if (d == null) throw new Exception("Deadline not found.");

        if (request.IsDone.HasValue) d.IsDone = request.IsDone.Value;
        if (!string.IsNullOrEmpty(request.Title)) d.Title = request.Title;
        if (request.DueDate.HasValue) d.DueDate = request.DueDate.Value;

        await _context.SaveChangesAsync(cancellationToken);

        return new CaseDeadlineDto
        {
            Id = d.Id, AssignedToId = d.AssignedToId, Title = d.Title, DueDate = d.DueDate, IsDone = d.IsDone, Priority = d.Priority
        };
    }
}

// ----------------------------------------------------
// COMMAND: Delete Case Deadline
// ----------------------------------------------------
public class DeleteCaseDeadlineCommand : IRequest<bool>
{
    public Guid CaseId { get; set; }
    public Guid DeadlineId { get; set; }
}

public class DeleteCaseDeadlineCommandHandler : IRequestHandler<DeleteCaseDeadlineCommand, bool>
{
    private readonly IApplicationDbContext _context;
    public DeleteCaseDeadlineCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<bool> Handle(DeleteCaseDeadlineCommand request, CancellationToken cancellationToken)
    {
        var d = await _context.CaseDeadlines.FirstOrDefaultAsync(x => x.Id == request.DeadlineId && x.CaseId == request.CaseId, cancellationToken);
        if (d == null) return false;

        _context.CaseDeadlines.Remove(d);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

// ----------------------------------------------------
// QUERY: Get Deadlines
// ----------------------------------------------------
public class GetCaseDeadlinesQuery : IRequest<List<CaseDeadlineDto>>
{
    public Guid CaseId { get; set; }
}

public class GetCaseDeadlinesQueryHandler : IRequestHandler<GetCaseDeadlinesQuery, List<CaseDeadlineDto>>
{
    private readonly IApplicationDbContext _context;
    public GetCaseDeadlinesQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<CaseDeadlineDto>> Handle(GetCaseDeadlinesQuery request, CancellationToken cancellationToken)
    {
        return await _context.CaseDeadlines
            .AsNoTracking()
            .Where(x => x.CaseId == request.CaseId)
            .OrderBy(x => x.DueDate)
            .Select(d => new CaseDeadlineDto
            {
                Id = d.Id, AssignedToId = d.AssignedToId, Title = d.Title, DueDate = d.DueDate, IsDone = d.IsDone, Priority = d.Priority
            }).ToListAsync(cancellationToken);
    }
}
