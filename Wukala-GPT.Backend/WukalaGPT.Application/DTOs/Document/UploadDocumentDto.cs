using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;

namespace WukalaGPT.Application.DTOs.Document;

public class UploadDocumentDto
{
    [Required]
    public IFormFile File { get; set; } = null!;

    public string? OptionalTitle { get; set; }
    
    public Guid? LegalCaseId { get; set; }
}
