namespace WukalaGPT.Domain.Entities;

using WukalaGPT.Domain.Enums;

public class AiChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid SessionId { get; set; }
    public AiChatSession Session { get; set; } = null!;
    
    public AiMessageRole Role { get; set; }
    
    public string Content { get; set; } = string.Empty;
    
    public bool IsDeepResearch { get; set; }
    
    public int? TokensUsed { get; set; }
    public long? ProcessingTimeMs { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
