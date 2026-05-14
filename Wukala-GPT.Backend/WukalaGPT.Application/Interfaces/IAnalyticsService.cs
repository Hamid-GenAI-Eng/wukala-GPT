using System;
using System.Threading.Tasks;
using WukalaGPT.Application.DTOs.Analytics;

namespace WukalaGPT.Application.Interfaces;

public interface IAnalyticsService
{
    Task<PracticeAnalyticsOverviewDto> GetOverviewAsync(Guid firmId, string period = "12m");
    Task<HeatmapDataDto> GetWorkloadHeatmapAsync(Guid firmId);
    Task<ClientAnalyticsDto> GetClientAnalyticsAsync(Guid firmId);
}
