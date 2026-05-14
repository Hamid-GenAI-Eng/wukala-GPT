# Wukala-GPT — Complete Backend System Design
## From Frontend Flow → Database → APIs → Scalability

---

## PART 1: THE COMPLETE LAWYER USER JOURNEY

> This is the end-to-end flow from the moment a lawyer visits the platform to their daily workflow.

### Phase 1 — Registration & Onboarding

```
Lawyer visits wukala.com
        │
        ▼
[Registration Page]
  ├─ Full Name
  ├─ Email
  ├─ Password
  ├─ Bar Council License No.
  ├─ CNIC
  ├─ Practice Area (multi-select)
  ├─ City / Province
  └─ Firm Name (optional)
        │
        ▼
Backend: POST /api/auth/register
  ├─ Validate Bar License (via Bar Council API or manual review)
  ├─ Hash password (bcrypt, 12 rounds)
  ├─ Create User record (status = "PendingVerification")
  ├─ Create LawyerProfile record
  ├─ Send verification email (SendGrid)
  └─ Return 201
        │
        ▼
[Email Verification]
  └─ Click link → POST /api/auth/verify-email?token=xxx
        │
        ▼
User status = "Active"
```

### Phase 2 — Login & Token Flow

```
[Login Page]
  ├─ Email + Password
  └─ "Remember Me" toggle
        │
        ▼
POST /api/auth/login
  ├─ Validate credentials
  ├─ Check account status (Active, Suspended, PendingVerification)
  ├─ Generate:
  │    ├─ Access Token  (JWT, 15 minutes)
  │    └─ Refresh Token (JWT, 7 days, stored in HttpOnly cookie)
  ├─ Log login event (IP, device, timestamp)
  └─ Return { accessToken, user: { id, name, role, firmId } }
        │
        ▼
Frontend stores accessToken in memory (NOT localStorage)
Refresh token is in HttpOnly cookie (XSS-safe)
        │
        ▼
Every API call: Authorization: Bearer <accessToken>
When expired: POST /api/auth/refresh → new accessToken
```

### Phase 3 — Dashboard Load (First Screen)

```
Lawyer lands on /lawyer-dashboard
        │
        ▼
Frontend fires 4 parallel API calls:
  ├─ GET /api/dashboard/overview  → stats, urgent tasks, recent cases
  ├─ GET /api/notifications?limit=5&unread=true
  ├─ GET /api/hearings?upcoming=true&limit=3
  └─ GET /api/cases?status=active&limit=5
        │
        ▼
DashboardOverview component renders:
  ├─ Stats Cards (Active Cases, Win Rate, Revenue, Pending Tasks)
  ├─ Urgent Tasks (deadlines < 48hrs)
  ├─ Upcoming Hearings (next 3)
  └─ Recent Cases (last 5 modified)
```

### Phase 4 — Module Navigation (Sidebar Clicks)

Each sidebar item maps to a module. When clicked:

```
User clicks "Case Management"
        │
        ▼
activeSection = 'cases' (local state in LawyerDashboard.tsx)
        │
        ▼
renderContent() returns <CaseManagement />
        │
        ▼
CaseManagement mounts → fires:
  GET /api/cases?lawyerId=xxx&page=1&limit=20
        │
        ▼
User sees case list → clicks a case
        │
        ▼
GET /api/cases/:caseId  (full detail with timeline, notes, docs)
        │
        ▼
Master-Detail view: left = list, right = case detail
        │
        ▼
User adds a note → POST /api/cases/:caseId/notes
User changes status → PATCH /api/cases/:caseId  { status: "Heard" }
User uploads doc → POST /api/cases/:caseId/documents (multipart)
```

---

## PART 2: ALL DATABASE TABLES

> Stack: **PostgreSQL** (primary), **Redis** (cache/sessions), **Azure Blob / AWS S3** (files)

---

### 🔐 Auth & Users

