using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WukalaGPT.Application.Features.Clients;
using WukalaGPT.Domain.Entities;
using Hangfire;

using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ClientsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IApplicationDbContext _context;

    public ClientsController(IMediator mediator, IApplicationDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    private Guid GetFirmId()
    {
        var claimValue = User.FindFirstValue("FirmId");
        if (!string.IsNullOrEmpty(claimValue) && Guid.TryParse(claimValue, out var firmId))
        {
            return firmId;
        }

        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(userIdString, out var userId))
        {
            var user = _context.Users.Find(userId);
            if (user?.FirmId != null) return user.FirmId.Value;
        }

        throw new UnauthorizedAccessException("User is not associated with a firm.");
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());


    [HttpGet]
    public async Task<IActionResult> GetClients([FromQuery] GetClientsQuery query)
    {
        query.FirmId = GetFirmId();
        return Ok(await _mediator.Send(query));
    }

    [HttpPost]
    public async Task<IActionResult> CreateClient([FromBody] CreateClientCommand command)
    {
        command.FirmId = GetFirmId();
        command.CreatedById = GetUserId();
        var result = await _mediator.Send(command);
        return Created($"/api/clients/{result.Id}", result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetClientDetail(Guid id)
    {
        return Ok(await _mediator.Send(new GetClientDetailQuery { FirmId = GetFirmId(), ClientId = id }));
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> UpdateClient(Guid id, [FromBody] UpdateClientCommand command)
    {
        command.FirmId = GetFirmId();
        command.ClientId = id;
        bool ok = await _mediator.Send(command);
        if (!ok) return NotFound();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> ArchiveClient(Guid id)
    {
        bool ok = await _mediator.Send(new ArchiveClientCommand { FirmId = GetFirmId(), ClientId = id });
        if (!ok) return NotFound();
        return Ok(new { message = "Client archived successfully" });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        return Ok(await _mediator.Send(new GetFirmStatsQuery { FirmId = GetFirmId() }));
    }

    [HttpPost("conflict-check")]
    public async Task<IActionResult> RunConflictCheck([FromBody] RunConflictCheckCommand command)
    {
        command.FirmId = GetFirmId();
        command.CheckedById = GetUserId();
        return Ok(await _mediator.Send(command));
    }

    [HttpGet("{id}/interactions")]
    public async Task<IActionResult> GetInteractions(Guid id, [FromQuery] string? type)
    {
        return Ok(await _mediator.Send(new GetInteractionsQuery { ClientId = id, Type = type }));
    }

    [HttpPost("{id}/interactions")]
    public async Task<IActionResult> LogInteraction(Guid id, [FromBody] LogInteractionCommand command)
    {
        command.FirmId = GetFirmId();
        command.ClientId = id;
        command.LoggedById = GetUserId();
        var res = await _mediator.Send(command);
        return Created($"/api/clients/{id}/interactions/{res.Id}", res);
    }
    
    [HttpPatch("{id}/dismiss-retention-alert")]
    public async Task<IActionResult> DismissRetention(Guid id)
    {
        bool ok = await _mediator.Send(new DismissRetentionAlertCommand { FirmId = GetFirmId(), ClientId = id });
        if (!ok) return NotFound();
        return Ok();
    }

    [HttpPost("{id}/portal-access/documents/{docId}")]
    public async Task<IActionResult> ShareDocumentToPortal(Guid id, Guid docId, [FromBody] ShareDocumentToPortalCommand req)
    {
        req.FirmId = GetFirmId();
        req.SharedById = GetUserId();
        req.ClientId = id;
        req.DocumentId = docId;
        await _mediator.Send(req);
        return Created("", new { ClientId = id, DocumentId = docId, SharedAt = DateTimeOffset.UtcNow, ExpiresAt = req.ExpiresAt });
    }

    [HttpDelete("{id}/portal-access/documents/{docId}")]
    public async Task<IActionResult> RevokeDocumentAccess(Guid id, Guid docId)
    {
        bool ok = await _mediator.Send(new RevokeDocumentFromPortalCommand { ClientId = id, DocumentId = docId });
        if (!ok) return NotFound();
        return Ok();
    }
}
