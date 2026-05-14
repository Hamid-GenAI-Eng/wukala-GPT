namespace WukalaGPT.Infrastructure.Services;

// Typically there would be an IEmailService in Application/Interfaces as well.
public class EmailService
{
    public Task SendEmailAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        // TODO: Implement Email Sending logic (e.g. SendGrid, SMTP)
        return Task.CompletedTask;
    }
}
