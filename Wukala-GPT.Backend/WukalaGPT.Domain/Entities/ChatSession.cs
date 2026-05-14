namespace WukalaGPT.Domain.Entities;

public class ChatSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public string Title { get; set; } = "New Chat";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
    
    // In a real app, this might contain a list of ChatMessage, etc. 
    // depending on whether the AI messages are stored in DB.
    // public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
