using System;
using System.Collections.Generic;
using WukalaGPT.Application.DTOs.Billing;

namespace WukalaGPT.Application.DTOs.Dashboard;

public class LawyerDashboardOverviewDto
{
    public DashboardStatsDto Stats { get; set; } = new();
    public List<UrgentItemDto> UrgentItems { get; set; } = new();
    public List<RecentCaseDto> RecentCases { get; set; } = new();
    public List<UpcomingHearingDto> UpcomingHearings { get; set; } = new();
    public List<CaseCategoryDistributionDto> CaseDistribution { get; set; } = new();
    public List<MonthlyRevenueDto> RevenueChart { get; set; } = new();
}

public class DashboardStatsDto
{
    public int ActiveCases { get; set; }
    public int TotalClients { get; set; }
    public int UpcomingHearings { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public string MonthlyRevenueFormatted => $"₨ {MonthlyRevenue:N0}";
    
    // Growth/Comparison placeholders (as per frontend design)
    public double ActiveCasesGrowth { get; set; } = 12.5; 
    public double ClientsGrowth { get; set; } = 8.2;
}

public class UrgentItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty; // critical, high, etc.
    public string Deadline { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // deadline, hearing, payment
}

public class RecentCaseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Client { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string LastUpdate { get; set; } = string.Empty;
}

public class UpcomingHearingDto
{
    public Guid Id { get; set; }
    public string CaseTitle { get; set; } = string.Empty;
    public string Court { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Time { get; set; } = string.Empty;
}

public class CaseCategoryDistributionDto
{
    public string Category { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class MonthlyRevenueDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
