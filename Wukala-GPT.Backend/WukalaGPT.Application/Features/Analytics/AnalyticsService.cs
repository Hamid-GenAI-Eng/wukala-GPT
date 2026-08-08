using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WukalaGPT.Application.DTOs.Analytics;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Application.Features.Analytics;

public class AnalyticsService : IAnalyticsService
{
    private readonly IApplicationDbContext _context;

    public AnalyticsService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PracticeAnalyticsOverviewDto> GetOverviewAsync(Guid firmId, string period = "12m")
    {
        var now = DateTime.UtcNow;
        var startDate = period switch
        {
            "3m" => now.AddMonths(-3),
            "6m" => now.AddMonths(-6),
            _ => now.AddMonths(-12)
        };

        var allCases = await _context.LegalCases.AsNoTracking()
            .Include(c => c.Client)
            .Where(c => c.FirmId == firmId && !c.IsArchived)
            .ToListAsync();

        var activeCases = allCases.Count(c => c.Status != CaseStatus.Closed);
        var decidedCases = allCases.Count(c => c.Outcome != CaseOutcome.None);
        var wonCases = allCases.Count(c => c.Outcome == CaseOutcome.Won);

        var winRate = decidedCases > 0 ? Math.Round((decimal)wonCases / decidedCases * 100, 1) : 0;

        var closedCases = allCases.Where(c => c.Status == CaseStatus.Closed).ToList();
        var avgDuration = closedCases.Any() 
            ? Math.Round(closedCases.Average(c => (c.UpdatedAt - c.CreatedAt).TotalDays / 30.44), 1)
            : 0.0; 

        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        
        var allPayments = await _context.Payments.AsNoTracking()
            .Include(p => p.Invoice)
            .ThenInclude(i => i.Client)
            .Where(p => p.Invoice.Lawyer.FirmId == firmId && p.Status == "Completed")
            .ToListAsync();
            
        var monthlyRevenue = allPayments.Where(p => p.PaymentDate >= startOfMonth).Sum(p => p.Amount);

        var allInvoices = await _context.Invoices.AsNoTracking()
            .Where(i => i.Lawyer.FirmId == firmId)
            .ToListAsync();

        var totalInvoicedThisMonth = allInvoices.Where(i => i.DateIssued >= startOfMonth).Sum(i => i.Amount);

        var collectionRate = totalInvoicedThisMonth > 0 ? Math.Round(monthlyRevenue / totalInvoicedThisMonth * 100, 1) : 0;

        var newClients = await _context.Clients.AsNoTracking()
            .CountAsync(c => c.FirmId == firmId && c.CreatedAt >= startOfMonth);

        // Revenue vs Expenses logic
        var pastMonthsList = Enumerable.Range(0, 12)
            .Select(i => now.AddMonths(-i))
            .OrderBy(d => d)
            .ToList();

        var revenueVsExpenses = new List<RevenueExpenseDataDto>();
        var expenses = await _context.FirmExpenses.AsNoTracking()
            .Where(e => e.FirmId == firmId && e.ExpenseDate >= startDate)
            .ToListAsync();

        foreach (var m in pastMonthsList)
        {
            var rev = allPayments.Where(p => p.PaymentDate >= startDate && p.PaymentDate.Year == m.Year && p.PaymentDate.Month == m.Month).Sum(p => p.Amount);
            var exp = expenses.Where(e => e.ExpenseDate.Year == m.Year && e.ExpenseDate.Month == m.Month).Sum(e => e.Amount);

            revenueVsExpenses.Add(new RevenueExpenseDataDto { Month = m.ToString("MMM"), Revenue = rev, Expenses = exp });
        }

        // Court Analytics
        var courtColors = new[] { "bg-primary", "bg-success", "bg-destructive", "bg-gold", "bg-primary-muted" };
        var caseIds = allCases.Select(c => c.Id).ToList();
        var allHearings = await _context.Hearings.AsNoTracking().Where(h => caseIds.Contains(h.CaseId)).ToListAsync();
        
        var courtAnalytics = allCases.Where(c => !string.IsNullOrEmpty(c.CourtName))
            .GroupBy(c => c.CourtName!)
            .Select((g, i) => {
                var courtCases = g.ToList();
                var courtDecided = courtCases.Count(c => c.Outcome != CaseOutcome.None);
                var courtWon = courtCases.Count(c => c.Outcome == CaseOutcome.Won);
                var cWinRate = courtDecided > 0 ? Math.Round((decimal)courtWon / courtDecided * 100, 0) : 0;
                var cHearings = allHearings.Count(h => courtCases.Select(cc => cc.Id).Contains(h.CaseId));
                
                return new CourtAnalyticsDto
                {
                    Court = g.Key,
                    Cases = courtCases.Count,
                    Hearings = cHearings,
                    WinRate = $"{cWinRate}%",
                    Color = courtColors[i % courtColors.Length]
                };
            }).OrderByDescending(c => c.Cases).Take(5).ToList();

        // Win Rate By Type
        var winRateByType = allCases.GroupBy(c => c.CaseType.ToString())
            .Select(g => {
                var tCases = g.ToList();
                var tDecided = tCases.Count(c => c.Outcome != CaseOutcome.None);
                var tWon = tCases.Count(c => c.Outcome == CaseOutcome.Won);
                var tWinRate = tDecided > 0 ? Math.Round((decimal)tWon / tDecided * 100, 0) : 0;
                return new WinRateByTypeDto { Type = g.Key, Won = tWon, Total = tCases.Count, Rate = $"{tWinRate}%" };
            }).OrderByDescending(w => w.Total).Take(5).ToList();

        // Pipeline Stages
        var pipelineStages = new List<PipelineStageDto>
        {
            new PipelineStageDto { Stage = "Filed", Count = allCases.Count(c => c.Status == CaseStatus.Filed), Color = "bg-primary/20 text-primary" },
            new PipelineStageDto { Stage = "Heard", Count = allCases.Count(c => c.Status == CaseStatus.Heard), Color = "bg-gold/20 text-gold" },
            new PipelineStageDto { Stage = "Reserved", Count = allCases.Count(c => c.Status == CaseStatus.Reserved), Color = "bg-warning/20 text-warning" },
            new PipelineStageDto { Stage = "Closed", Count = allCases.Count(c => c.Status == CaseStatus.Closed), Color = "bg-success/20 text-success" },
            new PipelineStageDto { Stage = "Appeal", Count = allCases.Count(c => c.Status == CaseStatus.Appeal), Color = "bg-destructive/20 text-destructive" }
        };

        // Revenue Summary
        var yearlyRev = allPayments.Where(p => p.PaymentDate >= now.AddYears(-1)).Sum(p => p.Amount);
        var totalEverRev = allPayments.Sum(p => p.Amount);
        var totalEverInv = allInvoices.Sum(i => i.Amount);
        var outstanding = totalEverInv - totalEverRev;
        var avgFee = allCases.Any() ? totalEverInv / allCases.Count : 0;
        var collEff = totalEverInv > 0 ? Math.Round(totalEverRev / totalEverInv * 100, 1) : 0;

        var revSummary = new RevenueSummaryDto
        {
            YearlyRevenue = $"₨ {(yearlyRev / 1000000).ToString("0.0")}M",
            AvgFeePerCase = $"₨ {(avgFee / 1000000).ToString("0.0")}M",
            CollectionEfficiency = $"{collEff}%",
            Outstanding = $"₨ {(outstanding / 1000000).ToString("0.0")}M"
        };

        // Top Paying Clients
        var topClients = allPayments.Where(p => p.Invoice.Client != null)
            .GroupBy(p => new { p.Invoice.ClientId, p.Invoice.Client!.FullName, p.Invoice.Client.CreatedAt })
            .Select(g => new ClientInsightDto
            {
                Name = g.Key.FullName,
                TotalBilled = $"₨ {(g.Sum(p => p.Amount) / 1000000).ToString("0.0")}M",
                Cases = allCases.Count(c => c.ClientId == g.Key.ClientId),
                Status = g.Key.CreatedAt >= now.AddMonths(-3) ? "New" : "Active",
                Retention = $"{(now - g.Key.CreatedAt).Days / 365} years"
            }).OrderByDescending(c => decimal.Parse(c.TotalBilled.Replace("₨ ", "").Replace("M", ""))).Take(5).ToList();

        return new PracticeAnalyticsOverviewDto
        {
            ActiveCases = activeCases,
            WinRate = winRate,
            TotalDecidedCases = decidedCases,
            AvgCaseDurationMonths = avgDuration,
            MonthlyRevenue = monthlyRevenue,
            CollectionRate = collectionRate,
            NewClientsThisMonth = newClients,
            RevenueVsExpenses = revenueVsExpenses,
            CaseOutcomes = new CaseOutcomesDto
            {
                Won = wonCases,
                Lost = allCases.Count(c => c.Outcome == CaseOutcome.Lost),
                Settled = allCases.Count(c => c.Outcome == CaseOutcome.Settled),
                Dismissed = allCases.Count(c => c.Outcome == CaseOutcome.Dismissed)
            },
            CourtAnalytics = courtAnalytics,
            WinRateByType = winRateByType,
            PipelineStages = pipelineStages,
            RevenueSummary = revSummary,
            TopPayingClients = topClients
        };
    }

