using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using WukalaGPT.Application.Features.CaseManagement;

namespace WukalaGPT.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CasesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CasesController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        return claim != null ? Guid.Parse(claim.Value) : Guid.Empty;
    }

    [HttpGet]
    public async Task<IActionResult> GetCases([FromQuery] string? status, [FromQuery] string? type, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        var result = await _mediator.Send(new GetCasesQuery
        {
            Status = status, CaseType = type, Search = search, Page = page, Limit = limit
        });
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCase([FromBody] CreateCaseCommand command)
    {
        command.LeadLawyerId = GetUserId(); // Extract secure auth boundary
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetCase), new { id = result.Id }, result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCase(Guid id)
    {
        var result = await _mediator.Send(new GetCaseDetailsQuery { CaseId = id, RequesterUserId = GetUserId() });
        return Ok(result);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> UpdateCase(Guid id, [FromBody] UpdateCaseCommand command)
    {
        if (id != command.Id) return BadRequest("Id mismatch.");
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> ArchiveCase(Guid id)
    {
        var success = await _mediator.Send(new ArchiveCaseCommand { Id = id });
        if (!success) return NotFound();
        return NoContent();
    }
    
    // --- TIMELINE ---
    [HttpGet("{id}/timeline")]
    public async Task<IActionResult> GetCaseTimeline(Guid id)
    {
        var result = await _mediator.Send(new GetCaseTimelineQuery { CaseId = id });
        return Ok(result);
    }

    [HttpPost("{id}/timeline")]
    public async Task<IActionResult> AddTimelineEvent(Guid id, [FromBody] AddTimelineEventCommand command)
    {
        command.CaseId = id;
        command.RequesterUserId = GetUserId();
        var result = await _mediator.Send(command);
        return Ok(result);
    }
    
    // --- NOTES ---
    [HttpGet("{id}/notes")]
    public async Task<IActionResult> GetCaseNotes(Guid id)
    {
        var result = await _mediator.Send(new GetCaseNotesQuery { CaseId = id, RequesterUserId = GetUserId() });
        return Ok(result);
    }

    [HttpPost("{id}/notes")]
    public async Task<IActionResult> AddCaseNote(Guid id, [FromBody] AddCaseNoteCommand command)
    {
        command.CaseId = id;
        command.RequesterUserId = GetUserId();
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPatch("{id}/notes/{noteId}")]
    public async Task<IActionResult> UpdateCaseNote(Guid id, Guid noteId, [FromBody] UpdateCaseNoteCommand command)
    {
        command.CaseId = id;
        command.NoteId = noteId;
        command.RequesterUserId = GetUserId();
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpDelete("{id}/notes/{noteId}")]
    public async Task<IActionResult> DeleteCaseNote(Guid id, Guid noteId)
    {
        var success = await _mediator.Send(new DeleteCaseNoteCommand { CaseId = id, NoteId = noteId, RequesterUserId = GetUserId() });
        if (!success) return NotFound();
        return NoContent();
    }
    
    // --- DEADLINES ---
    [HttpGet("{id}/deadlines")]
    public async Task<IActionResult> GetCaseDeadlines(Guid id)
    {
        var result = await _mediator.Send(new GetCaseDeadlinesQuery { CaseId = id });
        return Ok(result);
    }

    [HttpPost("{id}/deadlines")]
    public async Task<IActionResult> CreateCaseDeadline(Guid id, [FromBody] CreateCaseDeadlineCommand command)
    {
        command.CaseId = id;
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPatch("{id}/deadlines/{dlId}")]
    public async Task<IActionResult> UpdateCaseDeadline(Guid id, Guid dlId, [FromBody] UpdateCaseDeadlineCommand command)
    {
        command.CaseId = id;
        command.DeadlineId = dlId;
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpDelete("{id}/deadlines/{dlId}")]
    public async Task<IActionResult> DeleteCaseDeadline(Guid id, Guid dlId)
    {
        var success = await _mediator.Send(new DeleteCaseDeadlineCommand { CaseId = id, DeadlineId = dlId });
        if (!success) return NotFound();
        return NoContent();
    }
    
    // --- ASSIGNMENTS ---
    [HttpGet("{id}/assignments")]
    public async Task<IActionResult> GetCaseAssignments(Guid id)
    {
        var result = await _mediator.Send(new GetCaseAssignmentsQuery { CaseId = id });
        return Ok(result);
    }

    [HttpPost("{id}/assignments")]
    public async Task<IActionResult> AssignTeamMember(Guid id, [FromBody] AssignTeamMemberCommand command)
    {
        command.CaseId = id;
        command.RequesterUserId = GetUserId();
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpDelete("{id}/assignments/{uid}")]
    public async Task<IActionResult> RemoveTeamMember(Guid id, Guid uid)
    {
        var success = await _mediator.Send(new RemoveTeamMemberCommand { CaseId = id, UserIdToRemove = uid, RequesterUserId = GetUserId() });
        if (!success) return NotFound();
        return NoContent();
    }
    
    // --- LINKS ---
    [HttpPost("{id}/link")]
    public async Task<IActionResult> LinkCase(Guid id, [FromBody] LinkCaseCommand command)
    {
        command.CaseId = id;
        command.RequesterUserId = GetUserId();
        var success = await _mediator.Send(command);
        if (!success) return BadRequest("Failed to link case.");
        return Ok();
    }
}
