using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WukalaGPT.Application.DTOs.VirtualMunshi;
using System.Security.Claims;

namespace WukalaGPT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VirtualMunshiController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<VirtualMunshiController> _logger;

    public VirtualMunshiController(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<VirtualMunshiController> logger)
    {
        _httpClient = httpClientFactory.CreateClient("MizanAI");
        _configuration = configuration;
        _logger = logger;
        
        var mizanApiUrl = _configuration["MizanAI:BaseUrl"] ?? "http://mizan-api:8000";
        _httpClient.BaseAddress = new Uri(mizanApiUrl);
    }

    [HttpPost("cause-list")]
    public async Task<IActionResult> ProcessCauseList([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        try
        {
            using var content = new MultipartFormDataContent();
            using var fileStream = file.OpenReadStream();
            using var fileContent = new StreamContent(fileStream);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
            content.Add(fileContent, "file", file.FileName);

            var response = await _httpClient.PostAsync("/api/v1/munshi/cause-list", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var parsedResponse = JsonSerializer.Deserialize<CauseListResponseDto>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return Ok(parsedResponse);
            }

            _logger.LogError("Mizan AI API Error: {Error}", responseContent);
            return StatusCode((int)response.StatusCode, responseContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process Cause List via Virtual Munshi");
            return StatusCode(500, "An error occurred while processing the cause list.");
        }
    }

    [HttpPost("generate-notification")]
    public async Task<IActionResult> GenerateNotification([FromBody] MunshiNotificationRequestDto request)
    {
        try
        {
            var jsonRequest = JsonSerializer.Serialize(request);
            var content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/api/v1/munshi/generate-notification", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var parsedResponse = JsonSerializer.Deserialize<MunshiNotificationResponseDto>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return Ok(parsedResponse);
            }

            _logger.LogError("Mizan AI API Error: {Error}", responseContent);
            return StatusCode((int)response.StatusCode, responseContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate notification via Virtual Munshi");
            return StatusCode(500, "An error occurred while generating the notification.");
        }
    }
}
