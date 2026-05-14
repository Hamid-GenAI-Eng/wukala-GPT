using System;
using System.Collections.Generic;

namespace WukalaGPT.Domain.Entities;

public class Hearing
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    // Core Links
    public Guid FirmId { get; set; }
    public Firm Firm { get; set; } = null!;

    public Guid CaseId { get; set; }
    public LegalCase Case { get; set; } = null!;

    public Guid LeadLawyerId { get; set; }
    public User LeadLawyer { get; set; } = null!;

    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }

    // Hearing Demographics
    public string? HearingType { get; set; }
    public string CourtType { get; set; } = string.Empty;
    public string CourtName { get; set; } = string.Empty;
    public string? CourtRoom { get; set; }
    public string? JudgeName { get; set; }

    // Date and Time Components Native Separation
    public DateOnly HearingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public int DurationMins { get; set; } = 60;
    
    // Computed property strictly scoped to C# domain layer
    public TimeOnly EndTime => StartTime.AddMinutes(DurationMins);

    public string Status { get; set; } = "Scheduled";
    public string Priority { get; set; } = "Medium";

    // Descriptions
    public string? Notes { get; set; }
    public string? Instructions { get; set; }

    // Idempotent Hangfire Tracking
    public DateTimeOffset? Reminder24hSentAt { get; set; }
    public DateTimeOffset? Reminder2hSentAt { get; set; }

    // Audit Configs
    public bool IsArchived { get; set; } = false;
    public Guid CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Adjournments Navigation
    public ICollection<HearingAdjournment> Adjournments { get; set; } = new List<HearingAdjournment>();
}
