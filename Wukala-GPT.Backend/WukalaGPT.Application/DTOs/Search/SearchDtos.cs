using WukalaGPT.Application.DTOs.Lawyer;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.DTOs.Search;

public class LawyerSearchQueryDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    
    // Filters
    public string? City { get; set; }
    public Guid? SpecialityId { get; set; }
    public decimal? MaxConsultationFee { get; set; }
    public int? MinYearsOfExperience { get; set; }
    
    // Sorting: Relevance, Rating, Experience, FeeAsc, FeeDesc
    // Defaults to Relevance
    public string SortBy { get; set; } = "Relevance"; 
}

public class LawyerSearchItemDto
{
    public Guid LawyerUserId { get; set; } // The ID of the Lawyer's User profile
    public string FullName { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    
    public string? ProfilePhotoUrl { get; set; }
    public decimal ConsultationFee { get; set; }
    public decimal Rating { get; set; }
    public int ReviewCount { get; set; }
    public int YearsOfExperience { get; set; }
    
    public LawyerBadge Badges { get; set; }
    public List<string> Specialities { get; set; } = new();
    
    // Extracted Algorithm Score
    public double RelevanceScore { get; set; }

    public string Bio { get; set; } = string.Empty;
    public string DegreeTitle { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
}

public class LawyerClientViewDto
{
    public Guid LawyerUserId { get; set; }
    
    // Public Info Only (Notice NO Email/Phone/ChamberAddress)
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    
    public string Specialization { get; set; } = string.Empty;
    public string BarAssociation { get; set; } = string.Empty;
    public string DegreeTitle { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    
    public string? ProfilePhotoUrl { get; set; }
    public string? IntroVideoUrl { get; set; }
    
    public int YearsOfExperience { get; set; }
    public string Bio { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    
    public int CasesWon { get; set; }
    public int ActiveCases { get; set; }
    public string ResponseTime { get; set; } = string.Empty;
    
    public LawyerBadge Badges { get; set; }
    public decimal Rating { get; set; }
    public int ReviewCount { get; set; }
    
    public List<ExperienceDto> Experiences { get; set; } = new();
    public List<EducationDto> Educations { get; set; } = new();
    public List<SpecialityDto> Specialities { get; set; } = new();
}