```sql
-- Users (all platform users: lawyers, admins, clerks)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('Lawyer','Administrator','JuniorLawyer','Clerk','SuperAdmin')),
  status        VARCHAR(30) NOT NULL DEFAULT 'PendingVerification'
                CHECK (status IN ('Active','PendingVerification','Suspended','Deactivated')),
  firm_id       UUID REFERENCES firms(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Firms / Law Chambers
CREATE TABLE firms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  address       TEXT,
  city          VARCHAR(100),
  province      VARCHAR(100),
  subscription  VARCHAR(20) DEFAULT 'Basic' CHECK (subscription IN ('Basic','Pro','Firm')),
  storage_quota BIGINT DEFAULT 5368709120,  -- 5 GB in bytes
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Lawyer Profiles (extends users for lawyer-specific data)
CREATE TABLE lawyer_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bar_license_no    VARCHAR(100) UNIQUE,
  cnic              VARCHAR(15),
  specializations   TEXT[],           -- array: ['Civil', 'Criminal', 'Corporate']
  city              VARCHAR(100),
  province          VARCHAR(100),
  is_verified       BOOLEAN DEFAULT FALSE,
  win_rate          DECIMAL(5,2),     -- cached, updated by background job
  active_cases_count INT DEFAULT 0,   -- cached count
  profile_photo_url TEXT,
  bio               TEXT
);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,  -- store hash, not raw token
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Email Verification Tokens
CREATE TABLE verification_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL,
  type       VARCHAR(30) CHECK (type IN ('EmailVerification','PasswordReset')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ
);

-- Audit Log (every sensitive action)
CREATE TABLE audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,  -- 'CASE_CREATED', 'DOCUMENT_DOWNLOADED', etc.
  entity_type VARCHAR(50),
  entity_id   UUID,
  ip_address  VARCHAR(45),
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

### ⚖️ Cases

```sql
-- Cases (core entity)
CREATE TABLE cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id         UUID NOT NULL REFERENCES firms(id),
  lead_lawyer_id  UUID NOT NULL REFERENCES users(id),
  client_id       UUID NOT NULL REFERENCES clients(id),
  case_number     VARCHAR(100),          -- e.g. "CASE-2024-011"
  title           VARCHAR(500) NOT NULL,
  court_name      VARCHAR(255),
  case_type       VARCHAR(50) CHECK (case_type IN (
                    'Civil','Criminal','Corporate','Family',
                    'Property','Labour','Tax','Constitutional','Banking')),
  status          VARCHAR(20) DEFAULT 'Filed' CHECK (status IN (
                    'Filed','Active','Heard','Reserved','Decided','Appeal','Closed','Discovery','Negotiation')),
  priority        VARCHAR(10) DEFAULT 'Normal' CHECK (priority IN ('Critical','High','Medium','Normal','Low')),
  stage           VARCHAR(50),
  fir_number      VARCHAR(100),
  filing_date     DATE,
  next_date       DATE,
  judge_name      VARCHAR(255),
  opposing_counsel VARCHAR(255),
  description     TEXT,
  is_archived     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Case Team (which lawyers/clerks are assigned)
CREATE TABLE case_assignments (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id   UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id),
  role      VARCHAR(30) DEFAULT 'AssistingLawyer',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (case_id, user_id)
);

