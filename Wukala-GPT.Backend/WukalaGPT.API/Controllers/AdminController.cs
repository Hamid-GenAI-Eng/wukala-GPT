using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WukalaGPT.Application.DTOs.Admin;
using WukalaGPT.Application.DTOs.Lawyer;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Enums;
 
namespace WukalaGPT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly ILawyerProfileService _lawyerProfileService;

    public AdminController(IAdminService adminService, ILawyerProfileService lawyerProfileService)
    {
        _adminService = adminService;
        _lawyerProfileService = lawyerProfileService;
    }

    [HttpGet("health")]
    [AllowAnonymous] // Verification endpoint to confirm deployment
    public IActionResult GetHealth()
    {
        return Ok(new { status = "Healthy", version = "1.0.5-VISIBILITY-FIXED", timestamp = DateTime.UtcNow });
    }


    [HttpGet("lawyers")]
    public async Task<IActionResult> GetAllLawyers([FromQuery] VerificationStatus? status)
    {
        try
        {
            var lawyers = await _adminService.GetAllLawyersAsync(status);
            return Ok(lawyers);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("lawyers/{id}")]
    public async Task<IActionResult> GetLawyerDetails(Guid id)
    {
        try
        {
            // The ID passed should be the Lawyer's UserId
            var profile = await _adminService.GetLawyerDetailsAsync(id);
            return Ok(profile);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("lawyers/{id}/verify")]
    public async Task<IActionResult> UpdateLawyerVerification(Guid id, [FromBody] VerifyLawyerDto dto)
    {
        try
        {
            await _adminService.UpdateLawyerVerificationStatusAsync(id, dto.Status);
            return Ok(new { message = $"Lawyer verification status updated to {dto.Status}." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("users/{id}/suspend")]
    public async Task<IActionResult> SuspendOrActivateUser(Guid id, [FromBody] SuspendUserDto dto)
    {
        try
        {
            await _adminService.SuspendOrActivateUserAsync(id, dto.IsActive);
            var statusStr = dto.IsActive ? "Activated" : "Suspended";
            return Ok(new { message = $"User {statusStr} successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("lawyers/{id}/badges")]
    public async Task<IActionResult> AssignLawyerBadges(Guid id, [FromBody] UpdateLawyerBadgesDto dto)
    {
        try
        {
            await _lawyerProfileService.AssignBadgesAsync(id, dto);
            return Ok(new { message = "Lawyer badges updated successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetPlatformStats()
    {
        try
        {
            var stats = await _adminService.GetPlatformStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
