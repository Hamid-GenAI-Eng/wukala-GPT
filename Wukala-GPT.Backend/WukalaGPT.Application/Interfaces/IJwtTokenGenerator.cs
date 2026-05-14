using WukalaGPT.Domain.Entities;

namespace WukalaGPT.Application.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}
