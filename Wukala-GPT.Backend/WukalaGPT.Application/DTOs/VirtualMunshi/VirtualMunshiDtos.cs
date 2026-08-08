using System.Text.Json.Serialization;

namespace WukalaGPT.Application.DTOs.VirtualMunshi;

public class MunshiNotificationRequestDto
{
    [JsonPropertyName("case_title")]
    public string CaseTitle { get; set; } = string.Empty;

    [JsonPropertyName("next_hearing_date")]
    public string NextHearingDate { get; set; } = string.Empty;

    [JsonPropertyName("court")]
    public string Court { get; set; } = string.Empty;

    [JsonPropertyName("include_audio")]
    public bool IncludeAudio { get; set; } = false;
}

public class MunshiNotificationResponseDto
{
    [JsonPropertyName("text_roman_urdu")]
    public string TextRomanUrdu { get; set; } = string.Empty;

    [JsonPropertyName("audio_base64")]
    public string? AudioBase64 { get; set; }
}

public class ParsedCaseDto
{
    [JsonPropertyName("case_title")]
    public string CaseTitle { get; set; } = string.Empty;

    [JsonPropertyName("case_number")]
    public string CaseNumber { get; set; } = string.Empty;

    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("judge")]
    public string Judge { get; set; } = string.Empty;

    [JsonPropertyName("courtroom")]
    public string Courtroom { get; set; } = string.Empty;
}

public class CauseListResponseDto
{
    [JsonPropertyName("cases")]
    public List<ParsedCaseDto> Cases { get; set; } = new();
}
