using StackExchange.Redis;
using System.Net;

namespace WukalaGPT.API.Middleware;

public class RedisRateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConnectionMultiplexer _redis;
    private const int StandardMaxRequests = 100;
    private const int StrictMaxRequests = 20;
    private const int WindowSeconds = 60;

    public RedisRateLimitingMiddleware(RequestDelegate next, IConnectionMultiplexer redis)
    {
        _next = next;
        _redis = redis;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var endpoint = context.Request.Path.Value?.ToLower() ?? "";
        
        // Strict limit for Documents and AI API endpoints
        int limit = endpoint.Contains("/api/documents") || endpoint.Contains("/api/ai") ? StrictMaxRequests : StandardMaxRequests;
        
        try
        {
            var db = _redis.GetDatabase();
            var currentWindow = DateTime.UtcNow.Minute;
            var key = $"RateLimit:{ip}:{currentWindow}";
            
            var requests = await db.StringIncrementAsync(key);
            if (requests == 1)
            {
                // Set expiration to clear up memory (Current Minute + 1)
                await db.KeyExpireAsync(key, TimeSpan.FromSeconds(WindowSeconds + 5));
            }

            if (requests > limit)
            {
                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"message\": \"Too many requests. Global rate limit exceeded. Please wait a minute and try again.\"}");
                return;
            }
        }
        catch (Exception ex)
        {
            // Graceful degradation: If Redis is offline, allow the request rather than throwing 500 Internal Error.
            Console.WriteLine($"[Redis Bypass] Rate limiter gracefully bypassed due to connection failure: {ex.Message}");
        }

        await _next(context);
    }
}
