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

    public async Task<AuthResponseDto> RegisterClientAsync(RegisterClientDto dto, string? ipAddress = null, string? userAgent = null)
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
        var emailHtml = GenerateProfessionalOtpEmail(firstName, otp, ipAddress, userAgent);
        BackgroundJob.Enqueue(() => _emailService.SendEmailAsync(user.Email, "Your Verification Code - Wukala GPT", emailHtml));

        return new AuthResponseDto { Token = "", Message = "Client registered successfully. Please verify OTP sent to your email." };
    }

    public async Task<AuthResponseDto> RegisterLawyerAsync(RegisterLawyerDto dto, string? ipAddress = null, string? userAgent = null)
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
        var firstName = names.Length > 0 ? names[0] : string.Empty;
        var emailHtml = GenerateProfessionalOtpEmail(firstName, otp, ipAddress, userAgent);
        BackgroundJob.Enqueue(() => _emailService.SendEmailAsync(user.Email, "Your Verification Code - Wukala GPT", emailHtml));

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

    public async Task ResendOtpAsync(ResendOtpDto dto, string? ipAddress = null, string? userAgent = null)
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
        var emailHtml = GenerateProfessionalOtpEmail(user.FirstName, user.OtpCode, ipAddress, userAgent);
        BackgroundJob.Enqueue(() => _emailService.SendEmailAsync(user.Email, "Your Verification Code - Wukala GPT", emailHtml));
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
        var resetLink = $"https://www.wukala-gpt.app/reset-password?token={token}&email={user.Email}";
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

    private string GenerateProfessionalOtpEmail(string name, string otp, string? ipAddress, string? userAgent)
    {
        var refId = Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper();
        var time = DateTime.UtcNow.ToString("f") + " UTC";
        var ip = string.IsNullOrEmpty(ipAddress) ? "Unknown" : ipAddress;
        var os = string.IsNullOrEmpty(userAgent) ? "Unknown Device" : userAgent;

        return $@"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Verification Code - Wukala GPT</title>
            <style>
                body {{ font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }}
                .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }}
                .header {{ background-color: #1a365d; padding: 30px; text-align: center; border-bottom: 4px solid #c5a963; }}
                .header h1 {{ margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 0.5px; }}
                .header p {{ margin: 5px 0 0 0; color: #e2e8f0; font-size: 14px; opacity: 0.9; }}
                .content {{ padding: 40px 30px; }}
                .greeting {{ font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #2d3748; }}
                .otp-box {{ background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0; }}
                .otp-code {{ font-size: 36px; font-weight: 700; color: #1a365d; letter-spacing: 6px; margin: 0; }}
                .otp-note {{ font-size: 13px; color: #718096; margin-top: 10px; }}
                .security-info {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #edf2f7; font-size: 12px; color: #a0aec0; }}
                .security-info strong {{ color: #718096; font-weight: 600; }}
                .security-info ul {{ list-style: none; padding: 0; margin: 10px 0 0 0; }}
                .security-info li {{ margin-bottom: 6px; }}
                .footer {{ background-color: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; }}
                .footer a {{ color: #c5a963; text-decoration: none; font-weight: 600; }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>WUKALA GPT</h1>
                    <p>Mizan.AI - Enterprise Legal Intelligence</p>
                </div>
                <div class='content'>
                    <div class='greeting'>Hello {name},</div>
                    <p>You recently requested to sign in or register with Wukala GPT. Use the verification code below to securely complete your request.</p>
                    
                    <div class='otp-box'>
                        <div class='otp-code'>{otp}</div>
                        <div class='otp-note'>This code will expire in 10 minutes.</div>
                    </div>
                    
                    <p style='font-size: 14px; color: #4a5568; line-height: 1.6;'>If you did not request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.</p>
                    
                    <div class='security-info'>
                        <strong>Security Information</strong>
                        <ul>
                            <li><strong>Time:</strong> {time}</li>
                            <li><strong>IP Address:</strong> {ip}</li>
                            <li><strong>Device / OS:</strong> {os}</li>
                            <li><strong>Reference ID:</strong> {refId}</li>
                        </ul>
                    </div>
                </div>
                <div class='footer'>
                    <p>&copy; {DateTime.UtcNow.Year} Code Envision Technologies. All rights reserved.</p>
                    <p>Secure Legal Intelligence Platform | <a href='https://www.wukala-gpt.app/privacy'>Privacy Policy</a></p>
                </div>
            </div>
        </body>
        </html>";
    }
}
