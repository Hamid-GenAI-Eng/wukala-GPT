using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using WukalaGPT.Application.Features.Hearings.CQRS;

using System.Security.Claims;

namespace WukalaGPT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HearingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public HearingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetFirmId()
    {
        var val = User.FindFirstValue("FirmId");
        return string.IsNullOrEmpty(val) ? Guid.Empty : Guid.Parse(val);
    }

    private Guid GetUserId()
    {
        var val = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return string.IsNullOrEmpty(val) ? Guid.Empty : Guid.Parse(val);
    }

    [HttpGet]
    public async Task<IActionResult> GetCalendarFeed(
        [FromQuery] string view = "month", 
        [FromQuery] string? date = null, 
        [FromQuery] Guid? lawyerId = null,
        [FromQuery] string? status = null,
        [FromQuery] Guid? caseId = null)
    {
        var targetDate = string.IsNullOrEmpty(date) ? DateOnly.FromDateTime(DateTime.UtcNow) : DateOnly.Parse(date);
        
        var query = new GetHearingsQuery
        {
            FirmId = GetFirmId(),
            View = view,
            Date = targetDate,
            LawyerId = lawyerId,
            Status = status,
            CaseId = caseId
        };
        return Ok(await _mediator.Send(query));
    }

    [HttpPost]
    public async Task<IActionResult> CreateHearing([FromBody] CreateHearingCommand command)
    {
        command.FirmId = GetFirmId();
        if (command.LeadLawyerId == Guid.Empty) command.LeadLawyerId = GetUserId();
        return Ok(await _mediator.Send(command));
    }

    [HttpPost("{id}/adjourn")]
    public async Task<IActionResult> RecordAdjournment(Guid id, [FromBody] AdjournHearingCommand command)
    {
        command.HearingId = id;
        command.FirmId = GetFirmId();
        command.AdjournedById = GetUserId();
        return Ok(await _mediator.Send(command));
    }

    [HttpPatch("{id}/complete")]
    public async Task<IActionResult> CompleteHearing(Guid id, [FromBody] CompleteHearingCommand command)
    {
        command.HearingId = id;
        command.FirmId = GetFirmId();
        command.UserId = GetUserId();
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> CancelHearing(Guid id, [FromBody] DeleteHearingCommand command)
    {
        command.HearingId = id;
        command.FirmId = GetFirmId();
        command.UserId = GetUserId();
        var success = await _mediator.Send(command);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpGet("conflicts")]
    public async Task<IActionResult> CheckConflicts(
        [FromQuery] DateOnly startDate,
        [FromQuery] DateOnly? endDate,
        [FromQuery] TimeOnly? startTime,
        [FromQuery] int? durationMins,
        [FromQuery] Guid? excludeHearingId,
        [FromQuery] Guid? lawyerId)
    {
        var query = new GetConflictsQuery
        {
            FirmId = GetFirmId(),
            LawyerId = lawyerId ?? GetUserId(),
            StartDate = startDate,
            EndDate = endDate,
            StartTime = startTime,
            DurationMins = durationMins,
            ExcludeHearingId = excludeHearingId
        };
        return Ok(await _mediator.Send(query));
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportHearings(
        [FromQuery] string format = "pdf",
        [FromQuery] string? week = null,
        [FromQuery] string? month = null,
        [FromQuery] Guid? lawyerId = null)
    {
        var query = new ExportHearingsQuery
        {
            FirmId = GetFirmId(),
            LawyerId = lawyerId,
            Week = week,
            Month = month,
            Format = format
        };
        
        var result = await _mediator.Send(query);
        return File(result.Data, result.ContentType, result.FileName);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] string period = "3m", [FromQuery] Guid? lawyerId = null)
    {
        var query = new GetHearingStatsQuery
        {
            FirmId = GetFirmId(),
            LawyerId = lawyerId,
            Period = period
        };
        return Ok(await _mediator.Send(query));
    }
}
