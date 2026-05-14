# Wukala-GPT Lawyer Dashboard — Complete Backend Flow & Architecture

> **Status of Modules:** Case Management ✅ | Hearing Calendar ✅ | Client CRM ✅ | Document Drafting ✅ | Fee & Billing ✅ | Smart Notifications ⚠️ | Practice Analytics ⚠️ | Team Management ⚠️ | Document Vault ⚠️ | Dashboard Overview ⚠️

---

## 🔑 Core Principles Before We Start

### How Frontend Currently Works (Critical to Understand)
The entire dashboard is a **single-page shell** — `LawyerDashboard.tsx` manages `activeSection` state and each sub-module renders in place. There are **NO sub-routes** like `/lawyer-dashboard/cases`. Each component fetches its own data independently when mounted.

### Auth Connection Point
- Frontend currently has **zero backend auth** — it reads `localStorage('auth_user')`
- Your existing Auth backend has JWT tokens
- **Fix**: Replace `useAuth()` calls with JWT-backed user. The `user.id` from JWT becomes the `lawyerId` for ALL queries

### All Data is Pakistan-Specific
- Currency: PKR (₨) — store as numbers, format on frontend
- CNIC format: `XXXXX-XXXXXXX-X`
- Courts: LHC, Islamabad Sessions, Supreme Court of Pakistan

---

## 📐 Database Entity Relationships

```
Lawyer (user with role='lawyer')
  ├── Cases (one-to-many)
  │     ├── CaseTimeline (one-to-many)
  │     ├── CaseNotes (one-to-many)
  │     ├── CaseDocuments (one-to-many)
  │     └── LinkedCases (self-referential many-to-many)
  ├── Hearings (one-to-many, each linked to a Case)
  ├── Clients (one-to-many)
  │     ├── ClientInteractions (one-to-many)
  │     └── ClientSharedDocuments (one-to-many)
  ├── Invoices (one-to-many)
  │     └── InvoiceItems (one-to-many)
  ├── Retainers (one-to-many)
  ├── BillingTemplates (one-to-many)
  ├── Payments (one-to-many)
  ├── DraftDocuments (one-to-many)
  ├── DocumentVaultFiles (one-to-many)
  ├── TeamMembers (one-to-many)
  └── Notifications (one-to-many)
```

---

## 🟢 MODULE 1: Case Management

### What the Frontend Shows
The most complex module (968 lines):
- **List View**: Search, tab filter (All/Active/Discovery/Appeal/Negotiation), advanced filter (Court + Case Type)
- **Pipeline Summary**: Clickable stage counters (Filed → Active → Heard → Reserved → Decided → Appeal)
- **Detail View**: Status pipeline tracker, Info Grid (Judge, Opposing Counsel, Next Hearing, Filed Date), Description, Linked Cases, 3 tabs: **Timeline | Documents | Notes**
- **New Case Dialog**: Form to create a new case

### Database Tables

#### `cases` table
```sql
id               UUID PRIMARY KEY
lawyer_id        UUID FK → users.id
title            VARCHAR(255)       -- "Khan Industries v. FBR"
case_number      VARCHAR(100)       -- "WP No. 12847/2024"
fir_number       VARCHAR(100)       -- nullable, criminal cases only
client_id        UUID FK → clients.id
court            VARCHAR(200)       -- "Lahore High Court"
judge            VARCHAR(200)
opposing_counsel VARCHAR(200)
type             ENUM('Tax','Criminal','Civil','Property','Banking','Labour','Corporate')
status           ENUM('Filed','Active','Heard','Reserved','Decided','Appeal','Discovery','Negotiation')
priority         ENUM('Critical','High','Medium','Low')
outcome          ENUM('Won','Lost','Settled')  -- nullable, set when status=Decided
next_hearing     DATE
stage            VARCHAR(100)       -- "Arguments", "Evidence", "Mediation"
filed_date       DATE
description      TEXT
created_at       TIMESTAMP
updated_at       TIMESTAMP
```

#### `case_linked_cases` table
```sql
case_id        UUID FK → cases.id
linked_case_id UUID FK → cases.id
PRIMARY KEY (case_id, linked_case_id)
```

#### `case_timeline` table
```sql
id          UUID PRIMARY KEY
case_id     UUID FK → cases.id
date        DATE
title       VARCHAR(255)
description TEXT
type        ENUM('hearing','order','filing','adjournment','document','note')
created_at  TIMESTAMP
```

#### `case_notes` table
```sql
id          UUID PRIMARY KEY
case_id     UUID FK → cases.id
author_id   UUID FK → users.id
author_name VARCHAR(100)   -- denormalized for speed
content     TEXT
created_at  TIMESTAMP
```

#### `case_documents` table
```sql
id               UUID PRIMARY KEY
case_id          UUID FK → cases.id
name             VARCHAR(255)
type             ENUM('PDF','DOCX','XLSX','ZIP','IMG')
size_bytes       BIGINT
file_url         VARCHAR(500)
uploaded_by_id   UUID FK → users.id
uploaded_by_name VARCHAR(100)       -- denormalized
confidential     BOOLEAN DEFAULT false
uploaded_at      TIMESTAMP
```

