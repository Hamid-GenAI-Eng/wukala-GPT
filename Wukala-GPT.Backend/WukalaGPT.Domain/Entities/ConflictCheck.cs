using System;
using System.Text.Json;

namespace WukalaGPT.Domain.Entities;

public class ConflictCheck
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FirmId { get; set; }
    public Guid CheckedById { get; set; }

    // What was checked
    public string ClientName { get; set; } = string.Empty;
    public string? ClientCnic { get; set; }
    public string? OpposingParty { get; set; }

    // Result
    public string Result { get; set; } = string.Empty; // Clear, Conflict, NeedsReview
    public string? RiskLevel { get; set; } // None, Low, Medium, High
    public string? Notes { get; set; }

    // Matched records (stored as JSON snapshot for audit)
    public JsonDocument? MatchedClients { get; set; }
    public JsonDocument? MatchedCases { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
