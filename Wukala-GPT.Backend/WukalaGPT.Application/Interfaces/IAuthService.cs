using WukalaGPT.Application.DTOs.Auth;

namespace WukalaGPT.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterClientAsync(RegisterClientDto dto, string? ipAddress = null, string? userAgent = null);
    Task<AuthResponseDto> RegisterLawyerAsync(RegisterLawyerDto dto, string? ipAddress = null, string? userAgent = null);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task ResendOtpAsync(ResendOtpDto dto, string? ipAddress = null, string? userAgent = null);
    Task<AuthResponseDto> VerifyOtpAsync(VerifyOtpDto dto);
    Task ForgotPasswordAsync(ForgotPasswordDto dto);
    Task ResetPasswordAsync(ResetPasswordDto dto);
    Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto);
    Task<UserProfileDto> GetMeAsync(Guid userId);
    Task UpdateMeAsync(Guid userId, UpdateProfileDto dto);
    Task LogoutAsync(string token);
    Task AcceptInviteAsync(AcceptInviteDto dto);
}
