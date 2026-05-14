using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Both Lawyers and Clients can use messaging
public class MessagesController : ControllerBase
{
    private readonly IMessagingService _messagingService;

    public MessagesController(IMessagingService messagingService)
    {
        _messagingService = messagingService;
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
            return Ok(message);
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
