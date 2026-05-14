using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsEmailVerified { get; set; } = false;
    public string? OtpCode { get; set; }
    public DateTime? OtpExpiry { get; set; }
    public string? PasswordResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Team & Firm properties
    public Guid? FirmId { get; set; }
    public TeamRole? StaffRole { get; set; }
    
    // Presence Tracking
    public bool IsOnline { get; set; } = false;
    public DateTime? LastSeenAt { get; set; }
    
    // Navigation properties can be added here if needed
    public LawyerProfile? LawyerProfile { get; set; }
    public ClientProfile? ClientProfile { get; set; }
}
