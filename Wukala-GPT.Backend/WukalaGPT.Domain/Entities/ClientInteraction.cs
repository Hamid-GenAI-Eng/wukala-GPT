using System;

namespace WukalaGPT.Domain.Entities;

public class ClientInteraction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    
    public Guid FirmId { get; set; }
    public Guid LoggedById { get; set; }

    public string Type { get; set; } = string.Empty; // 'Call', 'Meeting', etc.
    public string Summary { get; set; } = string.Empty;
    public string? Outcome { get; set; }
    public int? DurationMins { get; set; }

    public DateTimeOffset InteractionDate { get; set; }
    public string? NextAction { get; set; }
    public DateOnly? NextActionDate { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
