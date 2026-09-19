using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WukalaGPT.Application.DTOs.Billing;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities.Billing;

namespace WukalaGPT.Application.Features.Billing;

public class BillingService : IBillingService
{
    private readonly IApplicationDbContext _context;

    public BillingService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<BillingSummaryDto> GetBillingSummaryAsync(Guid lawyerId)
    {
        var invoices = await _context.Invoices
            .Where(i => i.LawyerId == lawyerId)
            .ToListAsync();

        var summary = new BillingSummaryDto
        {
            TotalRevenue = invoices.Where(i => i.Status == "Paid").Sum(i => i.Amount),
            OutstandingAmount = invoices.Where(i => i.Status == "Pending" || i.Status == "Partially Paid")
                .Sum(i => i.Amount - i.PaidAmount),
            OverdueAmount = invoices.Where(i => i.Status == "Overdue").Sum(i => i.Amount),
            ActiveRetainersCount = await _context.Retainers.CountAsync(r => r.LawyerId == lawyerId && r.Status == "Active")
        };

        return summary;
    }

    public async Task<List<InvoiceDto>> GetInvoicesAsync(Guid lawyerId, string? status = null, string? search = null)
    {
        var query = _context.Invoices.AsNoTracking()
            .Include(i => i.Client)
            .Where(i => i.LawyerId == lawyerId);

        if (!string.IsNullOrEmpty(status) && status != "all")
        {
            query = query.Where(i => i.Status.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(i => i.Client.FullName.Contains(search) || 
                                     i.InvoiceNumber.Contains(search));
        }

        var invoices = await query
            .OrderByDescending(i => i.DateIssued)
            .ToListAsync();

        return invoices.Select(MapToDto).ToList();
    }

    public async Task<InvoiceDto?> GetInvoiceByIdAsync(Guid id, Guid lawyerId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Client)
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id && i.LawyerId == lawyerId);

