using System;
using System.Collections.Generic;

namespace WukalaGPT.Domain.Entities.Billing;

public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string InvoiceNumber { get; set; } = string.Empty; // INV-2024-034
    
    public Guid LawyerId { get; set; }
    public User Lawyer { get; set; } = null!;
    
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    
    public Guid? CaseId { get; set; }
    public LegalCase? Case { get; set; }
    
    public string CaseRef { get; set; } = string.Empty;
    
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    
    public DateTime DateIssued { get; set; }
    public DateTime DueDate { get; set; }
    
    public string Status { get; set; } = "Draft"; // Paid, Pending, Overdue, Draft, Partially Paid
    public string? PaymentMethod { get; set; }
    public DateTime? PaidDate { get; set; }
    public string? Notes { get; set; }
    
    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class InvoiceItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Description { get; set; } = string.Empty;
    public decimal Hours { get; set; }
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
    
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
}
