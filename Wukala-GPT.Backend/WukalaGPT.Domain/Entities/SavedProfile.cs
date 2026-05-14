namespace WukalaGPT.Domain.Entities;

public class SavedProfile
{
    public Guid Id { get; set; }
    
    // The Client who is saving the profile
    public Guid ClientId { get; set; }
    public User Client { get; set; } = null!;
    
    // The Lawyer being saved
    public Guid LawyerId { get; set; }
    public User Lawyer { get; set; } = null!;
    
    public DateTime SavedAt { get; set; } = DateTime.UtcNow;
}
