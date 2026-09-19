using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WukalaGPT.Application.DTOs.Drafting;
using WukalaGPT.Application.Interfaces;

using Asp.Versioning;

namespace WukalaGPT.API.Controllers;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/document-drafting")]
[ApiController]
[Authorize] // Ensure WukalaGPT users are authenticated
public class DocumentDraftingController : ControllerBase
{
    private readonly IMizanAiClient _mizanAiClient;

    public DocumentDraftingController(IMizanAiClient mizanAiClient)
    {
        _mizanAiClient = mizanAiClient;
    }

    [HttpGet("templates")]
    public async Task<ActionResult<TemplatesResponse>> GetTemplates()
    {
        try
        {
            var response = await _mizanAiClient.GetTemplatesAsync();
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching templates from Mizan AI", details = ex.Message });
        }
    }

    [HttpGet("template-content")]
    public async Task<ActionResult<TemplateContentResponse>> GetTemplateContent([FromQuery] string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return BadRequest(new { message = "Template path is required." });
        }

        try
        {
            var response = await _mizanAiClient.GetTemplateContentAsync(path);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching template content", details = ex.Message });
        }
    }

    [HttpPost("export")]
    public async Task<IActionResult> ExportToDocx([FromBody] DraftExportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.MarkdownContent))
        {
            return BadRequest(new { message = "Document content is required." });
        }

        try
        {
            var fileBytes = await _mizanAiClient.ExportDraftToDocxAsync(request);
            var title = string.IsNullOrWhiteSpace(request.DocumentTitle) ? "Drafted_Document" : request.DocumentTitle;
            return File(fileBytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", $"{title}.docx");
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error exporting document", details = ex.Message });
        }
    }

    [HttpGet("template-file")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTemplateFile([FromQuery] string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return BadRequest(new { message = "Template path is required." });
        }

        try
        {
            var stream = await _mizanAiClient.GetTemplateFileAsync(path);
            return File(stream, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching template file", details = ex.Message });
        }
    }
}
