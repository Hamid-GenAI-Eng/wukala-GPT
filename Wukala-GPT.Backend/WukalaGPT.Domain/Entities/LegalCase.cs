using System;
using System.Collections.Generic;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Domain.Entities;

public class LegalCase
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    // In a multi-tenant system, this would link to the Firm boundary
    public Guid FirmId { get; set; }
    
    // Lead lawyer owning this case
    public Guid LeadLawyerId { get; set; }
    public User LeadLawyer { get; set; } = null!;
    
    // Optional Client Profile if registered, else raw text
    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }
    public string? ClientNameRaw { get; set; }
    
    public string? CaseNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? CourtName { get; set; }
    
    public CaseType CaseType { get; set; }
    public CaseStatus Status { get; set; } = CaseStatus.Filed;
    public CaseOutcome Outcome { get; set; } = CaseOutcome.None;
    public CasePriority Priority { get; set; } = CasePriority.Normal;
    
    public string? FirNumber { get; set; }
    public DateTime? FilingDate { get; set; }
    public DateOnly? NextDate { get; set; }
    public string? JudgeName { get; set; }
    public string? OpposingCounsel { get; set; }
    
    public string? Description { get; set; }
    public bool IsArchived { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public ICollection<CaseAssignment> Assignments { get; set; } = new List<CaseAssignment>();
    public ICollection<CaseTimelineEvent> TimelineEvents { get; set; } = new List<CaseTimelineEvent>();
    public ICollection<CaseNote> Notes { get; set; } = new List<CaseNote>();
    public ICollection<CaseDeadline> Deadlines { get; set; } = new List<CaseDeadline>();
    public ICollection<LegalDocument> Documents { get; set; } = new List<LegalDocument>();
    
    // We navigate links on both directions manually
    public ICollection<CaseLink> SourceLinks { get; set; } = new List<CaseLink>();
    public ICollection<CaseLink> TargetLinks { get; set; } = new List<CaseLink>();
}
