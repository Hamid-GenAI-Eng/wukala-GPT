using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.API.Controllers;

[Authorize(Roles = "Lawyer")]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("lawyer-overview")]
    public async Task<IActionResult> GetLawyerOverview()
    {
        var lawyerId = GetUserId();
        if (lawyerId == Guid.Empty) return Unauthorized();

        var overview = await _dashboardService.GetLawyerDashboardOverviewAsync(lawyerId);
        return Ok(overview);
    }

    private Guid GetUserId()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(userIdStr, out var userId) ? userId : Guid.Empty;
    }
}
