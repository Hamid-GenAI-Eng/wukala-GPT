using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WukalaGPT.Application.DTOs.AiChat;
using WukalaGPT.Application.Interfaces;

using Asp.Versioning;

namespace WukalaGPT.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
[Authorize]
    [EnableRateLimiting("AiLimiter")]
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

    public class CreateSessionRequest { public string Title { get; set; } = string.Empty; }

    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var session = await _aiChatService.CreateSessionAsync(userId, request.Title);
            return Ok(session);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG ERROR] CreateSession: {ex.ToString()}");
            return BadRequest(new { message = ex.Message });
        }
    }

    public class LogRequest { public string Error { get; set; } = string.Empty; }

    [HttpPost("log")]
    [AllowAnonymous]
    public IActionResult LogError([FromBody] LogRequest request)
    {
        Console.WriteLine($"[FRONTEND ERROR LOG] {request.Error}");
        return Ok();
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
        catch (TaskCanceledException ex)
        {
            return StatusCode(504, new { message = "MizanAI timed out while processing the request. This may happen if AI models are being loaded or inference took too long.", details = ex.Message });
        }
        catch (TimeoutException ex)
        {
            return StatusCode(504, new { message = "MizanAI connection timed out.", details = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An internal error occurred.", details = ex.Message });
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

    public class TtsRequestDto
    {
        public string text { get; set; }
    }

    [HttpPost("tts")]
    public async Task<IActionResult> GenerateTts([FromBody] TtsRequestDto request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.text))
                return BadRequest(new { message = "Text cannot be empty." });

            var stream = await _aiChatService.GenerateTtsAsync(request.text);
            return File(stream, "audio/mpeg");
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
