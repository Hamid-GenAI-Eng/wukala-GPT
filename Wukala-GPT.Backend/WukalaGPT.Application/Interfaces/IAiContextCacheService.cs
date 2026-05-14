namespace WukalaGPT.Application.Interfaces;

public interface IAiContextCacheService
{
    Task AddMessageToContextAsync(Guid userId, string role, string content);
    Task<List<object>> GetContextAsync(Guid userId);
    Task ClearContextAsync(Guid userId);
}
