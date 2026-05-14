using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using WukalaGPT.Application.Features.CaseManagement;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.API.Hubs;

public class CaseUpdateService : ICaseUpdateService
{
    private readonly IHubContext<CaseHub> _hubContext;

    public CaseUpdateService(IHubContext<CaseHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task BroadcastTimelineEventAsync(Guid caseId, CaseTimelineEventDto evt, CancellationToken cancellationToken)
    {
        await _hubContext.Clients.Group($"Case_{caseId}").SendAsync("ReceiveTimelineEvent", evt, cancellationToken);
    }
}
