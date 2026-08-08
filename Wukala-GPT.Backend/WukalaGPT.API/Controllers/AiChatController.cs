using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WukalaGPT.Application.DTOs.AiChat;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AiChatController : ControllerBase
{
    private readonly IMizanAiChatService _aiChatService;

    public AiChatController(IMizanAiChatService aiChatService)
    {
        _aiChatService = aiChatService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            throw new UnauthorizedAccessException("User ID not found in token.");
        return userId;
    }

    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] string title)
    {
        try
        {
            var userId = GetCurrentUserId();
            var session = await _aiChatService.CreateSessionAsync(userId, title);
            return Ok(session);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    public class UpdateTitleRequest { public string Title { get; set; } = string.Empty; }

    [HttpPatch("sessions/{sessionId}/title")]
    public async Task<IActionResult> UpdateSessionTitle(Guid sessionId, [FromBody] UpdateTitleRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _aiChatService.UpdateSessionTitleAsync(userId, sessionId, request.Title);
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> GetUserSessions()
    {
        try
        {
            var userId = GetCurrentUserId();
            var sessions = await _aiChatService.GetUserSessionsAsync(userId);
            return Ok(sessions);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("sessions/{sessionId}/messages")]
    public async Task<IActionResult> GetSessionMessages(Guid sessionId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var messages = await _aiChatService.GetSessionMessagesAsync(userId, sessionId);
            return Ok(messages);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("message")]
    public async Task<IActionResult> SendMessage([FromBody] AiChatRequestDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var response = await _aiChatService.SendMessageAsync(userId, request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    public class MultimodalFormPayload
    {
        public string? Message { get; set; }
        public bool IsDeepResearch { get; set; }
        public Guid? SessionId { get; set; }
        public List<IFormFile>? Files { get; set; }
    }

    [HttpPost("message/multimodal")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> SendMessageMultimodal([FromForm] MultimodalFormPayload payload)
    {
        try
        {
            var userId = GetCurrentUserId();
            var multimodalRequest = new AiChatMultimodalRequestDto
            {
                Message = payload.Message ?? string.Empty,
                IsDeepResearch = payload.IsDeepResearch,
                SessionId = payload.SessionId
            };

            if (payload.Files != null)
            {
                foreach (var file in payload.Files)
                {
                    using var memoryStream = new MemoryStream();
                    await file.CopyToAsync(memoryStream);
                    multimodalRequest.Files.Add(new MultimodalFileDto
                    {
                        FileName = file.FileName,
                        ContentType = file.ContentType,
                        ContentBytes = memoryStream.ToArray()
                    });
                }
            }

            var response = await _aiChatService.SendMultimodalMessageAsync(userId, multimodalRequest);
            return Ok(response);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("sessions/{sessionId}")]
    public async Task<IActionResult> DeleteSession(Guid sessionId)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _aiChatService.DeleteSessionAsync(userId, sessionId);
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("tts")]
    public async Task<IActionResult> GenerateTts([FromBody] string text)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(text))
                return BadRequest(new { message = "Text cannot be empty." });

            var stream = await _aiChatService.GenerateTtsAsync(text);
            return File(stream, "audio/mpeg");
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
