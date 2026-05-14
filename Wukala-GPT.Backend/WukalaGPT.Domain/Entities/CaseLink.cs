using System;
using WukalaGPT.Domain.Enums;

namespace WukalaGPT.Domain.Entities;

public class CaseLink
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid CaseId { get; set; }
    public LegalCase Case { get; set; } = null!;
    
    public Guid LinkedCaseId { get; set; }
    public LegalCase LinkedCase { get; set; } = null!;
    
    public CaseLinkType LinkType { get; set; }
}