### API Endpoints
```
GET    /api/lawyer/cases                           List cases (filtered + paginated)
POST   /api/lawyer/cases                           Create new case
GET    /api/lawyer/cases/:id                       Single case with all sub-data
PUT    /api/lawyer/cases/:id                       Update case
DELETE /api/lawyer/cases/:id                       Archive case

GET    /api/lawyer/cases/:id/timeline              Timeline events
POST   /api/lawyer/cases/:id/timeline              Add event

GET    /api/lawyer/cases/:id/notes                 Notes list
POST   /api/lawyer/cases/:id/notes                 Add note

GET    /api/lawyer/cases/:id/documents             Documents list
POST   /api/lawyer/cases/:id/documents             Upload document (multipart)
DELETE /api/lawyer/cases/:caseId/documents/:docId  Delete document

POST   /api/lawyer/cases/:id/links                 Link two cases
DELETE /api/lawyer/cases/:id/links/:linkedId       Unlink cases
```

### Query Parameters for GET /api/lawyer/cases
```
?search=     full-text across title, case_number, court, client name
?status=     matches status ENUM (tab filter)
?court=      court name filter
?type=       case type filter
?page=1&limit=20
```

### Response Shape (matches frontend CaseFile type)
```json
{
  "cases": [{
    "id": "uuid",
    "title": "Khan Industries v. FBR",
    "caseNumber": "WP No. 12847/2024",
    "firNumber": null,
    "client": "Khan Industries Ltd.",
    "clientId": "uuid",
    "court": "Lahore High Court",
    "judge": "Justice Malik Shahzad Ahmad",
    "opposingCounsel": "Adv. Tariq Hussain",
    "type": "Tax",
    "status": "Active",
    "priority": "High",
    "nextHearing": "2024-03-15",
    "stage": "Arguments",
    "filedDate": "2024-01-10",
    "description": "...",
    "linkedCases": ["uuid-of-linked"],
    "timeline": [...],
    "notes": [...],
    "documents": [...]
  }],
  "total": 6,
  "pipeline": {
    "Filed": 0, "Active": 3, "Heard": 0,
    "Reserved": 0, "Decided": 0, "Appeal": 1
  }
}
```

> **Key insight**: Return `pipeline` summary counts from the API directly. The frontend's `pipelineStages` counters use these — don't make the frontend filter large arrays.

### Add Note Flow
1. User types in `newNote` state, clicks Save
2. `POST /api/lawyer/cases/:id/notes` with `{ content }`
3. Backend auto-fills `author_id` from JWT, `author_name` from profile, `created_at = now`
4. Returns new note object → frontend appends it to list

---

## 🟢 MODULE 2: Hearing Calendar

### What the Frontend Shows
- **3 views**: Month (grid), Week (time-grid), Day (card list)
- **Conflict Detection**: `useMemo` flags hearings with same date AND same start time
- **Upcoming Hearings**: Always-visible list grouped as Today / Tomorrow / This Week / Later
- **Adjournment Dialog**: Updates hearing status + optionally creates a rescheduled clone
- **Add Hearing Dialog**: Links to case, date, time, court, judge, courtroom, type

### Database Table

#### `hearings` table
```sql
id                   UUID PRIMARY KEY
lawyer_id            UUID FK → users.id
case_id              UUID FK → cases.id
case_title           VARCHAR(255)    -- denormalized
case_number          VARCHAR(100)    -- denormalized
client_name          VARCHAR(200)    -- denormalized
court                VARCHAR(200)
court_type           ENUM('district','high','supreme','tribunal')
courtroom            VARCHAR(100)
judge                VARCHAR(200)
hearing_date         DATETIME        -- full datetime for conflict detection
end_time             TIME
type                 VARCHAR(100)    -- "Arguments","Evidence","Constitutional Petition"
status               ENUM('scheduled','adjourned','completed','cancelled')
priority             ENUM('critical','high','medium','low')
notes                TEXT
adjournment_reason   VARCHAR(300)    -- nullable
next_date            DATE            -- nullable
original_hearing_id  UUID FK → hearings.id  -- nullable (for rescheduled hearings)
created_at           TIMESTAMP
updated_at           TIMESTAMP
```

### API Endpoints
```
GET    /api/lawyer/hearings                  All hearings (filtered)
POST   /api/lawyer/hearings                  Add new hearing
GET    /api/lawyer/hearings/upcoming         Next 30 days, grouped by Today/Tomorrow/Week/Later
PUT    /api/lawyer/hearings/:id              Update hearing
POST   /api/lawyer/hearings/:id/adjourn      Mark adjourned + create rescheduled clone
GET    /api/lawyer/hearings/conflicts        Conflicting hearings (same date+time)
```

### Query Params for GET /api/lawyer/hearings
```
?view=month&year=2024&month=3    all hearings for March 2024
?view=week&date=2024-03-15       all hearings for that week
?view=day&date=2024-03-15        all hearings for that day
?courtType=high|district         filter by court type
?search=                         search case title, number, court
```

