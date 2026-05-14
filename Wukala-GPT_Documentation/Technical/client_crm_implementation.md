# Client CRM — Complete Implementation Reference
## Database Tables + All APIs

---

## PART 1 — DATABASE TABLES

### Table 1: `clients`

```sql
CREATE TABLE clients (
  -- Identity
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id           UUID NOT NULL REFERENCES firms(id) ON DELETE RESTRICT,
  created_by        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Core Info
  full_name         VARCHAR(255) NOT NULL,
  client_type       VARCHAR(20)  NOT NULL DEFAULT 'Individual'
                    CHECK (client_type IN ('Individual', 'Corporate')),

  -- Contact Details
  email             VARCHAR(255),
  phone             VARCHAR(20),
  whatsapp          VARCHAR(20),          -- separate WhatsApp number (frontend shows this)
  cnic              VARCHAR(15),          -- for conflict check by CNIC

  -- Corporate-specific
  company_name      VARCHAR(255),         -- only for Corporate clients
  contact_person    VARCHAR(255),         -- contact person at the company

  -- Location
  address           TEXT,
  city              VARCHAR(100),
  province          VARCHAR(100),

  -- Classification
  tags              TEXT[]   DEFAULT '{}',       -- ['VIP', 'Corporate', 'Criminal Defense']
  acquisition_source VARCHAR(30)
                    CHECK (acquisition_source IN (
                      'ClientReferral', 'BarAssociation',
                      'Online', 'WalkIn', 'Other'
                    )),

  -- Status
  status            VARCHAR(20) NOT NULL DEFAULT 'Active'
                    CHECK (status IN ('Active', 'Inactive', 'Conflicted')),

  -- Portal Access
  portal_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  portal_email      VARCHAR(255),         -- email used for client portal login (may differ)

  -- Retention Tracking (set by Hangfire job, not computed per-request)
  retention_flagged    BOOLEAN     NOT NULL DEFAULT FALSE,
  retention_flagged_at TIMESTAMPTZ,

  -- Dates
  onboarded_at      DATE         NOT NULL DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Soft Delete
  is_archived       BOOLEAN      NOT NULL DEFAULT FALSE,
  archived_at       TIMESTAMPTZ,

  -- Notes
  notes             TEXT,

  -- Constraints
  CONSTRAINT chk_corporate_has_company
    CHECK (client_type = 'Individual' OR company_name IS NOT NULL),
  CONSTRAINT chk_cnic_format
    CHECK (cnic IS NULL OR cnic ~ '^\d{13}$')  -- 13-digit CNIC
);

-- Indexes
CREATE INDEX idx_clients_firm        ON clients(firm_id, is_archived);
CREATE INDEX idx_clients_status      ON clients(firm_id, status) WHERE is_archived = FALSE;
CREATE INDEX idx_clients_retention   ON clients(firm_id, retention_flagged) WHERE retention_flagged = TRUE;
CREATE INDEX idx_clients_search      ON clients USING GIN (
  to_tsvector('english', full_name || ' ' || COALESCE(company_name,'') || ' ' || COALESCE(cnic,''))
);
CREATE INDEX idx_clients_tags        ON clients USING GIN (tags);
```

---

### Table 2: `client_interactions`

```sql
CREATE TABLE client_interactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  firm_id          UUID NOT NULL REFERENCES firms(id)   ON DELETE RESTRICT,
  logged_by        UUID NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,

  -- Interaction Details
  type             VARCHAR(20) NOT NULL
                   CHECK (type IN ('Call','Meeting','Email','WhatsApp','Visit','SMS')),
  summary          TEXT NOT NULL,
  outcome          TEXT,                  -- what was the result
  duration_mins    INT,                   -- only for calls/meetings

  -- Timing
  interaction_date TIMESTAMPTZ NOT NULL,
  next_action      TEXT,                  -- "Send retainer agreement", "Follow up on FIR"
  next_action_date DATE,                  -- triggers Hangfire reminder when set

  -- Metadata
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_interactions_client   ON client_interactions(client_id, interaction_date DESC);
CREATE INDEX idx_interactions_firm     ON client_interactions(firm_id, interaction_date DESC);
CREATE INDEX idx_interactions_followup ON client_interactions(next_action_date)
  WHERE next_action_date IS NOT NULL;   -- Hangfire queries this index
```

