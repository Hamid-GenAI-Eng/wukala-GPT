using Microsoft.EntityFrameworkCore;
using WukalaGPT.Application.DTOs.Admin;
using WukalaGPT.Application.DTOs.Lawyer;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Domain.Enums;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;


namespace WukalaGPT.Application.Features.Admin;

public class AdminService : IAdminService
{
    private readonly IApplicationDbContext _context;
    private readonly IDistributedCache _cache;
    private readonly Microsoft.Extensions.Logging.ILogger<AdminService> _logger;
    
    // Enterprise level constants for cache management
    private const string CITIES_CACHE_KEY = "Available_Cities";

    public AdminService(
        IApplicationDbContext context, 
        IDistributedCache cache,
        Microsoft.Extensions.Logging.ILogger<AdminService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }


    private async Task InvalidateSearchCacheAsync(Guid? lawyerUserId = null)
    {
        try
        {
            if (lawyerUserId.HasValue)
            {
                // Clear the specific lawyer's profile view cache so clients/lawyers see the update instantly
                await _cache.RemoveAsync($"Lawyer_Profile_{lawyerUserId.Value}");
            }

            // Enterprise Cache Pinning Strategy: Increment version to invalidate all current search permutations
            string versionKey = "Lawyer_Search_Global_Version";
            string versionStr = await _cache.GetStringAsync(versionKey);
            int version = string.IsNullOrEmpty(versionStr) ? 0 : int.Parse(versionStr);
            await _cache.SetStringAsync(versionKey, (version + 1).ToString(), new DistributedCacheEntryOptions 
            { 
                AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1) 
            });
            
            await _cache.RemoveAsync(CITIES_CACHE_KEY);
            _logger.LogInformation("Search cache invalidated successfully. Global version: {Version}", version + 1);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Redis cache invalidation failed: {Message}. Search results may be stale for up to 10 mins.", ex.Message);
        }
    }


    private AdminLawyerProfileDto MapToAdminDto(LawyerProfile lawyer)
    {
        return new AdminLawyerProfileDto
        {
            Id = lawyer.Id,
            UserId = lawyer.UserId,
            FirstName = lawyer.User.FirstName,
            LastName = lawyer.User.LastName,
            Email = lawyer.User.Email,
            PhoneNumber = lawyer.User.PhoneNumber,
            City = lawyer.User.City,
            
            IsEmailVerified = lawyer.User.IsEmailVerified,
            IsActive = lawyer.User.IsActive,
            CreatedAt = lawyer.User.CreatedAt,
            
            LicenseNumber = lawyer.LicenseNumber,
            CNIC = lawyer.CNIC,
            Specialization = lawyer.Specialization,
            BarAssociation = lawyer.BarAssociation,
            BarCouncilNumber = lawyer.BarCouncilNumber,
            DegreeTitle = lawyer.DegreeTitle,
            YearOfCompletion = lawyer.YearOfCompletion,
            University = lawyer.University,
            ChamberAddress = lawyer.ChamberAddress,
            
            ProfilePhotoUrl = lawyer.ProfilePhotoUrl,
            DegreeFileUrl = lawyer.DegreeFileUrl,
            IntroVideoUrl = lawyer.IntroVideoUrl,
            
            YearsOfExperience = lawyer.YearsOfExperience,
            Bio = lawyer.Bio,
            ConsultationFee = lawyer.ConsultationFee,
            CasesWon = lawyer.CasesWon,
            ActiveCases = lawyer.ActiveCases,
            ResponseTime = lawyer.ResponseTime,
            
            IsProfileVisible = lawyer.IsProfileVisible,
            IsAvailableForNewCases = lawyer.IsAvailableForNewCases,
            ReceiveEmailNotifications = lawyer.ReceiveEmailNotifications,
            
            VerificationStatus = lawyer.VerificationStatus,
            Badges = lawyer.Badges,
            Rating = lawyer.Rating,
            ReviewCount = lawyer.ReviewCount,
            
            Experiences = lawyer.Experiences.Select(e => new ExperienceDto
            {
                Id = e.Id,
                Role = e.Role,
                FirmCompany = e.FirmCompany,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                IsCurrent = e.IsCurrent,
                ShortBio = e.ShortBio
            }).ToList(),
            
            Educations = lawyer.Educations.Select(e => new EducationDto
            {
                Id = e.Id,
                InstituteName = e.InstituteName,
                DegreeName = e.DegreeName,
                Grades = e.Grades,
                DegreeImageUrl = e.DegreeImageUrl
            }).ToList(),
            
            Specialities = lawyer.LawyerSpecialities.Select(ls => new SpecialityDto
            {
                Id = ls.Speciality.Id,
                Name = ls.Speciality.Name
            }).ToList()
        };
    }

    public async Task<List<AdminLawyerProfileDto>> GetAllLawyersAsync(VerificationStatus? statusFilter)
    {
        var query = _context.LawyerProfiles
            .Include(l => l.User)
            .Include(l => l.Experiences)
            .Include(l => l.Educations)
            .Include(l => l.LawyerSpecialities)
                .ThenInclude(ls => ls.Speciality)
            // Fix 1: Strictly hide users who have not verified their email via OTP
            .Where(l => l.User.IsEmailVerified == true)
            .AsQueryable();

        if (statusFilter.HasValue)
        {
            query = query.Where(l => l.VerificationStatus == statusFilter.Value);
        }

        var lawyers = await query.ToListAsync();
        return lawyers.Select(MapToAdminDto).ToList();
    }

    public async Task<AdminLawyerProfileDto> GetLawyerDetailsAsync(Guid lawyerUserId)
    {
        // Enterprise level: [v1.0.3-PRO] - Resilience and detailed diagnostics
        var lawyer = await _context.LawyerProfiles
            .Include(l => l.User)
            .Include(l => l.Experiences)
            .Include(l => l.Educations)
            .Include(l => l.LawyerSpecialities)
                .ThenInclude(ls => ls.Speciality)
            .FirstOrDefaultAsync(l => l.UserId == lawyerUserId || l.Id == lawyerUserId);

        if (lawyer == null)
        {
            // Self-healing check: Is it just a User record missing a Profile?
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == lawyerUserId && u.Role == UserRole.Lawyer);
            if (user != null)
            {
                throw new Exception($"[v1.0.3-PRO] GHOST RECORD: User exists but Profile is missing. Use 'Update' to fix.");
            }
            throw new Exception($"[v1.0.3-PRO] Lawyer record not found for ID: {lawyerUserId}.");
        }

        return MapToAdminDto(lawyer);
    }

    public async Task UpdateLawyerVerificationStatusAsync(Guid lawyerUserId, VerificationStatus status)
    {
        _logger.LogInformation("Updating verification status for lawyer user {UserId} to {Status}", lawyerUserId, status);

        // Enterprise Fix: Must .Include(l => l.User) to avoid NullReferenceException when activating account
        var lawyer = await _context.LawyerProfiles
            .Include(l => l.User)
            .FirstOrDefaultAsync(l => l.UserId == lawyerUserId || l.Id == lawyerUserId);
        
        if (lawyer == null) 
        {
            _logger.LogWarning("Lawyer profile not found for ID {Id}; checking if it is a User ID.", lawyerUserId);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == lawyerUserId && u.Role == UserRole.Lawyer);
            if (user == null)
                throw new Exception($"[v1.0.5] Lawyer record not found for ID: {lawyerUserId}");

            _logger.LogInformation("Found User record for {UserId}. Creating profile on the fly...", lawyerUserId);
            lawyer = new LawyerProfile
            {
                UserId = user.Id,
                User = user,
                VerificationStatus = status,
                IsProfileVisible = true,
                IsAvailableForNewCases = true
            };

            if (status == VerificationStatus.Approved)
            {
                user.IsActive = true;
                user.IsEmailVerified = true;
            }

            _context.LawyerProfiles.Add(lawyer);
        }
        else
        {
            lawyer.VerificationStatus = status;
            // Ensure lawyer is searchable immediately upon approval
            if (status == VerificationStatus.Approved)
            {
                _logger.LogInformation("Deep-activating lawyer {LawyerId} (User: {UserId}) profile and flags.", lawyer.Id, lawyer.UserId);
                lawyer.IsProfileVisible = true;
                lawyer.IsAvailableForNewCases = true; // Crucial fix for default DB value
                
                if (lawyer.User != null)
                {
                    lawyer.User.IsActive = true;
                    lawyer.User.IsEmailVerified = true;
                }
            }
        }

        await _context.SaveChangesAsync(default);
        _logger.LogInformation("Database updated for Lawyer {UserId}. Proceeding to cache invalidation.", lawyerUserId);
        
        await InvalidateSearchCacheAsync(lawyer.UserId);
    }


    public async Task SuspendOrActivateUserAsync(Guid userId, bool isActive)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) throw new Exception("User not found.");

        user.IsActive = isActive;
        await _context.SaveChangesAsync(default);
    }

    public async Task<PlatformStatsDto> GetPlatformStatsAsync()
    {
        int totalLawyers = await _context.Users.CountAsync(u => u.Role == UserRole.Lawyer);
        int pendingApprovals = await _context.LawyerProfiles.CountAsync(l => l.VerificationStatus == VerificationStatus.Pending);
        int approvedVerifications = await _context.LawyerProfiles.CountAsync(l => l.VerificationStatus == VerificationStatus.Approved);
        int rejectedVerifications = await _context.LawyerProfiles.CountAsync(l => l.VerificationStatus == VerificationStatus.Rejected);
        int totalClients = await _context.Users.CountAsync(u => u.Role == UserRole.Client);
        
        int totalActive = await _context.Users.CountAsync(u => u.IsActive);
        int totalSuspended = await _context.Users.CountAsync(u => !u.IsActive);

        int activeChats = await _context.ChatSessions.CountAsync() + await _context.Conversations.CountAsync();
        int totalDocuments = await _context.LegalDocuments.CountAsync();

        return new PlatformStatsDto
        {
            TotalLawyers = totalLawyers,
            PendingLawyerApprovals = pendingApprovals,
            ApprovedVerifications = approvedVerifications,
            RejectedVerifications = rejectedVerifications,
            ActiveChats = activeChats,
            TotalDocuments = totalDocuments,
            TotalClients = totalClients,
            TotalActiveUsers = totalActive,
            TotalSuspendedUsers = totalSuspended
        };
    }
}
