namespace WukalaGPT.Application.Interfaces;

public interface IAIChatService
{
    Task<string> GetChatResponseAsync(string prompt, CancellationToken cancellationToken = default);
}
