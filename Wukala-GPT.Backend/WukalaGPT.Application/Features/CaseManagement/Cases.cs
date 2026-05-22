using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.Features.CaseManagement;

// ---- DTOS ----
public class CaseDto
{
    public Guid Id { get; set; }
    public Guid FirmId { get; set; }
    public Guid LeadLawyerId { get; set; }
    public Guid? ClientId { get; set; }
    public string? ClientNameRaw { get; set; }
    public string? CaseNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? CourtName { get; set; }
    public CaseType CaseType { get; set; }
    public CaseStatus Status { get; set; }
    public CasePriority Priority { get; set; }
    public string? FirNumber { get; set; }
    public DateTime? FilingDate { get; set; }
    public DateOnly? NextDate { get; set; }
    public string? JudgeName { get; set; }
    public string? OpposingCounsel { get; set; }
    public string? Description { get; set; }
    public bool IsArchived { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class PaginatedList<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
}

// ----------------------------------------------------
// QUERY: List Cases (Paginated, Filtered)
// ----------------------------------------------------
public class GetCasesQuery : IRequest<PaginatedList<CaseDto>>
{
    public string? Status { get; set; }
    public string? CaseType { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 20;
    public Guid FirmId { get; set; }
}

public class GetCasesQueryHandler : IRequestHandler<GetCasesQuery, PaginatedList<CaseDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IDistributedCache _cache;

    public GetCasesQueryHandler(IApplicationDbContext context, IDistributedCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<PaginatedList<CaseDto>> Handle(GetCasesQuery request, CancellationToken cancellationToken)
    {
        string cacheKey = $"Cases_Firm_{request.FirmId}_Page_{request.Page}_Limit_{request.Limit}_T_{request.CaseType}_S_{request.Status}_Search_{request.Search}";
        var cachedData = await _cache.GetStringAsync(cacheKey, cancellationToken);
        
        if (!string.IsNullOrEmpty(cachedData))
        {
            return JsonSerializer.Deserialize<PaginatedList<CaseDto>>(cachedData) ?? new PaginatedList<CaseDto>();
        }

        var query = _context.LegalCases.AsNoTracking().Where(c => !c.IsArchived && c.FirmId == request.FirmId);

        if (!string.IsNullOrEmpty(request.Status))
        {
            if (Enum.TryParse<CaseStatus>(request.Status, true, out var status))
                query = query.Where(c => c.Status == status);
        }

        if (!string.IsNullOrEmpty(request.CaseType))
        {
            if (Enum.TryParse<CaseType>(request.CaseType, true, out var cType))
                query = query.Where(c => c.CaseType == cType);
        }

        if (!string.IsNullOrEmpty(request.Search))
        {
            query = query.Where(c => c.Title.Contains(request.Search) ||
                                     c.CaseNumber!.Contains(request.Search) ||
                                     c.ClientNameRaw!.Contains(request.Search));
        }

        var total = await query.CountAsync(cancellationToken);
        
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((request.Page - 1) * request.Limit)
            .Take(request.Limit)
            .Select(c => new CaseDto
            {
                Id = c.Id,
                FirmId = c.FirmId,
                LeadLawyerId = c.LeadLawyerId,
                ClientId = c.ClientId,
                ClientNameRaw = c.ClientNameRaw,
                CaseNumber = c.CaseNumber,
                Title = c.Title,
                CourtName = c.CourtName,
                CaseType = c.CaseType,
                Status = c.Status,
                Priority = c.Priority,
                FirNumber = c.FirNumber,
                FilingDate = c.FilingDate,
                NextDate = c.NextDate,
                JudgeName = c.JudgeName,
                OpposingCounsel = c.OpposingCounsel,
                Description = c.Description,
                IsArchived = c.IsArchived,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        var result = new PaginatedList<CaseDto>
        {
            Items = items,
            TotalCount = total,
            Page = request.Page,
            Limit = request.Limit
        };

        // Cache the response securely for 30 seconds to ensure high data freshness for UI updates
        var cacheOptions = new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30) };
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), cacheOptions, cancellationToken);

        return result;
    }
}

// ----------------------------------------------------
// COMMAND: Create Case
// ----------------------------------------------------
public class CreateCaseCommand : IRequest<CaseDto>
{
    public Guid FirmId { get; set; }
    public Guid LeadLawyerId { get; set; }
    public Guid? ClientId { get; set; }
    public string? ClientNameRaw { get; set; }
    public string? CaseNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? CourtName { get; set; }
    public string CaseType { get; set; } = "Civil";
    public string Priority { get; set; } = "Normal";
    public string? FirNumber { get; set; }
    public DateTime? FilingDate { get; set; }
    public string? JudgeName { get; set; }
    public string? OpposingCounsel { get; set; }
    public string? Description { get; set; }
}

public class CreateCaseCommandHandler : IRequestHandler<CreateCaseCommand, CaseDto>
{
    private readonly IApplicationDbContext _context;

