using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.Application.Features.Clients.Jobs;

public class RetentionAlertJob
{
    private readonly IApplicationDbContext _db;

    public RetentionAlertJob(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task ExecuteAsync(Guid firmId)
    {
        var cutoff = DateTimeOffset.UtcNow.AddDays(-60);

        // Find Active, non-archived clients for this firm
        var activeClientIds = await _db.Clients
            .Where(c => c.FirmId == firmId && c.Status == "Active" && !c.IsArchived)
            .Select(c => c.Id)
            .ToListAsync();

        if (!activeClientIds.Any()) return;

        // Filter: No contact in 60+ days
        var recentlyContactedIds = await _db.ClientInteractions
            .Where(i => activeClientIds.Contains(i.ClientId) && i.InteractionDate > cutoff)
            .Select(i => i.ClientId)
            .Distinct()
            .ToListAsync();

        var atRiskIds = activeClientIds.Except(recentlyContactedIds).ToList();

        if (!atRiskIds.Any()) return;

        // Note: Missing 'Invoices' constraint from exact spec since Invoices table does not exist yet.
        // Once Billing module is implemented, we can add the billing constraint here.

        // Flag them
        await _db.Clients
            .Where(c => atRiskIds.Contains(c.Id))
            .ExecuteUpdateAsync(s => s
                .SetProperty(c => c.RetentionFlagged, true)
                .SetProperty(c => c.RetentionFlaggedAt, DateTimeOffset.UtcNow));

        // Publish event for firm owner (assuming mediatR pipeline hook added later)
    }
}
