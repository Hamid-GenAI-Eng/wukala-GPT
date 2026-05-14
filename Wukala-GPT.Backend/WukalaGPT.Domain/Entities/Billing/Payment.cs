using System;

namespace WukalaGPT.Domain.Entities.Billing;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string Method { get; set; } = string.Empty; // Bank Transfer, Cash, Cheque, Online
    public string Reference { get; set; } = string.Empty;
    public string Status { get; set; } = "Completed"; // Completed, Processing, Failed
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
