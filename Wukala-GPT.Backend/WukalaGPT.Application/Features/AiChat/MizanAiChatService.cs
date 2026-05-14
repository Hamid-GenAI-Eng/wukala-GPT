using Microsoft.EntityFrameworkCore;
using WukalaGPT.Application.DTOs.AiChat;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.Features.AiChat;

public class MizanAiChatService : IMizanAiChatService
{
    private readonly IApplicationDbContext _context;
    private readonly IMizanAiClient _mizanClient;

    public MizanAiChatService(IApplicationDbContext context, IMizanAiClient mizanClient)
    {
        _context = context;
        _mizanClient = mizanClient;
    }

    public async Task<AiChatSessionDto> CreateSessionAsync(Guid userId, string title)
    {
        var session = new AiChatSession
        {
            UserId = userId,
            Title = title,
            StartedAt = DateTime.UtcNow,
            LastMessageAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.AiChatSessions.Add(session);
        await _context.SaveChangesAsync(default);

        return new AiChatSessionDto
        {
            Id = session.Id,
            Title = session.Title,
            StartedAt = session.StartedAt,
            LastMessageAt = session.LastMessageAt
        };
    }

    public async Task<IEnumerable<AiChatSessionDto>> GetUserSessionsAsync(Guid userId)
    {
        return await _context.AiChatSessions
            .Where(s => s.UserId == userId && s.IsActive)
            .OrderByDescending(s => s.LastMessageAt)
            .Select(s => new AiChatSessionDto
            {
                Id = s.Id,
                Title = s.Title,
                StartedAt = s.StartedAt,
                LastMessageAt = s.LastMessageAt
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<AiChatMessageDto>> GetSessionMessagesAsync(Guid userId, Guid sessionId)
    {
        // Security: Ensure the session belongs to the requesting user
        var session = await _context.AiChatSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

        if (session == null)
            throw new UnauthorizedAccessException("Session not found or access denied.");

        return await _context.AiChatMessages
            .Where(m => m.SessionId == sessionId)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new AiChatMessageDto
            {
                Id = m.Id,
                SessionId = m.SessionId,
                Role = m.Role.ToString(),
                Content = m.Content,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<AiChatResponseDto> SendMessageAsync(Guid userId, AiChatRequestDto request)
    {
        Guid sessionId;

        if (request.SessionId.HasValue)
        {
            // Security: Verify user owns the session
            var session = await _context.AiChatSessions
                .FirstOrDefaultAsync(s => s.Id == request.SessionId.Value && s.UserId == userId);
                
            if (session == null)
                throw new UnauthorizedAccessException("Session not found or access denied.");
                
            sessionId = session.Id;
            session.LastMessageAt = DateTime.UtcNow;
        }
        else
        {
            // Create a new session
            var session = new AiChatSession
            {
                UserId = userId,
                Title = string.IsNullOrWhiteSpace(request.Message) ? "New Chat" : 
                        (request.Message.Length > 30 ? request.Message.Substring(0, 30) + "..." : request.Message)
            };
            _context.AiChatSessions.Add(session);
            await _context.SaveChangesAsync(default); // Save to generate Id
            sessionId = session.Id;
        }

        // 1. Save User Query
        var userMessage = new AiChatMessage
        {
            SessionId = sessionId,
            Role = AiMessageRole.User,
            Content = request.Message,
            IsDeepResearch = request.IsDeepResearch,
            CreatedAt = DateTime.UtcNow
        };
        _context.AiChatMessages.Add(userMessage);
        await _context.SaveChangesAsync(default);

        var startTime = System.Diagnostics.Stopwatch.GetTimestamp();

        // 2. Call Mizan AI via Backend Client
        var mizanRequest = new MizanAiChatRequest
        {
            message = request.Message,
            is_deep_research = request.IsDeepResearch,
            conversation_id = sessionId.ToString() // LangGraph thread ID
        };
        
        var mizanResponse = await _mizanClient.SendMessageAsync(mizanRequest);
        
        var processingTime = System.Diagnostics.Stopwatch.GetElapsedTime(startTime).TotalMilliseconds;

        // 3. Save Assistant Response
        var assistantMessage = new AiChatMessage
        {
            SessionId = sessionId,
            Role = AiMessageRole.Assistant,
            Content = mizanResponse.response,
            IsDeepResearch = request.IsDeepResearch,
            ProcessingTimeMs = (long)processingTime,
            CreatedAt = DateTime.UtcNow
        };
        _context.AiChatMessages.Add(assistantMessage);
        await _context.SaveChangesAsync(default);

        return new AiChatResponseDto
        {
            Response = mizanResponse.response
        };
    }

    public async Task DeleteSessionAsync(Guid userId, Guid sessionId)
    {
        var session = await _context.AiChatSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

        if (session == null)
            throw new UnauthorizedAccessException("Session not found or access denied.");

        _context.AiChatSessions.Remove(session);
        await _context.SaveChangesAsync(default);
    }
}
