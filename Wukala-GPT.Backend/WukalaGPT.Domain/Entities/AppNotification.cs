using System;

namespace WukalaGPT.Domain.Entities;

public class AppNotification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid? FirmId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Detail { get; set; }
    
    public string Type { get; set; } = string.Empty; // urgent, hearing, payment, document, etc.
    public string Priority { get; set; } = "medium"; // critical, high, medium, low
    
    public string? ActionLabel { get; set; }
    public string? ActionType { get; set; }
    public string? RelatedCaseReference { get; set; }
    public string? Source { get; set; } // Case Management, Billing, etc.

    public bool IsRead { get; set; } = false;
    public bool IsDismissed { get; set; } = false;
    
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

