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
// COMMAND: Add Case Note
// ----------------------------------------------------
public class AddCaseNoteCommand : IRequest<CaseNoteDto>
{
    public Guid CaseId { get; set; }
    public Guid RequesterUserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsPrivate { get; set; }
}

public class AddCaseNoteCommandHandler : IRequestHandler<AddCaseNoteCommand, CaseNoteDto>
{
    private readonly IApplicationDbContext _context;

    public AddCaseNoteCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<CaseNoteDto> Handle(AddCaseNoteCommand request, CancellationToken cancellationToken)
    {
        var caseRef = await _context.LegalCases.FindAsync(new object[] { request.CaseId }, cancellationToken);
        if (caseRef == null) throw new Exception("Case not found");

        var note = new CaseNote
        {
            CaseId = request.CaseId,
            AuthorId = request.RequesterUserId,
            Content = request.Content,
            IsPrivate = request.IsPrivate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CaseNotes.Add(note);
        await _context.SaveChangesAsync(cancellationToken);

        return new CaseNoteDto
        {
            Id = note.Id,
            AuthorId = note.AuthorId,
            Content = note.Content,
            IsPrivate = note.IsPrivate,
            CreatedAt = note.CreatedAt,
            UpdatedAt = note.UpdatedAt
        };
    }
}

// ----------------------------------------------------
// COMMAND: Update Case Note
// ----------------------------------------------------
public class UpdateCaseNoteCommand : IRequest<CaseNoteDto>
{
    public Guid CaseId { get; set; }
    public Guid NoteId { get; set; }
    public Guid RequesterUserId { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class UpdateCaseNoteCommandHandler : IRequestHandler<UpdateCaseNoteCommand, CaseNoteDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateCaseNoteCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<CaseNoteDto> Handle(UpdateCaseNoteCommand request, CancellationToken cancellationToken)
    {
        var note = await _context.CaseNotes.FirstOrDefaultAsync(n => n.Id == request.NoteId && n.CaseId == request.CaseId, cancellationToken);
        if (note == null) throw new Exception("Note not found");

        // Security check
        if (note.AuthorId != request.RequesterUserId) throw new UnauthorizedAccessException("You can only edit your own notes.");

        note.Content = request.Content;
        note.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new CaseNoteDto
        {
            Id = note.Id, AuthorId = note.AuthorId, Content = note.Content, IsPrivate = note.IsPrivate, CreatedAt = note.CreatedAt, UpdatedAt = note.UpdatedAt
        };
    }
}

// ----------------------------------------------------
// COMMAND: Delete Case Note
// ----------------------------------------------------
public class DeleteCaseNoteCommand : IRequest<bool>
{
    public Guid CaseId { get; set; }
    public Guid NoteId { get; set; }
    public Guid RequesterUserId { get; set; }
}

public class DeleteCaseNoteCommandHandler : IRequestHandler<DeleteCaseNoteCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteCaseNoteCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<bool> Handle(DeleteCaseNoteCommand request, CancellationToken cancellationToken)
    {
        var note = await _context.CaseNotes.FirstOrDefaultAsync(n => n.Id == request.NoteId && n.CaseId == request.CaseId, cancellationToken);
        if (note == null) return false;

        if (note.AuthorId != request.RequesterUserId) throw new UnauthorizedAccessException("Cannot delete note authored by someone else.");

        _context.CaseNotes.Remove(note);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

// ----------------------------------------------------
// QUERY: Get Case Notes
// ----------------------------------------------------
public class GetCaseNotesQuery : IRequest<List<CaseNoteDto>>
{
    public Guid CaseId { get; set; }
    public Guid RequesterUserId { get; set; }
}

public class GetCaseNotesQueryHandler : IRequestHandler<GetCaseNotesQuery, List<CaseNoteDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCaseNotesQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<CaseNoteDto>> Handle(GetCaseNotesQuery request, CancellationToken cancellationToken)
    {
        var caseRef = await _context.LegalCases.AsNoTracking().FirstOrDefaultAsync(c => c.Id == request.CaseId, cancellationToken);
        if (caseRef == null) throw new Exception("Case not found.");

        return await _context.CaseNotes
            .AsNoTracking()
            .Where(n => n.CaseId == request.CaseId && (!n.IsPrivate || n.AuthorId == request.RequesterUserId || caseRef.LeadLawyerId == request.RequesterUserId))
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new CaseNoteDto
            {
                Id = n.Id, AuthorId = n.AuthorId, Content = n.Content, IsPrivate = n.IsPrivate, CreatedAt = n.CreatedAt, UpdatedAt = n.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
