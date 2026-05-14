namespace WukalaGPT.Domain.Entities;

public class Education
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid LawyerProfileId { get; set; }
    public LawyerProfile LawyerProfile { get; set; } = null!;

    public string InstituteName { get; set; } = string.Empty;
    public string DegreeName { get; set; } = string.Empty;
    public string Grades { get; set; } = string.Empty;
    public string? DegreeImageUrl { get; set; }
}
