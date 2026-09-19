using Microsoft.EntityFrameworkCore;
using WukalaGPT.Application.DTOs.Common;
using WukalaGPT.Application.DTOs.Lawyer;
using WukalaGPT.Application.DTOs.Search;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Enums;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using System.Text.Json;


namespace WukalaGPT.Application.Features.Search;

public class LawyerSearchService : ILawyerSearchService
{
    private readonly IApplicationDbContext _context;
    private readonly IDistributedCache _cache;
    private readonly Microsoft.Extensions.Logging.ILogger<LawyerSearchService> _logger;

    public LawyerSearchService(
        IApplicationDbContext context, 
        IDistributedCache cache,
        Microsoft.Extensions.Logging.ILogger<LawyerSearchService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }


    public async Task<PagedResult<LawyerSearchItemDto>> SearchLawyersAsync(LawyerSearchQueryDto query)
    {
        // Fetch current cache version - Fail-safe against Redis downtime
        string versionKey = "Lawyer_Search_Global_Version";
        string version = "0";
        string? cachedData = null;

        try
        {
            version = await _cache.GetStringAsync(versionKey) ?? "0";
            var cacheKey = $"Search_Lawyers_v{version}_{query.City}_{query.SpecialityId}_{query.MaxConsultationFee}_{query.MinYearsOfExperience}_{query.SortBy}_{query.Page}_{query.PageSize}";
            cachedData = await _cache.GetStringAsync(cacheKey);
            
            if (!string.IsNullOrEmpty(cachedData))
            {
                _logger.LogInformation("Search results served from cache (v{Version})", version);
                return JsonSerializer.Deserialize<PagedResult<LawyerSearchItemDto>>(cachedData)!;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Redis cache error in Search: {Message}. Falling back to DB.", ex.Message);
        }


        // Start with only visible, available, and fully approved lawyers
        var baseQuery = _context.LawyerProfiles
            .Include(l => l.User)
            .Include(l => l.LawyerSpecialities)
                .ThenInclude(ls => ls.Speciality)
            .Where(l => l.IsProfileVisible && 
                   l.IsAvailableForNewCases && 
                   l.VerificationStatus == VerificationStatus.Approved &&
                   l.User.IsActive);

        // Verification Logging: Help identify why Found 0
        _logger.LogDebug("Running Search Data Audit...");
        var approvedCount = await _context.LawyerProfiles.CountAsync(l => l.VerificationStatus == VerificationStatus.Approved);
        var activeApprovedCount = await _context.LawyerProfiles.CountAsync(l => l.VerificationStatus == VerificationStatus.Approved && l.User.IsActive);
        var searchReadyCount = await _context.LawyerProfiles.CountAsync(l => l.VerificationStatus == VerificationStatus.Approved && l.User.IsActive && l.IsProfileVisible && l.IsAvailableForNewCases);
        
        _logger.LogInformation("Search Context Audit - Approved: {Approved}, Active+Approved: {ActiveApproved}, Searchable: {Searchable}", 
            approvedCount, activeApprovedCount, searchReadyCount);


        // Apply Hard Filters
        if (!string.IsNullOrEmpty(query.City))
        {
            baseQuery = baseQuery.Where(l => l.User.City.ToLower() == query.City.ToLower());
        }
        
        if (query.SpecialityId.HasValue)
        {
            baseQuery = baseQuery.Where(l => l.LawyerSpecialities.Any(ls => ls.SpecialityId == query.SpecialityId.Value));
        }

        if (query.MaxConsultationFee.HasValue)
        {
            baseQuery = baseQuery.Where(l => l.ConsultationFee <= query.MaxConsultationFee.Value);
        }

        if (query.MinYearsOfExperience.HasValue)
        {
            baseQuery = baseQuery.Where(l => l.YearsOfExperience >= query.MinYearsOfExperience.Value);
        }

        // Apply Ranking Algorithm & Projection combined
        // Because of EF Core limitations with flags enums in complex math, we'll project a simplified version first
        var projectedQuery = baseQuery.Select(l => new 
        {
            Lawyer = l,
            // Calculate base relevance components that EF can translate to SQL
            BaseScore = (decimal)(l.Rating * 10) + 
                        (Math.Min(l.ReviewCount, 40) * 0.5m) + 
                        (Math.Min(l.YearsOfExperience, 20) * 1.0m) + 
                        (Math.Min(l.CasesWon, 75) * 0.2m)
        });
        
        // Materialize the list for the current paginated view, then apply the in-memory Badge boost calculations
        var totalCount = await projectedQuery.CountAsync();
        
        // Apply Sorting mapped from the 'query.SortBy' string
        switch (query.SortBy?.ToLower())
        {
            case "priceasc":
                projectedQuery = projectedQuery.OrderBy(x => x.Lawyer.ConsultationFee);
                break;
            case "pricedesc":
                projectedQuery = projectedQuery.OrderByDescending(x => x.Lawyer.ConsultationFee);
                break;
            case "experience":
                projectedQuery = projectedQuery.OrderByDescending(x => x.Lawyer.YearsOfExperience);
                break;
            case "rating":
                projectedQuery = projectedQuery.OrderByDescending(x => x.Lawyer.Rating).ThenByDescending(x => x.Lawyer.ReviewCount);
                break;
            default: // "relevance"
                // We order by the combined BaseScore. The badges tiebreaker will happen in memory for the top N.
                projectedQuery = projectedQuery.OrderByDescending(x => x.BaseScore).ThenByDescending(x => x.Lawyer.Rating);
                break;
        }

        // Apply Pagination
        var paginatedResults = await projectedQuery
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        // Perform final in-memory Relevance Score boost based on Flag Enums and map to final DTO
        var itemsList = paginatedResults.Select(p => 
        {
            double badgeBoost = 0;
            if (p.Lawyer.Badges.HasFlag(LawyerBadge.TopRated)) badgeBoost += 15;
            if (p.Lawyer.Badges.HasFlag(LawyerBadge.ClientRecommended)) badgeBoost += 10;
            if (p.Lawyer.Badges.HasFlag(LawyerBadge.Verified)) badgeBoost += 5;
            
            double profileBoost = string.IsNullOrEmpty(p.Lawyer.ProfilePhotoUrl) ? 0 : 5;
            
            double finalScore = (double)p.BaseScore + badgeBoost + profileBoost;

            return new LawyerSearchItemDto
            {
                LawyerUserId = p.Lawyer.UserId,
                FullName = $"{p.Lawyer.User.FirstName} {p.Lawyer.User.LastName}".Trim(),
                City = p.Lawyer.User.City,
                ProfilePhotoUrl = p.Lawyer.ProfilePhotoUrl,
                ConsultationFee = p.Lawyer.ConsultationFee,
                Rating = p.Lawyer.Rating,
                ReviewCount = p.Lawyer.ReviewCount,
                YearsOfExperience = p.Lawyer.YearsOfExperience,
                Badges = p.Lawyer.Badges,
                Specialities = p.Lawyer.LawyerSpecialities.Select(ls => ls.Speciality.Name).ToList(),
                RelevanceScore = finalScore,
                Bio = p.Lawyer.Bio,
                DegreeTitle = p.Lawyer.DegreeTitle,
                University = p.Lawyer.University,
                Specialization = p.Lawyer.Specialization
            };
        }).ToList();

        // If sorted strictly by Relevance, re-sort the page in memory to account for the Badge Boosts!
        if (string.IsNullOrEmpty(query.SortBy) || query.SortBy.ToLower() == "relevance")
        {
            itemsList = itemsList.OrderByDescending(x => x.RelevanceScore).ToList();
        }

        var result = new PagedResult<LawyerSearchItemDto>
        {
            Items = itemsList,
            TotalCount = totalCount,
            PageSize = query.PageSize,
            CurrentPage = query.Page
        };

        try
        {
            var cacheKey = $"Search_Lawyers_v{version}_{query.City}_{query.SpecialityId}_{query.MaxConsultationFee}_{query.MinYearsOfExperience}_{query.SortBy}_{query.Page}_{query.PageSize}";
            var cacheOptions = new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), cacheOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed to save search results to cache: {Message}", ex.Message);
        }


        return result;
    }

