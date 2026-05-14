using Microsoft.AspNetCore.Http;

namespace WukalaGPT.Application.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadFileAsync(IFormFile file, string folderName);
    Task DeleteFileAsync(string fileUrl);
}
