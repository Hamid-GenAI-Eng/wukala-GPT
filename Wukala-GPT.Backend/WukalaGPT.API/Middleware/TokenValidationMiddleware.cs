using Microsoft.EntityFrameworkCore;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using System.Net;

namespace WukalaGPT.API.Middleware;

public class TokenValidationMiddleware
{
    private readonly RequestDelegate _next;

    public TokenValidationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IApplicationDbContext dbContext)
    {
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
        if (authHeader != null && authHeader.StartsWith("Bearer "))
        {
            var token = authHeader.Substring("Bearer ".Length).Trim();
            
            // Check if token exists in InvalidatedTokens
            var isInvalid = await dbContext.InvalidatedTokens.AnyAsync(t => t.Token == token);
            if (isInvalid)
            {
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"message\": \"Token has been invalidated (Logged out or Suspended).\"}");
                return;
            }
        }

        await _next(context);
    }
}
