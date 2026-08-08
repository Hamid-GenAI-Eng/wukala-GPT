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
                    var error = contextFeature.Error;
                    
                    int statusCode = error switch
                    {
                        KeyNotFoundException => StatusCodes.Status404NotFound,
                        UnauthorizedAccessException => StatusCodes.Status403Forbidden,
                        ArgumentException or InvalidOperationException => StatusCodes.Status400BadRequest,
                        _ => StatusCodes.Status500InternalServerError
                    };

                    context.Response.StatusCode = statusCode;

                    await context.Response.WriteAsJsonAsync(new 
                    {
                        StatusCode = statusCode,
                        Message = statusCode == 500 ? "Internal Server Error" : error.Message,
                        Detail = statusCode == 500 ? error.Message : null
                    });
                }
            });
        });
    }
}
