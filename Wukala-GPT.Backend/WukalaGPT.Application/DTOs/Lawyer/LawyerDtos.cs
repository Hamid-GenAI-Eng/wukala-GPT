using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.DTOs.Lawyer;

public class LawyerProfileDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    
    // User aggregated data
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;

    // Profile generic info
    public string LicenseNumber { get; set; } = string.Empty;
    public string CNIC { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string BarAssociation { get; set; } = string.Empty;
    public string BarCouncilNumber { get; set; } = string.Empty;
    public string DegreeTitle { get; set; } = string.Empty;
    public int YearOfCompletion { get; set; }
    public string University { get; set; } = string.Empty;
    public string ChamberAddress { get; set; } = string.Empty;
    
    public string? ProfilePhotoUrl { get; set; }
    public string? DegreeFileUrl { get; set; }
    public string? IntroVideoUrl { get; set; }
    
    // Stats & Bio
    public int YearsOfExperience { get; set; }
    public string Bio { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    public int CasesWon { get; set; }
    public int ActiveCases { get; set; }
    public string ResponseTime { get; set; } = string.Empty;
    
    // Settings & Status
    public bool IsProfileVisible { get; set; }
    public bool IsAvailableForNewCases { get; set; }
    public bool ReceiveEmailNotifications { get; set; }
    
    public VerificationStatus VerificationStatus { get; set; }
    public LawyerBadge Badges { get; set; }
    
    public decimal Rating { get; set; }
    public int ReviewCount { get; set; }
    
    // Collections
    public List<ExperienceDto> Experiences { get; set; } = new();
    public List<EducationDto> Educations { get; set; } = new();
    public List<SpecialityDto> Specialities { get; set; } = new();
}

public class UpdateLawyerProfileDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;

    public int YearsOfExperience { get; set; }
    public string Bio { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    public string ResponseTime { get; set; } = "Under 1 hour";
    
    public bool IsProfileVisible { get; set; } = true;
    public bool IsAvailableForNewCases { get; set; } = true;
    public bool ReceiveEmailNotifications { get; set; } = true;
}

public class UpdateLawyerSettingsDto
{
    public bool? IsProfileVisible { get; set; }
    public bool? IsAvailableForNewCases { get; set; }
    public bool? ReceiveEmailNotifications { get; set; }
}

public class UpdateLawyerBadgesDto
{
    public LawyerBadge Badges { get; set; }
}

public class ExperienceDto
{
    public Guid Id { get; set; }
    public string Role { get; set; } = string.Empty;
    public string FirmCompany { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public string? ShortBio { get; set; }
    public string? ProofUrl { get; set; }
}

public class UpdateExperienceDto
{
    public string Role { get; set; } = string.Empty;
    public string FirmCompany { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public string? ShortBio { get; set; }
    public string? ProofUrl { get; set; }
}

public class EducationDto
{
    public Guid Id { get; set; }
    public string InstituteName { get; set; } = string.Empty;
    public string DegreeName { get; set; } = string.Empty;
    public string Grades { get; set; } = string.Empty;
    public string? DegreeImageUrl { get; set; }
}

public class UpdateEducationDto
{
    public string InstituteName { get; set; } = string.Empty;
    public string DegreeName { get; set; } = string.Empty;
    public string Grades { get; set; } = string.Empty;
    public string? DegreeImageUrl { get; set; }
}

public class SpecialityDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
