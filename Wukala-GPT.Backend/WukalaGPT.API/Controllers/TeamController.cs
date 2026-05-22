using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using WukalaGPT.Application.DTOs.Team;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.API.Controllers;

[Authorize(Roles = "Lawyer,Admin")]
[ApiController]
[Route("api/[controller]")]
public class TeamController : ControllerBase
{
    private readonly ITeamService _teamService;
    private readonly IApplicationDbContext _context;

    public TeamController(ITeamService teamService, IApplicationDbContext context)
    {
        _teamService = teamService;
        _context = context;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        return claim != null ? Guid.Parse(claim.Value) : Guid.Empty;
    }

    private Guid GetFirmId()
    {
        var claimValue = User.FindFirstValue("FirmId");
        if (!string.IsNullOrEmpty(claimValue) && Guid.TryParse(claimValue, out var firmId))
        {
            return firmId;
        }

        var userId = GetUserId();
        if (userId != Guid.Empty)
        {
            var user = _context.Users.Find(userId);
            if (user?.FirmId != null) return user.FirmId.Value;
        }
        
        return Guid.Empty;
    }

    [HttpGet("members")]
    public async Task<ActionResult<List<TeamMemberDto>>> GetTeamMembers()
    {
        try
        {
            var firmId = GetFirmId();
            var result = await _teamService.GetTeamMembersAsync(firmId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost("invite")]
    public async Task<ActionResult> InviteMember([FromBody] InviteMemberRequestDto request)
    {
        try
        {
            var firmId = GetFirmId();
            var userId = GetUserId();
            await _teamService.InviteMemberAsync(firmId, userId, request);
            return Ok(new { Message = "Invitation sent successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpGet("tasks")]
    public async Task<ActionResult<List<StaffTaskDto>>> GetTasks()
    {
        try
        {
            var firmId = GetFirmId();
            var result = await _teamService.GetTasksAsync(firmId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost("tasks")]
    public async Task<ActionResult<StaffTaskDto>> CreateTask([FromBody] StaffTaskDto request)
    {
        try
        {
            var firmId = GetFirmId();
            var userId = GetUserId();
            var result = await _teamService.CreateTaskAsync(firmId, userId, request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPut("tasks/{id}/status")]
    public async Task<ActionResult> UpdateTaskStatus(Guid id, [FromBody] string newStatus)
    {
        try
        {
            var firmId = GetFirmId();
            await _teamService.UpdateTaskStatusAsync(id, firmId, newStatus);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpGet("activity")]
    public async Task<ActionResult<List<FirmActivityLogDto>>> GetActivity()
    {
        try
        {
            var firmId = GetFirmId();
            var result = await _teamService.GetRecentActivityAsync(firmId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
