using WukalaGPT.Application.DTOs.Admin;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.Interfaces;

public interface IAdminService
{
    Task<List<AdminLawyerProfileDto>> GetAllLawyersAsync(VerificationStatus? statusFilter);
    Task<AdminLawyerProfileDto> GetLawyerDetailsAsync(Guid lawyerUserId);
    Task UpdateLawyerVerificationStatusAsync(Guid lawyerUserId, VerificationStatus status);
    Task SuspendOrActivateUserAsync(Guid userId, bool isActive);
    Task<PlatformStatsDto> GetPlatformStatsAsync();
}
