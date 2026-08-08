using System;
using System.Collections.Generic;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.DTOs.Analytics;

public class PracticeAnalyticsOverviewDto
{
    public int ActiveCases { get; set; }
    public decimal WinRate { get; set; } // Percentage e.g. 78.5
    public int TotalDecidedCases { get; set; }
    public double AvgCaseDurationMonths { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public decimal CollectionRate { get; set; } // Percentage
    public int NewClientsThisMonth { get; set; }
    
    public List<RevenueExpenseDataDto> RevenueVsExpenses { get; set; } = new();
    public CaseOutcomesDto CaseOutcomes { get; set; } = new();
    
    // Detailed Analytics properties
    public List<CourtAnalyticsDto> CourtAnalytics { get; set; } = new();
    public List<WinRateByTypeDto> WinRateByType { get; set; } = new();
    public List<PipelineStageDto> PipelineStages { get; set; } = new();
    public RevenueSummaryDto RevenueSummary { get; set; } = new();
    public List<ClientInsightDto> TopPayingClients { get; set; } = new();
}

public class CourtAnalyticsDto
{
    public string Court { get; set; } = string.Empty;
    public int Hearings { get; set; }
    public int Cases { get; set; }
    public string WinRate { get; set; } = string.Empty;
    public string Color { get; set; } = "bg-primary";
}

public class WinRateByTypeDto
{
    public string Type { get; set; } = string.Empty;
    public int Won { get; set; }
    public int Total { get; set; }
    public string Rate { get; set; } = string.Empty;
}

public class PipelineStageDto
{
    public string Stage { get; set; } = string.Empty;
    public int Count { get; set; }
    public string Color { get; set; } = "bg-primary/20 text-primary";
}

public class RevenueSummaryDto
{
    public string YearlyRevenue { get; set; } = string.Empty;
    public string AvgFeePerCase { get; set; } = string.Empty;
    public string CollectionEfficiency { get; set; } = string.Empty;
    public string Outstanding { get; set; } = string.Empty;
}

public class ClientInsightDto
{
    public string Name { get; set; } = string.Empty;
    public int Cases { get; set; }
    public string TotalBilled { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Retention { get; set; } = string.Empty;
}

public class RevenueExpenseDataDto
{
    public string Month { get; set; } = string.Empty; // e.g. "Jul"
    public decimal Revenue { get; set; }
    public decimal Expenses { get; set; }
}

public class CaseOutcomesDto
{
    public int Won { get; set; }
    public int Lost { get; set; }
    public int Settled { get; set; }
    public int Dismissed { get; set; }
}

public class HeatmapDataDto
{
    public List<List<int>> Data { get; set; } = new();
    public int AvgHearingsPerWeek { get; set; }
    public List<BusiestDayDto> BusiestDays { get; set; } = new();
    public CapacityPlanningDto CapacityPlanning { get; set; } = new();
}

public class BusiestDayDto
{
    public string Day { get; set; } = string.Empty;
    public double Avg { get; set; }
    public int Hearings { get; set; }
}

public class CapacityPlanningDto
{
    public string AvailableCapacity { get; set; } = string.Empty;
    public string AvailableCapacitySub { get; set; } = string.Empty;
    public string PeakAlert { get; set; } = string.Empty;
    public string PeakAlertSub { get; set; } = string.Empty;
    public string WeeklyAvg { get; set; } = string.Empty;
    public string WeeklyAvgSub { get; set; } = string.Empty;
}

public class ClientAnalyticsDto
{
    public int TotalClients { get; set; }
    public decimal RetentionRate { get; set; }
    public int NewThisMonth { get; set; }
    public decimal AvgLifetimeValue { get; set; }
    
    public List<ClientInsightDto> ClientPortfolio { get; set; } = new();
    public List<ReferralSourceDto> ReferralSources { get; set; } = new();
}

public class ReferralSourceDto
{
    public string Source { get; set; } = string.Empty;
    public int Count { get; set; }
    public int Pct { get; set; }
}
