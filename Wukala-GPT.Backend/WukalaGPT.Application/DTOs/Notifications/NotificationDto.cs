using System;

namespace WukalaGPT.Application.DTOs.Notifications;

public class NotificationDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Desc { get; set; } = string.Empty;
    public string? Detail { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string? ActionLabel { get; set; }
    public string? ActionType { get; set; }
    public string? RelatedCase { get; set; }
    public string? Source { get; set; }
    public bool Read { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public string Time { get; set; } = string.Empty;
}

public class NotificationSettingsDto
{
    public string Type { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public bool Email { get; set; }
    public bool Push { get; set; }
    public bool InApp { get; set; }
    public bool Sound { get; set; }
}
