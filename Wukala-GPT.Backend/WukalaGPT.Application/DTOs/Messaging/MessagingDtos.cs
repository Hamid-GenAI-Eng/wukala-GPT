using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.DTOs.Messaging;

public class MessageDto
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string? SenderPhotoUrl { get; set; }
    
    public Guid ReceiverId { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public string? ReceiverPhotoUrl { get; set; }
    
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public MessageStatus Status { get; set; }
}

public class ConversationDto
{
    public Guid Id { get; set; }
    
    public Guid OtherParticipantId { get; set; }
    public string OtherParticipantName { get; set; } = string.Empty;
    public string? OtherParticipantPhotoUrl { get; set; }
    
    public bool IsOnline { get; set; }
    public DateTime? LastSeenAt { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime LastMessageAt { get; set; }
    
    public MessageDto? LastMessage { get; set; }
    public int UnreadCount { get; set; }
}
