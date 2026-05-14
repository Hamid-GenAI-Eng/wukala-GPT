using System;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Features.CaseManagement;

namespace WukalaGPT.Application.Interfaces;

public interface ICaseUpdateService
{
    Task BroadcastTimelineEventAsync(Guid caseId, CaseTimelineEventDto evt, CancellationToken cancellationToken);
}
