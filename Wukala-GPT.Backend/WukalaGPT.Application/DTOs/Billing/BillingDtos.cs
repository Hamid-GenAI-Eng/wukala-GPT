using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace WukalaGPT.Application.DTOs.Billing;

public class InvoiceDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string CaseRef { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string AmountFormatted { get; set; } = string.Empty;
    public DateTime DateIssued { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<InvoiceItemDto> Items { get; set; } = new();
    public decimal PaidAmount { get; set; }
    public string? PaymentMethod { get; set; }
    public DateTime? PaidDate { get; set; }
    public string? Notes { get; set; }
}

public class InvoiceItemDto
{
    public string Description { get; set; } = string.Empty;
    public decimal Hours { get; set; }
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
}

public class CreateInvoiceDto
{
    [Required(ErrorMessage = "Client is required.")]
    public Guid ClientId { get; set; }
    
    public Guid? CaseId { get; set; }
    
    [Required(ErrorMessage = "Case Reference is required.")]
    public string CaseRef { get; set; } = string.Empty;
    
    [Required]
    public DateTime DateIssued { get; set; }
    
    [Required]
    public DateTime DueDate { get; set; }
    
    [Required]
    [MinLength(1, ErrorMessage = "At least one line item is required.")]
    public List<InvoiceItemDto> Items { get; set; } = new();
    
    public string? Notes { get; set; }
}

public class PaymentDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string Method { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class CreatePaymentDto
{
    [Required]
    public decimal Amount { get; set; }
    
    [Required]
    public string Method { get; set; } = string.Empty;
    
    public string Reference { get; set; } = string.Empty;
    
    [Required]
    public DateTime Date { get; set; }
}

public class RetainerDto
{
    public Guid Id { get; set; }
    public string RetainerNumber { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal UsedAmount { get; set; }
    public decimal RemainingAmount => TotalAmount - UsedAmount;
    public int UtilizationPercentage => TotalAmount > 0 ? (int)(UsedAmount / TotalAmount * 100) : 0;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string BillingCycle { get; set; } = string.Empty;
}

public class CreateRetainerDto
{
    [Required]
    public Guid ClientId { get; set; }
    
    [Required]
    public decimal TotalAmount { get; set; }
    
    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }
    
    [Required]
    public string BillingCycle { get; set; } = string.Empty; // Monthly, Quarterly, Annual
}

public class BillingTemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<InvoiceItemDto> Items { get; set; } = new();
    public int UsageCount { get; set; }
    public DateTime? LastUsed { get; set; }
}

public class CreateTemplateDto
{
    [Required]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public string Category { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    [Required]
    [MinLength(1)]
    public List<InvoiceItemDto> Items { get; set; } = new();
}

public class BillingSummaryDto
{
    public decimal TotalRevenue { get; set; }
    public decimal OutstandingAmount { get; set; }
    public decimal OverdueAmount { get; set; }
    public int ActiveRetainersCount { get; set; }
    
    public string TotalRevenueFormatted => $"₨ {TotalRevenue:N0}";
    public string OutstandingAmountFormatted => $"₨ {OutstandingAmount:N0}";
    public string OverdueAmountFormatted => $"₨ {OverdueAmount:N0}";
}
