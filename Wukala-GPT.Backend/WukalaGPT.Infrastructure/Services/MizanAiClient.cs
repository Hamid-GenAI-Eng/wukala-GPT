using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using WukalaGPT.Application.DTOs.AiChat;
using WukalaGPT.Application.Interfaces;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace WukalaGPT.Infrastructure.Services;

public class MizanAiClient : IMizanAiClient
{
    private readonly HttpClient _httpClient;
    private readonly string _serviceTokenSecret;

    public MizanAiClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _serviceTokenSecret = configuration["MizanAi:ServiceToken"] ?? "supersecretkey_mizan_ai_production_ready";
        
        var baseUrl = configuration["MizanAi:BaseUrl"] ?? "http://localhost:8000";
        if (!baseUrl.StartsWith("http://") && !baseUrl.StartsWith("https://"))
        {
            baseUrl = "http://" + baseUrl;
        }
        _httpClient.BaseAddress = new Uri(baseUrl);
    }

    private string GenerateServiceToken()
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, "internal_service")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_serviceTokenSecret));
        // Use HS256 as Python's jose default algorithm expects it
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        var tokenOptions = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(5), // Short-lived token for internal service auth
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(tokenOptions);
    }

    public async Task<MizanAiChatResponse> SendMessageAsync(MizanAiChatRequest request)
    {
        // Dynamically generate a short-lived service token for this request
        var serviceToken = GenerateServiceToken();
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", serviceToken);

        var response = await _httpClient.PostAsJsonAsync("/api/v1/chat/", request);
        
        response.EnsureSuccessStatusCode();
        
        var result = await response.Content.ReadFromJsonAsync<MizanAiChatResponse>();
        if (result == null)
            throw new Exception("Received null response from Mizan AI.");
            
        return result;
    }

    public async Task<WukalaGPT.Application.DTOs.Drafting.TemplatesResponse> GetTemplatesAsync()
    {
        var serviceToken = GenerateServiceToken();
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", serviceToken);

        var response = await _httpClient.GetAsync("/api/v1/drafting/templates");
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<WukalaGPT.Application.DTOs.Drafting.TemplatesResponse>();
        return result ?? new WukalaGPT.Application.DTOs.Drafting.TemplatesResponse();
    }

    public async Task<WukalaGPT.Application.DTOs.Drafting.DraftGenerateResponse> GenerateDraftAsync(WukalaGPT.Application.DTOs.Drafting.DraftGenerateRequest request)
    {
        var serviceToken = GenerateServiceToken();
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", serviceToken);

        var response = await _httpClient.PostAsJsonAsync("/api/v1/drafting/generate", request);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<WukalaGPT.Application.DTOs.Drafting.DraftGenerateResponse>();
        return result ?? new WukalaGPT.Application.DTOs.Drafting.DraftGenerateResponse();
    }

    public async Task<byte[]> ExportDraftToDocxAsync(WukalaGPT.Application.DTOs.Drafting.DraftExportRequest request)
    {
        var serviceToken = GenerateServiceToken();
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", serviceToken);

        var response = await _httpClient.PostAsJsonAsync("/api/v1/drafting/export", request);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadAsByteArrayAsync();
    }

    public async Task<MizanAiChatResponse> SendMultimodalMessageAsync(string message, bool isDeepResearch, string conversationId, List<MultimodalFileDto> files)
    {
        var serviceToken = GenerateServiceToken();
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", serviceToken);

        using var content = new MultipartFormDataContent();
        
        content.Add(new StringContent(message ?? ""), "message");
        content.Add(new StringContent(isDeepResearch.ToString().ToLower()), "is_deep_research");
        content.Add(new StringContent(conversationId ?? ""), "conversation_id");

        foreach (var file in files)
        {
            if (file.ContentBytes != null && file.ContentBytes.Length > 0)
            {
                var fileContent = new ByteArrayContent(file.ContentBytes);
                if (!string.IsNullOrEmpty(file.ContentType))
                {
                    fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);
                }
                content.Add(fileContent, "files", file.FileName);
            }
        }

        var response = await _httpClient.PostAsync("/api/v1/chat/multimodal", content);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<MizanAiChatResponse>();
        if (result == null)
            throw new Exception("Received null response from Mizan AI multimodal endpoint.");
            
        return result;
    }

    public async Task<Stream> GenerateTtsAsync(string text)
    {
        var serviceToken = GenerateServiceToken();
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", serviceToken);

        var requestBody = new { text = text };
        var response = await _httpClient.PostAsJsonAsync("/api/v1/chat/tts", requestBody);
        
        response.EnsureSuccessStatusCode();
        
        return await response.Content.ReadAsStreamAsync();
    }
    public async Task<WukalaGPT.Application.DTOs.Drafting.ExtractFieldsResponse> ExtractFieldsAsync(WukalaGPT.Application.DTOs.Drafting.ExtractFieldsRequest request)
    {
        var serviceToken = GenerateServiceToken();
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", serviceToken);

        var response = await _httpClient.PostAsJsonAsync("/api/v1/drafting/extract-fields", request);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<WukalaGPT.Application.DTOs.Drafting.ExtractFieldsResponse>();
        return result ?? new WukalaGPT.Application.DTOs.Drafting.ExtractFieldsResponse();
    }

    public async Task<Stream> GetTemplateFileAsync(string templatePath)
    {
        var serviceToken = GenerateServiceToken();
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", serviceToken);

        var response = await _httpClient.GetAsync($"/api/v1/drafting/template-file?path={Uri.EscapeDataString(templatePath)}");
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadAsStreamAsync();
    }

    public async Task<WukalaGPT.Application.DTOs.CaseIntelligence.CaseIntelligenceResponse> AnalyzeCaseAsync(WukalaGPT.Application.DTOs.CaseIntelligence.CaseIntelligenceRequest request)
    {
        var serviceToken = GenerateServiceToken();
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", serviceToken);

        var response = await _httpClient.PostAsJsonAsync("/api/v1/case-intelligence/analyze", request);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<WukalaGPT.Application.DTOs.CaseIntelligence.CaseIntelligenceResponse>();
        return result ?? new WukalaGPT.Application.DTOs.CaseIntelligence.CaseIntelligenceResponse();
    }
}
