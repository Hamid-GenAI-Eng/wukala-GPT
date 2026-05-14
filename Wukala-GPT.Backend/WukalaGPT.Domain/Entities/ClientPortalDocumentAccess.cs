using System;

namespace WukalaGPT.Domain.Entities;

public class ClientPortalDocumentAccess
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    
    public Guid DocumentId { get; set; }
    public LegalDocument Document { get; set; } = null!;
    
    public Guid FirmId { get; set; }
    public Guid SharedById { get; set; }
    
    public DateTimeOffset SharedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
}
