using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using WukalaGPT.Application.DTOs.Analytics;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.API.Controllers;

[Authorize(Roles = "Lawyer,Admin")]
[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;
    private readonly IApplicationDbContext _context;

    public AnalyticsController(IAnalyticsService analyticsService, IApplicationDbContext context)
    {
        _analyticsService = analyticsService;
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


    [HttpGet("overview")]
    public async Task<ActionResult<PracticeAnalyticsOverviewDto>> GetOverview([FromQuery] string period = "12m")
    {
        try
        {
            var firmId = GetFirmId();
            var result = await _analyticsService.GetOverviewAsync(firmId, period);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpGet("workload")]
    public async Task<ActionResult<HeatmapDataDto>> GetWorkload()
    {
        try
        {
            var firmId = GetFirmId();
            var result = await _analyticsService.GetWorkloadHeatmapAsync(firmId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpGet("clients")]
    public async Task<ActionResult<ClientAnalyticsDto>> GetClientAnalytics()
    {
        try
        {
            var firmId = GetFirmId();
            var result = await _analyticsService.GetClientAnalyticsAsync(firmId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
