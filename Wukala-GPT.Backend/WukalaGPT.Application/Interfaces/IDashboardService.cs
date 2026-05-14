using System;
using System.Threading.Tasks;
using WukalaGPT.Application.DTOs.Dashboard;

namespace WukalaGPT.Application.Interfaces;

public interface IDashboardService
{
    Task<LawyerDashboardOverviewDto> GetLawyerDashboardOverviewAsync(Guid lawyerId);
}
