using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.Application.Features.Clients.Jobs;

public class FollowUpReminderJob
{
    private readonly IApplicationDbContext _db;

    public FollowUpReminderJob(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task SendFollowUpReminder(Guid interactionId)
    {
        var interaction = await _db.ClientInteractions
            .Include(i => i.Client)
            .FirstOrDefaultAsync(i => i.Id == interactionId);

        if (interaction == null) return;  // deleted = skip silently

        // The exact spec dictates creating a notification.
        // Assuming a cross-module internal notification service or domain event exists:
        // await _notifications.CreateAsync(...)

        // For now, this securely serves as the Hangfire invocation skeleton until
        // the Notification module goes live.
        Console.WriteLine($"[Hangfire] Follow-up Reminder Sent to {interaction.LoggedById} for client {interaction.Client.FullName}: {interaction.NextAction}");
    }
}
