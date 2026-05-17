using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WukalaGPT.Application.DTOs.Lawyer;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Lawyer, Admin")] // Primary audience for most of these
public class LawyersController : ControllerBase
{
    private readonly ILawyerProfileService _profileService;
    private readonly IFileStorageService _fileStorage;

    public LawyersController(ILawyerProfileService profileService, IFileStorageService fileStorage)
    {
        _profileService = profileService;
        _fileStorage = fileStorage;
    }

    private Guid GetUserId()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            throw new UnauthorizedAccessException("Invalid token.");
        return userId;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        try
        {
            var profile = await _profileService.GetProfileAsync(GetUserId());
            return Ok(profile);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateLawyerProfileDto dto)
    {
        try
        {
            var profile = await _profileService.UpdateProfileAsync(GetUserId(), dto);
            return Ok(profile);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("me/photo")]
    public async Task<IActionResult> UpdateMyPhoto(IFormFile photo)
    {
        try
        {
            var url = await _profileService.UpdateProfilePhotoAsync(GetUserId(), photo);
            return Ok(new { photoUrl = url, message = "Photo updated successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("me/document")]
    public async Task<IActionResult> UploadDocument(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded." });

            var url = await _fileStorage.UploadFileAsync(file, "lawyer-proofs");
            return Ok(new { url, message = "Document uploaded successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // --- Experience ---

    [HttpPost("me/experience")]
    public async Task<IActionResult> AddExperience([FromBody] UpdateExperienceDto dto)
    {
        try
        {
            var result = await _profileService.AddExperienceAsync(GetUserId(), dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("me/experience/{id}")]
    public async Task<IActionResult> UpdateExperience(Guid id, [FromBody] UpdateExperienceDto dto)
    {
        try
        {
            await _profileService.UpdateExperienceAsync(GetUserId(), id, dto);
            return Ok(new { message = "Experience updated successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("me/experience/{id}")]
    public async Task<IActionResult> DeleteExperience(Guid id)
    {
        try
        {
            await _profileService.DeleteExperienceAsync(GetUserId(), id);
            return Ok(new { message = "Experience deleted successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // --- Education ---

    [HttpPost("me/education")]
    public async Task<IActionResult> AddEducation([FromBody] UpdateEducationDto dto)
    {
        try
        {
            var result = await _profileService.AddEducationAsync(GetUserId(), dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("me/education/{id}")]
    public async Task<IActionResult> UpdateEducation(Guid id, [FromBody] UpdateEducationDto dto)
    {
        try
        {
            await _profileService.UpdateEducationAsync(GetUserId(), id, dto);
            return Ok(new { message = "Education updated successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("me/education/{id}")]
    public async Task<IActionResult> DeleteEducation(Guid id)
    {
        try
        {
            await _profileService.DeleteEducationAsync(GetUserId(), id);
            return Ok(new { message = "Education deleted successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // --- Specialities ---

    [HttpGet("specialities")]
    [AllowAnonymous] // Anyone should be able to get standard specialities
    public async Task<IActionResult> GetSpecialities()
    {
        var specialities = await _profileService.GetAllSpecialitiesAsync();
        return Ok(specialities);
    }

    [HttpPut("me/specialities")]
    public async Task<IActionResult> AssignSpecialities([FromBody] List<Guid> specialityIds)
    {
        try
        {
            await _profileService.AssignSpecialitiesAsync(GetUserId(), specialityIds);
            return Ok(new { message = "Specialities updated successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // --- Admin ---

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/badges")]
    public async Task<IActionResult> AssignBadges(Guid id, [FromBody] UpdateLawyerBadgesDto dto)
    {
        try
        {
            await _profileService.AssignBadgesAsync(id, dto);
            return Ok(new { message = "Badges updated successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
