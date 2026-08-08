using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.Application.Features.Clients;

public class GetClientDetailQuery : IRequest<ClientDetailDto>
{
    public Guid FirmId { get; set; }
    public Guid ClientId { get; set; }
}

public class GetClientDetailQueryHandler : IRequestHandler<GetClientDetailQuery, ClientDetailDto>
{
    private readonly IApplicationDbContext _db;
    public GetClientDetailQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<ClientDetailDto> Handle(GetClientDetailQuery req, CancellationToken cancellationToken)
    {
        var c = await _db.Clients.AsNoTracking().FirstOrDefaultAsync(c => c.Id == req.ClientId && c.FirmId == req.FirmId, cancellationToken);
        if (c == null) throw new UnauthorizedAccessException("Client not found or access denied.");

        // Async Parallel processing of stats
        var interactionsCountTask = _db.ClientInteractions.Where(i => i.ClientId == c.Id).CountAsync(cancellationToken);
        var lastContactTask = _db.ClientInteractions.Where(i => i.ClientId == c.Id).MaxAsync(i => (DateTimeOffset?)i.InteractionDate, cancellationToken);
        var allCasesTask = _db.LegalCases.Where(k => k.ClientId == c.Id && !k.IsArchived).ToListAsync(cancellationToken);

        await Task.WhenAll(interactionsCountTask, lastContactTask, allCasesTask);

        var allCases = allCasesTask.Result;

        return new ClientDetailDto
        {
            Id = c.Id, FullName = c.FullName, ClientType = c.ClientType, CompanyName = c.CompanyName, ContactPerson = c.ContactPerson,
            Email = c.Email, Phone = c.Phone, Whatsapp = c.Whatsapp, City = c.City, Province = c.Province, Address = c.Address,
            Cnic = c.Cnic, Tags = c.Tags, Status = c.Status, PortalEnabled = c.PortalEnabled, PortalEmail = c.PortalEmail,
            RetentionFlagged = c.RetentionFlagged, RetentionFlaggedAt = c.RetentionFlaggedAt, OnboardedAt = c.OnboardedAt,
            AcquisitionSource = c.AcquisitionSource, Notes = c.Notes, CreatedAt = c.CreatedAt, UpdatedAt = c.UpdatedAt,
            Stats = new ClientStatsDto
            {
                TotalCasesCount = allCases.Count,
                ActiveCasesCount = allCases.Count(k => k.Status != WukalaGPT.Domain.Enums.CaseStatus.Closed),
                TotalInteractions = interactionsCountTask.Result,
                LastContactDate = lastContactTask.Result,
                TotalBilled = 0, // Pending Invoice feature
                OutstandingBalance = 0
            }
        };
    }
}

public class UpdateClientCommand : IRequest<bool>
{
    public Guid FirmId { get; set; }
    public Guid ClientId { get; set; }
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string[]? Tags { get; set; }
    public string? Status { get; set; }
    public bool? PortalEnabled { get; set; }
    public string? PortalEmail { get; set; }
    public string? Notes { get; set; }
}

public class UpdateClientCommandHandler : IRequestHandler<UpdateClientCommand, bool>
{
    private readonly IApplicationDbContext _db;
    public UpdateClientCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<bool> Handle(UpdateClientCommand req, CancellationToken cancellationToken)
    {
        var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == req.ClientId && c.FirmId == req.FirmId, cancellationToken);
        if (client == null) return false;

        if (req.FullName != null) client.FullName = req.FullName;
        if (req.Phone != null) client.Phone = req.Phone;
        if (req.Tags != null) client.Tags = req.Tags;
        if (req.Status != null) client.Status = req.Status;
        if (req.PortalEnabled.HasValue) client.PortalEnabled = req.PortalEnabled.Value;
        if (req.PortalEmail != null) client.PortalEmail = req.PortalEmail;
        if (req.Notes != null) client.Notes = req.Notes;

        client.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class ArchiveClientCommand : IRequest<bool>
{
    public Guid FirmId { get; set; }
    public Guid ClientId { get; set; }
}

public class ArchiveClientCommandHandler : IRequestHandler<ArchiveClientCommand, bool>
{
    private readonly IApplicationDbContext _db;
    public ArchiveClientCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<bool> Handle(ArchiveClientCommand req, CancellationToken cancellationToken)
    {
        var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == req.ClientId && c.FirmId == req.FirmId, cancellationToken);
        if (client == null) return false;

        var activeCases = await _db.LegalCases.AnyAsync(c => c.ClientId == client.Id && c.Status != WukalaGPT.Domain.Enums.CaseStatus.Closed && !c.IsArchived, cancellationToken);
        if (activeCases) throw new InvalidOperationException("Cannot archive client with active cases.");

        client.IsArchived = true;
        client.ArchivedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class GetFirmStatsQuery : IRequest<object>
{
    public Guid FirmId { get; set; }
}

public class GetFirmStatsQueryHandler : IRequestHandler<GetFirmStatsQuery, object>
{
    private readonly IApplicationDbContext _db;
    public GetFirmStatsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<object> Handle(GetFirmStatsQuery req, CancellationToken cancellationToken)
    {
        var baseQuery = _db.Clients.AsNoTracking().Where(c => c.FirmId == req.FirmId && !c.IsArchived);
        var clients = await baseQuery.Select(c => new { c.Status, c.RetentionFlagged, c.AcquisitionSource, c.ClientType }).ToListAsync(cancellationToken);

        return new
        {
            totalClients = clients.Count,
            activeClients = clients.Count(c => c.Status == "Active"),
            inactiveClients = clients.Count(c => c.Status == "Inactive"),
            conflictedClients = clients.Count(c => c.Status == "Conflicted"),
            retentionAlertsCount = clients.Count(c => c.RetentionFlagged),
            byAcquisitionSource = clients.Where(c => c.AcquisitionSource != null).GroupBy(c => c.AcquisitionSource).ToDictionary(g => g.Key!, g => g.Count()),
            byType = clients.GroupBy(c => c.ClientType).ToDictionary(g => g.Key, g => g.Count())
        };
    }
}

public class DismissRetentionAlertCommand : IRequest<bool>
{
    public Guid FirmId { get; set; }
    public Guid ClientId { get; set; }
}

public class DismissRetentionAlertCommandHandler : IRequestHandler<DismissRetentionAlertCommand, bool>
{
    private readonly IApplicationDbContext _db;
    public DismissRetentionAlertCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<bool> Handle(DismissRetentionAlertCommand req, CancellationToken cancellationToken)
    {
         var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == req.ClientId && c.FirmId == req.FirmId, cancellationToken);
         if (client == null) return false;
         
         client.RetentionFlagged = false;
         client.RetentionFlaggedAt = null;
         await _db.SaveChangesAsync(cancellationToken);
         return true;
    }
}
