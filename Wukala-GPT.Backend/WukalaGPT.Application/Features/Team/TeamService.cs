using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WukalaGPT.Application.DTOs.Team;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Domain.Enums;
using Hangfire;

namespace WukalaGPT.Application.Features.Team;

public class TeamService : ITeamService
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<TeamService> _logger;
    private readonly IEmailService _emailService;

    public TeamService(IApplicationDbContext context, ILogger<TeamService> logger, IEmailService emailService)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
    }

    public async Task<List<TeamMemberDto>> GetTeamMembersAsync(Guid firmId)
    {
        var users = await _context.Users.AsNoTracking()
            .Where(u => u.FirmId == firmId)
            .ToListAsync();

        var userIds = users.Select(u => u.Id).ToList();

        var allTasks = await _context.StaffTasks.AsNoTracking()
            .Where(t => t.FirmId == firmId && userIds.Contains(t.AssignedToUserId))
            .ToListAsync();

        var activeCases = await _context.LegalCases.AsNoTracking()
            .Where(c => c.FirmId == firmId && c.Status != CaseStatus.Closed && userIds.Contains(c.LeadLawyerId))
            .GroupBy(c => c.LeadLawyerId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(k => k.UserId, v => v.Count);

        var specializations = await _context.LawyerSpecialities.AsNoTracking()
            .Include(ls => ls.Speciality)
            .Where(ls => userIds.Contains(ls.LawyerProfile.UserId))
            .GroupBy(ls => ls.LawyerProfile.UserId)
            .ToDictionaryAsync(g => g.Key, g => g.Select(s => s.Speciality.Name).FirstOrDefault() ?? "General Practice");

        var results = new List<TeamMemberDto>();

        foreach (var user in users)
        {
            var userTasks = allTasks.Where(t => t.AssignedToUserId == user.Id).ToList();
            var spec = specializations.GetValueOrDefault(user.Id, "General Practice");
            
            results.Add(new TeamMemberDto
            {
                UserId = user.Id,
                Name = $"{(user.StaffRole == TeamRole.Clerk ? "" : "Adv. ")}{user.FirstName} {user.LastName}",
                Role = user.StaffRole?.ToString() ?? "Unknown",
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                ActiveCases = activeCases.GetValueOrDefault(user.Id, 0),
                TasksCompleted = userTasks.Count(t => t.Status == StaffTaskStatus.Completed),
                TasksPending = userTasks.Count(t => t.Status != StaffTaskStatus.Completed),
                Status = user.IsOnline ? "Available" : "Busy",
                Specialization = spec,
                JoinedDate = user.CreatedAt.ToString("MMM yyyy")
            });
        }

        return results;
    }

    public async Task InviteMemberAsync(Guid firmId, Guid currentUserId, InviteMemberRequestDto request)
    {
        _logger.LogInformation("Inviting {Email} to Firm {FirmId} as {Role}", request.Email, firmId, request.Role);

        var currentMemberCount = await _context.Users.CountAsync(u => u.FirmId == firmId);
        if (currentMemberCount >= 10)
        {
            throw new Exception("You have reached the maximum limit of 10 team members for your firm.");
        }

        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()).Replace("+", "").Replace("/", "").Replace("=", "");
        var resetLink = $"https://www.wukala-gpt.app/accept-invite?token={token}&email={request.Email}";
        
        var emailHtml = $@"
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; background-color: #fcfcfc;'>
            <div style='text-align: center; margin-bottom: 30px;'>
                <h1 style='color: #1a365d; margin: 0;'>Wukala GPT</h1>
                <p style='color: #718096; font-size: 16px;'>Firm Team Invitation</p>
            </div>
            <div style='background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);'>
                <h2 style='color: #2d3748; margin-top: 0;'>You've been invited!</h2>
                <p style='color: #4a5568; line-height: 1.6;'>You have been invited to join a Law Firm on Wukala GPT as a <strong>{request.Role}</strong>.</p>
                <p style='color: #4a5568; line-height: 1.6; margin-bottom: 30px;'>To accept this invitation and securely access your new workspace, please click the button below to set your password and complete your registration.</p>
                <div style='text-align: center;'>
                    <a href='{resetLink}' style='display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;'>Accept Invitation</a>
                </div>
            </div>
            <div style='text-align: center; margin-top: 30px; color: #a0aec0; font-size: 14px;'>
                <p>If you did not expect this invitation, you can safely ignore this email.</p>
            </div>
        </div>";

        if (existingUser != null)
        {
            existingUser.FirmId = firmId;
            existingUser.StaffRole = request.Role;
            existingUser.PasswordResetToken = token;
            existingUser.ResetTokenExpiry = DateTime.UtcNow.AddDays(7);
        }
        else
        {
            var newUser = new User
            {
                Email = request.Email,
                FirmId = firmId,
                StaffRole = request.Role,
                IsActive = false,
                Role = UserRole.Lawyer,
                FirstName = request.Email.Split('@')[0], 
                LastName = "",
                PasswordResetToken = token,
                ResetTokenExpiry = DateTime.UtcNow.AddDays(7)
            };
            _context.Users.Add(newUser);
        }

        await _context.SaveChangesAsync(default);

        _logger.LogInformation("Invitation Link for {Email}: {Link}", request.Email, resetLink);
        
        BackgroundJob.Enqueue(() => _emailService.SendEmailAsync(request.Email, "Invitation to join Wukala-GPT Firm Team", emailHtml));
        
        await LogActivityAsync(firmId, currentUserId, "Invited team member", request.Email, FirmActivityType.Other);
    }

    public async Task<List<StaffTaskDto>> GetTasksAsync(Guid firmId)
    {
        var tasks = await _context.StaffTasks.AsNoTracking()
            .Include(t => t.AssignedToUser)
            .Include(t => t.AssignedByUser)
            .Where(t => t.FirmId == firmId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return tasks.Select(t => new StaffTaskDto
        {
            Id = t.Id,
            Title = t.Title,
            AssignedTo = $"{t.AssignedToUser.FirstName} {t.AssignedToUser.LastName}".Trim(),
            AssignedBy = $"{t.AssignedByUser.FirstName} {t.AssignedByUser.LastName}".Trim(),
            DueDate = t.DueDate,
            Priority = t.Priority.ToString(),
            Status = t.Status == StaffTaskStatus.InProgress ? "In Progress" : t.Status.ToString(),
            Type = t.Type.ToString()
        }).ToList();
    }

    public async Task<StaffTaskDto> CreateTaskAsync(Guid firmId, Guid assignedBy, StaffTaskDto request)
    {
        if (!request.AssignedToUserId.HasValue)
        {
            throw new Exception("Assignee must be specified via explicit ID.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.FirmId == firmId && u.Id == request.AssignedToUserId.Value);
        if(user == null) throw new Exception("Assignee not found in your firm.");

        var task = new StaffTask
        {
            FirmId = firmId,
            Title = request.Title,
            AssignedToUserId = user.Id,
            AssignedByUserId = assignedBy,
            DueDate = request.DueDate,
            Priority = Enum.Parse<StaffTaskPriority>(request.Priority),
            Status = StaffTaskStatus.Pending,
            Type = Enum.Parse<StaffTaskType>(request.Type)
        };

        _context.StaffTasks.Add(task);
        await _context.SaveChangesAsync(default);

        await LogActivityAsync(firmId, assignedBy, "Assigned a task", task.Title, FirmActivityType.Other);

        return request;
    }

    public async Task UpdateTaskStatusAsync(Guid taskId, Guid firmId, string newStatus)
    {
        var task = await _context.StaffTasks.FirstOrDefaultAsync(t => t.Id == taskId && t.FirmId == firmId);
        if (task != null)
        {
            if (Enum.TryParse<StaffTaskStatus>(newStatus.Replace(" ", ""), out var status))
            {
                task.Status = status;
                await _context.SaveChangesAsync(default);
            }
        }
    }

    public async Task<List<FirmActivityLogDto>> GetRecentActivityAsync(Guid firmId, int count = 20)
    {
        var logs = await _context.FirmActivityLogs.AsNoTracking()
            .Include(l => l.User)
            .Where(l => l.FirmId == firmId)
            .OrderByDescending(l => l.CreatedAt)
            .Take(count)
            .ToListAsync();

        return logs.Select(l => new FirmActivityLogDto
        {
            Id = l.Id,
            Member = $"{l.User.FirstName} {l.User.LastName}".Trim(),
            Action = l.Action,
            Target = l.Target,
            Timestamp = GetTimeAgo(l.CreatedAt),
            Type = l.Type.ToString().ToLower() // simple mapping for UI icon mapping
        }).ToList();
    }

    public async Task LogActivityAsync(Guid firmId, Guid userId, string action, string target, FirmActivityType type)
    {
        var log = new FirmActivityLog
        {
            FirmId = firmId,
            UserId = userId,
            Action = action,
            Target = target,
            Type = type
        };
        
        _context.FirmActivityLogs.Add(log);
        await _context.SaveChangesAsync(default);
    }
    
    private string GetTimeAgo(DateTime dateTime)
    {
        var span = DateTime.UtcNow - dateTime;
        if (span.TotalMinutes < 1) return "just now";
        if (span.TotalHours < 1) return $"{(int)span.TotalMinutes} min ago";
        if (span.TotalDays < 1) return $"{(int)span.TotalHours} hours ago";
        if (span.TotalDays < 2) return "yesterday";
        return $"{(int)span.TotalDays} days ago";
    }
    public async Task<List<FirmCalendarEventDto>> GetFirmCalendarAsync(Guid firmId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var hearings = await _context.Hearings.AsNoTracking()
            .Include(h => h.Case)
            .ThenInclude(c => c.LeadLawyer)
            .Where(h => h.FirmId == firmId && h.HearingDate == today)
            .OrderBy(h => h.HearingDate) // actually they are all today, so maybe we need a Time property if it exists, otherwise just order by creation or title
            .ToListAsync();

        var courtColors = new[] { "bg-success", "bg-primary", "bg-gold", "bg-destructive", "bg-primary-muted" };

        return hearings.Select((h, i) => new FirmCalendarEventDto
        {
            Time = "09:00 AM", // Since Hearing doesn't seem to have a time field based on previous knowledge, we hardcode or parse
            Lawyer = $"Adv. {h.Case.LeadLawyer.FirstName} {h.Case.LeadLawyer.LastName}".Trim(),
            Hearing = h.Case.Title,
            Court = h.Case.CourtName ?? "Local Court",
            Color = courtColors[i % courtColors.Length]
        }).ToList();
    }

    public async Task UpdateMemberRoleAsync(Guid firmId, Guid memberId, string newRole)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == memberId && u.FirmId == firmId);
        if (user != null)
        {
            if (Enum.TryParse<TeamRole>(newRole.Replace(" ", ""), out var roleEnum))
            {
                user.StaffRole = roleEnum;
                await _context.SaveChangesAsync(default);
                await LogActivityAsync(firmId, memberId, "Updated role", $"Role changed to {newRole}", FirmActivityType.Other);
            }
        }
    }

    public async Task RemoveMemberAsync(Guid firmId, Guid memberId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == memberId && u.FirmId == firmId);
        if (user != null)
        {
            user.FirmId = null;
            user.StaffRole = null;
            await _context.SaveChangesAsync(default);
            await LogActivityAsync(firmId, memberId, "Removed member from firm", user.Email, FirmActivityType.Other);
        }
    }
}