-- Case Timeline Events
CREATE TABLE case_timeline (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  created_by  UUID REFERENCES users(id),
  event_type  VARCHAR(50) CHECK (event_type IN (
                'Filed','Hearing','Adjournment','Order','Submission',
                'Document','Note','StatusChange','Appeal')),
  title       VARCHAR(500) NOT NULL,
  description TEXT,
  event_date  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Case Notes (internal, confidential)
CREATE TABLE case_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  is_private  BOOLEAN DEFAULT FALSE,   -- if true, only lead lawyer sees it
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Linked Cases (case references another case)
CREATE TABLE case_links (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  linked_case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  link_type    VARCHAR(50),  -- 'Appeal', 'Related', 'SplitFrom'
  UNIQUE (case_id, linked_case_id)
);

-- Documents table
CREATE TABLE case_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  uploaded_by     UUID NOT NULL REFERENCES users(id),
  file_name       VARCHAR(500) NOT NULL,
  file_type       VARCHAR(20),
  file_size       VARCHAR(50),
  file_url        TEXT NOT NULL,
  description     TEXT,
  is_confidential BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Deadlines / Tasks per Case
CREATE TABLE case_deadlines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  title       VARCHAR(500) NOT NULL,
  due_date    TIMESTAMPTZ NOT NULL,
  is_done     BOOLEAN DEFAULT FALSE,
  priority    VARCHAR(10) DEFAULT 'Normal',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 📅 Hearings

```sql
CREATE TABLE hearings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  firm_id         UUID NOT NULL REFERENCES firms(id),
  lead_lawyer_id  UUID NOT NULL REFERENCES users(id),
  client_id       UUID REFERENCES clients(id),
  hearing_title   VARCHAR(500),
  court_name      VARCHAR(255) NOT NULL,
  court_type      VARCHAR(50) CHECK (court_type IN (
                    'DistrictCourt','HighCourt','SupremeCourt',
                    'FamilyCourt','BankingCourt','NABCourt','Tribunal')),
  judge_name      VARCHAR(255),
  hearing_date    TIMESTAMPTZ NOT NULL,
  duration_mins   INT DEFAULT 60,
  status          VARCHAR(20) DEFAULT 'Scheduled' CHECK (status IN (
                    'Scheduled','Adjourned','Completed','Cancelled')),
  room_number     VARCHAR(50),
  notes           TEXT,
  reminder_sent   BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Adjournments
CREATE TABLE hearing_adjournments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_id      UUID NOT NULL REFERENCES hearings(id) ON DELETE CASCADE,
  adjourned_by    UUID REFERENCES users(id),
  original_date   TIMESTAMPTZ NOT NULL,
  new_date        TIMESTAMPTZ,
  reason          TEXT,
  court_order_ref VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 👤 Clients

```sql
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id         UUID NOT NULL REFERENCES firms(id),
  created_by      UUID NOT NULL REFERENCES users(id),
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(255),
  phone           VARCHAR(20),
  cnic            VARCHAR(15),
  client_type     VARCHAR(20) DEFAULT 'Individual'
                  CHECK (client_type IN ('Individual','Corporate')),
  company_name    VARCHAR(255),         -- for corporate clients
  address         TEXT,
  city            VARCHAR(100),
  tags            TEXT[],               -- ['VIP', 'Corporate', 'Criminal Defense']
  status          VARCHAR(20) DEFAULT 'Active'
                  CHECK (status IN ('Active','Inactive','Conflicted')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Client Interactions (calls, meetings, emails)
CREATE TABLE client_interactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  type            VARCHAR(20) CHECK (type IN ('Call','Meeting','Email','WhatsApp','Visit')),
  summary         TEXT NOT NULL,
  duration_mins   INT,
  outcome         TEXT,
  next_action     TEXT,
  interaction_date TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Conflict of Interest Records
CREATE TABLE conflict_checks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id         UUID NOT NULL REFERENCES firms(id),
  checked_by      UUID NOT NULL REFERENCES users(id),
  client_name     VARCHAR(255) NOT NULL,
  opposing_party  VARCHAR(255),
  result          VARCHAR(20) CHECK (result IN ('Clear','Conflict','NeedsReview')),
  notes           TEXT,
  checked_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 📄 Document Vault

```sql
CREATE TABLE document_folders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id     UUID NOT NULL REFERENCES firms(id),
  name        VARCHAR(255) NOT NULL,
  parent_id   UUID REFERENCES document_folders(id),  -- for nested folders
  color       VARCHAR(50),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id         UUID NOT NULL REFERENCES firms(id),
  folder_id       UUID REFERENCES document_folders(id),
  case_id         UUID REFERENCES cases(id),
  client_id       UUID REFERENCES clients(id),
  uploaded_by     UUID NOT NULL REFERENCES users(id),
  file_name       VARCHAR(500) NOT NULL,
  file_type       VARCHAR(20),                        -- 'PDF', 'DOCX', 'XLSX', 'IMG', 'ZIP'
  mime_type       VARCHAR(100),
  file_size_bytes BIGINT NOT NULL,
  storage_url     TEXT NOT NULL,                      -- S3/Azure Blob URL (private)
  storage_key     TEXT NOT NULL,                      -- unique key in blob storage
  is_confidential BOOLEAN DEFAULT FALSE,
  is_ocr_indexed  BOOLEAN DEFAULT FALSE,
  ocr_text        TEXT,                               -- extracted text for full-text search
  current_version INT DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_ocr ON documents USING GIN (to_tsvector('english', ocr_text));

-- Document Versions
CREATE TABLE document_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number  INT NOT NULL,
  storage_url     TEXT NOT NULL,
  storage_key     TEXT NOT NULL,
  file_size_bytes BIGINT,
  uploaded_by     UUID NOT NULL REFERENCES users(id),
  change_summary  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Document Shares (secure sharing links)
CREATE TABLE document_shares (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  shared_by       UUID NOT NULL REFERENCES users(id),
  share_token     VARCHAR(255) UNIQUE NOT NULL,   -- random secure token
  password_hash   VARCHAR(255),                   -- optional password
  shared_with     VARCHAR(255),                   -- email or 'client', 'opponent'
  expires_at      TIMESTAMPTZ NOT NULL,
  accessed_at     TIMESTAMPTZ,                    -- first access time
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### ✏️ Document Drafting (AI-powered)

```sql
CREATE TABLE document_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id         UUID REFERENCES firms(id),    -- NULL = system-wide template
  created_by      UUID REFERENCES users(id),
  name            VARCHAR(255) NOT NULL,
  category        VARCHAR(50),                  -- 'Litigation', 'Corporate', etc.
  description     TEXT,
  content         TEXT NOT NULL,                -- the template body with {{placeholders}}
  is_ai_generated BOOLEAN DEFAULT FALSE,
  usage_count     INT DEFAULT 0,
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clause_bank (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id     UUID REFERENCES firms(id),
  created_by  UUID REFERENCES users(id),
  title       VARCHAR(255) NOT NULL,
  category    VARCHAR(100),
  content     TEXT NOT NULL,
  tags        TEXT[],
  usage_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE drafts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id         UUID NOT NULL REFERENCES firms(id),
  created_by      UUID NOT NULL REFERENCES users(id),
  template_id     UUID REFERENCES document_templates(id),
  case_id         UUID REFERENCES cases(id),
  client_id       UUID REFERENCES clients(id),
  title           VARCHAR(500) NOT NULL,
  content         TEXT NOT NULL,
  status          VARCHAR(20) DEFAULT 'Draft'
                  CHECK (status IN ('Draft','Review','Final','Archived')),
  version         INT DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE draft_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id    UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
  version_no  INT NOT NULL,
  content     TEXT NOT NULL,
  saved_by    UUID REFERENCES users(id),
  saved_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 💰 Fee & Billing

```sql
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id         UUID NOT NULL REFERENCES firms(id),
  created_by      UUID NOT NULL REFERENCES users(id),
  client_id       UUID NOT NULL REFERENCES clients(id),
  case_id         UUID REFERENCES cases(id),
  invoice_number  VARCHAR(50) UNIQUE NOT NULL,  -- INV-2024-034
  invoice_date    DATE NOT NULL,
  due_date        DATE NOT NULL,
  status          VARCHAR(20) DEFAULT 'Draft'
                  CHECK (status IN ('Draft','Pending','Paid','Overdue','PartiallyPaid','Cancelled')),
  subtotal        DECIMAL(12,2) NOT NULL,
  tax_rate        DECIMAL(5,2) DEFAULT 0,
  tax_amount      DECIMAL(12,2) DEFAULT 0,
  total           DECIMAL(12,2) NOT NULL,
  paid_amount     DECIMAL(12,2) DEFAULT 0,
  currency        CHAR(3) DEFAULT 'PKR',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  hours       DECIMAL(8,2) DEFAULT 0,
  rate        DECIMAL(12,2) NOT NULL,
  amount      DECIMAL(12,2) NOT NULL,
  sort_order  INT DEFAULT 0
);

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id),
  firm_id         UUID NOT NULL REFERENCES firms(id),
  client_id       UUID NOT NULL REFERENCES clients(id),
  amount          DECIMAL(12,2) NOT NULL,
  payment_date    DATE NOT NULL,
  method          VARCHAR(30) CHECK (method IN (
                    'Cash','Cheque','BankTransfer','OnlineTransfer','Mobile')),
  reference_no    VARCHAR(100),
  notes           TEXT,
  recorded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE retainers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id         UUID NOT NULL REFERENCES firms(id),
  client_id       UUID NOT NULL REFERENCES clients(id),
  total_amount    DECIMAL(12,2) NOT NULL,
  used_amount     DECIMAL(12,2) DEFAULT 0,
  billing_cycle   VARCHAR(20) CHECK (billing_cycle IN ('Monthly','Quarterly','Yearly')),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  status          VARCHAR(20) DEFAULT 'Active'
                  CHECK (status IN ('Active','Expiring','Exhausted','Expired')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE billing_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id     UUID NOT NULL REFERENCES firms(id),
  name        VARCHAR(255) NOT NULL,
  category    VARCHAR(50),
  description TEXT,
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE billing_template_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_template_id UUID NOT NULL REFERENCES billing_templates(id) ON DELETE CASCADE,
  description         TEXT NOT NULL,
  rate                DECIMAL(12,2) NOT NULL,
  sort_order          INT DEFAULT 0
);
```

---

### 🔔 Notifications

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  firm_id         UUID REFERENCES firms(id),
  type            VARCHAR(30) CHECK (type IN (
                    'Urgent','Hearing','Payment','Document',
                    'Reminder','Client','Case','Team')),
  priority        VARCHAR(10) CHECK (priority IN ('Critical','High','Medium','Low')),
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  detail          TEXT,
  entity_type     VARCHAR(50),   -- 'Case', 'Hearing', 'Invoice', etc.
  entity_id       UUID,
  action_label    VARCHAR(100),
  is_read         BOOLEAN DEFAULT FALSE,
  is_dismissed    BOOLEAN DEFAULT FALSE,
  source          VARCHAR(100),  -- 'Case Management', 'Billing', etc.
  related_case    VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);

CREATE TABLE notification_preferences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{
    "urgent":   {"email":true,"push":true,"inApp":true,"sound":true},
    "hearing":  {"email":true,"push":true,"inApp":true,"sound":true},
    "payment":  {"email":true,"push":false,"inApp":true,"sound":false},
    "document": {"email":false,"push":false,"inApp":true,"sound":false},
    "reminder": {"email":true,"push":true,"inApp":true,"sound":true},
    "client":   {"email":true,"push":true,"inApp":true,"sound":false},
    "case":     {"email":true,"push":false,"inApp":true,"sound":false},
    "team":     {"email":false,"push":false,"inApp":true,"sound":false}
  }'::JSONB
);
```

---

### 👥 Team Management

```sql
-- team member invitations
CREATE TABLE team_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id     UUID NOT NULL REFERENCES firms(id),
  invited_by  UUID NOT NULL REFERENCES users(id),
  email       VARCHAR(255) NOT NULL,
  role        VARCHAR(20) NOT NULL,
  token       VARCHAR(255) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks assigned to team members
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id         UUID NOT NULL REFERENCES firms(id),
  case_id         UUID REFERENCES cases(id),
  assigned_to     UUID NOT NULL REFERENCES users(id),
  assigned_by     UUID NOT NULL REFERENCES users(id),
  title           TEXT NOT NULL,
  description     TEXT,
  type            VARCHAR(20) CHECK (type IN ('Research','Drafting','CasePrep','Filing','Other')),
  priority        VARCHAR(10) DEFAULT 'Medium' CHECK (priority IN ('High','Medium','Low')),
  status          VARCHAR(20) DEFAULT 'Pending'
                  CHECK (status IN ('Pending','InProgress','Completed','Cancelled')),
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Team Activity Log
CREATE TABLE team_activity (
  id          BIGSERIAL PRIMARY KEY,
  firm_id     UUID NOT NULL REFERENCES firms(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,  -- 'Accessed case file', 'Uploaded document'
  target      TEXT,                   -- what they acted on
  entity_type VARCHAR(50),
  entity_id   UUID,
  log_type    VARCHAR(20) CHECK (log_type IN ('case','document','note','billing','login')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_team_activity_firm ON team_activity(firm_id, created_at DESC);
```

---

## PART 3: ALL API ENDPOINTS

> Base URL: `https://api.wukala.com/api/v1`
> All protected routes require: `Authorization: Bearer <token>`

---

### 🔐 Authentication

```
POST   /auth/register              → Register new lawyer
POST   /auth/login                 → Login, returns accessToken + sets refresh cookie
POST   /auth/refresh               → Get new accessToken using refresh cookie
POST   /auth/logout                → Revoke refresh token, blacklist in Redis
POST   /auth/verify-email          → Verify email with token
POST   /auth/forgot-password       → Send reset email
POST   /auth/reset-password        → Reset with token
GET    /auth/me                    → Get current user profile
PATCH  /auth/me                    → Update profile
```

### 📊 Dashboard

```
GET    /dashboard/overview         → Stats: active cases, win rate, revenue, tasks
                                     Query: ?period=30d|7d|today
```

### ⚖️ Cases

```
GET    /cases                      → List cases (paginated, filtered, searched)
                                     Query: ?status=Active&type=Civil&search=Khan&page=1&limit=20
POST   /cases                      → Create new case
GET    /cases/:id                  → Full case detail (with timeline, notes, linked cases)
PATCH  /cases/:id                  → Update case (status, judge, next date, etc.)
DELETE /cases/:id                  → Archive case (soft delete)

GET    /cases/:id/timeline         → Case timeline events
POST   /cases/:id/timeline         → Add timeline event

GET    /cases/:id/notes            → Case notes
POST   /cases/:id/notes            → Add note
PATCH  /cases/:id/notes/:noteId    → Edit note
DELETE /cases/:id/notes/:noteId    → Delete note

GET    /cases/:id/documents        → Documents linked to case
POST   /cases/:id/documents        → Upload document to case (multipart/form-data)
        Body: file, description, isConfidential

GET    /cases/:id/deadlines        → Deadlines for case
POST   /cases/:id/deadlines        → Create deadline
PATCH  /cases/:id/deadlines/:dlId  → Mark done, edit
DELETE /cases/:id/deadlines/:dlId  → Delete

GET    /cases/:id/assignments      → Team members on case
POST   /cases/:id/assignments      → Assign team member
DELETE /cases/:id/assignments/:uid → Remove assignment

POST   /cases/:id/link             → Link to another case
        Body: { linkedCaseId, linkType }
```

### 📅 Hearings

```
GET    /hearings                   → List hearings
                                     Query: ?upcoming=true&caseId=xx&month=2024-03
POST   /hearings                   → Schedule hearing
GET    /hearings/:id               → Hearing detail
PATCH  /hearings/:id               → Update hearing
DELETE /hearings/:id               → Cancel hearing

POST   /hearings/:id/adjourn       → Record adjournment
        Body: { newDate, reason, courtOrderRef }

GET    /hearings/conflicts          → Detect conflicts
        Query: ?date=2024-03-15&duration=60
```

### 👤 Clients

```
GET    /clients                    → List clients (paginated, searched)
POST   /clients                    → Create client
GET    /clients/:id                → Client full profile
PATCH  /clients/:id                → Update client
DELETE /clients/:id                → Archive client

GET    /clients/:id/interactions   → Interaction history
POST   /clients/:id/interactions   → Log new interaction
PATCH  /clients/:id/interactions/:iid → Edit
DELETE /clients/:id/interactions/:iid → Delete

GET    /clients/:id/cases          → All cases for client
GET    /clients/:id/documents      → Docs shared with client

POST   /clients/conflict-check     → Check conflict of interest
        Body: { clientName, opposingParty }
```

### 📁 Document Vault

```
GET    /documents                  → List documents (paginated, filtered)
                                     Query: ?folderId=xx&caseId=xx&type=PDF&search=khan
POST   /documents/upload           → Upload (multipart/form-data)
        Body: file, folderId, caseId, clientId, isConfidential
GET    /documents/:id              → File metadata + download URL (pre-signed URL)
PATCH  /documents/:id              → Update metadata
DELETE /documents/:id              → Soft delete

GET    /documents/:id/versions     → Version history
POST   /documents/:id/versions     → Upload new version

POST   /documents/:id/share        → Generate secure share link
        Body: { expiresInHours, password }
GET    /documents/shared/:token    → Access shared document (no auth required)

GET    /documents/folders          → Folder tree
POST   /documents/folders          → Create folder
PATCH  /documents/folders/:id      → Rename folder
DELETE /documents/folders/:id      → Delete empty folder

GET    /documents/search           → Full-text OCR search
        Query: ?q=sale+agreement&folderId=xx
```

### ✏️ Document Drafting

```
GET    /drafting/templates         → List templates
POST   /drafting/templates         → Create template
GET    /drafting/templates/:id     → Get template
PATCH  /drafting/templates/:id     → Update
DELETE /drafting/templates/:id     → Delete
POST   /drafting/templates/ai-generate → AI generates template from prompt
        Body: { prompt, category }

GET    /drafting/clauses           → Clause bank list
POST   /drafting/clauses           → Add clause
PATCH  /drafting/clauses/:id       → Edit clause
DELETE /drafting/clauses/:id       → Delete

GET    /drafting/drafts            → All drafts (paginated)
POST   /drafting/drafts            → Create draft from template
GET    /drafting/drafts/:id        → Full draft with versions
PATCH  /drafting/drafts/:id        → Auto-save content
POST   /drafting/drafts/:id/finalize → Mark as Final
POST   /drafting/drafts/:id/versions → Save version snapshot

GET    /drafting/drafts/:id/export → Export as PDF or DOCX
```

### 💰 Fee & Billing

```
GET    /billing/invoices           → List invoices (paginated, filtered)
                                     Query: ?status=Pending&clientId=xx
POST   /billing/invoices           → Create invoice
GET    /billing/invoices/:id       → Invoice detail with line items
PATCH  /billing/invoices/:id       → Update invoice
DELETE /billing/invoices/:id       → Delete draft invoice

POST   /billing/invoices/:id/send  → Email invoice to client
GET    /billing/invoices/:id/pdf   → Download PDF

POST   /billing/payments           → Record payment
        Body: { invoiceId, amount, method, referenceNo, paymentDate }
GET    /billing/payments           → Payment history

GET    /billing/retainers          → List retainers
POST   /billing/retainers          → Create retainer
GET    /billing/retainers/:id      → Retainer detail
PATCH  /billing/retainers/:id      → Update
POST   /billing/retainers/:id/renew → Renew retainer

GET    /billing/templates          → Billing templates
POST   /billing/templates          → Create billing template
PATCH  /billing/templates/:id      → Update
DELETE /billing/templates/:id      → Delete

GET    /billing/summary            → Revenue summary
                                     Query: ?period=monthly|yearly|custom&from=&to=
```

### 🔔 Notifications

```
GET    /notifications              → List notifications (paginated)
                                     Query: ?unread=true&type=Urgent&page=1
PATCH  /notifications/:id/read     → Mark single as read
POST   /notifications/read-all     → Mark all as read
DELETE /notifications/:id          → Dismiss notification
DELETE /notifications/dismissed    → Clear all dismissed

GET    /notifications/preferences  → Get notification preferences
PATCH  /notifications/preferences  → Update preferences
        Body: { urgent: { email: true, push: false, ... }, ... }
```

### 📈 Analytics

```
GET    /analytics/kpis             → KPI cards (cases, win rate, revenue, etc.)
                                     Query: ?period=3m|6m|12m
GET    /analytics/revenue          → Revenue vs expenses trend
GET    /analytics/cases            → Case outcomes, win rate by type/court
GET    /analytics/clients          → Client portfolio, acquisition sources
GET    /analytics/workload         → Workload heatmap + busiest days
GET    /analytics/export           → Export full report as PDF/Excel
```

### 👥 Team Management

```
GET    /team                       → List team members
POST   /team/invite                → Send invitation email
        Body: { email, role }
DELETE /team/:userId               → Remove member
PATCH  /team/:userId/role          → Change role

GET    /team/tasks                 → Task board (all firm tasks)
                                     Query: ?status=Pending&assignedTo=xx
POST   /team/tasks                 → Assign task
PATCH  /team/tasks/:id             → Update task status
DELETE /team/tasks/:id             → Delete task

GET    /team/activity              → Activity log
                                     Query: ?userId=xx&limit=50
GET    /team/calendar              → Firm-wide today's hearing schedule
```

---

## PART 4: REAL-TIME (SignalR / WebSocket)

> Use **ASP.NET Core SignalR** (since .NET backend). Hubs run behind the API Gateway.

### SignalR Hub: `/hubs/lawyer`

```
Server → Client Events:
  "NewNotification"       → { notification object }   — push instantly
  "HearingReminder"       → { hearingId, minutesBefore }
  "CaseStatusChanged"     → { caseId, newStatus, changedBy }
  "DocumentUploaded"      → { documentId, uploadedBy, caseId }
  "PaymentReceived"       → { invoiceId, amount, clientName }
  "TeamActivityUpdate"    → { action, member, target }

Client → Server Events:
  JoinFirmGroup(firmId)   → Subscribe to firm-wide events
  LeaveGroup(firmId)
  TypingInDraft(draftId)  → Collaborative editing indicator
```

### Redis Pub/Sub (for multi-instance scaling)

```
When any server instance receives an event (e.g., payment from webhook):
  → Publishes to Redis channel "firm:{firmId}:events"
  → All SignalR server instances subscribed to that channel
  → Forward to connected clients
```

---

## PART 5: FILE STORAGE ARCHITECTURE

```
Upload Flow:
  1. Client → POST /documents/upload (multipart, max 50MB)
  2. API validates: file type, size, virus scan (ClamAV)
  3. API streams to Azure Blob Storage (private container)
  4. API stores metadata in documents table
  5. If PDF/Image: Queue OCR job → Azure Form Recognizer / Tesseract
  6. OCR result stored in documents.ocr_text
  7. Full-text search index updated

Download Flow:
  1. Client → GET /documents/:id
  2. API checks permission (firm member + has access)
  3. API generates pre-signed URL (valid 15 minutes)
  4. Client downloads directly from Blob Storage (bypasses API)

Shared Link Flow:
  1. POST /documents/:id/share → generates random token, stores in document_shares
  2. Share URL: https://wukala.com/shared/{token}
  3. GET /documents/shared/{token} → validates token, expiry, password
  4. If valid: generate pre-signed URL for client
```

---

## PART 6: AUTHENTICATION & AUTHORIZATION

### JWT Structure

```json
// Access Token Payload
{
  "sub": "user-uuid",
  "email": "sara@lawfirm.pk",
  "role": "Lawyer",
  "firmId": "firm-uuid",
  "permissions": ["cases:read","cases:write","billing:read"],
  "exp": 1711450000,
  "iat": 1711449100
}
```

### Role-Based Access Control (RBAC)

```
Role          │ Cases    │ Clients  │ Billing  │ Vault    │ Team     │ Analytics
──────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────
Lawyer        │ full     │ full     │ full     │ full     │ view     │ full
Administrator │ full     │ full     │ full     │ full     │ full     │ full
JuniorLawyer  │ r/w      │ r/w      │ view     │ r/w      │ view     │ view
Clerk         │ view     │ view     │ none     │ upload   │ view     │ none
SuperAdmin    │ all      │ all      │ all      │ all      │ all      │ all

Notes:
- JuniorLawyer only sees cases they are ASSIGNED to
- Clerk only sees today's hearings + approved documents
- Billing is invisible to clerks
```

### Data Isolation (Multi-Tenancy)

```
Every query MUST include firm_id filter.
Middleware automatically injects: WHERE firm_id = '{user.firmId}'
Never allow cross-firm data access — enforce at database query level.
```

---

## PART 7: REDIS CACHING STRATEGY

```
Key Pattern                          TTL     Purpose
─────────────────────────────────────────────────────────────────
jwt:blacklist:{jti}                  15m     Revoked access tokens
session:refresh:{userId}             7d      Refresh token binding
rate:limit:{ip}:{endpoint}           1m      API rate limiting (100 req/min)
cache:dashboard:{userId}             5m      Dashboard overview stats
cache:cases:list:{firmId}:{hash}     2m      Case list (invalidate on write)
cache:analytics:{firmId}:{period}    1h      Analytics data (heavy compute)
cache:notifications:{userId}         30s     Notification count badge
signalr:group:{firmId}               —       SignalR pub/sub channel
```

---

## PART 8: BACKGROUND JOBS (Hangfire / Quartz.NET)

```
Job                          Schedule        Description
───────────────────────────────────────────────────────────────────────────
HearingReminderJob           Every 15 min    Check hearings in next 24hrs,
                                             send push + email if not sent
DeadlineAlertJob             9 AM daily      Find deadlines due in 48hrs,
                                             create notifications
InvoiceOverdueJob            7 AM daily      Mark invoices past due date
                                             as Overdue, create notification
RetainerExpiryJob            8 AM daily      Check retainers expiring in 30 days
OcrProcessingJob             On upload       Process new documents for OCR
AnalyticsCacheWarmJob        Midnight        Pre-compute analytics for all firms
CleanupJob                   4 AM daily      Delete expired share links,
                                             old verification tokens, dismissed
                                             notifications older than 90 days
WinRateRecalcJob             Sunday 2 AM     Recalculate lawyer win rates
                                             from decided cases
```

---

## PART 9: COMPLETE SYSTEM ARCHITECTURE

```
                        ┌─────────────────────────────┐
                        │      Cloudflare CDN/WAF      │
                        └──────────────┬──────────────┘
                                       │
                        ┌──────────────▼──────────────┐
                        │      API Gateway (Nginx)     │
                        │  Rate limit │ SSL │ Routing  │
                        └──────┬──────────────┬────────┘
                               │              │
               ┌───────────────▼──┐    ┌──────▼──────────────┐
               │  .NET 8 Web API  │    │  SignalR Hub Server  │
               │  (Horizontal     │    │  (can scale out with │
               │   scale: 3+)     │    │   Redis backplane)   │
               └──────┬───────────┘    └──────┬──────────────┘
                      │                       │
         ┌────────────┼───────────────────────┘
         │            │
    ┌────▼────┐  ┌────▼────────────────────────────────────┐
    │  Redis  │  │              PostgreSQL                  │
    │  Cache  │  │  (Primary + Read Replica for analytics) │
    └─────────┘  └─────────────────────────────────────────┘
         │
    ┌────▼─────────────────────────────────────────────────┐
    │              External Services                        │
    │  ├─ Azure Blob Storage (encrypted file storage)       │
    │  ├─ Azure Form Recognizer (OCR)                      │
    │  ├─ OpenAI / Azure OpenAI (AI document drafting)     │
    │  ├─ SendGrid (transactional emails)                  │
    │  ├─ Firebase Cloud Messaging (push notifications)    │
    │  ├─ Hangfire (background jobs)                       │
    │  └─ Stripe/JazzCash (payment gateway — future)      │
    └──────────────────────────────────────────────────────┘
```

---

## PART 10: SECURITY CHECKLIST

```
✅ Authentication
  - JWT access token: 15 min expiry, stored in memory only
  - Refresh token: 7 days, HttpOnly Secure cookie (XSS-safe)
  - Refresh token rotation: new token issued on each refresh
  - Blacklist revoked tokens in Redis

✅ Authorization
  - RBAC middleware on every protected route
  - firm_id injected into every DB query (multi-tenancy isolation)
  - Case-level access: only assigned members can view

✅ API Security
  - HTTPS only (TLS 1.3)
  - CORS: whitelist only wukala.com
  - Rate limiting: 100 req/min per IP, stricter on /auth
  - Input validation: FluentValidation on all request models
  - SQL: ONLY parameterized queries / EF Core (no raw SQL interpolation)
  - File uploads: type whitelist, size limit, virus scan

✅ Data Security
  - Files: AES-256 at rest in Azure Blob (private containers only)
  - Pre-signed URLs expire in 15 minutes
  - Passwords: bcrypt, 12 rounds
  - PII (CNIC, phone): encrypted at column level (PostgreSQL pgcrypto)
  - Audit log: every sensitive action tracked with IP + userId

✅ Infrastructure
  - WAF (Cloudflare) blocks SQLi, XSS, DDoS
  - Secrets: Azure Key Vault (no secrets in code or .env committed)
  - Dependency scanning: automated in CI/CD pipeline
```

---

## PART 11: IMPLEMENTATION ORDER (What to Build First)

```
Sprint 1 (Week 1-2): Foundation
  ✅ PostgreSQL schema + migrations (EF Core)
  ✅ Auth module: register, login, JWT, refresh, email verify
  ✅ Firm + User management
  ✅ Redis setup: token blacklist + rate limiting

Sprint 2 (Week 3-4): Core Modules
  ✅ Cases: full CRUD + timeline + notes
  ✅ Clients: full CRUD + interactions
  ✅ Hearings: CRUD + conflict detection

Sprint 3 (Week 5-6): Files & Documents
  ✅ Azure Blob integration
  ✅ Document upload/download + pre-signed URLs
  ✅ Folders + sharing + version control
  ✅ OCR background job

Sprint 4 (Week 7-8): Business Logic
  ✅ Billing: invoices + payments + retainers
  ✅ Notifications: DB + SignalR real-time push
  ✅ Background jobs: reminders, overdue alerts

Sprint 5 (Week 9-10): Intelligence Layer
  ✅ Analytics: all KPI endpoints + caching
  ✅ Team management: tasks + activity log
  ✅ Document drafting: templates + AI integration
  ✅ Dashboard overview aggregate endpoint
```
