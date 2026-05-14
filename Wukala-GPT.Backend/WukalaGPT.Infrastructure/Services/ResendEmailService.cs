using Microsoft.Extensions.Configuration;
using Resend;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.Infrastructure.Services;

public class ResendEmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly string _fromEmail;

    public ResendEmailService(IResend resend, IConfiguration config)
    {
        _resend = resend;
        _fromEmail = config["Resend:FromEmail"] ?? "onboarding@resend.dev";
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

        await _resend.EmailSendAsync(message);
    }
}