---

### Table 3: `conflict_checks`

```sql
CREATE TABLE conflict_checks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id         UUID NOT NULL REFERENCES firms(id)   ON DELETE RESTRICT,
  checked_by      UUID NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,

  -- What was checked
  client_name     VARCHAR(255) NOT NULL,
  client_cnic     VARCHAR(15),
  opposing_party  VARCHAR(255),

  -- Result
  result          VARCHAR(20) NOT NULL
                  CHECK (result IN ('Clear', 'Conflict', 'NeedsReview')),
  risk_level      VARCHAR(10)
                  CHECK (risk_level IN ('None', 'Low', 'Medium', 'High')),
  notes           TEXT,

  -- Matched records (stored as JSON snapshot for audit)
  matched_clients JSONB DEFAULT '[]',    -- array of {id, name, cnic} that matched
  matched_cases   JSONB DEFAULT '[]',    -- array of {id, title, opposingCounsel} that matched

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conflict_firm ON conflict_checks(firm_id, created_at DESC);
```

---

### Table 4: `client_portal_document_access`

> Only for controlling which documents a client can see in their portal.
> For internal document-client linking, use `documents.client_id` directly.

```sql
CREATE TABLE client_portal_document_access (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES clients(id)   ON DELETE CASCADE,
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  firm_id      UUID NOT NULL REFERENCES firms(id)     ON DELETE RESTRICT,
  shared_by    UUID NOT NULL REFERENCES users(id)     ON DELETE RESTRICT,
  shared_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,              -- NULL = no expiry
  revoked_at   TIMESTAMPTZ,             -- NULL = still active

  UNIQUE (client_id, document_id)
);

CREATE INDEX idx_portal_docs_client ON client_portal_document_access(client_id)
  WHERE revoked_at IS NULL;
```

---

## PART 2 — COMPLETE API ENDPOINTS

> Base: `GET /api/v1/clients`
> All routes require: `Authorization: Bearer <token>`
> All queries auto-scoped to `firm_id` from JWT — never trust client-sent firm_id

---

### 1. `GET /clients` — List Clients

**Query Parameters:**
```
search          string    Search full_name, company_name, cnic, email
status          string    'Active' | 'Inactive' | 'Conflicted'
client_type     string    'Individual' | 'Corporate'
tags            string[]  Filter by tags e.g. ?tags=VIP&tags=Criminal
acquisition_source string
retention_flagged bool    true = show at-risk clients only
page            int       default 1
limit           int       default 20, max 100
sort_by         string    'name' | 'onboarded_at' | 'last_contact' | 'total_billed'
sort_dir        string    'asc' | 'desc'
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "fullName": "Khan Industries Pvt Ltd",
      "clientType": "Corporate",
      "companyName": "Khan Industries Pvt Ltd",
      "contactPerson": "Mr. Ahmed Khan",
      "email": "ahmed@khanindustries.pk",
      "phone": "+92 300 111 2233",
      "whatsapp": "+92 300 111 2233",
      "city": "Lahore",
      "tags": ["VIP", "Corporate"],
      "status": "Active",
      "portalEnabled": true,
      "retentionFlagged": false,
      "onboardedAt": "2024-01-15",
      "activeCasesCount": 5,      // computed: COUNT from cases table
      "totalBilled": 1800000,     // computed: SUM from invoices table
      "outstandingBalance": 280000, // computed: SUM unpaid invoices
      "lastContactDate": "2024-03-10", // computed: MAX interaction_date
      "acquisitionSource": "ClientReferral"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

**Business Logic:**
```
- Only return clients WHERE firm_id = jwt.firmId AND is_archived = FALSE
- Computed fields via LEFT JOIN subqueries or separate async calls:
    activeCasesCount: SELECT COUNT(*) FROM cases WHERE client_id = c.id AND status != 'Closed'
    totalBilled:      SELECT COALESCE(SUM(total),0) FROM invoices WHERE client_id = c.id
    outstandingBalance: SELECT COALESCE(SUM(total - paid_amount),0) FROM invoices
                        WHERE client_id = c.id AND status NOT IN ('Paid','Cancelled')
    lastContactDate:  SELECT MAX(interaction_date) FROM client_interactions WHERE client_id = c.id
