using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

namespace WukalaGPT.IntegrationTests;

public static class TestJwtHelper
{
    // Mirrors JwtSettings from appsettings.json for Test generation
    public static string GenerateTestToken(Guid userId, Guid firmId)
    {
        // For testing, we mock the secret key logic used in API.
        // In real execution, the factory reads appsettings.json, so we must match it.
        // We'll generate a dummy token just for the factory configuration if we override Auth, 
        // OR we use the actual test secret.
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim("FirmId", firmId.ToString())
        };

        // For simplicity in xUnit Auth override testing, we can use a hardcoded helper 
        // if we inject a Mock Authentication scheme.
        // Below is standard generation if needed, but integration tests often bypass Auth 
        // with a custom TestAuthHandler.
        
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("SuperSecretKeyForTheIntegrationTestFrameworkToMockTheTokens123!!"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        var token = new JwtSecurityToken(
            issuer: "TestIssuer",
            audience: "TestAudience",
            claims: claims,
            expires: DateTime.Now.AddMinutes(30),
            signingCredentials: creds
        );
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
