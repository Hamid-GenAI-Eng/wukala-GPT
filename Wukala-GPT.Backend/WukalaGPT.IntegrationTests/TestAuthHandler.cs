using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace WukalaGPT.IntegrationTests;

public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string DefaultScheme = "TestScheme";

    public TestAuthHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, 
        ILoggerFactory logger, UrlEncoder encoder) 
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Check for headers indicating mock impersonation context
        if (!Request.Headers.TryGetValue("X-Test-UserId", out var userIdHeader) ||
            !Request.Headers.TryGetValue("X-Test-FirmId", out var firmIdHeader))
        {
            return Task.FromResult(AuthenticateResult.Fail("Missing test auth headers."));
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userIdHeader[0]!),
            new Claim("FirmId", firmIdHeader[0]!)
        };

        var identity = new ClaimsIdentity(claims, DefaultScheme);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, DefaultScheme);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
