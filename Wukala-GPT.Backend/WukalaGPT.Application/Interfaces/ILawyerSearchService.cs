using WukalaGPT.Application.DTOs.Common;
using WukalaGPT.Application.DTOs.Search;

namespace WukalaGPT.Application.Interfaces;

public interface ILawyerSearchService
{
    Task<PagedResult<LawyerSearchItemDto>> SearchLawyersAsync(LawyerSearchQueryDto query);
    Task<LawyerClientViewDto> GetLawyerProfileForClientAsync(Guid lawyerUserId);
    Task<List<string>> GetAvailableCitiesAsync();
}
