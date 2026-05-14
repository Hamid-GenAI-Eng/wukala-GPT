using System;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Domain.Entities;

public class CaseDeadline
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid CaseId { get; set; }
    public LegalCase Case { get; set; } = null!;
    
    public Guid? AssignedToId { get; set; }
    public User? AssignedTo { get; set; }
    
    public string Title { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    
    public bool IsDone { get; set; } = false;
    public CasePriority Priority { get; set; } = CasePriority.Normal;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
