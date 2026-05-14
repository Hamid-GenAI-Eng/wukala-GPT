using System;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Domain.Entities;

public class StaffTask
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid FirmId { get; set; }
    
    public string Title { get; set; } = string.Empty;
    
    public Guid AssignedToUserId { get; set; }
    public User AssignedToUser { get; set; } = null!;
    
    public Guid AssignedByUserId { get; set; }
    public User AssignedByUser { get; set; } = null!;
    
    public DateTime DueDate { get; set; }
    
    public StaffTaskPriority Priority { get; set; } = StaffTaskPriority.Medium;
    public StaffTaskStatus Status { get; set; } = StaffTaskStatus.Pending;
    public StaffTaskType Type { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