- Cache this list in Redis for 2 minutes: key = "clients:list:{firmId}:{queryHash}"
- Invalidate cache on any client write
```

---

### 2. `POST /clients` — Create Client

**Request Body:**
```json
{
  "fullName": "Khan Industries Pvt Ltd",
  "clientType": "Corporate",
  "companyName": "Khan Industries Pvt Ltd",
  "contactPerson": "Mr. Ahmed Khan",
  "email": "ahmed@khanindustries.pk",
  "phone": "+92 300 111 2233",
  "whatsapp": "+92 300 111 2233",
  "cnic": "3520112345679",
  "address": "14-B, Gulberg III",
  "city": "Lahore",
  "province": "Punjab",
  "tags": ["VIP", "Corporate"],
  "acquisitionSource": "ClientReferral",
  "notes": "High-value corporate client referred by Judge Hassan",
  "portalEnabled": false
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "fullName": "Khan Industries Pvt Ltd",
  ...all fields...,
  "onboardedAt": "2024-04-04",
  "createdAt": "2024-04-04T09:30:00Z"
}
```

**Business Logic:**
```
- Validate: if clientType = 'Corporate', companyName is required
- Validate: CNIC format if provided (13 digits)
- Check for duplicate: WARN (not block) if same cnic or email exists in this firm
- Set created_by = jwt.userId
- Set firm_id = jwt.firmId
- Publish: ClientCreatedEvent (for audit log, team notifications)
- Invalidate Redis client list cache
```

---

### 3. `GET /clients/:id` — Client Full Detail

**Response:**
```json
{
  "id": "uuid",
  "fullName": "Khan Industries Pvt Ltd",
  "clientType": "Corporate",
  "companyName": "Khan Industries Pvt Ltd",
  "contactPerson": "Mr. Ahmed Khan",
  "email": "ahmed@khanindustries.pk",
  "phone": "+92 300 111 2233",
  "whatsapp": "+92 300 111 2233",
  "cnic": "3520112345679",
  "address": "14-B, Gulberg III",
  "city": "Lahore",
  "province": "Punjab",
  "tags": ["VIP", "Corporate"],
  "status": "Active",
  "acquisitionSource": "ClientReferral",
  "portalEnabled": true,
  "portalEmail": "ahmed@khanindustries.pk",
  "retentionFlagged": false,
  "retentionFlaggedAt": null,
  "onboardedAt": "2024-01-15",
  "notes": "High-value corporate client",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-03-15T14:30:00Z",

  // Computed summary stats
  "stats": {
    "activeCasesCount": 5,
    "totalCasesCount": 8,
    "totalBilled": 1800000,
    "totalPaid": 1520000,
    "outstandingBalance": 280000,
    "lastContactDate": "2024-03-10",
    "totalInteractions": 24
  }
}
```

**Business Logic:**
```
- Verify client.firm_id == jwt.firmId (403 if not)
- Run all stats as parallel async queries
- Cache in Redis: "client:detail:{clientId}" TTL 5 min
- Invalidate on any write to client or related entities
```

---

### 4. `PATCH /clients/:id` — Update Client

**Request Body:** (all fields optional — partial update)
```json
{
  "fullName": "Khan Industries Ltd.",
  "phone": "+92 300 999 8877",
  "tags": ["VIP", "Corporate", "Priority"],
  "status": "Active",
  "portalEnabled": true,
  "portalEmail": "portal@khanindustries.pk",
  "notes": "Updated notes"
}
```

**Response:** `200 OK` — Updated client object

**Business Logic:**
```
- Verify ownership (firm_id check)
- Update updated_at = NOW() automatically
- If status changed to 'Conflicted': publish ClientConflictedEvent
- If portalEnabled changed to true AND portalEmail set:
    → Send portal invitation email via SendGrid