### Adjournment Flow (Critical — must match frontend behavior)
`POST /api/lawyer/hearings/:id/adjourn` with `{ reason, nextDate? }`:
1. UPDATE existing: `status='adjourned'`, `adjournment_reason=reason`, `next_date=nextDate`
2. If `nextDate` provided: INSERT new hearing (clone) with `hearing_date=nextDate`, `status='scheduled'`, `original_hearing_id=:id`, `notes="Adjourned from [date]. Reason: [reason]"`
3. Return both: `{ original: {...}, rescheduled: {...} }`

### Conflict Detection SQL
```sql
SELECT h1.id as a_id, h1.case_title as a_title,
       h2.id as b_id, h2.case_title as b_title,
       DATE(h1.hearing_date) as conflict_date
FROM hearings h1
JOIN hearings h2
  ON h1.lawyer_id = h2.lawyer_id
  AND DATE(h1.hearing_date) = DATE(h2.hearing_date)
  AND TIME(h1.hearing_date) = TIME(h2.hearing_date)
  AND h1.id != h2.id
  AND h1.status = 'scheduled'
  AND h2.status = 'scheduled'
WHERE h1.lawyer_id = :lawyerId
  AND h1.id < h2.id   -- deduplicate pairs
```

---

## 🟢 MODULE 3: Client CRM

### What the Frontend Shows
- **Client Card Grid**: avatar initials, CNIC, phone, city, tags, case count, total billed, VIP + Retention Alert flags
- **Tabs**: All / Active / VIP / Alerts / Inactive
- **Tag Filter**: dropdown by practice area
- **Client Detail View** (4 sub-tabs): Overview | Cases | Communications | Documents
- **Conflict of Interest Check**: search by name/CNIC → returns matching existing clients
- **Add Client Dialog**: CNIC, contact, address, city, WhatsApp
- **Log Interaction Dialog**: type + summary

### Database Tables

#### `clients` table
```sql
id               UUID PRIMARY KEY
lawyer_id        UUID FK → users.id
name             VARCHAR(255)       -- Company or individual name
contact_person   VARCHAR(200)
cnic             VARCHAR(20)        -- "35202-1234567-1"
email            VARCHAR(200)
phone            VARCHAR(30)
whatsapp         VARCHAR(30)
city             VARCHAR(100)
address          TEXT
status           ENUM('Active','Inactive')
is_vip           BOOLEAN DEFAULT false
tags             JSON               -- ["Corporate","High Value"]
date_onboarded   DATE
last_contact     DATE               -- updated on new interaction
retention_alert  BOOLEAN DEFAULT false  -- if last_contact > 60 days
portal_enabled   BOOLEAN DEFAULT false
total_billed_pkr DECIMAL(15,2) DEFAULT 0   -- rolling sum
outstanding_pkr  DECIMAL(15,2) DEFAULT 0   -- rolling sum
created_at       TIMESTAMP
updated_at       TIMESTAMP
```

#### `client_interactions` table
```sql
id               UUID PRIMARY KEY
client_id        UUID FK → clients.id
lawyer_id        UUID FK → users.id
type             ENUM('call','meeting','whatsapp','email','sms')
summary          TEXT
interaction_date DATE
interaction_time TIME
duration_minutes INT     -- nullable
created_at       TIMESTAMP
```

#### `client_shared_documents` table
```sql
id          UUID PRIMARY KEY
client_id   UUID FK → clients.id
lawyer_id   UUID FK → users.id
name        VARCHAR(255)
file_type   VARCHAR(20)
size_bytes  BIGINT
file_url    VARCHAR(500)
shared_date DATE
created_at  TIMESTAMP
```

### API Endpoints
```
GET    /api/lawyer/clients                        List clients (filtered)
POST   /api/lawyer/clients                        Add new client
GET    /api/lawyer/clients/:id                    Client detail (cases, interactions, docs)
PUT    /api/lawyer/clients/:id                    Update client
DELETE /api/lawyer/clients/:id                    Soft delete (set status=Inactive)

POST   /api/lawyer/clients/:id/interactions       Log interaction (updates last_contact)
GET    /api/lawyer/clients/:id/interactions       All interactions

POST   /api/lawyer/clients/:id/documents          Share document
GET    /api/lawyer/clients/:id/documents          Shared docs list

GET    /api/lawyer/clients/conflict-check?q=      Conflict of interest check
```

### Conflict of Interest Check
```sql
WHERE lawyer_id = :me
  AND (name ILIKE '%:q%'
    OR contact_person ILIKE '%:q%'
    OR cnic = ':q')
-- Returns ALL clients including Inactive — past clients can still be conflicts
```

### Client List SQL (Active Cases Count)
```sql
SELECT c.*,
  COUNT(cs.id) FILTER (WHERE cs.status != 'Decided') as active_cases
FROM clients c
LEFT JOIN cases cs ON cs.client_id = c.id
WHERE c.lawyer_id = :lawyerId
GROUP BY c.id
```

### Retention Alert Logic
Nightly job or on-read computation:
```
IF last_contact < NOW() - 60 DAYS AND has_ever_had_case = true
  THEN retention_alert = true
```

---

## 🟢 MODULE 4: Document Drafting