    public async Task<LawyerClientViewDto> GetLawyerProfileForClientAsync(Guid lawyerUserId)
    {
        var cacheKey = $"Lawyer_Profile_{lawyerUserId}";
        var cachedProfile = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cachedProfile))
        {
            return JsonSerializer.Deserialize<LawyerClientViewDto>(cachedProfile)!;
        }

        var lawyer = await _context.LawyerProfiles
            .Include(l => l.User)
            .Include(l => l.Experiences)
            .Include(l => l.Educations)
            .Include(l => l.LawyerSpecialities)
                .ThenInclude(ls => ls.Speciality)
            .FirstOrDefaultAsync(l => l.UserId == lawyerUserId);

        if (lawyer == null || !lawyer.IsProfileVisible || !lawyer.IsAvailableForNewCases || lawyer.VerificationStatus != VerificationStatus.Approved || !lawyer.User.IsActive)
            throw new Exception("Lawyer profile is not available or does not exist.");

        var profileDto = new LawyerClientViewDto
        {
            LawyerUserId = lawyer.UserId,
            FirstName = lawyer.User.FirstName,
            LastName = lawyer.User.LastName,
            City = lawyer.User.City,
            PhoneNumber = lawyer.User.PhoneNumber,
            ChamberAddress = lawyer.ChamberAddress,
            
            Specialization = lawyer.Specialization,
            BarAssociation = lawyer.BarAssociation,
            DegreeTitle = lawyer.DegreeTitle,
            University = lawyer.University,
            
            ProfilePhotoUrl = lawyer.ProfilePhotoUrl,
            IntroVideoUrl = lawyer.IntroVideoUrl,
            
            YearsOfExperience = lawyer.YearsOfExperience,
            Bio = lawyer.Bio,
            ConsultationFee = lawyer.ConsultationFee,
            CasesWon = lawyer.CasesWon,
            ActiveCases = lawyer.ActiveCases,
            ResponseTime = lawyer.ResponseTime,
            
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
                ShortBio = e.ShortBio,
                ProofUrl = e.ProofUrl
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
        
        var cacheOptions = new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30) };
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(profileDto), cacheOptions);
        
        return profileDto;
    }

    public async Task<List<string>> GetAvailableCitiesAsync()
    {
        var cacheKey = "Available_Cities";
        var cachedCities = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cachedCities))
            return JsonSerializer.Deserialize<List<string>>(cachedCities)!;

        var cities = await _context.LawyerProfiles
            .Include(l => l.User)
            .Where(l => l.IsProfileVisible && l.IsAvailableForNewCases && l.VerificationStatus == VerificationStatus.Approved && l.User.IsActive)
            .Select(l => l.User.City)
            .Distinct()
            .ToListAsync();
            
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(cities), new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6) });
        return cities;
    }
}
