using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WukalaGPT.Application.DTOs.Team;

namespace WukalaGPT.Application.Interfaces;

public interface ITeamService
{
    Task<List<TeamMemberDto>> GetTeamMembersAsync(Guid firmId);
    Task InviteMemberAsync(Guid firmId, Guid currentUserId, InviteMemberRequestDto request);
    
    Task<List<StaffTaskDto>> GetTasksAsync(Guid firmId);
    Task<StaffTaskDto> CreateTaskAsync(Guid firmId, Guid assignedBy, StaffTaskDto request);
    Task UpdateTaskStatusAsync(Guid taskId, Guid firmId, string newStatus);
    
    Task<List<FirmActivityLogDto>> GetRecentActivityAsync(Guid firmId, int count = 20);
    Task LogActivityAsync(Guid firmId, Guid userId, string action, string target, WukalaGPT.Domain.Enums.FirmActivityType type);
    Task<List<FirmCalendarEventDto>> GetFirmCalendarAsync(Guid firmId);
    Task UpdateMemberRoleAsync(Guid firmId, Guid memberId, string newRole);
    Task RemoveMemberAsync(Guid firmId, Guid memberId);
}
