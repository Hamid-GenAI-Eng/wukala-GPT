using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;

namespace WukalaGPT.Application.Features.Clients;

public class ShareDocumentToPortalCommand : IRequest<bool>
{
    public Guid FirmId { get; set; }
    public Guid SharedById { get; set; }
    public Guid ClientId { get; set; }
    public Guid DocumentId { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
}

public class ShareDocumentToPortalCommandHandler : IRequestHandler<ShareDocumentToPortalCommand, bool>
{
    private readonly IApplicationDbContext _db;
    public ShareDocumentToPortalCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<bool> Handle(ShareDocumentToPortalCommand req, CancellationToken cancellationToken)
    {
        var existing = await _db.ClientPortalDocumentAccesses.FirstOrDefaultAsync(p => p.ClientId == req.ClientId && p.DocumentId == req.DocumentId, cancellationToken);
        if (existing != null)
        {
            existing.RevokedAt = null; // Un-revoke
            existing.ExpiresAt = req.ExpiresAt;
            await _db.SaveChangesAsync(cancellationToken);
            return true;
        }

        var access = new ClientPortalDocumentAccess
        {
            FirmId = req.FirmId, ClientId = req.ClientId, DocumentId = req.DocumentId, SharedById = req.SharedById, ExpiresAt = req.ExpiresAt
        };
        _db.ClientPortalDocumentAccesses.Add(access);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class RevokeDocumentFromPortalCommand : IRequest<bool>
{
    public Guid ClientId { get; set; }
    public Guid DocumentId { get; set; }
}

public class RevokeDocumentFromPortalCommandHandler : IRequestHandler<RevokeDocumentFromPortalCommand, bool>
{
    private readonly IApplicationDbContext _db;
    public RevokeDocumentFromPortalCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<bool> Handle(RevokeDocumentFromPortalCommand req, CancellationToken cancellationToken)
    {
        var access = await _db.ClientPortalDocumentAccesses.FirstOrDefaultAsync(p => p.ClientId == req.ClientId && p.DocumentId == req.DocumentId, cancellationToken);
        if (access == null) return false;

        access.RevokedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
