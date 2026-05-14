using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace WukalaGPT.API.Hubs;

[Authorize]
public class CaseHub : Hub
{
    // Clients connect taking a specific string matching caseId
    public async Task JoinCaseGroup(Guid caseId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Case_{caseId}");
    }

    public async Task LeaveCaseGroup(Guid caseId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Case_{caseId}");
    }
}
