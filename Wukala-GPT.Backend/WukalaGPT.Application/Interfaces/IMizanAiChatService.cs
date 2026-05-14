using WukalaGPT.Application.DTOs.AiChat;

namespace WukalaGPT.Application.Interfaces;

public interface IMizanAiChatService
{
    Task<AiChatSessionDto> CreateSessionAsync(Guid userId, string title);
    Task<IEnumerable<AiChatSessionDto>> GetUserSessionsAsync(Guid userId);
    Task<IEnumerable<AiChatMessageDto>> GetSessionMessagesAsync(Guid userId, Guid sessionId);
    Task<AiChatResponseDto> SendMessageAsync(Guid userId, AiChatRequestDto request);
    Task DeleteSessionAsync(Guid userId, Guid sessionId);
}
