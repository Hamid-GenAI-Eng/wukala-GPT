using System;

namespace WukalaGPT.Domain.Entities;

public class CaseNote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid CaseId { get; set; }
    public LegalCase Case { get; set; } = null!;
    
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
    
    public string Content { get; set; } = string.Empty;
    public bool IsPrivate { get; set; } = false; // If true, only lead lawyer sees it
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
