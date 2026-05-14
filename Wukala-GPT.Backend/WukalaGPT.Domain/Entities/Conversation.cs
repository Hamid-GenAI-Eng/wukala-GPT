namespace WukalaGPT.Domain.Entities;

public class Conversation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid Participant1Id { get; set; }
    public User Participant1 { get; set; } = null!;
    
    public Guid Participant2Id { get; set; }
    public User Participant2 { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
