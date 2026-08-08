using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WukalaGPT.Application.DTOs.CaseIntelligence;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.API.Controllers;

[Authorize(Roles = "Lawyer")]
[ApiController]
[Route("api/[controller]")]
public class CaseIntelligenceController : ControllerBase
{
    private readonly IMizanAiClient _mizanAiClient;

    public CaseIntelligenceController(IMizanAiClient mizanAiClient)
    {
        _mizanAiClient = mizanAiClient;
    }

    [HttpPost("analyze")]
    public async Task<ActionResult<CaseIntelligenceResponse>> AnalyzeCase([FromBody] CaseIntelligenceRequest request)
    {
        try
        {
            // In a real application, we might want to validate the user has access to this case/session
            var response = await _mizanAiClient.AnalyzeCaseAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error analyzing case", details = ex.Message });
        }
    }
}
