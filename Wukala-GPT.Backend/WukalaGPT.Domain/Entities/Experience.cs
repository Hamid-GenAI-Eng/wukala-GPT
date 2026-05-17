namespace WukalaGPT.Domain.Entities;

public class Experience
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid LawyerProfileId { get; set; }
    public LawyerProfile LawyerProfile { get; set; } = null!;

    public string Role { get; set; } = string.Empty;
    public string FirmCompany { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public string? ShortBio { get; set; }
    
    public string? ProofUrl { get; set; }
}
