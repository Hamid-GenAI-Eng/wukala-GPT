using System;

namespace WukalaGPT.Domain.Entities.Billing;

public class Retainer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string RetainerNumber { get; set; } = string.Empty; // RET-001
    
    public Guid LawyerId { get; set; }
    public User Lawyer { get; set; } = null!;
    
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    
    public decimal TotalAmount { get; set; }
    public decimal UsedAmount { get; set; }
    
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    
    public string Status { get; set; } = "Active"; // Active, Expiring, Exhausted, Expired
    public string BillingCycle { get; set; } = "Monthly"; // Monthly, Quarterly, Yearly
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