    public async Task<ClientAnalyticsDto> GetClientAnalyticsAsync(Guid firmId)
    {
        var clients = await _context.Clients.AsNoTracking().Where(c => c.FirmId == firmId).ToListAsync();
        var totalClients = clients.Count;
        
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        
        var newThisMonth = clients.Count(c => c.CreatedAt >= startOfMonth);

        var allCases = await _context.LegalCases.AsNoTracking().Where(c => c.FirmId == firmId).ToListAsync();
        var allPayments = await _context.Payments.AsNoTracking()
            .Include(p => p.Invoice)
            .Where(p => p.Invoice.Lawyer.FirmId == firmId && p.Status == "Completed")
            .ToListAsync();

        var clientsWithCases = allCases.Where(c => c.ClientId != null)
            .GroupBy(c => c.ClientId)
            .Select(g => new { ClientId = g.Key, CaseCount = g.Count() })
            .ToList();
            
        var multiCaseClients = clientsWithCases.Count(c => c.CaseCount > 1);
        var retentionRate = totalClients > 0 ? Math.Round((decimal)multiCaseClients / totalClients * 100, 1) : 100m;

        var totalPayments = allPayments.Sum(p => p.Amount);
        var avgLifetimeValue = totalClients > 0 ? Math.Round(totalPayments / totalClients, 2) : 0m;

        var clientPortfolio = clients.Select(c => {
            var cCases = allCases.Count(lc => lc.ClientId == c.Id);
            var cPayments = allPayments.Where(p => p.Invoice.ClientId == c.Id).Sum(p => p.Amount);
            return new ClientInsightDto
            {
                Name = c.FullName,
                Cases = cCases,
                TotalBilled = $"₨ {(cPayments / 1000000).ToString("0.0")}M",
                Status = c.CreatedAt >= now.AddMonths(-3) ? "New" : "Active",
                Retention = $"{(now - c.CreatedAt).Days / 365} years"
            };
        }).OrderByDescending(c => decimal.Parse(c.TotalBilled.Replace("₨ ", "").Replace("M", ""))).Take(10).ToList();

        var referralSources = clients.GroupBy(c => c.AcquisitionSource ?? "Walk-in")
            .Select(g => new ReferralSourceDto
            {
                Source = g.Key,
                Count = g.Count(),
                Pct = totalClients > 0 ? (int)Math.Round((double)g.Count() / totalClients * 100) : 0
            }).OrderByDescending(r => r.Count).ToList();

        return new ClientAnalyticsDto
        {
            TotalClients = totalClients,
            RetentionRate = retentionRate,
            NewThisMonth = newThisMonth,
            AvgLifetimeValue = avgLifetimeValue,
            ClientPortfolio = clientPortfolio,
            ReferralSources = referralSources
        };
    }

