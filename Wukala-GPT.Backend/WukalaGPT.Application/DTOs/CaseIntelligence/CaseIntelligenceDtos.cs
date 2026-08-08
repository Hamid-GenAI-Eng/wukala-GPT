using System.Text.Json.Serialization;

namespace WukalaGPT.Application.DTOs.CaseIntelligence;

public class CaseIntelligenceRequest
{
    [JsonPropertyName("session_id")]
    public string SessionId { get; set; } = string.Empty;

    [JsonPropertyName("raw_facts")]
    public string RawFacts { get; set; } = string.Empty;

    [JsonPropertyName("mode")]
    public string Mode { get; set; } = "standard";

    [JsonPropertyName("image_base64")]
    public string? ImageBase64 { get; set; }
}

public class TimelineEventResponse
{
    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("event")]
    public string Event { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}

public class PrecedentResponse
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("citation")]
    public string Citation { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;
}

public class StrategyResponse
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("desc")]
    public string Desc { get; set; } = string.Empty;

    [JsonPropertyName("precedents")]
    public List<PrecedentResponse> Precedents { get; set; } = new();
}

public class CaseIntelligenceResponse
{
    [JsonPropertyName("timeline")]
    public List<TimelineEventResponse> Timeline { get; set; } = new();

    [JsonPropertyName("issues")]
    public List<string> Issues { get; set; } = new();

    [JsonPropertyName("strategies")]
    public List<StrategyResponse> Strategies { get; set; } = new();

    [JsonPropertyName("weaknesses")]
    public List<string> Weaknesses { get; set; } = new();
}
