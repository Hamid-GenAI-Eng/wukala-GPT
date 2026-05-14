using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;

namespace WukalaGPT.Application.Features.Clients;

// ------------- DTOs -------------
public class ClientDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string ClientType { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Whatsapp { get; set; }
    public string? City { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public string Status { get; set; } = string.Empty;
    public bool PortalEnabled { get; set; }
    public bool RetentionFlagged { get; set; }
    public DateOnly OnboardedAt { get; set; }
    public int ActiveCasesCount { get; set; }
    public decimal TotalBilled { get; set; }
    public decimal OutstandingBalance { get; set; }
    public DateTimeOffset? LastContactDate { get; set; }
    public string? AcquisitionSource { get; set; }
    public string? Cnic { get; set; }
}

public class ClientDetailDto : ClientDto
{
    public string? Province { get; set; }
    public string? Address { get; set; }
    public string? Notes { get; set; }
    public string? PortalEmail { get; set; }
    public DateTimeOffset? RetentionFlaggedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public ClientStatsDto Stats { get; set; } = new();
}

public class ClientStatsDto
{
    public int ActiveCasesCount { get; set; }
    public int TotalCasesCount { get; set; }
    public decimal TotalBilled { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal OutstandingBalance { get; set; }
    public DateTimeOffset? LastContactDate { get; set; }
    public int TotalInteractions { get; set; }
}

public class PaginatedList<T>
{
    public List<T> Data { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
}

// ------------- 1. GET /clients -------------
public class GetClientsQuery : IRequest<PaginatedList<ClientDto>>
{
    public Guid FirmId { get; set; }
    public string? Search { get; set; }
    public string? Status { get; set; }
    public string? ClientType { get; set; }
    public string[]? Tags { get; set; }
    public bool? RetentionFlagged { get; set; }
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 20;
}

public class GetClientsQueryHandler : IRequestHandler<GetClientsQuery, PaginatedList<ClientDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly IDistributedCache _cache;

