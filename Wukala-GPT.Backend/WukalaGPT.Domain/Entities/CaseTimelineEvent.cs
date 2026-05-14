using System;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Domain.Entities;

public class CaseTimelineEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid CaseId { get; set; }
    public LegalCase Case { get; set; } = null!;
    
    public Guid? CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    
    public CaseEventType EventType { get; set; }
    
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    public DateTime EventDate { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
