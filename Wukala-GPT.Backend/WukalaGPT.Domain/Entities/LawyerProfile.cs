using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Domain.Entities;

public class LawyerProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public string LicenseNumber { get; set; } = string.Empty;
    public string CNIC { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string BarAssociation { get; set; } = string.Empty;
    public string BarCouncilNumber { get; set; } = string.Empty;
    public string DegreeTitle { get; set; } = string.Empty;
    public int YearOfCompletion { get; set; }
    public string University { get; set; } = string.Empty;
    public string ChamberAddress { get; set; } = string.Empty;
    public string? DegreeFileUrl { get; set; }
    public string? IntroVideoUrl { get; set; }
    
    public string? ProfilePhotoUrl { get; set; }
    
    public int YearsOfExperience { get; set; }
    public string Bio { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    
    public int CasesWon { get; set; }
    public int ActiveCases { get; set; }
    public string ResponseTime { get; set; } = "Under 1 hour";
    
    // Settings
    public bool IsProfileVisible { get; set; } = true;
    public bool IsAvailableForNewCases { get; set; } = true;
    public bool ReceiveEmailNotifications { get; set; } = true;
    
    public VerificationStatus VerificationStatus { get; set; } = VerificationStatus.Pending;
    public LawyerBadge Badges { get; set; } = LawyerBadge.None;
    
    public decimal Rating { get; set; }
    public int ReviewCount { get; set; }
    
    // Collections
    public ICollection<Experience> Experiences { get; set; } = new List<Experience>();
    public ICollection<Education> Educations { get; set; } = new List<Education>();
    public ICollection<LawyerSpeciality> LawyerSpecialities { get; set; } = new List<LawyerSpeciality>();
}