        return invoice == null ? null : MapToDto(invoice);
    }

    public async Task<InvoiceDto> CreateInvoiceAsync(Guid lawyerId, CreateInvoiceDto dto)
    {
        var invoiceCount = await _context.Invoices.CountAsync(i => i.LawyerId == lawyerId);
        var invoiceNumber = $"INV-{DateTime.Now.Year}-{100 + invoiceCount + 1}";

        var invoice = new Invoice
        {
            LawyerId = lawyerId,
            ClientId = dto.ClientId,
            CaseId = dto.CaseId,
            CaseRef = dto.CaseRef,
            InvoiceNumber = invoiceNumber,
            DateIssued = dto.DateIssued,
            DueDate = dto.DueDate,
            Notes = dto.Notes,
            Status = "Pending",
            Amount = dto.Items.Sum(x => x.Amount),
            Items = dto.Items.Select(x => new InvoiceItem
            {
                Description = x.Description,
                Hours = x.Hours,
                Rate = x.Rate,
                Amount = x.Amount
            }).ToList()
        };

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync(default);

        return MapToDto(invoice);
    }

    public async Task<List<PaymentDto>> GetRecentPaymentsAsync(Guid lawyerId)
    {
        var payments = await _context.Payments.AsNoTracking()
            .Include(p => p.Invoice)
            .Include(p => p.Client)
            .Where(p => p.Invoice.LawyerId == lawyerId)
            .OrderByDescending(p => p.PaymentDate)
            .Take(10)
            .ToListAsync();

        return payments.Select(p => new PaymentDto
        {
            Id = p.Id,
            InvoiceNumber = p.Invoice.InvoiceNumber,
            ClientName = p.Client != null ? p.Client.FullName : "Unknown Client",
            Amount = p.Amount,
            Date = p.PaymentDate,
            Method = p.Method,
            Reference = p.Reference,
            Status = p.Status
        }).ToList();
    }

    public async Task<List<RetainerDto>> GetRetainersAsync(Guid lawyerId)
    {
        var retainers = await _context.Retainers.AsNoTracking()
            .Include(r => r.Client)
            .Where(r => r.LawyerId == lawyerId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .ToListAsync();

        return retainers.Select(r => new RetainerDto
        {
            Id = r.Id,
            RetainerNumber = r.RetainerNumber,
            ClientName = r.Client != null ? r.Client.FullName : "Unknown Client",
            TotalAmount = r.TotalAmount,
            UsedAmount = r.UsedAmount,
            StartDate = r.StartDate,
            EndDate = r.EndDate,
            Status = r.Status,
            BillingCycle = r.BillingCycle
        }).ToList();
    }

    public async Task<List<BillingTemplateDto>> GetTemplatesAsync(Guid lawyerId)
    {
        var templates = await _context.BillingTemplates.AsNoTracking()
            .Include(t => t.Items)
            .Where(t => t.LawyerId == lawyerId)
            .ToListAsync();

        if (!templates.Any())
        {
            return new List<BillingTemplateDto>
            {
                new BillingTemplateDto
                {
                    Id = Guid.NewGuid(),
                    Name = "Standard Legal Consultation",
                    Category = "Consultation",
                    Description = "Standard one hour legal consultation.",
                    Items = new List<InvoiceItemDto>
                    {
                        new InvoiceItemDto { Description = "Legal Consultation Fee", Rate = 15000, Hours = 1, Amount = 15000 }
                    }
                },
                new BillingTemplateDto
                {
                    Id = Guid.NewGuid(),
                    Name = "Contract Drafting",
                    Category = "Drafting",
                    Description = "Drafting of standard legal agreements.",
                    Items = new List<InvoiceItemDto>
                    {
                        new InvoiceItemDto { Description = "Document Drafting", Rate = 25000, Hours = 1, Amount = 25000 },
                        new InvoiceItemDto { Description = "Review & Revisions", Rate = 10000, Hours = 1, Amount = 10000 }
                    }
                },
                new BillingTemplateDto
                {
                    Id = Guid.NewGuid(),
                    Name = "Court Appearance",
                    Category = "Litigation",
                    Description = "Fee for representing the client in court proceedings.",
                    Items = new List<InvoiceItemDto>
                    {
                        new InvoiceItemDto { Description = "Court Appearance Fee", Rate = 50000, Hours = 1, Amount = 50000 }
                    }
                }
            };
        }

        return templates.Select(t => new BillingTemplateDto
        {
            Id = t.Id,
            Name = t.Name,
            Category = t.Category,
            Description = t.Description,
            UsageCount = t.UsageCount,
            LastUsed = t.LastUsed,
            Items = t.Items.Select(i => new InvoiceItemDto
            {
                Description = i.Description,
                Rate = i.Rate,
                Hours = 1,
                Amount = i.Rate
            }).ToList()
        }).ToList();
    }

    private InvoiceDto MapToDto(Invoice i)
    {
        return new InvoiceDto
        {
            Id = i.Id,
            InvoiceNumber = i.InvoiceNumber,
            ClientName = i.Client != null ? i.Client.FullName : "Unknown Client",
            CaseRef = i.CaseRef,
            Amount = i.Amount,
            AmountFormatted = $"₨ {i.Amount:N0}",
            DateIssued = i.DateIssued,
            DueDate = i.DueDate,
            Status = i.Status,
            PaidAmount = i.PaidAmount,
            PaymentMethod = i.PaymentMethod,
            PaidDate = i.PaidDate,
            Notes = i.Notes,
            Items = i.Items?.Select(item => new InvoiceItemDto
            {
                Description = item.Description,
                Hours = item.Hours,
                Rate = item.Rate,
                Amount = item.Amount
            }).ToList() ?? new List<InvoiceItemDto>()
        };
    }

    public async Task<RetainerDto> CreateRetainerAsync(Guid lawyerId, CreateRetainerDto dto)
    {
        var count = await _context.Retainers.CountAsync(r => r.LawyerId == lawyerId);
        var retainerNumber = $"RET-{DateTime.Now.Year}-{100 + count + 1}";

        var retainer = new Retainer
        {
            LawyerId = lawyerId,
            ClientId = dto.ClientId,
            RetainerNumber = retainerNumber,
            TotalAmount = dto.TotalAmount,
            UsedAmount = 0,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            BillingCycle = dto.BillingCycle,
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Retainers.Add(retainer);
        await _context.SaveChangesAsync(default);

        return new RetainerDto
        {
            Id = retainer.Id,
            RetainerNumber = retainer.RetainerNumber,
            ClientName = "Unknown Client", // will be refreshed by caller
            TotalAmount = retainer.TotalAmount,
            UsedAmount = retainer.UsedAmount,
            StartDate = retainer.StartDate,
            EndDate = retainer.EndDate,
            Status = retainer.Status,
            BillingCycle = retainer.BillingCycle
        };
    }

    public async Task<BillingTemplateDto> CreateTemplateAsync(Guid lawyerId, CreateTemplateDto dto)
    {
        var template = new BillingTemplate
        {
            LawyerId = lawyerId,
            Name = dto.Name,
            Category = dto.Category,
            Description = dto.Description,
            Items = dto.Items.Select(i => new BillingTemplateItem
            {
                Description = i.Description,
                Rate = i.Rate
            }).ToList(),
            UsageCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.BillingTemplates.Add(template);
        await _context.SaveChangesAsync(default);

        return new BillingTemplateDto
        {
            Id = template.Id,
            Name = template.Name,
            Category = template.Category,
            Description = template.Description,
            UsageCount = template.UsageCount,
            Items = template.Items.Select(i => new InvoiceItemDto
            {
                Description = i.Description,
                Rate = i.Rate,
                Hours = 1,
                Amount = i.Rate
            }).ToList()
        };
    }

    public async Task<PaymentDto> RecordPaymentAsync(Guid lawyerId, Guid invoiceId, CreatePaymentDto dto)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Client)
            .FirstOrDefaultAsync(i => i.Id == invoiceId && i.LawyerId == lawyerId);

        if (invoice == null)
            throw new Exception("Invoice not found");

        var payment = new Payment
        {
            ClientId = invoice.ClientId,
            InvoiceId = invoice.Id,
            Amount = dto.Amount,
            PaymentDate = dto.Date,
            Method = dto.Method,
            Reference = dto.Reference,
            Status = "Completed",
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);

        invoice.PaidAmount += dto.Amount;
        invoice.PaidDate = dto.Date;
        invoice.PaymentMethod = dto.Method;
        invoice.UpdatedAt = DateTime.UtcNow;

        if (invoice.PaidAmount >= invoice.Amount)
        {
            invoice.Status = "Paid";
        }
        else if (invoice.PaidAmount > 0)
        {
            invoice.Status = "Partially Paid";
        }

        await _context.SaveChangesAsync(default);

        return new PaymentDto
        {
            Id = payment.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            ClientName = invoice.Client?.FullName ?? "Unknown Client",
            Amount = payment.Amount,
            Date = payment.PaymentDate,
            Method = payment.Method,
            Reference = payment.Reference,
            Status = payment.Status
        };
    }
}
