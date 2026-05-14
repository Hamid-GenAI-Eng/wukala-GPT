using System;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.DTOs.Team;

public class TeamMemberDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public int ActiveCases { get; set; }
    public int TasksCompleted { get; set; }
    public int TasksPending { get; set; }
    public string Status { get; set; } = "Available"; // Derived from presence or FirmActivity
    public string Specialization { get; set; } = string.Empty;
    public string JoinedDate { get; set; } = string.Empty;
}

public class StaffTaskDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string AssignedTo { get; set; } = string.Empty;
    public string AssignedBy { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
}

public class FirmActivityLogDto
{
    public Guid Id { get; set; }
    public string Member { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Target { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty; // e.g. "10 min ago"
    public string Type { get; set; } = string.Empty; // UI matching
}

public class InviteMemberRequestDto
{
    public string Email { get; set; } = string.Empty;
    public TeamRole Role { get; set; }
}
