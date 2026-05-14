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
            .Where(c => c.FirmId == firmId)
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
        
        var monthlyRevenue = await _context.Payments.AsNoTracking()
            .Where(p => p.Invoice.Lawyer.FirmId == firmId && p.PaymentDate >= startOfMonth && p.Status == "Completed")
            .SumAsync(p => p.Amount);

        var totalInvoicedThisMonth = await _context.Invoices.AsNoTracking()
            .Where(i => i.Lawyer.FirmId == firmId && i.DateIssued >= startOfMonth)
            .SumAsync(i => i.Amount);

        var collectionRate = totalInvoicedThisMonth > 0 ? Math.Round(monthlyRevenue / totalInvoicedThisMonth * 100, 1) : 0;

        var newClients = await _context.Clients.AsNoTracking()
            .CountAsync(c => c.FirmId == firmId && c.CreatedAt >= startOfMonth);

        // Revenue vs Expenses logic
        var pastMonthsList = Enumerable.Range(0, 12)
            .Select(i => now.AddMonths(-i))
            .OrderBy(d => d)
            .ToList();

        var revenueVsExpenses = new List<RevenueExpenseDataDto>();

        var payments = await _context.Payments.AsNoTracking()
            .Where(p => p.Invoice.Lawyer.FirmId == firmId && p.PaymentDate >= startDate && p.Status == "Completed")
            .ToListAsync();

        var expenses = await _context.FirmExpenses.AsNoTracking()
            .Where(e => e.FirmId == firmId && e.ExpenseDate >= startDate)
            .ToListAsync();

        foreach (var m in pastMonthsList)
        {
            var rev = payments.Where(p => p.PaymentDate.Year == m.Year && p.PaymentDate.Month == m.Month).Sum(p => p.Amount);
            var exp = expenses.Where(e => e.ExpenseDate.Year == m.Year && e.ExpenseDate.Month == m.Month).Sum(e => e.Amount);

            revenueVsExpenses.Add(new RevenueExpenseDataDto
            {
                Month = m.ToString("MMM"),
                Revenue = rev,
                Expenses = exp
            });
        }

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
            }
        };
    }

    public async Task<ClientAnalyticsDto> GetClientAnalyticsAsync(Guid firmId)
    {
        var totalClients = await _context.Clients.AsNoTracking().CountAsync(c => c.FirmId == firmId);
        
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        
        var newThisMonth = await _context.Clients.AsNoTracking().CountAsync(c => c.FirmId == firmId && c.CreatedAt >= startOfMonth);

        // Retention Rate based on Clients who have multiple cases or are actively engaged vs total
        var clientsWithCases = await _context.LegalCases.AsNoTracking()
            .Where(c => c.FirmId == firmId && c.ClientId != null)
            .GroupBy(c => c.ClientId)
            .Select(g => new { ClientId = g.Key, CaseCount = g.Count() })
            .ToListAsync();
            
        var multiCaseClients = clientsWithCases.Count(c => c.CaseCount > 1);
        var retentionRate = totalClients > 0 ? Math.Round((decimal)multiCaseClients / totalClients * 100, 1) : 100m;

        // Average Lifetime Value per Client
        var totalPayments = await _context.Payments.AsNoTracking()
            .Where(p => p.Invoice.Lawyer.FirmId == firmId && p.Status == "Completed")
            .SumAsync(p => p.Amount);
            
        var avgLifetimeValue = totalClients > 0 ? Math.Round(totalPayments / totalClients, 2) : 0m;

        return new ClientAnalyticsDto
        {
            TotalClients = totalClients,
            RetentionRate = retentionRate,
            NewThisMonth = newThisMonth,
            AvgLifetimeValue = avgLifetimeValue
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

        return new HeatmapDataDto
        {
            Data = data,
            AvgHearingsPerWeek = hearings.Count / 12
        };
    }
}
