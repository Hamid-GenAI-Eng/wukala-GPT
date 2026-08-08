using WukalaGPT.Application.DTOs.AiChat;

namespace WukalaGPT.Application.Interfaces;

public interface IMizanAiClient
{
    Task<MizanAiChatResponse> SendMessageAsync(MizanAiChatRequest request);
    Task<WukalaGPT.Application.DTOs.Drafting.TemplatesResponse> GetTemplatesAsync();
    Task<WukalaGPT.Application.DTOs.Drafting.DraftGenerateResponse> GenerateDraftAsync(WukalaGPT.Application.DTOs.Drafting.DraftGenerateRequest request);
    Task<byte[]> ExportDraftToDocxAsync(WukalaGPT.Application.DTOs.Drafting.DraftExportRequest request);
    Task<MizanAiChatResponse> SendMultimodalMessageAsync(string message, bool isDeepResearch, string conversationId, List<MultimodalFileDto> files);
    Task<Stream> GenerateTtsAsync(string text);
    Task<WukalaGPT.Application.DTOs.Drafting.ExtractFieldsResponse> ExtractFieldsAsync(WukalaGPT.Application.DTOs.Drafting.ExtractFieldsRequest request);
    Task<Stream> GetTemplateFileAsync(string templatePath);
    Task<WukalaGPT.Application.DTOs.CaseIntelligence.CaseIntelligenceResponse> AnalyzeCaseAsync(WukalaGPT.Application.DTOs.CaseIntelligence.CaseIntelligenceRequest request);
}
