using System;

namespace WukalaGPT.Domain.Entities;

public class HearingAdjournment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Source Reference
    public Guid OriginalHearingId { get; set; }
    public Hearing OriginalHearing { get; set; } = null!;

    // Rescheduled Reference
    public Guid? NewHearingId { get; set; }
    public Hearing? NewHearing { get; set; }

    // Firm Scoping Denormalized Log
    public Guid FirmId { get; set; }

    public Guid AdjournedById { get; set; }
    public User AdjournedBy { get; set; } = null!;

    // Snapshots of the past
    public DateOnly OriginalDate { get; set; }
    public TimeOnly OriginalTime { get; set; }

    // Unconfirmed pending future states
    public DateOnly? NewDate { get; set; }
    public TimeOnly? NewTime { get; set; }

    // Details Context
    public string Reason { get; set; } = string.Empty;
    public string? ReasonDetail { get; set; }
    public string? CourtOrderRef { get; set; }
    public bool AdjournedByCourt { get; set; } = false;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
