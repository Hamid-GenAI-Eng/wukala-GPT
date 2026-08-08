using System.Text.Json.Serialization;

namespace WukalaGPT.Application.DTOs.Drafting;

public class TemplateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public List<TemplateLanguageDto> Languages { get; set; } = new();
}

public class TemplateLanguageDto
{
    public string Language { get; set; } = string.Empty;
    public List<string> Files { get; set; } = new();
}

public class TemplatesResponse
{
    public List<TemplateCategoryDto> Categories { get; set; } = new();
}

public class DraftGenerateRequest
{
    [JsonPropertyName("template_path")]
    public string TemplatePath { get; set; } = string.Empty;

    [JsonPropertyName("case_facts")]
    public string CaseFacts { get; set; } = string.Empty;
}

public class DraftGenerateResponse
{
    public string Draft { get; set; } = string.Empty;
}

public class DraftExportRequest
{
    [JsonPropertyName("markdown_content")]
    public string MarkdownContent { get; set; } = string.Empty;
    
    [JsonPropertyName("document_title")]
    public string DocumentTitle { get; set; } = string.Empty;
}

public class ExtractFieldsRequest
{
    [JsonPropertyName("template_path")]
    public string TemplatePath { get; set; } = string.Empty;
}

public class ExtractFieldsResponse
{
    [JsonPropertyName("fields")]
    public List<TemplateFieldDto> Fields { get; set; } = new();
}

public class TemplateFieldDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;
}
