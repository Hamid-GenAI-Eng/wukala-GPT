using MediatR;
using Microsoft.EntityFrameworkCore;
using Hangfire;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Application.Features.Clients.Jobs;

namespace WukalaGPT.Application.Features.Clients;

public class InteractionDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string? Outcome { get; set; }
    public int? DurationMins { get; set; }
    public DateTimeOffset InteractionDate { get; set; }
    public string? NextAction { get; set; }
    public DateOnly? NextActionDate { get; set; }
    public Guid LoggedById { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class GetInteractionsQuery : IRequest<List<InteractionDto>>
{
    public Guid ClientId { get; set; }
    public string? Type { get; set; }
}

public class GetInteractionsQueryHandler : IRequestHandler<GetInteractionsQuery, List<InteractionDto>>
{
    private readonly IApplicationDbContext _db;
    public GetInteractionsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<InteractionDto>> Handle(GetInteractionsQuery req, CancellationToken cancellationToken)
    {
        var q = _db.ClientInteractions.AsNoTracking().Where(i => i.ClientId == req.ClientId);
        if (!string.IsNullOrEmpty(req.Type)) q = q.Where(i => i.Type == req.Type);

        return await q.OrderByDescending(i => i.InteractionDate).Select(i => new InteractionDto
        {
            Id = i.Id, Type = i.Type, Summary = i.Summary, Outcome = i.Outcome, DurationMins = i.DurationMins,
            InteractionDate = i.InteractionDate, NextAction = i.NextAction, NextActionDate = i.NextActionDate,
            LoggedById = i.LoggedById, CreatedAt = i.CreatedAt
        }).ToListAsync(cancellationToken);
    }
}

public class LogInteractionCommand : IRequest<InteractionDto>
{
    public Guid ClientId { get; set; }
    public Guid FirmId { get; set; }
    public Guid LoggedById { get; set; }
    public string Type { get; set; } = string.Empty; // 'Call', 'Meeting', etc.
    public string Summary { get; set; } = string.Empty;
    public string? Outcome { get; set; }
    public int? DurationMins { get; set; }
    public DateTimeOffset InteractionDate { get; set; }
    public string? NextAction { get; set; }
    public DateOnly? NextActionDate { get; set; }
}

public class LogInteractionCommandHandler : IRequestHandler<LogInteractionCommand, InteractionDto>
{
    private readonly IApplicationDbContext _db;
    public LogInteractionCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<InteractionDto> Handle(LogInteractionCommand req, CancellationToken cancellationToken)
    {
        var interaction = new ClientInteraction
        {
            ClientId = req.ClientId, FirmId = req.FirmId, LoggedById = req.LoggedById, Type = req.Type, Summary = req.Summary,
            Outcome = req.Outcome, DurationMins = req.DurationMins, InteractionDate = req.InteractionDate, NextAction = req.NextAction, NextActionDate = req.NextActionDate
        };

        _db.ClientInteractions.Add(interaction);

        // Turn off retention flag if it's back engaged
        var client = await _db.Clients.FindAsync(new object[] { req.ClientId }, cancellationToken);
        if (client != null && client.RetentionFlagged)
        {
            client.RetentionFlagged = false;
            client.RetentionFlaggedAt = null;
        }

        await _db.SaveChangesAsync(cancellationToken);

        // Hangfire Scheduling Hook for Follow-up Reminders
        if (req.NextActionDate.HasValue && !string.IsNullOrEmpty(req.NextAction))
        {
            var triggerTime = req.NextActionDate.Value.ToDateTime(new TimeOnly(9, 0), DateTimeKind.Utc);
            BackgroundJob.Schedule<FollowUpReminderJob>(j => j.SendFollowUpReminder(interaction.Id), triggerTime);
        }

        return new InteractionDto { Id = interaction.Id, Type = interaction.Type, InteractionDate = interaction.InteractionDate };
    }
}
