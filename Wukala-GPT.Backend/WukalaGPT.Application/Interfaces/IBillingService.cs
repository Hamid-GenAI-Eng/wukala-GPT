using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WukalaGPT.Application.DTOs.Billing;

namespace WukalaGPT.Application.Interfaces;

public interface IBillingService
{
    Task<BillingSummaryDto> GetBillingSummaryAsync(Guid lawyerId);
    Task<List<InvoiceDto>> GetInvoicesAsync(Guid lawyerId, string? status = null, string? search = null);
    Task<InvoiceDto?> GetInvoiceByIdAsync(Guid id, Guid lawyerId);
    Task<InvoiceDto> CreateInvoiceAsync(Guid lawyerId, CreateInvoiceDto dto);
    Task<List<PaymentDto>> GetRecentPaymentsAsync(Guid lawyerId);
    Task<List<RetainerDto>> GetRetainersAsync(Guid lawyerId);
    Task<List<BillingTemplateDto>> GetTemplatesAsync(Guid lawyerId);
}
