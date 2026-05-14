using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.DTOs.Document;

public class DocumentResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    
    // Size formatting (MB or KB)
    public string SizeFormatted { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    
    // Document Type
    public string Classification { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    
    // Time tracking
    public DateTime UploadedAt { get; set; }
    public string TimeAgo { get; set; } = string.Empty;
}
