using Microsoft.EntityFrameworkCore;
using WukalaGPT.Application.DTOs.Common;
using WukalaGPT.Application.DTOs.Messaging;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.Features.Messaging;

public class MessagingService : IMessagingService
{
    private readonly IApplicationDbContext _context;

    public MessagingService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task UpdatePresenceAsync(Guid userId, bool isOnline)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.IsOnline = isOnline;
            user.LastSeenAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(default);
        }
    }

    public async Task<MessageDto> SendMessageAsync(Guid senderId, Guid receiverId, string content)
    {
        if (senderId == receiverId)
            throw new Exception("Cannot send message to yourself.");

        var sender = await _context.Users.Include(u => u.LawyerProfile).FirstOrDefaultAsync(u => u.Id == senderId);
        var receiver = await _context.Users.Include(u => u.LawyerProfile).FirstOrDefaultAsync(u => u.Id == receiverId);

        if (sender == null || receiver == null)
            throw new Exception("Invalid sender or receiver.");

        // Find or create Conversation
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => 
                (c.Participant1Id == senderId && c.Participant2Id == receiverId) ||
                (c.Participant1Id == receiverId && c.Participant2Id == senderId));

        if (conversation == null)
        {
            conversation = new Conversation
            {
                Participant1Id = senderId,
                Participant2Id = receiverId,
                CreatedAt = DateTime.UtcNow,
                LastMessageAt = DateTime.UtcNow
            };
            _context.Conversations.Add(conversation);
        }
        else
        {
            conversation.LastMessageAt = DateTime.UtcNow;
            _context.Conversations.Update(conversation);
        }

        var message = new Message
        {
            ConversationId = conversation.Id,
            SenderId = senderId,
            ReceiverId = receiverId,
            Content = content,
            SentAt = DateTime.UtcNow,
            Status = MessageStatus.Sent // Default to Sent
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync(default);

        return new MessageDto
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = senderId,
            SenderName = $"{sender.FirstName} {sender.LastName}".Trim(),
            SenderPhotoUrl = sender.LawyerProfile?.ProfilePhotoUrl,
            ReceiverId = receiverId,
            ReceiverName = $"{receiver.FirstName} {receiver.LastName}".Trim(),
            ReceiverPhotoUrl = receiver.LawyerProfile?.ProfilePhotoUrl,
            Content = message.Content,
            SentAt = message.SentAt,
            Status = message.Status
        };
    }

    public async Task<PagedResult<ConversationDto>> GetConversationsAsync(Guid userId, int page, int pageSize)
    {
        var baseQuery = _context.Conversations
            .Include(c => c.Participant1)
                .ThenInclude(u => u.LawyerProfile)
            .Include(c => c.Participant2)
                .ThenInclude(u => u.LawyerProfile)
            .Include(c => c.Messages)
            .Where(c => c.Participant1Id == userId || c.Participant2Id == userId)
            .OrderByDescending(c => c.LastMessageAt);

        var totalCount = await baseQuery.CountAsync();
        
        var rawConversations = await baseQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtoList = rawConversations.Select(c => 
        {
            var otherUser = c.Participant1Id == userId ? c.Participant2 : c.Participant1;
            var lastMsg = c.Messages.OrderByDescending(m => m.SentAt).FirstOrDefault();
            
            var unreadCount = c.Messages.Count(m => m.ReceiverId == userId && m.Status != MessageStatus.Read);

            MessageDto? lastMsgDto = null;
            if (lastMsg != null)
            {
                var sender = lastMsg.SenderId == c.Participant1Id ? c.Participant1 : c.Participant2;
                var receiver = lastMsg.ReceiverId == c.Participant1Id ? c.Participant1 : c.Participant2;
                
                lastMsgDto = new MessageDto
                {
                    Id = lastMsg.Id,
                    ConversationId = lastMsg.ConversationId,
                    SenderId = lastMsg.SenderId,
                    SenderName = $"{sender.FirstName} {sender.LastName}".Trim(),
                    ReceiverId = lastMsg.ReceiverId,
                    ReceiverName = $"{receiver.FirstName} {receiver.LastName}".Trim(),
                    Content = lastMsg.Content,
                    SentAt = lastMsg.SentAt,
                    Status = lastMsg.Status
                };
            }

            return new ConversationDto
            {
                Id = c.Id,
                OtherParticipantId = otherUser.Id,
                OtherParticipantName = $"{otherUser.FirstName} {otherUser.LastName}".Trim(),
                OtherParticipantPhotoUrl = otherUser.LawyerProfile?.ProfilePhotoUrl,
                IsOnline = otherUser.IsOnline,
                LastSeenAt = otherUser.LastSeenAt,
                CreatedAt = c.CreatedAt,
                LastMessageAt = c.LastMessageAt,
                LastMessage = lastMsgDto,
                UnreadCount = unreadCount
            };
        }).ToList();

        return new PagedResult<ConversationDto>
        {
            Items = dtoList,
            TotalCount = totalCount,
            PageSize = pageSize,
            CurrentPage = page
        };
    }

    public async Task<PagedResult<MessageDto>> GetMessagesAsync(Guid conversationId, Guid userId, int page, int pageSize)
    {
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == conversationId && (c.Participant1Id == userId || c.Participant2Id == userId));
            
        if (conversation == null)
            throw new Exception("Conversation not found or access denied.");

        var baseQuery = _context.Messages
            .Include(m => m.Sender)
                .ThenInclude(u => u.LawyerProfile)
            .Include(m => m.Receiver)
                .ThenInclude(u => u.LawyerProfile)
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.SentAt);

        var totalCount = await baseQuery.CountAsync();

        var messages = await baseQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtoList = messages.Select(m => new MessageDto
        {
            Id = m.Id,
            ConversationId = m.ConversationId,
            SenderId = m.SenderId,
            SenderName = $"{m.Sender.FirstName} {m.Sender.LastName}".Trim(),
            SenderPhotoUrl = m.Sender.LawyerProfile?.ProfilePhotoUrl,
            ReceiverId = m.ReceiverId,
            ReceiverName = $"{m.Receiver.FirstName} {m.Receiver.LastName}".Trim(),
            ReceiverPhotoUrl = m.Receiver.LawyerProfile?.ProfilePhotoUrl,
            Content = m.Content,
            SentAt = m.SentAt,
            Status = m.Status
        }).ToList();
        
        // Reverse them so they are returned in chronological order for chat bubbles
        dtoList.Reverse();

        return new PagedResult<MessageDto>
        {
            Items = dtoList,
            TotalCount = totalCount,
            PageSize = pageSize,
            CurrentPage = page
        };
    }

    public async Task MarkMessagesAsReadAsync(Guid conversationId, Guid userId)
    {
        // Find all unread messages sent TO this user inside this conversation
        var unreadMessages = await _context.Messages
            .Where(m => m.ConversationId == conversationId && 
                        m.ReceiverId == userId && 
                        m.Status != MessageStatus.Read)
            .ToListAsync();

        if (unreadMessages.Any())
        {
            foreach (var msg in unreadMessages)
            {
                msg.Status = MessageStatus.Read;
            }
            _context.Messages.UpdateRange(unreadMessages);
            await _context.SaveChangesAsync(default);
        }
    }
}
