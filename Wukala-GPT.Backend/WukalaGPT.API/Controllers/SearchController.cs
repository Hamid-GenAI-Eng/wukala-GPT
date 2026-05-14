using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WukalaGPT.Application.DTOs.Search;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class SearchController : ControllerBase
{
    private readonly ILawyerSearchService _searchService;

    public SearchController(ILawyerSearchService searchService)
    {
        _searchService = searchService;
    }

    [HttpGet("lawyers")]
    public async Task<IActionResult> SearchLawyers([FromQuery] LawyerSearchQueryDto query)
    {
        try
        {
            var result = await _searchService.SearchLawyersAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("lawyers/{id}")]
    public async Task<IActionResult> GetLawyerProfile(Guid id)
    {
        try
        {
            var profile = await _searchService.GetLawyerProfileForClientAsync(id);
            return Ok(profile);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("cities")]
    public async Task<IActionResult> GetAvailableCities()
    {
        try
        {
            var cities = await _searchService.GetAvailableCitiesAsync();
            return Ok(cities);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
