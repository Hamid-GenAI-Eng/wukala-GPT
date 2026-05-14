using System;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Domain.Entities;

public class FirmExpense
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid FirmId { get; set; }
    
    public ExpenseCategory Category { get; set; }
    
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; } // When the expense occurred
    
    public string Description { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
