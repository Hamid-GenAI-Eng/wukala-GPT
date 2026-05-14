using System;
using System.Collections.Generic;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Domain.Entities;

public class Client
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FirmId { get; set; }
    public Guid CreatedById { get; set; }

    public Guid LawyerId { get; set; }
    public User Lawyer { get; set; } = null!;

    // Core Info
    public string FullName { get; set; } = string.Empty;
    public string ClientType { get; set; } = "Individual"; // 'Individual', 'Corporate'

    // Contact Details
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Whatsapp { get; set; }
    public string? Cnic { get; set; }

    // Corporate-specific
    public string? CompanyName { get; set; }
    public string? ContactPerson { get; set; }

    // Location
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Province { get; set; }

    // Classification
    public string[] Tags { get; set; } = Array.Empty<string>();
    public string? AcquisitionSource { get; set; }

    // Status
    public string Status { get; set; } = "Active";

    // Portal Access
    public bool PortalEnabled { get; set; } = false;
    public string? PortalEmail { get; set; }

    // Retention Tracking
    public bool RetentionFlagged { get; set; } = false;
    public DateTimeOffset? RetentionFlaggedAt { get; set; }

    // Dates
    public DateOnly OnboardedAt { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Soft Delete
    public bool IsArchived { get; set; } = false;
    public DateTimeOffset? ArchivedAt { get; set; }

    // Notes
    public string? Notes { get; set; }

    // Navigation Properties (Assuming EF Core setup later)
    public ICollection<LegalCase> Cases { get; set; } = new List<LegalCase>();
    public ICollection<ClientInteraction> Interactions { get; set; } = new List<ClientInteraction>();
}
