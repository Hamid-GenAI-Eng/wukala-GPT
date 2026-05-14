using WukalaGPT.Application.DTOs.Common;
using WukalaGPT.Application.DTOs.Messaging;

namespace WukalaGPT.Application.Interfaces;

public interface IMessagingService
{
    Task<MessageDto> SendMessageAsync(Guid senderId, Guid receiverId, string content);
    Task<PagedResult<ConversationDto>> GetConversationsAsync(Guid userId, int page, int pageSize);
    Task<PagedResult<MessageDto>> GetMessagesAsync(Guid conversationId, Guid userId, int page, int pageSize);
    Task MarkMessagesAsReadAsync(Guid conversationId, Guid userId);
    Task UpdatePresenceAsync(Guid userId, bool isOnline);
}
