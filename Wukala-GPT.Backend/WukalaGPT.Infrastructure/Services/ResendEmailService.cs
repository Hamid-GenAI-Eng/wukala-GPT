using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Resend;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.Infrastructure.Services;

public class ResendEmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly string _fromEmail;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(IResend resend, IConfiguration config, ILogger<ResendEmailService> logger)
    {
        _resend = resend;
        _fromEmail = config["Resend:FromEmail"] ?? "onboarding@resend.dev";
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string htmlBody)
    {
        var message = new EmailMessage
        {
            From = _fromEmail,
            To = { to },
            Subject = subject,
            HtmlBody = htmlBody
        };

        try
        {
            _logger.LogInformation("Attempting to send email to {To} via Resend", to);
            var response = await _resend.EmailSendAsync(message);
            _logger.LogInformation("Resend API called for {To}. Result: {Response}", to, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To} via Resend. Exception: {Message}", to, ex.Message);
            throw; // Re-throw to let caller or Hangfire handle it
        }
    }
}
