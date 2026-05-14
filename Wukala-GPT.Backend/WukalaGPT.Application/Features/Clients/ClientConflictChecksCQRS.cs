using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;

namespace WukalaGPT.Application.Features.Clients;

public class ConflictCheckDto
{
    public Guid CheckId { get; set; }
    public string Result { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public JsonDocument? MatchedClients { get; set; }
    public JsonDocument? MatchedCases { get; set; }
}

public class RunConflictCheckCommand : IRequest<ConflictCheckDto>
{
    public Guid FirmId { get; set; }
    public Guid CheckedById { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? ClientCnic { get; set; }
    public string? OpposingParty { get; set; }
}

public class RunConflictCheckCommandHandler : IRequestHandler<RunConflictCheckCommand, ConflictCheckDto>
{
    private readonly IApplicationDbContext _db;
    public RunConflictCheckCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<ConflictCheckDto> Handle(RunConflictCheckCommand req, CancellationToken cancellationToken)
    {
        // 1. Check Clients
        var matchedClientsQuery = _db.Clients.Where(c => c.FirmId == req.FirmId && !c.IsArchived);
        var nameMatchStr = req.ClientName.ToLower();
        var clientMatches = await matchedClientsQuery.Where(c => 
            c.FullName.ToLower().Contains(nameMatchStr) || 
            (req.ClientCnic != null && c.Cnic == req.ClientCnic)
        ).Select(c => new { c.Id, c.FullName, c.Cnic, c.Status }).ToListAsync(cancellationToken);

        // 2. Check Cases
        var caseMatches = new List<dynamic>();
        if (!string.IsNullOrEmpty(req.OpposingParty))
        {
            var opStr = req.OpposingParty.ToLower();
            caseMatches = await _db.LegalCases.Where(c => c.FirmId == req.FirmId && !c.IsArchived &&
                (c.OpposingCounsel!.ToLower().Contains(nameMatchStr) || 
                 c.OpposingCounsel.ToLower().Contains(opStr) || 
                 c.Title.ToLower().Contains(opStr))
            ).Select(c => new { c.Id, CaseNumber = c.CaseNumber ?? "", c.Title, c.OpposingCounsel }).ToListAsync<dynamic>(cancellationToken);
        }

        // 3. Evaluate Rule
        var result = "Clear";
        var risk = "None";
        var summary = "No conflicts found.";

        if (clientMatches.Any(c => c.Cnic == req.ClientCnic)) { result = "Conflict"; risk = "High"; summary = "Direct CNIC match found in database."; }
        else if (caseMatches.Any()) { result = "Conflict"; risk = "High"; summary = "Name match in active case opponent."; }
        else if (clientMatches.Any()) { result = "NeedsReview"; risk = "Medium"; summary = "Fuzzy match in clients."; }

        var conflictLog = new ConflictCheck
        {
            FirmId = req.FirmId, CheckedById = req.CheckedById, ClientName = req.ClientName, ClientCnic = req.ClientCnic, OpposingParty = req.OpposingParty,
            Result = result, RiskLevel = risk, Notes = summary,
            MatchedClients = JsonSerializer.SerializeToDocument(clientMatches),
            MatchedCases = JsonSerializer.SerializeToDocument(caseMatches)
        };

        _db.ConflictChecks.Add(conflictLog);
        await _db.SaveChangesAsync(cancellationToken);

        return new ConflictCheckDto { CheckId = conflictLog.Id, Result = result, RiskLevel = risk, Summary = summary, MatchedClients = conflictLog.MatchedClients, MatchedCases = conflictLog.MatchedCases };
    }
}