    public async Task<HeatmapDataDto> GetWorkloadHeatmapAsync(Guid firmId)
    {
        var now = DateTime.UtcNow;
        var startOfToday = now.Date;
        var startOf12WeeksAgo = startOfToday.AddDays(-(12 * 7));

        // Fetch events over the last 12 weeks
        var hearings = await _context.Hearings.AsNoTracking()
            .Where(h => h.FirmId == firmId && h.HearingDate >= DateOnly.FromDateTime(startOf12WeeksAgo))
            .Select(h => h.HearingDate)
            .ToListAsync();

        var tasks = await _context.StaffTasks.AsNoTracking()
            .Where(t => t.FirmId == firmId && t.DueDate >= startOf12WeeksAgo)
            .Select(t => t.DueDate.Date)
            .ToListAsync();

        var activityLogs = await _context.FirmActivityLogs.AsNoTracking()
            .Where(a => a.FirmId == firmId && a.CreatedAt >= startOf12WeeksAgo)
            .Select(a => a.CreatedAt.Date)
            .ToListAsync();

        // Aggregate daily load
        var dailyFrequency = new Dictionary<DateTime, int>();

        var currentDate = startOf12WeeksAgo;
        while (currentDate <= startOfToday)
        {
            dailyFrequency[currentDate] = 0;
            currentDate = currentDate.AddDays(1);
        }

        foreach (var h in hearings)
        {
            var date = new DateTime(h.Year, h.Month, h.Day);
            if (dailyFrequency.ContainsKey(date)) dailyFrequency[date] += 2; // Hearings weight more
        }

        foreach (var t in tasks)
        {
            if (dailyFrequency.ContainsKey(t)) dailyFrequency[t] += 1;
        }

        foreach (var a in activityLogs)
        {
            if (dailyFrequency.ContainsKey(a)) dailyFrequency[a] += 1;
        }

        // Build Heatmap 12 weeks x 7 days
        var data = new List<List<int>>();
        var dayMap = dailyFrequency.OrderBy(k => k.Key).Select(k => k.Value).ToList();
        int sum = 0;

        for (int w = 0; w < 12; w++)
        {
            var weekScore = new List<int>();
            for (int d = 0; d < 7; d++)
            {
                int index = (w * 7) + d;
                int count = index < dayMap.Count ? dayMap[index] : 0;
                
                // cap intensity visually up to 4
                int intensity = count == 0 ? 0 : (count < 3 ? 1 : count < 6 ? 2 : count < 10 ? 3 : 4);
                weekScore.Add(intensity);
                sum += (count > 0 && d != 0 && d != 6) ? 1 : 0; // count active weekdays for average
            }
            data.Add(weekScore);
        }

        var daysOfWeek = new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday };
        var busiestDays = daysOfWeek.Select(day => {
            var allForDay = dailyFrequency.Where(kvp => kvp.Key.DayOfWeek == day).Select(kvp => kvp.Value).ToList();
            var avg = allForDay.Any() ? Math.Round(allForDay.Average(), 1) : 0;
            var total = allForDay.Sum();
            return new BusiestDayDto { Day = day.ToString(), Avg = avg, Hearings = total };
        }).OrderByDescending(d => d.Avg).ToList();

