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
    public string TemplatePath { get; set; } = string.Empty;
    public string CaseFacts { get; set; } = string.Empty;
}

public class DraftGenerateResponse
{
    public string Draft { get; set; } = string.Empty;
}

public class DraftExportRequest
{
    public string MarkdownContent { get; set; } = string.Empty;
    public string DocumentTitle { get; set; } = string.Empty;
}
