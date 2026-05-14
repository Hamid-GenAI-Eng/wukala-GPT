using System;
using System.Collections.Generic;

namespace WukalaGPT.Domain.Entities.Billing;

public class BillingTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty; // Standard Litigation Invoice
    public string Category { get; set; } = string.Empty; // Litigation, Corporate, etc.
    public string Description { get; set; } = string.Empty;
    
    public Guid LawyerId { get; set; }
    public User Lawyer { get; set; } = null!;
    
    public int UsageCount { get; set; }
    public DateTime? LastUsed { get; set; }
    
    public ICollection<BillingTemplateItem> Items { get; set; } = new List<BillingTemplateItem>();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class BillingTemplateItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Description { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    
    public Guid TemplateId { get; set; }
    public BillingTemplate Template { get; set; } = null!;
}