        // Capacity Planning Heuristic
        var nextWeekEnd = startOfToday.AddDays(7);
        var futureHearings = await _context.Hearings.AsNoTracking()
            .CountAsync(h => h.FirmId == firmId && h.HearingDate >= DateOnly.FromDateTime(startOfToday) && h.HearingDate <= DateOnly.FromDateTime(nextWeekEnd));
            
        var futureTasks = await _context.StaffTasks.AsNoTracking()
            .CountAsync(t => t.FirmId == firmId && t.DueDate >= startOfToday && t.DueDate <= nextWeekEnd);

        var estimatedHoursUsed = (futureHearings * 2) + (futureTasks * 1);
        var standardCapacityHours = 40;
        var availableCapacity = Math.Max(0, standardCapacityHours - estimatedHoursUsed);

        var avgHearingsPerWeek = hearings.Count / 12;

        return new HeatmapDataDto
        {
            Data = data,
            AvgHearingsPerWeek = avgHearingsPerWeek,
            BusiestDays = busiestDays,
            CapacityPlanning = new CapacityPlanningDto
            {
                AvailableCapacity = "Available Capacity",
                AvailableCapacitySub = $"You have ~{availableCapacity} hours free this week for new consultations",
                PeakAlert = "Weekly Workload Insight",
                PeakAlertSub = estimatedHoursUsed > 30 ? "Heavy workload week ahead. Consider delegating tasks." : "Workload is manageable. Good time to onboard new clients.",
                WeeklyAvg = "Weekly Avg.",
                WeeklyAvgSub = $"{avgHearingsPerWeek} hearings/week average"
            }
        };
    }
}
