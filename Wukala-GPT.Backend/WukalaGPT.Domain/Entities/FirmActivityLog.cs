using System;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Domain.Entities;

public class FirmActivityLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid FirmId { get; set; }
    
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public string Action { get; set; } = string.Empty;
    public string Target { get; set; } = string.Empty;
    
    public FirmActivityType Type { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
