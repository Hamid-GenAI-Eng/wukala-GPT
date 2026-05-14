namespace WukalaGPT.Domain.Entities;

public class AiChatSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public string Title { get; set; } = "New Chat";
    
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
    
    public bool IsActive { get; set; } = true;
    
    public ICollection<AiChatMessage> Messages { get; set; } = new List<AiChatMessage>();
}
