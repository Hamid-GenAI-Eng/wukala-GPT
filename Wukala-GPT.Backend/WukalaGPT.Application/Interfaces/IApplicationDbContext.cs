using Microsoft.EntityFrameworkCore;
using WukalaGPT.Domain.Entities;

namespace WukalaGPT.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<LawyerProfile> LawyerProfiles { get; }
    DbSet<ClientProfile> ClientProfiles { get; }
    DbSet<LegalDocument> LegalDocuments { get; }
    DbSet<DocumentDraft> DocumentDrafts { get; }
    DbSet<ChatSession> ChatSessions { get; }
    DbSet<Message> Messages { get; }
    DbSet<Conversation> Conversations { get; }
    DbSet<InvalidatedToken> InvalidatedTokens { get; }
    
    DbSet<Experience> Experiences { get; }
    DbSet<Education> Educations { get; }
    DbSet<Speciality> Specialities { get; }
    DbSet<LawyerSpeciality> LawyerSpecialities { get; }
    
    // AI Chat
    DbSet<AiChatSession> AiChatSessions { get; }
    DbSet<AiChatMessage> AiChatMessages { get; }
    
    DbSet<SavedProfile> SavedProfiles { get; }
    
    // Case Management System
    DbSet<LegalCase> LegalCases { get; }
    DbSet<Firm> Firms { get; }
    DbSet<CaseAssignment> CaseAssignments { get; }
    DbSet<CaseTimelineEvent> CaseTimelineEvents { get; }
    DbSet<CaseNote> CaseNotes { get; }
    DbSet<CaseLink> CaseLinks { get; }
    DbSet<CaseDeadline> CaseDeadlines { get; }
    DbSet<Hearing> Hearings { get; }
    DbSet<HearingAdjournment> HearingAdjournments { get; }
    DbSet<AppNotification> AppNotifications { get; }

    // Client CRM System
    DbSet<Client> Clients { get; }
    DbSet<ClientInteraction> ClientInteractions { get; }
    DbSet<ConflictCheck> ConflictChecks { get; }
    DbSet<ClientPortalDocumentAccess> ClientPortalDocumentAccesses { get; }

    // Analytics & Team Management
    DbSet<StaffTask> StaffTasks { get; }
    DbSet<FirmActivityLog> FirmActivityLogs { get; }
    DbSet<FirmExpense> FirmExpenses { get; }

    // Billing System
    DbSet<WukalaGPT.Domain.Entities.Billing.Invoice> Invoices { get; }
    DbSet<WukalaGPT.Domain.Entities.Billing.InvoiceItem> InvoiceItems { get; }
    DbSet<WukalaGPT.Domain.Entities.Billing.Payment> Payments { get; }
    DbSet<WukalaGPT.Domain.Entities.Billing.Retainer> Retainers { get; }
    DbSet<WukalaGPT.Domain.Entities.Billing.BillingTemplate> BillingTemplates { get; }
    DbSet<WukalaGPT.Domain.Entities.Billing.BillingTemplateItem> BillingTemplateItems { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}

