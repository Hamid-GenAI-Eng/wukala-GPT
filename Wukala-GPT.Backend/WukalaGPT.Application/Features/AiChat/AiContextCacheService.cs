using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.Application.Features.AiChat;

public class AiContextCacheService : IAiContextCacheService
{
    private readonly IDistributedCache _cache;
    private readonly TimeSpan _expiry = TimeSpan.FromHours(1);

    public AiContextCacheService(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task AddMessageToContextAsync(Guid userId, string role, string content)
    {
        var key = $"AiContext_{userId}";
        var existing = await _cache.GetStringAsync(key);
        var messages = string.IsNullOrEmpty(existing) 
            ? new List<Dictionary<string, string>>() 
            : JsonSerializer.Deserialize<List<Dictionary<string, string>>>(existing)!;

        messages.Add(new Dictionary<string, string> { { "role", role }, { "content", content } });

        // Keep only last 10 messages for context
        if (messages.Count > 10) messages.RemoveAt(0);

        var options = new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = _expiry };
        await _cache.SetStringAsync(key, JsonSerializer.Serialize(messages), options);
    }

    public async Task<List<object>> GetContextAsync(Guid userId)
    {
        var key = $"AiContext_{userId}";
        var existing = await _cache.GetStringAsync(key);
        if (string.IsNullOrEmpty(existing)) return new List<object>();
        
        return JsonSerializer.Deserialize<List<object>>(existing)!;
    }

    public async Task ClearContextAsync(Guid userId)
    {
        await _cache.RemoveAsync($"AiContext_{userId}");
    }
}
