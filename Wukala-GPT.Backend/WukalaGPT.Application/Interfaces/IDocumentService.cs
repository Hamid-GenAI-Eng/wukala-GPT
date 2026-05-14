using WukalaGPT.Application.DTOs.Document;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.Interfaces;

public interface IDocumentService
{
    Task<DocumentResponseDto> UploadDocumentAsync(Guid userId, UploadDocumentDto dto);
    Task<List<DocumentResponseDto>> GetUserDocumentsAsync(Guid userId, DocumentClassification? classification, string? searchQuery);
    Task<DocumentResponseDto> GetDocumentAsync(Guid userId, Guid documentId);
    Task DeleteDocumentAsync(Guid userId, Guid documentId);
}
