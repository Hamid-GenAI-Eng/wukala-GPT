using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.Infrastructure.Services;

public class CloudinaryService : IFileStorageService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService(IConfiguration config)
    {
        var account = new Account(
            config["Cloudinary:CloudName"],
            config["Cloudinary:ApiKey"],
            config["Cloudinary:ApiSecret"]
        );
        _cloudinary = new Cloudinary(account);
    }

    public async Task<string> UploadFileAsync(IFormFile file, string folderName)
    {
        if (file.Length > 0)
        {
            await using var stream = file.OpenReadStream();
            
            // SECURITY: Validate magic bytes to prevent malicious file uploads
            if (!WukalaGPT.Infrastructure.Helpers.FileValidationHelper.IsValidFileSignature(file.FileName, stream))
            {
                throw new InvalidOperationException("File signature verification failed. The file may be corrupted or disguised.");
            }
            
            // Check if file is a video
            var isVideo = file.ContentType.StartsWith("video/");

            var isPdf = file.ContentType.Contains("pdf") || file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase);

            var uploadParams = isVideo 
                ? new VideoUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folderName
                }
                : new RawUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folderName,
                    Type = "authenticated" // FIX: Raw files (like PDFs) are blocked by Cloudinary by default unless authenticated
                };

            if (!isVideo && !isPdf && file.ContentType.StartsWith("image/"))
            {
                var imageUploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folderName
                };
                var uploadResult = await _cloudinary.UploadAsync(imageUploadParams);
                return uploadResult.SecureUrl?.ToString() ?? string.Empty;
            }
            
            if (isVideo)
            {
                var uploadResult = await _cloudinary.UploadLargeAsync((VideoUploadParams)uploadParams);
                return uploadResult.SecureUrl?.ToString() ?? string.Empty;
            }
            else
            {
                var uploadResult = await _cloudinary.UploadAsync((RawUploadParams)uploadParams);
                return uploadResult.SecureUrl?.ToString() ?? string.Empty;
            }
        }
        return string.Empty;
    }

    public async Task DeleteFileAsync(string fileUrl)
    {
        var uri = new Uri(fileUrl);
        var segments = uri.Segments;
        
        var resourceType = ResourceType.Image;
        if (fileUrl.Contains("/raw/")) resourceType = ResourceType.Raw;
        else if (fileUrl.Contains("/video/")) resourceType = ResourceType.Video;

        var typeStr = fileUrl.Contains("/authenticated/") ? "authenticated" : "upload";

        var publicIdWithExtension = segments.Last();
        var startIndex = Array.FindIndex(segments, s => s.StartsWith("upload/") || s.StartsWith("authenticated/")) + 1;
        if (segments[startIndex].StartsWith("v") && segments[startIndex].EndsWith("/")) startIndex++; // Skip version

        var folderSegments = segments.Skip(startIndex).Take(segments.Length - startIndex - 1);
        
        var publicId = resourceType == ResourceType.Raw 
            ? Uri.UnescapeDataString(publicIdWithExtension)
            : Path.GetFileNameWithoutExtension(Uri.UnescapeDataString(publicIdWithExtension));

        var fullPublicId = string.Join("", folderSegments) + publicId;

        var deleteParams = new DeletionParams(fullPublicId)
        {
            ResourceType = resourceType,
            Type = typeStr
        };
        await _cloudinary.DestroyAsync(deleteParams);
    }

    public async Task<Stream> GetFileStreamAsync(string fileUrl)
    {
        var client = new HttpClient();
        var response = await client.GetAsync(fileUrl, HttpCompletionOption.ResponseHeadersRead);
        
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Failed to retrieve document from Cloudinary. Status: {response.StatusCode}. URL: {fileUrl}. Error: {errorContent}");
        }

        return await response.Content.ReadAsStreamAsync();
    }
}
