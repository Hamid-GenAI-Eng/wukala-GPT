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

            var uploadParams = isVideo 
                ? new VideoUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folderName
                }
                : new RawUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folderName
                };

            if (!isVideo && file.ContentType.StartsWith("image/"))
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
        if (fileUrl.Contains("/raw/upload/")) resourceType = ResourceType.Raw;
        else if (fileUrl.Contains("/video/upload/")) resourceType = ResourceType.Video;

        var publicIdWithExtension = segments.Last();
        var folderSegments = segments.Skip(5).Take(segments.Length - 6);
        
        var publicId = resourceType == ResourceType.Raw 
            ? Uri.UnescapeDataString(publicIdWithExtension) // Raw needs extension
            : Path.GetFileNameWithoutExtension(Uri.UnescapeDataString(publicIdWithExtension));

        var fullPublicId = string.Join("", folderSegments) + publicId;

        var deleteParams = new DeletionParams(fullPublicId)
        {
            ResourceType = resourceType
        };
        await _cloudinary.DestroyAsync(deleteParams);
    }
}
