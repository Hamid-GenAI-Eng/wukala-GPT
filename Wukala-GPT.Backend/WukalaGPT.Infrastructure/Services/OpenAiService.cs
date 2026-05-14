using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.Infrastructure.Services;

public class OpenAiService : IAIChatService
{
    public Task<string> GetChatResponseAsync(string prompt, CancellationToken cancellationToken = default)
    {
        // TODO: Implement OpenAI API call
        return Task.FromResult($"AI Response to: {prompt}");
    }
}
