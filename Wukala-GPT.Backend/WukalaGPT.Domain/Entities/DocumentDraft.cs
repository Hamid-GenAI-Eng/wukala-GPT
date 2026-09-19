using System;

namespace WukalaGPT.Domain.Entities;

public class DocumentDraft
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    // The original template name, e.g. "affidavit-for-cnic-loss-english.docx"
    public string TemplateName { get; set; } = string.Empty;
    
    // The raw HTML content of the draft
    public string HtmlContent { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastModifiedAt { get; set; } = DateTime.UtcNow;
}