    public GetClientsQueryHandler(IApplicationDbContext db, IDistributedCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<PaginatedList<ClientDto>> Handle(GetClientsQuery req, CancellationToken cancellationToken)
    {
        var cacheKey = $"clients:list:{req.FirmId}:{req.Search}_{req.Status}_{req.ClientType}_{req.Page}_{req.Limit}_{req.RetentionFlagged}_{(req.Tags != null ? string.Join(",", req.Tags) : "")}";
        var cachedData = await _cache.GetStringAsync(cacheKey, cancellationToken);
        
        if (!string.IsNullOrEmpty(cachedData))
            return JsonSerializer.Deserialize<PaginatedList<ClientDto>>(cachedData)!;

        var q = _db.Clients.AsNoTracking().Where(c => c.FirmId == req.FirmId && !c.IsArchived);

        if (!string.IsNullOrEmpty(req.Status)) q = q.Where(c => c.Status == req.Status);
        if (!string.IsNullOrEmpty(req.ClientType)) q = q.Where(c => c.ClientType == req.ClientType);
        if (req.RetentionFlagged.HasValue && req.RetentionFlagged.Value) q = q.Where(c => c.RetentionFlagged);
        if (req.Tags != null && req.Tags.Any()) q = q.Where(c => c.Tags.Any(t => req.Tags.Contains(t)));
        
        if (!string.IsNullOrEmpty(req.Search))
        {
            var searchStr = req.Search.ToLower();
            q = q.Where(c => c.FullName.ToLower().Contains(searchStr) || 
                             (c.CompanyName != null && c.CompanyName.ToLower().Contains(searchStr)) || 
                             (c.Cnic != null && c.Cnic.Contains(searchStr)) ||
                             (c.Email != null && c.Email.ToLower().Contains(searchStr)));
        }

        // Hard Scale Limit for 1M+ user protections against massive pagination fetches
        if (req.Limit > 100) req.Limit = 100;
        if (req.Limit < 1) req.Limit = 20;

        var total = await q.CountAsync(cancellationToken);
        
        // Optimize: Bulk load computed fields manually in memory to prevent heavy N+1 evaluations
        var clients = await q.OrderByDescending(c => c.OnboardedAt).Skip((req.Page - 1) * req.Limit).Take(req.Limit).ToListAsync(cancellationToken);
        var clientIds = clients.Select(c => c.Id).ToList();

        var interactions = await _db.ClientInteractions.Where(i => clientIds.Contains(i.ClientId)).GroupBy(i => i.ClientId)
            .Select(g => new { ClientId = g.Key, LastContact = g.Max(i => i.InteractionDate) }).ToDictionaryAsync(x => x.ClientId, x => x.LastContact, cancellationToken);

        var activeCases = await _db.LegalCases.Where(c => c.ClientId.HasValue && clientIds.Contains(c.ClientId.Value) && c.Status != WukalaGPT.Domain.Enums.CaseStatus.Closed)
            .GroupBy(c => c.ClientId!.Value).Select(g => new { ClientId = g.Key, Count = g.Count() }).ToDictionaryAsync(x => x.ClientId, x => x.Count, cancellationToken);

        var result = new PaginatedList<ClientDto>
        {
            Total = total, Page = req.Page, Limit = req.Limit,
            Data = clients.Select(c => new ClientDto
            {
                Id = c.Id, FullName = c.FullName, ClientType = c.ClientType, CompanyName = c.CompanyName, ContactPerson = c.ContactPerson,
                Email = c.Email, Phone = c.Phone, Whatsapp = c.Whatsapp, City = c.City, Tags = c.Tags, Status = c.Status, PortalEnabled = c.PortalEnabled,
                RetentionFlagged = c.RetentionFlagged, OnboardedAt = c.OnboardedAt, AcquisitionSource = c.AcquisitionSource, Cnic = c.Cnic,
                LastContactDate = interactions.GetValueOrDefault(c.Id),
                ActiveCasesCount = activeCases.GetValueOrDefault(c.Id)
            }).ToList()
        };

        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2) }, cancellationToken);
        return result;
    }
}

// ------------- 2. POST /clients -------------
public class CreateClientCommand : IRequest<ClientDto>
{
    public Guid FirmId { get; set; }
    public Guid CreatedById { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string ClientType { get; set; } = "Individual";
    public string? CompanyName { get; set; }
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Whatsapp { get; set; }
    public string? Cnic { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Province { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public string? AcquisitionSource { get; set; }
    public string? Notes { get; set; }
    public bool PortalEnabled { get; set; }
}

public class CreateClientCommandHandler : IRequestHandler<CreateClientCommand, ClientDto>
{
    private readonly IApplicationDbContext _db;
    public CreateClientCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<ClientDto> Handle(CreateClientCommand req, CancellationToken cancellationToken)
    {
        if (req.ClientType == "Corporate" && string.IsNullOrEmpty(req.CompanyName))
            throw new Exception("Corporate clients must specify a Company Name");

        var client = new Client
        {
            FirmId = req.FirmId, CreatedById = req.CreatedById, FullName = req.FullName, ClientType = req.ClientType,
            CompanyName = req.CompanyName, ContactPerson = req.ContactPerson, Email = req.Email, Phone = req.Phone,
            Whatsapp = req.Whatsapp, Cnic = req.Cnic, Address = req.Address, City = req.City, Province = req.Province,
            Tags = req.Tags, AcquisitionSource = req.AcquisitionSource, Notes = req.Notes, PortalEnabled = req.PortalEnabled
        };

        _db.Clients.Add(client);
        await _db.SaveChangesAsync(cancellationToken);
        
        // Assume MediatR Event here: await _mediator.Publish(new ClientCreatedEvent(client.Id));

        return new ClientDto { Id = client.Id, FullName = client.FullName, OnboardedAt = client.OnboardedAt };
    }
}

// Additional handlers (GetCaseDetails, Update, Archive, Stats, Retention) following sequence...
