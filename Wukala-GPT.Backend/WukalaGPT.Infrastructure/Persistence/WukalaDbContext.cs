using Microsoft.EntityFrameworkCore;
using System.Reflection;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;

namespace WukalaGPT.Infrastructure.Persistence;

public class WukalaDbContext : DbContext, IApplicationDbContext
{
    public WukalaDbContext(DbContextOptions<WukalaDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<LawyerProfile> LawyerProfiles => Set<LawyerProfile>();
    public DbSet<ClientProfile> ClientProfiles => Set<ClientProfile>();
    public DbSet<LegalDocument> LegalDocuments => Set<LegalDocument>();
    public DbSet<DocumentDraft> DocumentDrafts => Set<DocumentDraft>();
    public DbSet<ChatSession> ChatSessions => Set<ChatSession>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<InvalidatedToken> InvalidatedTokens => Set<InvalidatedToken>();
    
    public DbSet<Experience> Experiences => Set<Experience>();
    public DbSet<Education> Educations => Set<Education>();
    public DbSet<Speciality> Specialities => Set<Speciality>();
    public DbSet<LawyerSpeciality> LawyerSpecialities => Set<LawyerSpeciality>();
    
    public DbSet<AiChatSession> AiChatSessions => Set<AiChatSession>();
    public DbSet<AiChatMessage> AiChatMessages => Set<AiChatMessage>();
    
    public DbSet<SavedProfile> SavedProfiles => Set<SavedProfile>();
    
    // Case Management System
    public DbSet<LegalCase> LegalCases => Set<LegalCase>();
    public DbSet<Firm> Firms => Set<Firm>();
    public DbSet<CaseAssignment> CaseAssignments => Set<CaseAssignment>();
    public DbSet<CaseTimelineEvent> CaseTimelineEvents => Set<CaseTimelineEvent>();
    public DbSet<CaseNote> CaseNotes => Set<CaseNote>();
    public DbSet<CaseLink> CaseLinks => Set<CaseLink>();
    public DbSet<CaseDeadline> CaseDeadlines => Set<CaseDeadline>();

    // Client CRM System
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<ClientInteraction> ClientInteractions => Set<ClientInteraction>();
    public DbSet<ConflictCheck> ConflictChecks => Set<ConflictCheck>();
    public DbSet<ClientPortalDocumentAccess> ClientPortalDocumentAccesses => Set<ClientPortalDocumentAccess>();
    public DbSet<Hearing> Hearings => Set<Hearing>();
    public DbSet<HearingAdjournment> HearingAdjournments => Set<HearingAdjournment>();
    public DbSet<AppNotification> AppNotifications => Set<AppNotification>();

    // Analytics & Team Management
    public DbSet<StaffTask> StaffTasks => Set<StaffTask>();
    public DbSet<FirmActivityLog> FirmActivityLogs => Set<FirmActivityLog>();
    public DbSet<FirmExpense> FirmExpenses => Set<FirmExpense>();

    // Billing System
    public DbSet<WukalaGPT.Domain.Entities.Billing.Invoice> Invoices => Set<WukalaGPT.Domain.Entities.Billing.Invoice>();
    public DbSet<WukalaGPT.Domain.Entities.Billing.InvoiceItem> InvoiceItems => Set<WukalaGPT.Domain.Entities.Billing.InvoiceItem>();
    public DbSet<WukalaGPT.Domain.Entities.Billing.Payment> Payments => Set<WukalaGPT.Domain.Entities.Billing.Payment>();
    public DbSet<WukalaGPT.Domain.Entities.Billing.Retainer> Retainers => Set<WukalaGPT.Domain.Entities.Billing.Retainer>();
    public DbSet<WukalaGPT.Domain.Entities.Billing.BillingTemplate> BillingTemplates => Set<WukalaGPT.Domain.Entities.Billing.BillingTemplate>();
    public DbSet<WukalaGPT.Domain.Entities.Billing.BillingTemplateItem> BillingTemplateItems => Set<WukalaGPT.Domain.Entities.Billing.BillingTemplateItem>();


    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        builder.Entity<LawyerSpeciality>()
            .HasKey(ls => new { ls.LawyerProfileId, ls.SpecialityId });
            
        builder.Entity<LawyerSpeciality>()
            .HasOne(ls => ls.LawyerProfile)
            .WithMany(lp => lp.LawyerSpecialities)
            .HasForeignKey(ls => ls.LawyerProfileId);
            
        builder.Entity<LawyerSpeciality>()
            .HasOne(ls => ls.Speciality)
            .WithMany(s => s.LawyerSpecialities)
            .HasForeignKey(ls => ls.SpecialityId);

        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // AI Chat Configuration
        builder.Entity<AiChatSession>()
            .HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<AiChatMessage>()
            .HasOne(m => m.Session)
            .WithMany(s => s.Messages)
            .HasForeignKey(m => m.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Saved Profiles Many-to-Many mapping relationships
        builder.Entity<SavedProfile>()
            .HasOne(sp => sp.Client)
            .WithMany()
            .HasForeignKey(sp => sp.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<SavedProfile>()
            .HasOne(sp => sp.Lawyer)
            .WithMany()
            .HasForeignKey(sp => sp.LawyerId)
            .OnDelete(DeleteBehavior.Restrict); // Prevent multiple cascade paths
            
        // Conversations Restrict Cascade mapping to prevent circular deletes on User
        builder.Entity<Conversation>()
            .HasOne(c => c.Participant1)
            .WithMany()
            .HasForeignKey(c => c.Participant1Id)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Conversation>()
            .HasOne(c => c.Participant2)
            .WithMany()
            .HasForeignKey(c => c.Participant2Id)
            .OnDelete(DeleteBehavior.Restrict);
            
        // Message FK mapping
        builder.Entity<Message>()
            .HasOne(m => m.Conversation)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Message>()
            .HasOne(m => m.Receiver)
            .WithMany()
            .HasForeignKey(m => m.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

        // Case Management System Configuration
        builder.Entity<CaseAssignment>()
            .HasOne(ca => ca.Case)
            .WithMany(c => c.Assignments)
            .HasForeignKey(ca => ca.CaseId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.Entity<CaseTimelineEvent>()
            .HasOne(cte => cte.Case)
            .WithMany(c => c.TimelineEvents)
            .HasForeignKey(cte => cte.CaseId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.Entity<CaseNote>()
            .HasOne(cn => cn.Case)
            .WithMany(c => c.Notes)
            .HasForeignKey(cn => cn.CaseId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.Entity<CaseDeadline>()
            .HasOne(cd => cd.Case)
            .WithMany(c => c.Deadlines)
            .HasForeignKey(cd => cd.CaseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<CaseLink>()
            .HasOne(cl => cl.Case)
            .WithMany(c => c.SourceLinks)
            .HasForeignKey(cl => cl.CaseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<CaseLink>()
            .HasOne(cl => cl.LinkedCase)
            .WithMany(c => c.TargetLinks)
            .HasForeignKey(cl => cl.LinkedCaseId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.Entity<CaseLink>()
            .HasIndex(cl => new { cl.CaseId, cl.LinkedCaseId })
            .IsUnique();
            
        builder.Entity<CaseAssignment>()
            .HasIndex(ca => new { ca.CaseId, ca.UserId })
            .IsUnique();

        // Analytics & Team Management Configuration
        builder.Entity<StaffTask>()
            .HasOne(st => st.AssignedToUser)
            .WithMany()
            .HasForeignKey(st => st.AssignedToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<StaffTask>()
            .HasOne(st => st.AssignedByUser)
            .WithMany()
            .HasForeignKey(st => st.AssignedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<StaffTask>()
            .HasIndex(st => new { st.FirmId, st.DueDate });
            
        builder.Entity<FirmActivityLog>()
            .HasOne(fa => fa.User)
            .WithMany()
            .HasForeignKey(fa => fa.UserId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.Entity<FirmActivityLog>()
            .HasIndex(fa => new { fa.FirmId, fa.CreatedAt });

        builder.Entity<FirmExpense>()
            .HasIndex(fe => new { fe.FirmId, fe.ExpenseDate });
            
        builder.Entity<FirmExpense>()
            .Property(fe => fe.Amount)
            .HasPrecision(18, 2);

        // Client CRM System Configuration
        builder.Entity<Client>()
            .HasIndex(c => new { c.FirmId, c.IsArchived });

        builder.Entity<ClientInteraction>()
            .HasOne(i => i.Client)
            .WithMany(c => c.Interactions)
            .HasForeignKey(i => i.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ClientPortalDocumentAccess>()
            .HasOne(p => p.Client)
            .WithMany()
            .HasForeignKey(p => p.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ClientPortalDocumentAccess>()
            .HasOne(p => p.Document)
            .WithMany()
            .HasForeignKey(p => p.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ClientPortalDocumentAccess>()
            .HasIndex(x => new { x.ClientId, x.DocumentId })
            .IsUnique();

        // ---------------- Court Hearing Module Configurations ---------------- //
        builder.Entity<Hearing>()
            // Ensure no circular cascades natively
            .HasOne(h => h.Case)
            .WithMany()
            .HasForeignKey(h => h.CaseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Hearing>()
            .HasOne(h => h.LeadLawyer)
            .WithMany()
            .HasForeignKey(h => h.LeadLawyerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Hearing>()
            .HasOne(h => h.Client)
            .WithMany()
            .HasForeignKey(h => h.ClientId)
            .OnDelete(DeleteBehavior.SetNull);

        // Required 5 Indexes on Hearings
        builder.Entity<Hearing>()
            .HasIndex(h => new { h.FirmId, h.HearingDate, h.StartTime })
            .HasFilter("\"IsArchived\" = false"); // Calendar rendering

        builder.Entity<Hearing>()
            .HasIndex(h => new { h.LeadLawyerId, h.HearingDate, h.StartTime })
            .HasFilter("\"Status\" = 'Scheduled' AND \"IsArchived\" = false"); // Conflict detection logic

        builder.Entity<Hearing>()
            .HasIndex(h => new { h.HearingDate, h.StartTime })
            .HasFilter("\"Status\" = 'Scheduled' AND \"IsArchived\" = false AND \"Reminder24hSentAt\" IS NULL"); // Hangfire reminder

        // Manual descending index approximations (supported implicitly based on query ordering, EF mapping doesn't always specify ASC/DESC purely in memory natively, but Postgres uses it efficiently)
        builder.Entity<Hearing>()
            .HasIndex(h => new { h.CaseId, h.HearingDate })
            .HasFilter("\"IsArchived\" = false"); // Case lookup

        builder.Entity<Hearing>()
            .HasIndex(h => new { h.ClientId, h.HearingDate })
            .HasFilter("\"ClientId\" IS NOT NULL AND \"IsArchived\" = false"); // Client lookup

        // Required Adjournments Configuration
        builder.Entity<HearingAdjournment>()
            .HasOne(ha => ha.OriginalHearing)
            .WithMany(h => h.Adjournments)
            .HasForeignKey(ha => ha.OriginalHearingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<HearingAdjournment>()
            .HasOne(ha => ha.NewHearing)
            .WithMany()
            .HasForeignKey(ha => ha.NewHearingId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<HearingAdjournment>()
            .HasIndex(ha => ha.OriginalHearingId);

        builder.Entity<HearingAdjournment>()
            .HasIndex(ha => new { ha.FirmId, ha.CreatedAt });

        // ---------------- Fee & Billing Module Configurations ---------------- //
        builder.Entity<WukalaGPT.Domain.Entities.Billing.Invoice>(entity =>
        {
            entity.HasIndex(i => new { i.LawyerId, i.Status });
            entity.HasIndex(i => i.InvoiceNumber).IsUnique();
            entity.Property(i => i.Amount).HasPrecision(18, 2);
            entity.Property(i => i.PaidAmount).HasPrecision(18, 2);

            entity.HasOne(i => i.Lawyer)
                .WithMany()
                .HasForeignKey(i => i.LawyerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(i => i.Client)
                .WithMany()
                .HasForeignKey(i => i.ClientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<WukalaGPT.Domain.Entities.Billing.InvoiceItem>(entity =>
        {
            entity.Property(ii => ii.Hours).HasPrecision(18, 2);
            entity.Property(ii => ii.Rate).HasPrecision(18, 2);
            entity.Property(ii => ii.Amount).HasPrecision(18, 2);
        });

        builder.Entity<WukalaGPT.Domain.Entities.Billing.Payment>(entity =>
        {
            entity.Property(p => p.Amount).HasPrecision(18, 2);
            entity.HasIndex(p => new { p.InvoiceId, p.Status });
            
            entity.HasOne(p => p.Invoice)
                .WithMany(i => i.Payments)
                .HasForeignKey(p => p.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<WukalaGPT.Domain.Entities.Billing.Retainer>(entity =>
        {
            entity.Property(r => r.TotalAmount).HasPrecision(18, 2);
            entity.Property(r => r.UsedAmount).HasPrecision(18, 2);
            entity.HasIndex(r => new { r.LawyerId, r.ClientId, r.Status });
        });

        builder.Entity<WukalaGPT.Domain.Entities.Billing.BillingTemplate>(entity =>
        {
            entity.HasIndex(bt => new { bt.LawyerId, bt.Category });
        });

        builder.Entity<WukalaGPT.Domain.Entities.Billing.BillingTemplateItem>(entity =>
        {
            entity.Property(bti => bti.Rate).HasPrecision(18, 2);
        });


        // Seed Admin User
        var adminId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        builder.Entity<User>().HasData(new User
        {
            Id = adminId,
            FirstName = "System",
            LastName = "Admin",
            Email = "wukalagpt@codeenvision.com",
            PhoneNumber = "0000000000",
            City = "System",
            PasswordHash = "$2a$11$QdbURztZ8cP/kN2svQ/p.uMOfPJJH5rZ7wkx4sRb53FIBr.6BfH5q",
            Role = WukalaGPT.Domain.Enums.UserRole.Admin,
            IsEmailVerified = true,
            IsActive = true,
            CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
