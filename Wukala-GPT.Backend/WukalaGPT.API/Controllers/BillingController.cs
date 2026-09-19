using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Application.DTOs.Billing;

using Asp.Versioning;

namespace WukalaGPT.API.Controllers;

[Authorize(Roles = "Lawyer", Policy = "NotJuniorLawyer")]
[ApiController]
[ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billingService;

    public BillingController(IBillingService billingService)
    {
        _billingService = billingService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var lawyerId = GetUserId();
        var summary = await _billingService.GetBillingSummaryAsync(lawyerId);
        return Ok(summary);
    }

    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices([FromQuery] string? status, [FromQuery] string? search)
    {
        var lawyerId = GetUserId();
        var invoices = await _billingService.GetInvoicesAsync(lawyerId, status, search);
        return Ok(invoices);
    }

    [HttpGet("invoices/{id}")]
    public async Task<IActionResult> GetInvoice(Guid id)
    {
        var lawyerId = GetUserId();
        var invoice = await _billingService.GetInvoiceByIdAsync(id, lawyerId);
        if (invoice == null) return NotFound();
        return Ok(invoice);
    }

    [HttpPost("invoices")]
    public async Task<IActionResult> CreateInvoice(CreateInvoiceDto dto)
    {
        var lawyerId = GetUserId();
        var invoice = await _billingService.CreateInvoiceAsync(lawyerId, dto);
        return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, invoice);
    }

    [HttpGet("recent-payments")]
    public async Task<IActionResult> GetRecentPayments()
    {
        var lawyerId = GetUserId();
        var payments = await _billingService.GetRecentPaymentsAsync(lawyerId);
        return Ok(payments);
    }

    [HttpGet("retainers")]
    public async Task<IActionResult> GetRetainers()
    {
        var lawyerId = GetUserId();
        var retainers = await _billingService.GetRetainersAsync(lawyerId);
        return Ok(retainers);
    }

    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates()
    {
        var lawyerId = GetUserId();
        var templates = await _billingService.GetTemplatesAsync(lawyerId);
        return Ok(templates);
    }

    [HttpPost("invoices/{id}/pay")]
    public async Task<IActionResult> RecordPayment(Guid id, CreatePaymentDto dto)
    {
        try
        {
            var lawyerId = GetUserId();
            var payment = await _billingService.RecordPaymentAsync(lawyerId, id, dto);
            return Ok(payment);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("retainers")]
    public async Task<IActionResult> CreateRetainer(CreateRetainerDto dto)
    {
        var lawyerId = GetUserId();
        var retainer = await _billingService.CreateRetainerAsync(lawyerId, dto);
        return Ok(retainer);
    }

    [HttpPost("templates")]
    public async Task<IActionResult> CreateTemplate(CreateTemplateDto dto)
    {
        var lawyerId = GetUserId();
        var template = await _billingService.CreateTemplateAsync(lawyerId, dto);
        return Ok(template);
    }

    private Guid GetUserId()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(userIdStr, out var userId) ? userId : Guid.Empty;
    }
}
