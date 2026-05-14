using WukalaGPT.Application.DTOs.Lawyer;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.DTOs.Admin;

public class AdminLawyerProfileDto : LawyerProfileDto
{
    public bool IsEmailVerified { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class VerifyLawyerDto
{
    public VerificationStatus Status { get; set; }
}

public class SuspendUserDto
{
    public bool IsActive { get; set; }
}

public class PlatformStatsDto
{
    public int TotalLawyers { get; set; }
    public int PendingLawyerApprovals { get; set; }
    public int TotalClients { get; set; }
    public int TotalActiveUsers { get; set; }
    public int TotalSuspendedUsers { get; set; }
}