- Invalidate Redis cache for this client + list
```

---

### 5. `DELETE /clients/:id` — Archive Client (Soft Delete)

**Response:** `200 OK`
```json
{ "message": "Client archived successfully" }
```

**Business Logic:**
```
- Never hard delete — set is_archived = TRUE, archived_at = NOW()
- Check: if client has active cases → return 409 Conflict
    { "error": "Cannot archive client with active cases" }
- Cancels any scheduled Hangfire jobs for this client
```

---

### 6. `GET /clients/:id/interactions` — Interaction History

**Query Parameters:**
```
type     string    Filter by type: 'Call' | 'Meeting' | 'Email' | 'WhatsApp' | 'Visit' | 'SMS'
page     int       default 1
limit    int       default 20
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "Meeting",
      "summary": "Discussed strategy for next hearing",
      "outcome": "Client agreed to settlement offer",
      "durationMins": 45,
      "interactionDate": "2024-03-10T14:00:00Z",
      "nextAction": "Draft settlement agreement",
      "nextActionDate": "2024-03-15",
      "loggedBy": {
        "id": "uuid",
        "name": "Adv. Sara Malik"
      },
      "createdAt": "2024-03-10T15:30:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 24 }
}
```

---

### 7. `POST /clients/:id/interactions` — Log Interaction

**Request Body:**
```json
{
  "type": "Meeting",
  "summary": "Discussed strategy for next hearing. Client wants to accept settlement.",
  "outcome": "Will review settlement offer by Friday",
  "durationMins": 45,
  "interactionDate": "2024-04-04T14:00:00Z",
  "nextAction": "Draft settlement agreement",
  "nextActionDate": "2024-04-09"
}
```

**Response:** `201 Created` — Created interaction object

**Business Logic:**
```
- Set logged_by = jwt.userId, firm_id = jwt.firmId
- If nextActionDate is set:
    → Schedule Hangfire job: FollowUpReminderJob
    → Fires on nextActionDate at 9 AM PKT
    → Creates a notification for the logged_by user
- After save: reset client.retention_flagged = FALSE
    (new interaction means client is re-engaged)
- Invalidate client detail cache (lastContactDate changes)
- Publish: ClientInteractionLoggedEvent
```

---

### 8. `PATCH /clients/:id/interactions/:interactionId` — Edit Interaction

**Request Body:** (partial update)
```json
{
  "summary": "Updated summary after reviewing notes",
  "nextActionDate": "2024-04-12"
}
```

**Business Logic:**
```
- Only the original logger OR firm Administrator can edit
- If nextActionDate changed: cancel old Hangfire job, schedule new one
```

---

### 9. `DELETE /clients/:id/interactions/:interactionId` — Delete Interaction

**Response:** `200 OK`

**Business Logic:**
```
- Only original logger OR Administrator can delete
- Cancel associated Hangfire follow-up job if nextActionDate was set
- Hard delete (interactions are low-risk, no audit chain needed)
```

---

### 10. `GET /clients/:id/cases` — Client's Case List

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "caseNumber": "CASE-2024-011",
      "title": "Khan Industries v. FBR",
      "status": "Active",
      "caseType": "Tax",
      "courtName": "Lahore High Court",
      "nextDate": "2024-04-15",
      "priority": "High",
      "leadLawyer": {
        "id": "uuid",
        "name": "Adv. Sara Malik"
      }
    }
  ],
  "meta": { "total": 8, "active": 5, "closed": 3 }
}
```

**Business Logic:**
```
- Query: SELECT * FROM cases WHERE client_id = :id AND firm_id = :firmId
- Order by: status = 'Active' first, then next_date ASC
- No pagination needed (clients rarely have >50 cases)
```

---

### 11. `GET /clients/:id/documents` — Client's Documents

**Query Parameters:**
```
portal_only  bool   If true, only docs shared to client portal
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "fileName": "Sale Agreement - Khan Industries.pdf",
      "fileType": "PDF",
      "fileSizeBytes": 245000,
      "folder": "Correspondence",
      "caseRef": "CASE-2024-011",
      "isConfidential": false,
      "isOcrIndexed": true,
      "versions": 3,
      "sharedWithPortal": true,
      "portalSharedAt": "2024-03-01T10:00:00Z",
      "modifiedAt": "2024-03-10T14:00:00Z"
    }
  ]
}
```