### What the Frontend Shows
Three tabs within one view:
1. **Templates**: Cards with category, uses count, starred, AI-powered badge, clauses count → Detail with preview + "Use Template"
2. **Clause Bank**: Searchable clauses with category filter, copy-to-clipboard, preview dialog
3. **Drafts**: In-progress drafts with status (Draft/Review/Final/Sent), version history on click

### Database Tables

#### `doc_templates` table
```sql
id           UUID PRIMARY KEY
lawyer_id    UUID FK → users.id   -- NULL = global/system template
name         VARCHAR(255)
category     ENUM('Court Filing','Criminal','Corporate','Property','General','Employment','Dispute Resolution')
description  TEXT
clauses_count INT
is_starred   BOOLEAN DEFAULT false
is_ai_powered BOOLEAN DEFAULT false
usage_count  INT DEFAULT 0
last_used_at TIMESTAMP
created_at   TIMESTAMP
```

#### `clause_bank` table
```sql
id          UUID PRIMARY KEY
lawyer_id   UUID FK → users.id   -- NULL = global clause
title       VARCHAR(255)
category    VARCHAR(100)
text        TEXT
tags        JSON
usage_count INT DEFAULT 0
created_at  TIMESTAMP
```

#### `draft_documents` table
```sql
id              UUID PRIMARY KEY
lawyer_id       UUID FK → users.id
client_id       UUID FK → clients.id
case_id         UUID FK → cases.id   -- nullable
template_id     UUID FK → doc_templates.id  -- nullable
name            VARCHAR(255)
status          ENUM('Draft','Review','Final','Sent')
word_count      INT
current_version VARCHAR(10)   -- "v3"
file_url        VARCHAR(500)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `draft_versions` table
```sql
id             UUID PRIMARY KEY
draft_id       UUID FK → draft_documents.id
version_number VARCHAR(10)     -- "v1","v2","v3"
author_id      UUID FK → users.id
author_name    VARCHAR(100)
change_summary TEXT
file_url       VARCHAR(500)
created_at     TIMESTAMP
```

### API Endpoints
```
GET    /api/lawyer/templates               List (lawyer's own + global)
POST   /api/lawyer/templates               Create template
GET    /api/lawyer/templates/:id           Template detail
PUT    /api/lawyer/templates/:id           Update (star, etc.)
POST   /api/lawyer/templates/:id/use       Increment usage, return template data

GET    /api/lawyer/clauses                 List clause bank
POST   /api/lawyer/clauses                 Add custom clause
POST   /api/lawyer/clauses/:id/use         Increment usage

GET    /api/lawyer/drafts                  List all drafts
POST   /api/lawyer/drafts                  Create draft
GET    /api/lawyer/drafts/:id              Draft + version history
PUT    /api/lawyer/drafts/:id              Update draft
POST   /api/lawyer/drafts/:id/version      Save new version
POST   /api/lawyer/drafts/:id/restore/:vId Restore old version
```

### "Use Template" Flow (exact sequence)
1. User clicks **"Use Template"** in template detail
2. Frontend: `POST /api/lawyer/drafts` with `{ templateId, clientId, name }`
3. Backend:
   - INSERT `draft_documents` (status=Draft, current_version="v1")
   - INSERT `draft_versions` v1 (change_summary="Initial draft from template")
   - INCREMENT `doc_templates.usage_count`
4. Returns new draft object → frontend switches to Drafts tab

---

## 🟢 MODULE 5: Fee & Billing

### What the Frontend Shows
4 main tabs:
1. **Invoices**: List + filter → Invoice Detail (line items, tax, total, Record Payment button)
2. **Payments**: Received payments ledger with reference numbers
3. **Retainers**: Cards with usage progress bar → Retainer Detail (Renew/Report)
4. **Templates**: Pre-configured billing line items → Create Invoice dialog

Revenue summary cards at top: Total Revenue / Outstanding / Overdue / Active Retainers

### Database Tables

#### `invoices` table
```sql
id              UUID PRIMARY KEY   -- displayed as "INV-2024-034"
lawyer_id       UUID FK → users.id
client_id       UUID FK → clients.id
case_id         UUID FK → cases.id   -- nullable
invoice_date    DATE
due_date        DATE
status          ENUM('Draft','Paid','Pending','Overdue','Partially Paid')
total_pkr       DECIMAL(12,2)
paid_amount_pkr DECIMAL(12,2) DEFAULT 0
payment_method  VARCHAR(100)         -- nullable
paid_date       DATE                 -- nullable
notes           TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `invoice_items` table
```sql
id          UUID PRIMARY KEY
invoice_id  UUID FK → invoices.id
description VARCHAR(300)
hours       DECIMAL(5,2)      -- 0 for flat fee
rate_pkr    DECIMAL(10,2)
amount_pkr  DECIMAL(12,2)     -- hours*rate OR flat
sort_order  INT
```

#### `retainers` table
```sql
id            UUID PRIMARY KEY
lawyer_id     UUID FK → users.id
client_id     UUID FK → clients.id
total_pkr     DECIMAL(12,2)
used_pkr      DECIMAL(12,2) DEFAULT 0
start_date    DATE
end_date      DATE
status        ENUM('Active','Expiring','Exhausted','Expired')
billing_cycle ENUM('Monthly','Quarterly','Annually')
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

#### `billing_templates` table
```sql
id          UUID PRIMARY KEY
lawyer_id   UUID FK → users.id
name        VARCHAR(200)
category    VARCHAR(100)    -- "Litigation","Corporate","Real Estate"
description TEXT
usage_count INT DEFAULT 0
created_at  TIMESTAMP
```

#### `billing_template_items` table
```sql
id          UUID PRIMARY KEY
template_id UUID FK → billing_templates.id
description VARCHAR(300)
rate_pkr    DECIMAL(10,2)
sort_order  INT
```

#### `payments` table
```sql
id             UUID PRIMARY KEY
invoice_id     UUID FK → invoices.id
lawyer_id      UUID FK → users.id
client_id      UUID FK → clients.id
amount_pkr     DECIMAL(12,2)
payment_date   DATE
payment_method ENUM('Bank Transfer','Cheque','Cash','Online Transfer','Credit Card')
reference_no   VARCHAR(100)
status         ENUM('Completed','Processing','Failed')
created_at     TIMESTAMP
```

### API Endpoints
```
GET    /api/lawyer/invoices                  List invoices (with summary)
POST   /api/lawyer/invoices                  Create invoice
GET    /api/lawyer/invoices/:id              Invoice detail with line items
PUT    /api/lawyer/invoices/:id              Update invoice
DELETE /api/lawyer/invoices/:id              Delete draft only
POST   /api/lawyer/invoices/:id/payment      Record payment
POST   /api/lawyer/invoices/:id/send         Send/email invoice

GET    /api/lawyer/payments                  Payment ledger
POST   /api/lawyer/payments                  Manual payment

GET    /api/lawyer/retainers                 List retainers
POST   /api/lawyer/retainers                 Create retainer
GET    /api/lawyer/retainers/:id             Detail
PUT    /api/lawyer/retainers/:id             Update (renew, etc.)
POST   /api/lawyer/retainers/:id/deduct      Deduct from balance

GET    /api/lawyer/billing-templates         List templates
POST   /api/lawyer/billing-templates         Create
GET    /api/lawyer/billing-templates/:id     Detail with items
PUT    /api/lawyer/billing-templates/:id     Edit
DELETE /api/lawyer/billing-templates/:id     Delete

GET    /api/lawyer/billing/summary           Revenue summary cards
```

### Revenue Summary Response (matches frontend top cards)
```json
{
  "totalRevenue": 1160000,
  "outstanding": 390000,
  "overdue": 175000,
  "pendingInvoices": 2,
  "overdueInvoices": 1,
  "activeRetainers": 2,
  "totalRetainers": 4
}
```

### Record Payment Flow
`POST /api/lawyer/invoices/:id/payment` with `{ amount, method, referenceNo, date }`:
1. INSERT into `payments`
2. UPDATE `invoices.paid_amount_pkr += amount`
3. If `paid_amount_pkr >= total_pkr` → status=`'Paid'` else status=`'Partially Paid'`
4. If invoice linked to retainer → UPDATE `retainers.used_pkr += amount`
5. Return updated invoice + new payment object

---

## 🟡 MODULE 6: Smart Notifications

### What the Frontend Shows (Incomplete → 8 hardcoded items)
- Types: urgent / hearing / payment / document / reminder / client / case
- Tabs: All / Unread / Urgent / Hearings / Payments
- Unread count + "Mark all as read" button
- Unread cards: left blue border + blue dot

### Notification Trigger Map

| Type | Trigger | Source |
|---|---|---|
| `urgent` | Filing deadline < 24h | `hearings.hearing_date = tomorrow` |
| `hearing` | New hearing scheduled | `hearings` INSERT |
| `payment` | Invoice payment received | `payments` INSERT |
| `document` | Document uploaded to case | `case_documents` INSERT |
| `reminder` | Client meeting < 2h away | `hearings` where type='Meeting' |
| `case` | Case status changed | `cases` UPDATE |
| `urgent` | Invoice past due date | nightly cron on `invoices` |

### Database Table

#### `notifications` table
```sql
id          UUID PRIMARY KEY
lawyer_id   UUID FK → users.id
title       VARCHAR(255)
description TEXT
type        ENUM('urgent','hearing','payment','document','reminder','client','case')
icon_type   VARCHAR(50)    -- maps to Lucide icon name
is_read     BOOLEAN DEFAULT false
source_type VARCHAR(50)    -- 'case','hearing','invoice','client'
source_id   UUID           -- FK to the related entity
created_at  TIMESTAMP
```

### API Endpoints
```
GET    /api/lawyer/notifications              List (filterable by type, read status)
PUT    /api/lawyer/notifications/read-all     Mark all as read
PUT    /api/lawyer/notifications/:id/read     Mark one as read
DELETE /api/lawyer/notifications/:id          Dismiss
```

### Background Job (Cron — every hour)
```
- hearings WHERE hearing_date = tomorrow AND status='scheduled'
    → INSERT notification(type='hearing', title='Hearing tomorrow: '+case_title)
- invoices WHERE due_date < today AND status='Pending'
    → INSERT notification(type='urgent', title='Invoice overdue: '+client_name)
    → UPDATE invoices SET status='Overdue'
```

### Event-Driven Triggers (fire at point of action)
```
POST /api/lawyer/payments     → INSERT notification(type='payment', ...)
POST /api/lawyer/hearings     → INSERT notification(type='hearing', ...)
POST /api/lawyer/cases/:id/documents → INSERT notification(type='document', ...)
PUT  /api/lawyer/cases/:id (status change) → INSERT notification(type='case', ...)
```

### Frontend Fix
Replace hardcoded `notifications` array:
```typescript
const { data } = useQuery({
  queryKey: ['notifications'],
  queryFn: () => api.get('/api/lawyer/notifications').then(r => r.data),
  refetchInterval: 60000, // poll every minute
});
// API returns is_read → rename to 'read' in response for frontend compat
```

---

## 🟡 MODULE 7: Practice Analytics

### What the Frontend Shows (Incomplete → all hardcoded)
- 4 KPI cards: Win Rate / Avg Case Duration / Revenue per Case / Client Satisfaction
- Monthly Revenue bar chart (custom SVG — NOT recharts despite it being installed)
- Case Outcomes stacked bar (Won/Settled/Lost)
- Practice Area breakdown table

### All computed from existing data — No new tables needed

### API Endpoints
```
GET /api/lawyer/analytics/summary          KPI cards
GET /api/lawyer/analytics/revenue?months=6 Monthly revenue chart
GET /api/lawyer/analytics/outcomes         Case outcome breakdown
GET /api/lawyer/analytics/practice-areas   Practice area breakdown
```

### SQL Computations

**Win Rate**
```sql
SELECT ROUND(
  COUNT(*) FILTER (WHERE outcome = 'Won') * 100.0 / NULLIF(COUNT(*), 0), 1
) as win_rate
FROM cases
WHERE lawyer_id = :id AND status = 'Decided'
```

**Avg Case Duration**
```sql
SELECT ROUND(
  AVG(EXTRACT(EPOCH FROM (updated_at - filed_date)) / 2592000), 1
) as avg_months
FROM cases
WHERE lawyer_id = :id AND status = 'Decided'
```

**Monthly Revenue**
```sql
SELECT TO_CHAR(DATE_TRUNC('month', paid_date), 'Mon') as month,
       SUM(paid_amount_pkr) as amount
FROM invoices
WHERE lawyer_id = :id
  AND paid_date >= NOW() - INTERVAL '6 months'
  AND status = 'Paid'
GROUP BY DATE_TRUNC('month', paid_date)
ORDER BY DATE_TRUNC('month', paid_date)
```

**Practice Area Breakdown**
```sql
SELECT c.type as area,
       COUNT(DISTINCT c.id) as cases,
       COALESCE(SUM(i.total_pkr), 0) as revenue_pkr
FROM cases c
LEFT JOIN invoices i ON i.case_id = c.id AND i.status = 'Paid'
WHERE c.lawyer_id = :id
GROUP BY c.type
```

### Response Shape (matches frontend exactly)
```json
{
  "kpis": {
    "winRate": "73%",
    "avgCaseDuration": "4.2 mo",
    "revenuePerCase": "₨ 89K",
    "clientSatisfaction": "4.7/5"
  },
  "monthlyRevenue": [
    { "month": "Oct", "amount": 2800000 },
    { "month": "Mar", "amount": 4200000 }
  ],
  "caseOutcomes": [
    { "outcome": "Won", "count": 32, "pct": 73 },
    { "outcome": "Settled", "count": 8, "pct": 18 },
    { "outcome": "Lost", "count": 4, "pct": 9 }
  ],
  "practiceAreas": [
    { "area": "Civil Litigation", "cases": 18, "revenue": "₨ 1.6M", "growth": "+22%" }
  ]
}
```

> **Note on `clientSatisfaction`**: No rating system exists yet. Add a `client_ratings` table in v2, or return a fixed computed value for now.

> **Note on `growth`**: Compute using previous period comparison — `(current_revenue - prev_revenue) / prev_revenue * 100`

---

## 🟡 MODULE 8: Team Management

### What the Frontend Shows (Incomplete → 5 hardcoded members)
- Member cards with: role, email, active cases count, utilization bar, status badge (Available/In Court/Busy)
- Summary: Avg Utilization / Cases Assigned / Available Now
- "Add Member" button (no dialog — needs to be built)

### Database Tables

#### `team_members` table
```sql
id              UUID PRIMARY KEY
lawyer_id       UUID FK → users.id   -- firm owner
user_id         UUID FK → users.id   -- nullable (if member registered in system)
name            VARCHAR(200)
role            ENUM('Senior Associate','Associate','Junior Associate','Paralegal','Legal Secretary','Intern')
email           VARCHAR(200)
phone           VARCHAR(30)
specialization  VARCHAR(200)
status          ENUM('Available','In Court','Busy','On Leave')
utilization_pct INT DEFAULT 0        -- (active_cases / max_cases) * 100
is_active       BOOLEAN DEFAULT true
joined_date     DATE
created_at      TIMESTAMP
```

#### `case_assignments` table
```sql
id             UUID PRIMARY KEY
case_id        UUID FK → cases.id
team_member_id UUID FK → team_members.id
role           VARCHAR(100)   -- "Lead Counsel","Research","Paralegal"
assigned_at    TIMESTAMP
```

### API Endpoints
```
GET    /api/lawyer/team                            List members with computed stats
POST   /api/lawyer/team                            Add new member
GET    /api/lawyer/team/:id                        Member detail + assigned cases
PUT    /api/lawyer/team/:id                        Update (status, role, etc.)
DELETE /api/lawyer/team/:id                        Deactivate (soft delete)

POST   /api/lawyer/cases/:caseId/assign/:memberId  Assign case to member
DELETE /api/lawyer/cases/:caseId/assign/:memberId  Remove assignment
```

### Utilization Computation SQL
```sql
SELECT tm.*,
  COUNT(ca.id) FILTER (
    WHERE c.status NOT IN ('Decided','Cancelled')
  ) as active_cases,
  ROUND(COUNT(ca.id) FILTER (
    WHERE c.status NOT IN ('Decided','Cancelled')
  ) * 100.0 / 10, 0) as utilization_pct   -- assume max 10 cases = 100%
FROM team_members tm
LEFT JOIN case_assignments ca ON ca.team_member_id = tm.id
LEFT JOIN cases c ON c.id = ca.case_id
WHERE tm.lawyer_id = :lawyerId AND tm.is_active = true
GROUP BY tm.id
```

### Team Summary Response
```json
{
  "members": [...],
  "summary": {
    "avgUtilization": 77,
    "totalCasesAssigned": 30,
    "availableNow": 3
  }
}
```

---

## 🟡 MODULE 9: Document Vault

### What the Frontend Shows (Incomplete → all hardcoded)
- Storage usage bar (2.1 GB / 10 GB)
- 4 folders with file count + size
- Recent files list with search + list/grid toggle
- Confidential lock icon per file
- View/Download buttons (non-functional)
- "Upload Files" button (no dialog — needs to be built)

### Relationship to Existing Document Storage Backend
Your existing Document Storage backend stores files. The Vault is a **lawyer-specific UI view** over those files — organized into 4 folders with confidentiality flags.

### Database Table

#### `vault_files` table
```sql
id              UUID PRIMARY KEY
lawyer_id       UUID FK → users.id
folder          ENUM('Court Filings','Client Documents','Evidence','Contracts & Agreements')
name            VARCHAR(300)
file_type       ENUM('PDF','DOCX','XLSX','ZIP','IMG')
size_bytes      BIGINT
file_url        VARCHAR(500)          -- S3/Azure presigned URL
is_confidential BOOLEAN DEFAULT false
case_id         UUID FK → cases.id   -- nullable
client_id       UUID FK → clients.id -- nullable
uploaded_by_id  UUID FK → users.id
modified_at     TIMESTAMP
created_at      TIMESTAMP
```

### API Endpoints
```
GET    /api/lawyer/vault/stats               Storage used, file count, folder breakdown
GET    /api/lawyer/vault/folders             Folders with file count + size
GET    /api/lawyer/vault/files               Recent files (search + folder filter)
POST   /api/lawyer/vault/files               Upload (multipart/form-data)
DELETE /api/lawyer/vault/files/:id           Delete file
GET    /api/lawyer/vault/files/:id/download  Presigned download URL
```

### Stats Response (matches frontend)
```json
{
  "usedBytes": 2254857830,
  "totalBytes": 10737418240,
  "usedDisplay": "2.1 GB",
  "totalDisplay": "10 GB",
  "totalFiles": 195,
  "totalFolders": 4,
  "confidentialCount": 12,
  "folders": [
    { "name": "Court Filings", "files": 47, "size": "234 MB" },
    { "name": "Client Documents", "files": 83, "size": "512 MB" },
    { "name": "Evidence", "files": 29, "size": "1.2 GB" },
    { "name": "Contracts & Agreements", "files": 36, "size": "189 MB" }
  ]
}
```

---

## 🟡 MODULE 10: Dashboard Overview

### What the Frontend Shows (Incomplete → all hardcoded)
- Time-of-day greeting + lawyer name
- 4 stat cards: Active Cases / Upcoming Hearings / Active Clients / Revenue MTD
- Urgent Items list (deadlines + meetings)
- Recent Cases list with "View All" 
- Quick Actions buttons (navigate to sub-modules — these stay frontend-only)
- Case Distribution progress bars by type
- Monthly Target: circular SVG at X%, Cases Won, Hours Billed, Client Retention

### Single Aggregation Endpoint
```
GET /api/lawyer/dashboard/overview
```
This aggregates everything in ONE call:

```json
{
  "stats": {
    "activeCases": 47,
    "activeCasesChange": "+3 this week",
    "upcomingHearings": 12,
    "nextHearingLabel": "Tomorrow",
    "activeClients": 83,
    "activeClientsChange": "+5 this month",
    "revenueMTD": 4200000,
    "revenueMTDDisplay": "₨ 4.2M",
    "revenueMTDChange": "+18% vs last month"
  },
  "urgentItems": [
    {
      "title": "Filing deadline: Khan Industries v. FBR",
      "time": "Due in 2 hours",
      "type": "critical"
    },
    {
      "title": "Client meeting: Fatima Enterprises",
      "time": "Today, 3:00 PM",
      "type": "warning"
    }
  ],
  "recentCases": [
    { "name": "Khan Industries v. FBR", "court": "LHC", "status": "Active", "type": "Tax" }
  ],
  "caseDistribution": [
    { "type": "Civil", "count": 18, "total": 47 },
    { "type": "Criminal", "count": 12, "total": 47 },
    { "type": "Corporate", "count": 9, "total": 47 },
    { "type": "Tax", "count": 8, "total": 47 }
  ],
  "monthlyTarget": {
    "targetPKR": 5800000,
    "achievedPKR": 4200000,
    "percentage": 72,
    "casesWon": 8,
    "casesTotal": 11,
    "hoursBilled": 142,
    "clientRetentionPct": 94
  }
}
```

### urgentItems SQL
```sql
-- Hearings within 24 hours
SELECT 'Hearing: ' || case_title as title,
       'Today at ' || TO_CHAR(hearing_date, 'HH12:MI AM') as time,
       'warning' as type
FROM hearings
WHERE lawyer_id = :id
  AND hearing_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
  AND status = 'scheduled'

UNION ALL

-- Overdue invoices
SELECT 'Invoice overdue: ' || cl.name,
       'Past due ' || DATE_PART('day', NOW() - due_date)::INT || ' days',
       'critical'
FROM invoices i
JOIN clients cl ON cl.id = i.client_id
WHERE i.lawyer_id = :id AND i.status = 'Overdue'
ORDER BY type DESC   -- critical first
LIMIT 5
```

---

## 🔌 Frontend Integration Strategy

### Step 1: Create Central HTTP Client
Create `src/lib/api.ts`:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // e.g., http://localhost:5000
});

// Attach JWT to every request
api.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
  if (user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export default api;
```

### Step 2: Replace Static Arrays with useQuery
Every module's mock data `const cases = [...]` becomes:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['cases', { search, status, court, type }],
  queryFn: () =>
    api.get('/api/lawyer/cases', { params: { search, status, court, type } })
       .then(r => r.data),
});
const cases = data?.cases ?? [];
const pipeline = data?.pipeline ?? {};
```

### Step 3: Mutations for Actions
```typescript
// Add Note example
const addNote = useMutation({
  mutationFn: (content: string) =>
    api.post(`/api/lawyer/cases/${selectedCase.id}/notes`, { content }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['cases', selectedCase.id] });
    setNewNote('');
  },
});
```

### Step 4: Loading & Error States
Each module needs to handle:
```tsx
if (isLoading) return <SkeletonLoader />;
if (error) return <ErrorState message="Failed to load cases" />;
```

---

## 📋 Implementation Priority Order

| # | Module | Reason |
|---|---|---|
| 1 | **Case Management** | Core entity — all others depend on it |
| 2 | **Client CRM** | Cases need clients (FK dependency) |
| 3 | **Hearing Calendar** | Hearings need cases |
| 4 | **Fee & Billing** | Invoices need cases + clients |
| 5 | **Dashboard Overview** | Aggregates modules 1-4 |
| 6 | **Document Drafting** | Needs cases + clients |
| 7 | **Document Vault** | May reuse existing doc storage |
| 8 | **Smart Notifications** | Needs all above for triggers |
| 9 | **Practice Analytics** | Pure aggregation — last as it needs data |
| 10 | **Team Management** | Standalone, lowest dependency |

---

## ⚠️ Critical Frontend Fixes Required When Connecting Backend

| Issue | Location | Fix |
|---|---|---|
| No route guard | `App.tsx` router | Add `if user.role !== 'lawyer'` → redirect to `/login` |
| JWT not sent | All HTTP calls | Add Axios interceptor (see Step 1 above) |
| `user.id` unused | `LawyerDashboard.tsx` | Pass `user.id` as `lawyerId` param to all queries |
| Hardcoded string IDs | All components | Replace `"CS-2024-001"` style IDs with real UUIDs |
| PKR formatting | All billing/analytics | Backend returns numbers, frontend formats: `₨ ${(n/1000000).toFixed(1)}M` |
| No loading states | All components | Add skeleton UI (shadcn `Skeleton` component) |
| `recharts` unused | `PracticeAnalytics` | Either use recharts for real charts or keep custom SVG bars |

---

## 🛠️ Backend Architecture Recommendation

Since Auth / Messaging / Profile backends are already done:

- **Same stack** for consistency (same language, framework, DB)
- **Route prefix**: All endpoints under `/api/lawyer/*`
- **JWT Middleware**: Protect ALL lawyer routes — extract `lawyerId = req.user.id`
- **No need to pass lawyerId in request body** — always read from JWT
- **Consistent error format**: `{ error: "Human message", code: "CASE_NOT_FOUND" }`
- **Pagination default**: `limit=20, page=1` on all list endpoints
- **Soft deletes**: Never hard-delete cases, clients, or invoices — use `is_archived` or `status=Inactive`
