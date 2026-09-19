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

public class TemplateContentResponse
{
    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;
}

public class DraftExportRequest
{
    [JsonPropertyName("markdown_content")]
    public string MarkdownContent { get; set; } = string.Empty;
    
    [JsonPropertyName("document_title")]
    public string DocumentTitle { get; set; } = string.Empty;
}

public class DocumentDraftDto
{
    public Guid Id { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime LastModifiedAt { get; set; }
}

public class SaveDocumentDraftRequest
{
    public Guid? Id { get; set; } // If null, creates new
    public string TemplateName { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
}
