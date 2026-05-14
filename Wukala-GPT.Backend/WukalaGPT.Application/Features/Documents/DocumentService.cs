using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using WukalaGPT.Application.DTOs.Document;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.Features.Documents;

public class DocumentService : IDocumentService
{
    private readonly IApplicationDbContext _context;
    private readonly IFileStorageService _fileStorage;
    private const long MaxFileSizeInBytes = 10 * 1024 * 1024; // 10 MB limit
    private readonly string[] _permittedExtensions = { ".pdf", ".jpeg", ".jpg", ".png", ".doc", ".docx" };

    public DocumentService(IApplicationDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    public async Task<DocumentResponseDto> UploadDocumentAsync(Guid userId, UploadDocumentDto dto)
    {
        var file = dto.File;
        if (file == null || file.Length == 0)
            throw new ArgumentException("File cannot be empty.");

        if (file.Length > MaxFileSizeInBytes)
            throw new InvalidOperationException("File size exceeds the maximum limit of 10 MB.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext) || !_permittedExtensions.Contains(ext))
            throw new InvalidOperationException("File type is not supported or potentially unsafe.");

        var classification = ClassifyDocument(file.FileName, ext);
        string folder = "wukala_documents"; // Base folder in Cloudinary
        
        var fileUrl = await _fileStorage.UploadFileAsync(file, folder);

        if (string.IsNullOrEmpty(fileUrl))
            throw new InvalidOperationException("Failed to upload document to cloud storage.");

        var document = new LegalDocument
        {
            UserId = userId,
            FileName = string.IsNullOrWhiteSpace(dto.OptionalTitle) ? file.FileName : dto.OptionalTitle,
            DefaultTitle = file.FileName,
            FileUrl = fileUrl,
            MimeType = file.ContentType,
            SizeInBytes = file.Length,
            Classification = classification,
            UploadedAt = DateTime.UtcNow
        };

        _context.LegalDocuments.Add(document);
        await _context.SaveChangesAsync(default);

        return MapToDto(document);
    }

    public async Task<List<DocumentResponseDto>> GetUserDocumentsAsync(Guid userId, DocumentClassification? classification, string? searchQuery)
    {
        var query = _context.LegalDocuments.Where(d => d.UserId == userId).AsQueryable();

        if (classification.HasValue)
        {
            query = query.Where(d => d.Classification == classification.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchQuery))
        {
            var searchLower = searchQuery.ToLower();
            query = query.Where(d => d.FileName.ToLower().Contains(searchLower) || d.DefaultTitle.ToLower().Contains(searchLower));
        }

        var documents = await query.OrderByDescending(d => d.UploadedAt).ToListAsync();

        return documents.Select(MapToDto).ToList();
    }

    public async Task<DocumentResponseDto> GetDocumentAsync(Guid userId, Guid documentId)
    {
        var document = await _context.LegalDocuments
            .FirstOrDefaultAsync(d => d.UserId == userId && d.Id == documentId);

        if (document == null)
            throw new KeyNotFoundException("Document not found.");

        return MapToDto(document);
    }

    public async Task DeleteDocumentAsync(Guid userId, Guid documentId)
    {
        var document = await _context.LegalDocuments
            .FirstOrDefaultAsync(d => d.UserId == userId && d.Id == documentId);

        if (document == null)
            throw new KeyNotFoundException("Document not found.");

        // Delete from cloud storage first
        try
        {
            await _fileStorage.DeleteFileAsync(document.FileUrl);
        }
        catch(Exception ex)
        {
            // Log it, but let's decide to proceed removing from DB so user isn't stuck.
            Console.WriteLine($"Failed to delete file from cloud storage: {ex.Message}");
        }

        _context.LegalDocuments.Remove(document);
        await _context.SaveChangesAsync(default);
    }

    private DocumentClassification ClassifyDocument(string fileName, string extension)
    {
        var lowerName = fileName.ToLowerInvariant();
        
        if (extension == ".jpg" || extension == ".jpeg" || extension == ".png")
            return DocumentClassification.Image;

        if (lowerName.Contains("contract") || lowerName.Contains("agreement") || lowerName.Contains("nda"))
            return DocumentClassification.Contract;

        if (extension == ".pdf" || extension == ".doc" || extension == ".docx")
            return DocumentClassification.LegalDoc;

        return DocumentClassification.Other;
    }

    private DocumentResponseDto MapToDto(LegalDocument document)
    {
        return new DocumentResponseDto
        {
            Id = document.Id,
            Name = document.FileName,
            Url = document.FileUrl,
            SizeFormatted = FormatFileSize(document.SizeInBytes),
            SizeInBytes = document.SizeInBytes,
            Classification = document.Classification.ToString(),
            MimeType = document.MimeType,
            UploadedAt = document.UploadedAt,
            TimeAgo = GetTimeAgo(document.UploadedAt)
        };
    }

    private string FormatFileSize(long bytes)
    {
        if (bytes >= 1024 * 1024)
            return $"{(bytes / 1024f / 1024f):0.##} MB";
        if (bytes >= 1024)
            return $"{(bytes / 1024f):0.##} KB";
        return $"{bytes} Bytes";
    }

    private string GetTimeAgo(DateTime uploadDate)
    {
        var timeSpan = DateTime.UtcNow - uploadDate;

        if (timeSpan.TotalDays >= 1)
            return $"{(int)timeSpan.TotalDays} days ago";
        if (timeSpan.TotalHours >= 1)
            return $"{(int)timeSpan.TotalHours} hours ago";
        if (timeSpan.TotalMinutes >= 1)
            return $"{(int)timeSpan.TotalMinutes} minutes ago";
        
        return "Just now";
    }
}
