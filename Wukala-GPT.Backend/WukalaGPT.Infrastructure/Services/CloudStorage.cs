using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.Infrastructure.Services;

public class CloudStorage : IDocumentStorage
{
    public Task<string> UploadDocumentAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        // TODO: Implement upload to S3/Azure Blob Storage
        return Task.FromResult($"https://fake-storage-url.com/{fileName}");
    }

    public Task DeleteDocumentAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        // TODO: Implement delete from S3/Azure Blob Storage
        return Task.CompletedTask;
    }
}
