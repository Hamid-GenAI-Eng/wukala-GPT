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
    // Maps to [weekIndex][dayIndex] -> intensity (0-4)
    public List<List<int>> Data { get; set; } = new();
    public int AvgHearingsPerWeek { get; set; }
}

// Additional DTOs for the Analytics page structure
public class ClientAnalyticsDto
{
    public int TotalClients { get; set; }
    public decimal RetentionRate { get; set; }
    public int NewThisMonth { get; set; }
    public decimal AvgLifetimeValue { get; set; }
}
