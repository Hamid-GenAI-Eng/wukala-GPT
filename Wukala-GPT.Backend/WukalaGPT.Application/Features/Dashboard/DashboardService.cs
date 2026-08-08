using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WukalaGPT.Application.DTOs.Dashboard;
using WukalaGPT.Application.Interfaces;

namespace WukalaGPT.Application.Features.Dashboard;

public class DashboardService : IDashboardService
{
    private readonly IApplicationDbContext _context;

    public DashboardService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<LawyerDashboardOverviewDto> GetLawyerDashboardOverviewAsync(Guid lawyerId)
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var dateNow = DateOnly.FromDateTime(now);

        // 1. Stats
        var activeCasesCount = await _context.LegalCases.AsNoTracking()
            .CountAsync(c => c.LeadLawyerId == lawyerId && c.Status != WukalaGPT.Domain.Enums.CaseStatus.Closed && !c.IsArchived);

        var totalClientsCount = await _context.Clients.AsNoTracking()
            .CountAsync(c => c.LawyerId == lawyerId);

        var upcomingHearingsCount = await _context.Hearings.AsNoTracking()
            .CountAsync(h => h.LeadLawyerId == lawyerId && h.HearingDate >= dateNow && h.Status == "Scheduled");

        var monthlyRevenue = await _context.Payments.AsNoTracking()
            .Where(p => p.Invoice.LawyerId == lawyerId && p.PaymentDate >= startOfMonth && p.Status == "Completed")
            .SumAsync(p => p.Amount);

        // 2. Urgent Items (Notifications with High/Critical priority + Deadlines)
        var urgentNotificationsRaw = await _context.AppNotifications.AsNoTracking()
            .Where(n => n.UserId == lawyerId && !n.IsRead && (n.Priority == "critical" || n.Priority == "high"))
            .OrderByDescending(n => n.CreatedAt)
            .Take(5)
            .Select(n => new
            {
                n.Id,
                n.Title,
                n.Description,
                n.Priority,
                n.CreatedAt,
                n.Type
            })
            .ToListAsync();

        var urgentNotifications = urgentNotificationsRaw.Select(n => new UrgentItemDto
        {
            Id = n.Id,
            Title = n.Title,
            Description = n.Description,
            Priority = n.Priority,
            Deadline = GetTimeAgo(n.CreatedAt),
            Type = n.Type
        }).ToList();

        // 3. Recent Cases
        var recentCasesRaw = await _context.LegalCases.AsNoTracking()
            .Include(c => c.Client)
            .Where(c => c.LeadLawyerId == lawyerId && !c.IsArchived)
            .OrderByDescending(c => c.CreatedAt)
            .Take(5)
            .Select(c => new
            {
                c.Id,
                c.Title,
                ClientName = c.Client != null ? c.Client.FullName : "Unknown Client",
                c.Status
            })
            .ToListAsync();

        var recentCases = recentCasesRaw.Select(c => new RecentCaseDto
        {
            Id = c.Id,
            Title = c.Title,
            Client = c.ClientName,
            Status = c.Status.ToString(),
            LastUpdate = "Recently added"
        }).ToList();

        // 4. Upcoming Hearings
        var upcomingHearingsRaw = await _context.Hearings.AsNoTracking()
            .Include(h => h.Case)
            .Where(h => h.LeadLawyerId == lawyerId && h.HearingDate >= dateNow && h.Status == "Scheduled" && (h.Case == null || !h.Case.IsArchived))
            .OrderBy(h => h.HearingDate)
            .Take(5)
            .Select(h => new
            {
                h.Id,
                Court = h.CourtName,
                h.HearingDate,
                h.StartTime
            })
            .ToListAsync();

        var upcomingHearings = upcomingHearingsRaw.Select(h => new UpcomingHearingDto
        {
            Id = h.Id,
            CaseTitle = "Case Hearing", // Ideally join with Case title if exists
            Court = h.Court ?? "Local Court",
            Date = h.HearingDate.ToDateTime(TimeOnly.MinValue),
            Time = h.StartTime.ToString("hh:mm tt")
         }).ToList();

        // 5. Case Distribution (Mocked logic based on status for now)
        var distribution = new List<CaseCategoryDistributionDto>
        {
            new() { Category = "Civil", Count = 45, Percentage = 45 },
            new() { Category = "Criminal", Count = 25, Percentage = 25 },
            new() { Category = "Corporate", Count = 20, Percentage = 20 },
            new() { Category = "Family", Count = 10, Percentage = 10 }
        };

        // 6. Revenue Chart (Last 6 months)
        var revenueChart = new List<MonthlyRevenueDto>();
        for (int i = 5; i >= 0; i--)
        {
            var monthDate = startOfMonth.AddMonths(-i);
            var endOfMonth = monthDate.AddMonths(1);
            var monthRevenue = await _context.Payments
                .Where(p => p.Invoice.LawyerId == lawyerId && p.PaymentDate >= monthDate && p.PaymentDate < endOfMonth && p.Status == "Completed")
                .SumAsync(p => p.Amount);

            revenueChart.Add(new MonthlyRevenueDto
            {
                Month = monthDate.ToString("MMM"),
                Amount = monthRevenue
            });
        }

        return new LawyerDashboardOverviewDto
        {
            Stats = new DashboardStatsDto
            {
                ActiveCases = activeCasesCount,
                TotalClients = totalClientsCount,
                UpcomingHearings = upcomingHearingsCount,
                MonthlyRevenue = monthlyRevenue
            },
            UrgentItems = urgentNotifications,
            RecentCases = recentCases,
            UpcomingHearings = upcomingHearings,
            CaseDistribution = distribution,
            RevenueChart = revenueChart
        };
    }

    private string GetTimeAgo(DateTimeOffset dateTime)
    {
        var span = DateTimeOffset.UtcNow - dateTime;
        if (span.TotalMinutes < 1) return "just now";
        if (span.TotalHours < 1) return $"{(int)span.TotalMinutes}m ago";
        if (span.TotalDays < 1) return $"{(int)span.TotalHours}h ago";
        return $"{(int)span.TotalDays}d ago";
    }
}
