namespace WukalaGPT.Domain.Entities;

public class ClientProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public string CompanyName { get; set; } = string.Empty;
    public string Industry { get; set; } = string.Empty;
    public string ContactNumber { get; set; } = string.Empty;
}
