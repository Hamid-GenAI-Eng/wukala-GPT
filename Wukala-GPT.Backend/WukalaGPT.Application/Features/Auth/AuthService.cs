using Microsoft.EntityFrameworkCore;
using WukalaGPT.Application.DTOs.Auth;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Domain.Enums;
using BCrypt.Net;
using Microsoft.Extensions.Caching.Distributed;
using Hangfire;

namespace WukalaGPT.Application.Features.Auth;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtGenerator;
    private readonly IEmailService _emailService;
    private readonly IFileStorageService _fileStorage;
    private readonly IDistributedCache _cache;

    public AuthService(
        IApplicationDbContext context, 
        IJwtTokenGenerator jwtGenerator, 
        IEmailService emailService, 
        IFileStorageService fileStorage,
        IDistributedCache cache)
    {
        _context = context;
        _jwtGenerator = jwtGenerator;
        _emailService = emailService;
        _fileStorage = fileStorage;
        _cache = cache;
    }

    public async Task<AuthResponseDto> RegisterClientAsync(RegisterClientDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            throw new Exception("Email already exists.");

        var names = dto.FullName.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var firstName = names.Length > 0 ? names[0] : string.Empty;
        var lastName = names.Length > 1 ? names[1] : string.Empty;

        var otp = GenerateOtp();
        var user = new User
        {
            FirstName = firstName,
            LastName = lastName,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNo,
            City = dto.City,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = UserRole.Client,
            OtpCode = otp,
            OtpExpiry = DateTime.UtcNow.AddMinutes(10)
        };

        var clientProfile = new ClientProfile
        {
            User = user,
            UserId = user.Id
        };

        _context.Users.Add(user);
        _context.ClientProfiles.Add(clientProfile);
        
        await _context.SaveChangesAsync(default);
        
        // Enterprise level: Offload email to background job for instant response
        BackgroundJob.Enqueue(() => _emailService.SendEmailAsync(user.Email, "Your Verification Code - Wukala GPT", $"Your OTP code is: <b>{otp}</b>. It is valid for 10 minutes."));

        return new AuthResponseDto { Token = "", Message = "Client registered successfully. Please verify OTP sent to your email." };
    }

    public async Task<AuthResponseDto> RegisterLawyerAsync(RegisterLawyerDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            throw new Exception("Email already exists.");

        var names = dto.FullName.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        
        string? degreeUrl = null;
        if (dto.Degree != null)
            degreeUrl = await _fileStorage.UploadFileAsync(dto.Degree, "lawyer_degrees");
            
        string? videoUrl = null;
        if (dto.IntroVideo != null)
            videoUrl = await _fileStorage.UploadFileAsync(dto.IntroVideo, "lawyer_videos");

        var otp = GenerateOtp();
        var user = new User
        {
            FirstName = names.Length > 0 ? names[0] : string.Empty,
            LastName = names.Length > 1 ? names[1] : string.Empty,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNo,
            City = dto.City,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = UserRole.Lawyer,
            OtpCode = otp,
            OtpExpiry = DateTime.UtcNow.AddMinutes(10)
        };

        var lawyerProfile = new LawyerProfile
        {
            User = user,
            UserId = user.Id,
            CNIC = dto.CNIC,
            BarCouncilNumber = dto.BarCouncilNumber,
            DegreeTitle = dto.DegreeTitle,
            YearOfCompletion = dto.YearOfCompletion,
            University = dto.University,
            ChamberAddress = dto.ChamberAddress,
            DegreeFileUrl = degreeUrl,
            IntroVideoUrl = videoUrl,
            VerificationStatus = VerificationStatus.Pending
        };

        _context.Users.Add(user);
        _context.LawyerProfiles.Add(lawyerProfile);
        
        await _context.SaveChangesAsync(default);
        
        // Enterprise level: Offload email to background job for instant response
        BackgroundJob.Enqueue(() => _emailService.SendEmailAsync(user.Email, "Your Verification Code - Wukala GPT", $"Your OTP code is: <b>{otp}</b>. It is valid for 10 minutes."));

        return new AuthResponseDto { Token = "", Message = "Lawyer registered successfully. Please verify OTP sent to your email." };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new Exception("Invalid credentials.");

        if (!user.IsEmailVerified)
            throw new Exception("Please verify your email/OTP first.");

        var token = _jwtGenerator.GenerateToken(user);
        return new AuthResponseDto { Token = token, Message = "Login successful." };
    }

    public async Task ResendOtpAsync(ResendOtpDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null)
            throw new Exception("User not found.");

        if (user.IsEmailVerified)
            throw new Exception("Email is already verified.");

        user.OtpCode = GenerateOtp();
        user.OtpExpiry = DateTime.UtcNow.AddMinutes(10);
        
        await _context.SaveChangesAsync(default);
        
        // Enterprise level: Offload email to background job for instant response
        BackgroundJob.Enqueue(() => _emailService.SendEmailAsync(user.Email, "Your Verification Code - Wukala GPT", $"Your OTP code is: <b>{user.OtpCode}</b>. It is valid for 10 minutes."));
    }

    public async Task<AuthResponseDto> VerifyOtpAsync(VerifyOtpDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null)
            throw new Exception("User not found.");

        if (user.OtpCode != dto.OtpCode || user.OtpExpiry < DateTime.UtcNow)
            throw new Exception("Invalid or expired OTP.");

        user.IsEmailVerified = true;
        user.OtpCode = null;
        user.OtpExpiry = null;
        
        await _context.SaveChangesAsync(default);
        
        var token = _jwtGenerator.GenerateToken(user);
        return new AuthResponseDto { Token = token, Message = "Email verified successfully." };
    }

    public async Task ForgotPasswordAsync(ForgotPasswordDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null)
            return; // Don't leak user existence

        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()).Replace("+", "").Replace("/", "").Replace("=", "");
        user.PasswordResetToken = token;
        user.ResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        
        await _context.SaveChangesAsync(default);

        // Ideally this URL comes from config (frontend URL)
        var resetLink = $"https://app.wukalagpt.com/reset-password?token={token}&email={user.Email}";
        BackgroundJob.Enqueue(() => _emailService.SendEmailAsync(user.Email, "Reset Password - Wukala GPT", $"Click <a href='{resetLink}'>here</a> to reset your password."));
    }

    public async Task ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || user.PasswordResetToken != dto.Token || user.ResetTokenExpiry < DateTime.UtcNow)
            throw new Exception("Invalid or expired reset token.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.PasswordResetToken = null;
        user.ResetTokenExpiry = null;
        
        await _context.SaveChangesAsync(default);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new Exception("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            throw new Exception("Incorrect current password.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync(default);
    }

    public async Task<UserProfileDto> GetMeAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new Exception("User not found.");

        return new UserProfileDto
        {
            Id = user.Id,
            FullName = $"{user.FirstName} {user.LastName}".Trim(),
            Email = user.Email,
            Role = user.Role.ToString(),
            IsEmailVerified = user.IsEmailVerified
        };
    }

    private string GenerateOtp()
    {
        return new Random().Next(100000, 999999).ToString();
    }

    private async Task SendOtpEmailAsync(string email, string otp)
    {
        await _emailService.SendEmailAsync(email, "Your Verification Code - Wukala GPT", $"Your OTP code is: <b>{otp}</b>. It is valid for 10 minutes.");
    }

    public async Task LogoutAsync(string token)
    {
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7) // Match JWT expiration
        };
        await _cache.SetStringAsync($"Blacklist_{token}", "true", options);
    }
}
