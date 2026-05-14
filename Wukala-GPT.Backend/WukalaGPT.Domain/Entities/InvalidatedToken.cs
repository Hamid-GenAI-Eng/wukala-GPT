namespace WukalaGPT.Domain.Entities;

public class InvalidatedToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiryTime { get; set; }
}
