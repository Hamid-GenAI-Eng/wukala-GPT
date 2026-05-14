namespace WukalaGPT.Application.DTOs.AiChat;

public class AiChatRequestDto
{
    public string Message { get; set; } = string.Empty;
    public bool IsDeepResearch { get; set; }
    public Guid? SessionId { get; set; }
}

public class AiChatResponseDto
{
    public string Response { get; set; } = string.Empty;
}

public class MizanAiChatRequest
{
    public string message { get; set; } = string.Empty;
    public bool is_deep_research { get; set; }
    public string conversation_id { get; set; } = string.Empty;
}

public class MizanAiChatResponse
{
    public string response { get; set; } = string.Empty;
}

public class AiChatMessageDto
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class AiChatSessionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime LastMessageAt { get; set; }
}
