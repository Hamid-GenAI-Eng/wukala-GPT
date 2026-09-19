using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WukalaGPT.Application.Interfaces;

using Asp.Versioning;

namespace WukalaGPT.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
[Authorize(Roles = "Client")]
public class SavedProfilesController : ControllerBase
{
    private readonly ISavedProfileService _savedProfileService;

    public SavedProfilesController(ISavedProfileService savedProfileService)
    {
        _savedProfileService = savedProfileService;
    }

    [HttpPost("{lawyerId}/toggle")]
    public async Task<IActionResult> ToggleSaveProfile(Guid lawyerId)
    {
        try
        {
            var clientIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(clientIdString) || !Guid.TryParse(clientIdString, out var clientId))
                return Unauthorized();

            await _savedProfileService.ToggleSaveProfileAsync(clientId, lawyerId);
            return Ok(new { message = "Profile save status toggled successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetSavedProfiles([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var clientIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(clientIdString) || !Guid.TryParse(clientIdString, out var clientId))
                return Unauthorized();

            var result = await _savedProfileService.GetSavedProfilesAsync(clientId, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
