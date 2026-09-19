using Microsoft.AspNetCore.Http;
using WukalaGPT.Application.DTOs.Lawyer;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.Interfaces;

public interface ILawyerProfileService
{
    Task<LawyerProfileDto> GetProfileAsync(Guid lawyerUserId);
    Task<LawyerProfileDto> UpdateProfileAsync(Guid lawyerUserId, UpdateLawyerProfileDto dto);
    Task UpdateSettingsAsync(Guid lawyerUserId, UpdateLawyerSettingsDto dto);
    Task<string> UpdateProfilePhotoAsync(Guid lawyerUserId, IFormFile photo);
    
    // Collections Management
    Task<ExperienceDto> AddExperienceAsync(Guid lawyerUserId, UpdateExperienceDto dto);
    Task UpdateExperienceAsync(Guid lawyerUserId, Guid experienceId, UpdateExperienceDto dto);
    Task DeleteExperienceAsync(Guid lawyerUserId, Guid experienceId);
    
    Task<EducationDto> AddEducationAsync(Guid lawyerUserId, UpdateEducationDto dto);
    Task UpdateEducationAsync(Guid lawyerUserId, Guid educationId, UpdateEducationDto dto);
    Task DeleteEducationAsync(Guid lawyerUserId, Guid educationId);
    
    // Specialities
    Task<List<SpecialityDto>> GetAllSpecialitiesAsync();
    Task AssignSpecialitiesAsync(Guid lawyerUserId, List<Guid> specialityIds);
    
    // Admin Only
    Task AssignBadgesAsync(Guid lawyerUserId, UpdateLawyerBadgesDto dto);
}