**Business Logic:**
```
Internal view (lawyer):
  SELECT d.* FROM documents d
  WHERE d.client_id = :clientId AND d.firm_id = :firmId
  ORDER BY d.updated_at DESC

Portal view (if ?portal_only=true):
  SELECT d.* FROM documents d
  JOIN client_portal_document_access cpda ON cpda.document_id = d.id
  WHERE cpda.client_id = :clientId
    AND cpda.revoked_at IS NULL
    AND (cpda.expires_at IS NULL OR cpda.expires_at > NOW())
```

---

### 12. `POST /clients/:id/portal-access/documents/:documentId` — Share Doc to Portal

**Request Body:**
```json
{
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response:** `201 Created`
```json
{
  "clientId": "uuid",
  "documentId": "uuid",
  "sharedAt": "2024-04-04T09:00:00Z",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

---

### 13. `DELETE /clients/:id/portal-access/documents/:documentId` — Revoke Portal Access

**Business Logic:**
```
- Set revoked_at = NOW() (soft revoke, keep audit trail)
- Client can no longer see this doc in their portal immediately
```

---

### 14. `POST /clients/conflict-check` — Run Conflict of Interest Check

**Request Body:**
```json
{
  "clientName": "Khan Industries",
  "clientCnic": "3520112345679",
  "opposingParty": "Federal Board of Revenue"
}
```

**Response:**
```json
{
  "result": "Conflict",
  "riskLevel": "High",
  "matchedClients": [
    {
      "id": "uuid",
      "fullName": "Khan Industries Pvt Ltd",
      "cnic": "3520112345679",
      "status": "Active",
      "matchReason": "CNIC match"
    }
  ],
  "matchedCases": [
    {
      "id": "uuid",
      "caseNumber": "CASE-2024-005",
      "title": "FBR v. Khan Industries",
      "opposingCounsel": "Riaz & Associates",
      "status": "Active",
      "matchReason": "Opposing party name match"
    }
  ],
  "summary": "2 conflict(s) found. Direct CNIC match with existing active client.",
  "checkId": "uuid"
}
```

**Business Logic (the algorithm):**
```
Step 1 — Search existing clients:
  SELECT id, full_name, cnic, status FROM clients
  WHERE firm_id = :firmId
    AND (
      full_name ILIKE '%' || :clientName || '%'
      OR (cnic = :clientCnic AND :clientCnic IS NOT NULL)
    )
    AND is_archived = FALSE

Step 2 — Search cases for opposing party:
  SELECT id, case_number, title, opposing_counsel, status FROM cases
  WHERE firm_id = :firmId
    AND (
      opposing_counsel ILIKE '%' || :clientName || '%'
      OR opposing_counsel ILIKE '%' || :opposingParty || '%'
      OR title ILIKE '%' || :opposingParty || '%'
    )
    AND is_archived = FALSE

Step 3 — Determine result:
  IF CNIC exact match found in clients          → result = 'Conflict',    riskLevel = 'High'
  ELSE IF name match in active case opponent    → result = 'Conflict',    riskLevel = 'High'
  ELSE IF name match in clients (fuzzy)         → result = 'NeedsReview', riskLevel = 'Medium'
  ELSE IF opposing party matches client name    → result = 'NeedsReview', riskLevel = 'Low'
  ELSE                                          → result = 'Clear',        riskLevel = 'None'

Step 4 — Save result to conflict_checks table (audit trail)
Step 5 — Return response
```

---

### 15. `GET /clients/conflict-checks` — History of Conflict Checks

**Query Parameters:**
```
result   string   'Clear' | 'Conflict' | 'NeedsReview'
page     int
limit    int
```

**Response:** Paginated list of past conflict check records.

---

### 16. `GET /clients/retention-alerts` — Clients Flagged for Retention

```
No query params needed — returns all flagged clients for this firm
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "fullName": "Fatima Enterprises",
      "lastContactDate": "2024-01-10",
      "daysSinceContact": 84,
      "totalBilled": 450000,
      "status": "Active",
      "retentionFlaggedAt": "2024-04-01T03:00:00Z"
    }
  ],
  "total": 3
}
```

---

### 17. `PATCH /clients/:id/dismiss-retention-alert` — Dismiss Alert

**Response:** `200 OK`

**Business Logic:**
```
- Set retention_flagged = FALSE, retention_flagged_at = NULL
- This resets until Hangfire job runs again and re-flags
- Used when lawyer consciously decides to stop pursuing client
```

---

### 18. `GET /clients/stats` — Firm-wide Client Statistics

> Used by Dashboard Overview and Practice Analytics

**Response:**
```json
{
  "totalClients": 42,
  "activeClients": 38,
  "inactiveClients": 3,
  "conflictedClients": 1,
  "retentionAlertsCount": 3,
  "newThisMonth": 7,
  "newThisQuarter": 12,
  "byAcquisitionSource": {
    "ClientReferral": 22,
    "BarAssociation": 8,
    "Online": 7,
    "WalkIn": 5
  },
  "byType": {
    "Individual": 28,
    "Corporate": 14
  },
  "retentionRate": 89.0
}
```

**Business Logic:**
```
- Cache in Redis: "stats:clients:{firmId}" TTL 1 hour
- Invalidate when client is created, archived, or status changes
```

---

### 19. `GET /clients/search` — Quick Search (for dropdowns)

> Used when creating a case: lawyer types name to select existing client

**Query Parameters:**
```
q       string   required, min 2 chars
limit   int      default 10
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "fullName": "Khan Industries Pvt Ltd",
      "clientType": "Corporate",
      "cnic": "352011****679",   // partially masked
      "activeCasesCount": 5
    }
  ]
}
```

**Business Logic:**
```
- Fast query using GIN index on full_name + company_name + cnic
- CNIC in response is masked (show first 6, last 3 only)
- Only Active clients returned
- Used for: case creation "select client" dropdown
```

---

## PART 3 — HANGFIRE BACKGROUND JOBS

### Job 1: `RetentionAlertJob` — Runs Daily at 3 AM

```csharp
// Flags clients with no contact in 60+ days
public async Task ExecuteAsync(Guid firmId)
{
    var cutoff = DateTime.UtcNow.AddDays(-60);

    var atRiskIds = await _db.Clients
        .Where(c => c.FirmId == firmId && c.Status == "Active" && !c.IsArchived)
        .Where(c => !_db.ClientInteractions
            .Any(i => i.ClientId == c.Id && i.InteractionDate > cutoff))
        .Where(c => _db.Invoices            // only clients with billing history
            .Any(i => i.ClientId == c.Id))
        .Select(c => c.Id)
        .ToListAsync();

    await _db.Clients
        .Where(c => atRiskIds.Contains(c.Id))
        .ExecuteUpdateAsync(s => s
            .SetProperty(c => c.RetentionFlagged, true)
            .SetProperty(c => c.RetentionFlaggedAt, DateTime.UtcNow));

    // Create a single summary notification for the firm owner
    if (atRiskIds.Any())
    {
        await _publisher.Publish(new RetentionAlertsGeneratedEvent(firmId, atRiskIds));
    }
}
```

---

### Job 2: `FollowUpReminderJob` — Scheduled per Interaction

```csharp
// Fires on next_action_date at 9 AM for follow-up reminders
public async Task SendFollowUpReminder(Guid interactionId)
{
    var interaction = await _db.ClientInteractions
        .Include(i => i.Client)
        .FirstOrDefaultAsync(i => i.Id == interactionId);

    if (interaction == null) return;  // deleted = skip silently

    await _notifications.CreateAsync(new CreateNotificationDto {
        RecipientId = interaction.LoggedBy,
        Type        = "Reminder",
        Priority    = "Medium",
        Title       = $"Follow-up: {interaction.Client.FullName}",
        Description = interaction.NextAction,
        EntityType  = "Client",
        EntityId    = interaction.ClientId
    });
}
```

---

## PART 4 — COMPLETE DTO REFERENCE

```csharp
// Request DTOs
public record CreateClientDto(
    string FullName,
    string ClientType,           // 'Individual' | 'Corporate'
    string? CompanyName,
    string? ContactPerson,
    string? Email,
    string? Phone,
    string? Whatsapp,
    string? Cnic,
    string? Address,
    string? City,
    string? Province,
    string[]? Tags,
    string? AcquisitionSource,
    string? Notes,
    bool PortalEnabled = false,
    string? PortalEmail = null
);

public record UpdateClientDto(
    string? FullName,
    string? CompanyName,
    string? ContactPerson,
    string? Email,
    string? Phone,
    string? Whatsapp,
    string? Address,
    string? City,
    string? Province,
    string[]? Tags,
    string? Status,
    string? Notes,
    bool? PortalEnabled,
    string? PortalEmail
);

public record CreateInteractionDto(
    string Type,
    string Summary,
    string? Outcome,
    int? DurationMins,
    DateTimeOffset InteractionDate,
    string? NextAction,
    DateOnly? NextActionDate
);

public record ConflictCheckRequestDto(
    string ClientName,
    string? ClientCnic,
    string? OpposingParty
);

// Response DTOs
public record ClientListItemDto(
    Guid Id,
    string FullName,
    string ClientType,
    string? CompanyName,
    string? ContactPerson,
    string? Email,
    string? Phone,
    string? Whatsapp,
    string? City,
    string[] Tags,
    string Status,
    bool PortalEnabled,
    bool RetentionFlagged,
    DateOnly OnboardedAt,
    int ActiveCasesCount,          // computed
    decimal TotalBilled,           // computed
    decimal OutstandingBalance,    // computed
    DateTimeOffset? LastContactDate, // computed
    string? AcquisitionSource
);

public record ClientDetailDto(
    // All ListItem fields +
    Guid Id,
    string? Cnic,
    string? Province,
    string? Address,
    string? Notes,
    string? PortalEmail,
    DateTimeOffset? RetentionFlaggedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    ClientStatsDto Stats
);

public record ClientStatsDto(
    int ActiveCasesCount,
    int TotalCasesCount,
    decimal TotalBilled,
    decimal TotalPaid,
    decimal OutstandingBalance,
    DateTimeOffset? LastContactDate,
    int TotalInteractions
);
```

---

## PART 5 — SUMMARY CHECKLIST

```
Database Tables:
  ✅ clients                          (main table, fully defined)
  ✅ client_interactions              (with next_action_date + Hangfire hook)
  ✅ conflict_checks                  (audit trail for all checks)
  ✅ client_portal_document_access    (portal access control only)

APIs (19 endpoints):
  ✅ GET    /clients                  (list + computed fields)
  ✅ POST   /clients                  (create)
  ✅ GET    /clients/search           (dropdown quick search)
  ✅ GET    /clients/stats            (firm-wide stats)
  ✅ GET    /clients/retention-alerts (flagged clients)
  ✅ GET    /clients/:id              (detail + stats)
  ✅ PATCH  /clients/:id              (update)
  ✅ DELETE /clients/:id              (soft archive)
  ✅ PATCH  /clients/:id/dismiss-retention-alert
  ✅ GET    /clients/:id/interactions  (list)
  ✅ POST   /clients/:id/interactions  (log new)
  ✅ PATCH  /clients/:id/interactions/:iid (edit)
  ✅ DELETE /clients/:id/interactions/:iid (delete)
  ✅ GET    /clients/:id/cases         (all linked cases)
  ✅ GET    /clients/:id/documents     (vault docs for client)
  ✅ POST   /clients/:id/portal-access/documents/:docId (share to portal)
  ✅ DELETE /clients/:id/portal-access/documents/:docId (revoke)
  ✅ POST   /clients/conflict-check    (run check)
  ✅ GET    /clients/conflict-checks   (check history)

Background Jobs:
  ✅ RetentionAlertJob     (daily @ 3 AM — flags inactive clients)
  ✅ FollowUpReminderJob   (scheduled per interaction — follow-up alerts)

MediatR Events Published:
  ✅ ClientCreatedEvent
  ✅ ClientConflictedEvent
  ✅ ClientInteractionLoggedEvent
  ✅ RetentionAlertsGeneratedEvent
```
