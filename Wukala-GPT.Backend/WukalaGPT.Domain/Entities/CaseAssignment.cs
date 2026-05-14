using System;

namespace WukalaGPT.Domain.Entities;

public class CaseAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid CaseId { get; set; }
    public LegalCase Case { get; set; } = null!;
    
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public string Role { get; set; } = "AssistingLawyer";
    
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
