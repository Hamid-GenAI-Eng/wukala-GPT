using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Application.DTOs.Drafting;
using WukalaGPT.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Asp.Versioning;

namespace WukalaGPT.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/document-drafts")]
[Authorize(Roles = "Lawyer, Client", Policy = "NotJuniorLawyer")]
public class DocumentDraftsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public DocumentDraftsController(IApplicationDbContext context)
    {
        _context = context;
    }

    private Guid GetUserId()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            throw new UnauthorizedAccessException("Invalid token.");
        return userId;
    }

    [HttpGet]
    public async Task<IActionResult> GetDrafts()
    {
        var userId = GetUserId();
        var drafts = await _context.DocumentDrafts
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.LastModifiedAt)
            .Select(d => new DocumentDraftDto
            {
                Id = d.Id,
                TemplateName = d.TemplateName,
                HtmlContent = d.HtmlContent,
                CreatedAt = d.CreatedAt,
                LastModifiedAt = d.LastModifiedAt
            })
            .ToListAsync();
            
        return Ok(drafts);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDraft(Guid id)
    {
        var userId = GetUserId();
        var draft = await _context.DocumentDrafts
            .Where(d => d.Id == id && d.UserId == userId)
            .Select(d => new DocumentDraftDto
            {
                Id = d.Id,
                TemplateName = d.TemplateName,
                HtmlContent = d.HtmlContent,
                CreatedAt = d.CreatedAt,
                LastModifiedAt = d.LastModifiedAt
            })
            .FirstOrDefaultAsync();
            
        if (draft == null) return NotFound(new { message = "Draft not found." });
        return Ok(draft);
    }

    [HttpPost]
    public async Task<IActionResult> SaveDraft([FromBody] SaveDocumentDraftRequest request)
    {
        var userId = GetUserId();
        
        if (request.Id.HasValue && request.Id.Value != Guid.Empty)
        {
            var existing = await _context.DocumentDrafts
                .FirstOrDefaultAsync(d => d.Id == request.Id.Value && d.UserId == userId);
                
            if (existing != null)
            {
                existing.HtmlContent = request.HtmlContent;
                existing.LastModifiedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(CancellationToken.None);
                
                return Ok(new DocumentDraftDto
                {
                    Id = existing.Id,
                    TemplateName = existing.TemplateName,
                    HtmlContent = existing.HtmlContent,
                    CreatedAt = existing.CreatedAt,
                    LastModifiedAt = existing.LastModifiedAt
                });
            }
        }
        
        var newDraft = new DocumentDraft
        {
            UserId = userId,
            TemplateName = request.TemplateName,
            HtmlContent = request.HtmlContent,
            CreatedAt = DateTime.UtcNow,
            LastModifiedAt = DateTime.UtcNow
        };
        
        _context.DocumentDrafts.Add(newDraft);
        await _context.SaveChangesAsync(CancellationToken.None);
        
        return Ok(new DocumentDraftDto
        {
            Id = newDraft.Id,
            TemplateName = newDraft.TemplateName,
            HtmlContent = newDraft.HtmlContent,
            CreatedAt = newDraft.CreatedAt,
            LastModifiedAt = newDraft.LastModifiedAt
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDraft(Guid id)
    {
        var userId = GetUserId();
        var draft = await _context.DocumentDrafts
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);
            
        if (draft == null)
            return NotFound(new { message = "Draft not found." });
            
        _context.DocumentDrafts.Remove(draft);
        await _context.SaveChangesAsync(CancellationToken.None);
        return Ok(new { message = "Draft deleted." });
    }
}
