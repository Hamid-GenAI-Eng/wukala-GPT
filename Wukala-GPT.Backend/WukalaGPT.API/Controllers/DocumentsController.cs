using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WukalaGPT.Application.DTOs.Document;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Lawyer, Client")] // Accessible to both roles
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    private Guid GetUserId()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            throw new UnauthorizedAccessException("Invalid token.");
        return userId;
    }

    [HttpPost]
    [RequestSizeLimit(15 * 1024 * 1024)] // 15MB to allow some overhead, logic checks for 10MB
    public async Task<IActionResult> UploadDocument([FromForm] UploadDocumentDto dto)
    {
        try
        {
            var document = await _documentService.UploadDocumentAsync(GetUserId(), dto);
            return Ok(document);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while uploading. " + ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetMyDocuments(
        [FromQuery] DocumentClassification? type, 
        [FromQuery] string? search)
    {
        try
        {
            var documents = await _documentService.GetUserDocumentsAsync(GetUserId(), type, search);
            return Ok(documents);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDocumentDetails(Guid id)
    {
        try
        {
            var document = await _documentService.GetDocumentAsync(GetUserId(), id);
            return Ok(document);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDocument(Guid id)
    {
        try
        {
            await _documentService.DeleteDocumentAsync(GetUserId(), id);
            return Ok(new { message = "Document deleted successfully." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
