using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WukalaGPT.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;
using WukalaGPT.API.Hubs;
using WukalaGPT.Domain.Enums;

using Asp.Versioning;

namespace WukalaGPT.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
[Authorize(Policy = "NotJuniorLawyer")] // Both Lawyers and Clients can use messaging, but Junior Lawyers are restricted
public class MessagesController : ControllerBase
{
    private readonly IMessagingService _messagingService;
    private readonly IFileStorageService _fileStorage;
    private readonly IHubContext<ChatHub> _hubContext;

    public MessagesController(
        IMessagingService messagingService,
        IFileStorageService fileStorage,
        IHubContext<ChatHub> hubContext)
    {
        _messagingService = messagingService;
        _fileStorage = fileStorage;
        _hubContext = hubContext;
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
    {
        try
        {
            var senderIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(senderIdString) || !Guid.TryParse(senderIdString, out var senderId))
                return Unauthorized();

            var message = await _messagingService.SendMessageAsync(senderId, request.ReceiverId, request.Content);

            // Broadcast the message in real-time to both recipient and sender groups via SignalR Hub Context.
            // Using a highly resilient payload structure with both camelCase and PascalCase properties
            // to ensure flawless integration regardless of client-side JSON serialization/casing.
            var broadcastPayload = new
            {
                Id = message.Id,
                SenderId = message.SenderId,
                ReceiverId = message.ReceiverId,
                Content = message.Content,
                SentAt = message.SentAt,
                Timestamp = message.SentAt,
                IsRead = message.Status == MessageStatus.Read,
                Status = message.Status.ToString()
            };

            await _hubContext.Clients.Group("User_" + request.ReceiverId).SendAsync("ReceiveMessage", broadcastPayload);
            await _hubContext.Clients.Group("User_" + senderIdString).SendAsync("ReceiveMessage", broadcastPayload);

            return Ok(message);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadAttachment(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded." });

            var url = await _fileStorage.UploadFileAsync(file, "chat-attachments");
            return Ok(new { url, message = "File uploaded successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("conversations")] 
    public async Task<IActionResult> GetConversations([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized();

            var conversations = await _messagingService.GetConversationsAsync(userId, page, pageSize);
            return Ok(conversations);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("conversations/{conversationId}")]
    public async Task<IActionResult> GetMessages(Guid conversationId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized();

            var messages = await _messagingService.GetMessagesAsync(conversationId, userId, page, pageSize);
            return Ok(messages);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    
    [HttpPut("conversations/{conversationId}/read")]
    public async Task<IActionResult> MarkMessagesAsRead(Guid conversationId)
    {
        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized();

            await _messagingService.MarkMessagesAsReadAsync(conversationId, userId);
            return Ok(new { message = "Messages marked as read." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("presence")]
    public async Task<IActionResult> UpdatePresence([FromBody] UpdatePresenceRequest request)
    {
        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized();

            await _messagingService.UpdatePresenceAsync(userId, request.IsOnline);
            return Ok(); // Silent success
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

// Inline input DTOs for the controller
public class SendMessageRequest
{
    public Guid ReceiverId { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class UpdatePresenceRequest
{
    public bool IsOnline { get; set; }
}
