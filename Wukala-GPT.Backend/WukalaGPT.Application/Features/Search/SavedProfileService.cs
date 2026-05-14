using Microsoft.EntityFrameworkCore;
using WukalaGPT.Application.DTOs.Common;
using WukalaGPT.Application.DTOs.Search;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.Features.Search;

public class SavedProfileService : ISavedProfileService
{
    private readonly IApplicationDbContext _context;

    public SavedProfileService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task ToggleSaveProfileAsync(Guid clientId, Guid lawyerId)
    {
        var lawyerExists = await _context.Users.AnyAsync(u => u.Id == lawyerId && u.Role == UserRole.Lawyer);
        if (!lawyerExists)
            throw new Exception("Lawyer not found.");

        var existingSave = await _context.SavedProfiles
            .FirstOrDefaultAsync(sp => sp.ClientId == clientId && sp.LawyerId == lawyerId);

        if (existingSave != null)
        {
            // Already saved, so we toggle it OFF (unsave/remove)
            _context.SavedProfiles.Remove(existingSave);
        }
        else
        {
            // Not saved, so we toggle it ON (save/insert)
            _context.SavedProfiles.Add(new SavedProfile
            {
                ClientId = clientId,
                LawyerId = lawyerId,
                SavedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync(default);
    }

    public async Task<PagedResult<LawyerSearchItemDto>> GetSavedProfilesAsync(Guid clientId, int page, int pageSize)
    {
        // We join the SavedProfiles table to get only the lawyers the client has saved.
        var baseQuery = _context.SavedProfiles
            .Include(sp => sp.Lawyer)
                .ThenInclude(u => u.LawyerProfile)
                    .ThenInclude(lp => lp.LawyerSpecialities)
                        .ThenInclude(ls => ls.Speciality)
            .Where(sp => sp.ClientId == clientId 
                   && sp.Lawyer.LawyerProfile != null 
                   && sp.Lawyer.IsActive
                   && sp.Lawyer.LawyerProfile.IsProfileVisible)
            .OrderByDescending(sp => sp.SavedAt);

        var totalCount = await baseQuery.CountAsync();

        var paginatedResults = await baseQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var itemsList = paginatedResults.Select(sp => 
        {
            var p = sp.Lawyer;
            var prof = p.LawyerProfile!;
            
            // Re-calculate the Badge Boosts visually for the return DTO
            double badgeBoost = 0;
            if (prof.Badges.HasFlag(LawyerBadge.TopRated)) badgeBoost += 15;
            if (prof.Badges.HasFlag(LawyerBadge.ClientRecommended)) badgeBoost += 10;
            if (prof.Badges.HasFlag(LawyerBadge.Verified)) badgeBoost += 5;
            
            double profileBoost = string.IsNullOrEmpty(prof.ProfilePhotoUrl) ? 0 : 5;
            
            // Re-calculate the exact relevance base score natively
            decimal baseScore = (decimal)(prof.Rating * 10) + 
                                (Math.Min(prof.ReviewCount, 40) * 0.5m) + 
                                (Math.Min(prof.YearsOfExperience, 20) * 1.0m) + 
                                (Math.Min(prof.CasesWon, 75) * 0.2m);
            
            double finalScore = (double)baseScore + badgeBoost + profileBoost;

            return new LawyerSearchItemDto
            {
                LawyerUserId = p.Id,
                FullName = $"{p.FirstName} {p.LastName}".Trim(),
                City = p.City,
                ProfilePhotoUrl = prof.ProfilePhotoUrl,
                ConsultationFee = prof.ConsultationFee,
                Rating = prof.Rating,
                ReviewCount = prof.ReviewCount,
                YearsOfExperience = prof.YearsOfExperience,
                Badges = prof.Badges,
                Specialities = prof.LawyerSpecialities.Select(ls => ls.Speciality.Name).ToList(),
                RelevanceScore = finalScore
            };
        }).ToList();

        return new PagedResult<LawyerSearchItemDto>
        {
            Items = itemsList,
            TotalCount = totalCount,
            PageSize = pageSize,
            CurrentPage = page
        };
    }
}
