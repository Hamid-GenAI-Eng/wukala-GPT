using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.Features.CaseManagement;

// ----------------------------------------------------
// COMMAND: Link Case
// ----------------------------------------------------
public class LinkCaseCommand : IRequest<bool>
{
    public Guid CaseId { get; set; }
    public Guid RequesterUserId { get; set; }
    public Guid LinkedCaseId { get; set; }
    public string LinkType { get; set; } = "Related";
    public string? Relationship { get; set; }
}

public class LinkCaseCommandHandler : IRequestHandler<LinkCaseCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public LinkCaseCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<bool> Handle(LinkCaseCommand request, CancellationToken cancellationToken)
    {
        if (request.CaseId == request.LinkedCaseId)
            throw new Exception("Cannot link a case to itself.");

        var sourceCase = await _context.LegalCases.FindAsync(new object[] { request.CaseId }, cancellationToken);
        var targetCase = await _context.LegalCases.FindAsync(new object[] { request.LinkedCaseId }, cancellationToken);

        if (sourceCase == null || targetCase == null)
            throw new Exception("One or both cases not found.");

        if (sourceCase.LeadLawyerId != request.RequesterUserId)
            throw new UnauthorizedAccessException("Must be lead lawyer to link cases.");

        var existingLink = await _context.CaseLinks
            .FirstOrDefaultAsync(l => l.CaseId == request.CaseId && l.LinkedCaseId == request.LinkedCaseId, cancellationToken);

        if (existingLink != null) throw new Exception("Link already exists.");

        var rawType = (request.Relationship ?? request.LinkType ?? "Related").Trim().ToLowerInvariant();
        CaseLinkType parsedLinkType;
        if (rawType.Contains("appeal"))
        {
            parsedLinkType = CaseLinkType.Appeal;
        }
        else if (rawType.Contains("split"))
        {
            parsedLinkType = CaseLinkType.SplitFrom;
        }
        else
        {
            parsedLinkType = CaseLinkType.Related;
        }

        var link = new CaseLink
        {
            CaseId = request.CaseId,
            LinkedCaseId = request.LinkedCaseId,
            LinkType = parsedLinkType
        };

        _context.CaseLinks.Add(link);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
