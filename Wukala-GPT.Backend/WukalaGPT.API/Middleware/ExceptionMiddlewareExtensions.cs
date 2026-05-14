using Microsoft.AspNetCore.Diagnostics;

namespace WukalaGPT.API.Middleware;

public static class ExceptionMiddlewareExtensions
{
    public static void ConfigureExceptionHandler(this IApplicationBuilder app)
    {
        app.UseExceptionHandler(appError =>
        {
            appError.Run(async context =>
            {
                context.Response.ContentType = "application/json";
                var contextFeature = context.Features.Get<IExceptionHandlerFeature>();
                if(contextFeature != null)
                {
                    // Basic generic error response
                    await context.Response.WriteAsJsonAsync(new 
                    {
                        StatusCode = context.Response.StatusCode,
                        Message = "Internal Server Error."
                    });
                }
            });
        });
    }
}
