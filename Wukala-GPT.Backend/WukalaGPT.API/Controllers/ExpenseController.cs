using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.API.Controllers;

public class AddExpenseRequestDto
{
    public ExpenseCategory Category { get; set; }
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string Description { get; set; } = string.Empty;
}

[Authorize(Roles = "Lawyer,Admin")]
[ApiController]
[Route("api/[controller]")]
public class ExpenseController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public ExpenseController(IApplicationDbContext context)
    {
        _context = context;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        return claim != null ? Guid.Parse(claim.Value) : Guid.Empty;
    }

    private Guid GetFirmId()
    {
        var claimValue = User.FindFirstValue("FirmId");
        if (!string.IsNullOrEmpty(claimValue) && Guid.TryParse(claimValue, out var firmId))
        {
            return firmId;
        }

        var userId = GetUserId();
        if (userId != Guid.Empty)
        {
            var user = _context.Users.Find(userId);
            if (user?.FirmId != null) return user.FirmId.Value;
        }
        
        return Guid.Empty;
    }

    [HttpPost]
    public async Task<ActionResult<FirmExpense>> AddExpense([FromBody] AddExpenseRequestDto request)
    {
        try
        {
            var firmId = GetFirmId();

            var expense = new FirmExpense
            {
                FirmId = firmId,
                Category = request.Category,
                Amount = request.Amount,
                ExpenseDate = request.ExpenseDate,
                Description = request.Description
            };

            // In a real application, would also log this via ITeamService.LogActivityAsync
            _context.FirmExpenses.Add(expense);
            await _context.SaveChangesAsync(default);

            return Ok(expense);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
