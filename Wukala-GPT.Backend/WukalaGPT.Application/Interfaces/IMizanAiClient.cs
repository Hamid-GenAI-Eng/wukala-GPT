using WukalaGPT.Application.DTOs.AiChat;

namespace WukalaGPT.Application.Interfaces;

public interface IMizanAiClient
{
    Task<MizanAiChatResponse> SendMessageAsync(MizanAiChatRequest request);
    Task<WukalaGPT.Application.DTOs.Drafting.TemplatesResponse> GetTemplatesAsync();
    Task<WukalaGPT.Application.DTOs.Drafting.DraftGenerateResponse> GenerateDraftAsync(WukalaGPT.Application.DTOs.Drafting.DraftGenerateRequest request);
    Task<byte[]> ExportDraftToDocxAsync(WukalaGPT.Application.DTOs.Drafting.DraftExportRequest request);
}
