namespace WukalaGPT.Application.Interfaces;

public interface IDocumentStorage
{
    Task<string> UploadDocumentAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task DeleteDocumentAsync(string fileUrl, CancellationToken cancellationToken = default);
}
