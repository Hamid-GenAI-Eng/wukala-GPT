using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Domain.Entities;

public class LegalDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    // Optional association with a Case
    public Guid? LegalCaseId { get; set; }
    public LegalCase? LegalCase { get; set; }
    
    public string DefaultTitle { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    public DocumentClassification Classification { get; set; } = DocumentClassification.Other;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
