using WukalaGPT.Application.DTOs.Common;
using WukalaGPT.Application.DTOs.Search;

namespace WukalaGPT.Application.Interfaces;

public interface ISavedProfileService
{
    Task ToggleSaveProfileAsync(Guid clientId, Guid lawyerId);
    Task<PagedResult<LawyerSearchItemDto>> GetSavedProfilesAsync(Guid clientId, int page, int pageSize);
}
