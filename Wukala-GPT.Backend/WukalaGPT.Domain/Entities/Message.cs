namespace WukalaGPT.Domain.Entities;

public class Message
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SenderId { get; set; }
    public User Sender { get; set; } = null!;
    
    public Guid ReceiverId { get; set; }
    public User Receiver { get; set; } = null!;
    
    public Guid ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;
    
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public WukalaGPT.Domain.Enums.MessageStatus Status { get; set; } = WukalaGPT.Domain.Enums.MessageStatus.Sent;
}