    public CreateCaseCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CaseDto> Handle(CreateCaseCommand request, CancellationToken cancellationToken)
    {
        var caseEntity = new LegalCase
        {
            FirmId = request.FirmId,
            LeadLawyerId = request.LeadLawyerId,
            ClientId = request.ClientId,
            ClientNameRaw = request.ClientNameRaw,
            CaseNumber = request.CaseNumber,
            Title = request.Title,
            CourtName = request.CourtName,
            CaseType = Enum.Parse<CaseType>(request.CaseType, true),
            Priority = Enum.Parse<CasePriority>(request.Priority, true),
            FirNumber = request.FirNumber,
            FilingDate = request.FilingDate,
            JudgeName = request.JudgeName,
            OpposingCounsel = request.OpposingCounsel,
            Description = request.Description,
            Status = CaseStatus.Filed,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.LegalCases.Add(caseEntity);
        await _context.SaveChangesAsync(cancellationToken);

        // Map to DTO
        return new CaseDto
        {
            Id = caseEntity.Id, Title = caseEntity.Title, // ... abbreviated for size
            CreatedAt = caseEntity.CreatedAt
        };
    }
}

// ----------------------------------------------------
// COMMAND: Update Case
// ----------------------------------------------------
public class UpdateCaseCommand : IRequest<CaseDto>
{
    public Guid Id { get; set; }
    public string? Title { get; set; }
    public string? CaseNumber { get; set; }
    public string? FirNumber { get; set; }
    public string? ClientNameRaw { get; set; }
    public string? CourtName { get; set; }
    public string? CaseType { get; set; }
    public string? Priority { get; set; }
    public string? Status { get; set; }
    public string? JudgeName { get; set; }
    public string? OpposingCounsel { get; set; }
    public DateOnly? NextDate { get; set; }
    public DateTime? FilingDate { get; set; }
    public string? Description { get; set; }
}

public class UpdateCaseCommandHandler : IRequestHandler<UpdateCaseCommand, CaseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IMediator _mediator;

    public UpdateCaseCommandHandler(IApplicationDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task<CaseDto> Handle(UpdateCaseCommand request, CancellationToken cancellationToken)
    {
        var caseEntity = await _context.LegalCases.FindAsync(new object[] { request.Id }, cancellationToken);
        if (caseEntity == null) throw new Exception("Case not found");

        if (!string.IsNullOrEmpty(request.Title))
            caseEntity.Title = request.Title;

        if (!string.IsNullOrEmpty(request.CaseNumber))
            caseEntity.CaseNumber = request.CaseNumber;

        if (request.FirNumber != null)
            caseEntity.FirNumber = request.FirNumber;

        if (!string.IsNullOrEmpty(request.ClientNameRaw))
            caseEntity.ClientNameRaw = request.ClientNameRaw;

        if (!string.IsNullOrEmpty(request.CourtName))
            caseEntity.CourtName = request.CourtName;

        if (!string.IsNullOrEmpty(request.CaseType) && Enum.TryParse<CaseType>(request.CaseType, true, out var cType))
            caseEntity.CaseType = cType;

        if (!string.IsNullOrEmpty(request.Priority) && Enum.TryParse<CasePriority>(request.Priority, true, out var cPriority))
            caseEntity.Priority = cPriority;

        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<CaseStatus>(request.Status, true, out var cStatus))
            caseEntity.Status = cStatus;
            
        if (request.JudgeName != null)
            caseEntity.JudgeName = request.JudgeName;

        if (request.OpposingCounsel != null)
            caseEntity.OpposingCounsel = request.OpposingCounsel;
            
        if (request.NextDate.HasValue)
            caseEntity.NextDate = request.NextDate;

        if (request.FilingDate.HasValue)
            caseEntity.FilingDate = request.FilingDate;

        if (request.Description != null)
            caseEntity.Description = request.Description;

        caseEntity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new CaseDto 
        { 
            Id = caseEntity.Id, 
            Title = caseEntity.Title, 
            Status = caseEntity.Status,
            CaseNumber = caseEntity.CaseNumber,
            ClientNameRaw = caseEntity.ClientNameRaw,
            CourtName = caseEntity.CourtName,
            JudgeName = caseEntity.JudgeName,
            OpposingCounsel = caseEntity.OpposingCounsel,
            Description = caseEntity.Description
        };
    }
}

// ----------------------------------------------------
// COMMAND: Archive Case (Soft Delete)
// ----------------------------------------------------
public class ArchiveCaseCommand : IRequest<bool>
{
    public Guid Id { get; set; }
}

public class ArchiveCaseCommandHandler : IRequestHandler<ArchiveCaseCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public ArchiveCaseCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ArchiveCaseCommand request, CancellationToken cancellationToken)
    {
        var caseEntity = await _context.LegalCases.FindAsync(new object[] { request.Id }, cancellationToken);
        if (caseEntity == null) return false;

        caseEntity.IsArchived = true;
        caseEntity.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
