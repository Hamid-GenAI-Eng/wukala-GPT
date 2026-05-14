using System;

namespace WukalaGPT.Domain.Entities;

public class Firm
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
