using WukalaGPT.Application.DTOs.Auth;

namespace WukalaGPT.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterClientAsync(RegisterClientDto dto);
    Task<AuthResponseDto> RegisterLawyerAsync(RegisterLawyerDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task ResendOtpAsync(ResendOtpDto dto);
    Task<AuthResponseDto> VerifyOtpAsync(VerifyOtpDto dto);
    Task ForgotPasswordAsync(ForgotPasswordDto dto);
    Task ResetPasswordAsync(ResetPasswordDto dto);
    Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto);
    Task<UserProfileDto> GetMeAsync(Guid userId);
    Task LogoutAsync(string token);
}
