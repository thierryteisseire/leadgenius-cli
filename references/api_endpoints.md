# API Endpoints Reference

Complete request/response schemas for every LeadGenius Pro Automation API endpoint.

**Base URL:** `https://api.leadgenius.app`
**Authentication:** `X-API-Key: lgp_xxx` header on every request.

---

## Authentication

### `GET /api/automation/auth/test`

Verify that your API key is valid and see the associated identity (owner, company, key ID).

**Query Parameters:** None.

**Response:**

```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "owner": "f4a844a8-00c1-7087-b434-f6d681e1f269",
    "companyId": "company-api-test2-030526",
    "apiKeyId": "apikey-api-test2-1772645628",
    "message": "API key is valid"
  },
  "requestId": "req-abc123"
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  https://api.leadgenius.app/api/automation/auth/test | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts auth test
```

---

## Leads

### `GET /api/automation/leads`

List EnrichLeads by `client_id`, sorted by `createdAt` descending. Supports field selection and pagination.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `client_id` | string | Yes | — | Client to list leads for |
| `fields` | string | No | default set | Comma-separated field names to return |
| `limit` | integer | No | 50 | Max records (capped at 500) |
| `nextToken` | string | No | — | Pagination token from previous response |

**Default fields returned:** `id`, `firstName`, `lastName`, `fullName`, `email`, `linkedinUrl`, `companyName`, `title`, `status`, `client_id`, `company_id`, `createdAt`, `updatedAt`.

**Custom field selection:** Pass `fields=email,companyName,aiLeadScore` to return only those fields (`id` is always included).

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "lead-001",
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane@example.com",
        "companyName": "Acme Corp",
        "title": "VP Sales",
        "status": "active",
        "client_id": "client-123",
        "createdAt": "2026-03-01T10:00:00.000Z"
      }
    ],
    "count": 1,
    "nextToken": null
  }
}
```

**Pagination:** When `nextToken` is present in the response, pass it as a query parameter to fetch the next page. When `nextToken` is `null`, there are no more pages.

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/leads?client_id=YOUR_CLIENT_ID&limit=10" | jq
```

```bash
# With field selection
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/leads?client_id=YOUR_CLIENT_ID&fields=email,companyName,aiLeadScore" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts leads list --client YOUR_CLIENT_ID --limit 10
```

---

### `GET /api/automation/leads/{id}`

Return a single EnrichLead with all fields (100+ fields including enrichment, AI, scoring, engagement data).

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | EnrichLead record ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "lead-001",
    "firstName": "Jane",
    "lastName": "Doe",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "linkedinUrl": "https://linkedin.com/in/janedoe",
    "companyName": "Acme Corp",
    "title": "VP Sales",
    "aiLeadScore": "85",
    "aiQualification": "Highly Qualified",
    "engagementScore": 42,
    "client_id": "client-123",
    "company_id": "company-456",
    "owner": "owner-sub-789",
    "status": "active",
    "createdAt": "2026-03-01T10:00:00.000Z",
    "updatedAt": "2026-03-15T14:30:00.000Z"
  }
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/leads/LEAD_ID" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts leads get LEAD_ID
```

---

### `POST /api/automation/leads/import`

Import one or more EnrichLeads. Supports single lead or batch (up to 500).

**Request Body — Single lead:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `client_id` | string | Yes | — | Client to import into (must belong to your company) |
| `firstName` | string | No | — | First name |
| `lastName` | string | No | — | Last name |
| `email` | string | No | — | Email address |
| `companyName` | string | No | — | Company name |
| `title` | string | No | — | Job title |
| `linkedinUrl` | string | No | — | LinkedIn profile URL |

Any additional EnrichLead fields can be included. Unknown fields are silently stripped. `owner` and `company_id` are auto-set from your API key.

**Request Body — Batch:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `leads` | array | Yes | — | Array of lead objects (max 500). Each object uses the same fields as single-lead import. |

**Key behaviors:**
- Cross-client duplicate detection by `email` / `linkedinUrl` (warning only, not blocking)
- Max batch size: 500 leads

**Response:**

```json
{
  "success": true,
  "data": {
    "created": 2,
    "failed": 0,
    "createdIds": ["id-1", "id-2"],
    "errors": [],
    "warnings": []
  },
  "message": "Imported 2 of 2 leads"
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"YOUR_CLIENT","firstName":"Jane","lastName":"Doe","email":"jane@example.com","companyName":"Acme"}' \
  https://api.leadgenius.app/api/automation/leads/import | jq
```

**CLI equivalent:**

```bash
# Import from JSON file
npx tsx src/scripts/lgp.ts leads import --file leads.json

# Import inline
npx tsx src/scripts/lgp.ts leads import --data '{"client_id":"YOUR_CLIENT","firstName":"Jane","email":"jane@example.com"}'
```

---

### `GET /api/automation/leads/search`

Search leads by email, name, companyUrl, or linkedinUrl. Uses GSI indexes for efficient lookups.

**Query Parameters (at least one search field required):**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `email` | string | No | — | Exact email match (uses `email-index` GSI) |
| `firstName` | string | No | — | Exact first name match (uses `firstName-lastName-index` GSI) |
| `lastName` | string | No | — | Used with `firstName` (uses `firstName-lastName-index` GSI) |
| `companyUrl` | string | No | — | Exact company URL match (uses `company_id` GSI + filter) |
| `linkedinUrl` | string | No | — | Exact LinkedIn URL match (uses `company_id` GSI + filter) |
| `client_id` | string | No | — | Narrow results to a specific client |
| `limit` | integer | No | 50 | Max records (capped at 500) |
| `nextToken` | string | No | — | Pagination token |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "lead-001",
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane@example.com",
        "companyName": "Acme Corp"
      }
    ],
    "count": 1,
    "nextToken": null
  }
}
```

**Pagination:** Same as List Leads — pass `nextToken` from the response to get the next page.

**curl:**

```bash
# Search by email
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/leads/search?email=jane@example.com" | jq

# Search by name
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/leads/search?firstName=Jane&lastName=Doe" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts leads search --email jane@example.com
npx tsx src/scripts/lgp.ts leads search --first-name Jane --last-name Doe
```

---

### `POST /api/automation/leads/deduplicate`

Scan leads for a client and find duplicate groups by match fields.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `client_id` | string | Yes | — | Client to scan for duplicates |
| `matchFields` | array | Yes | — | Fields to match on (see valid values below) |
| `dryRun` | boolean | No | `true` | When `true`, report duplicates without making changes |

**Valid match fields:**

| Match Field | Confidence | Description |
|-------------|------------|-------------|
| `email` | high | Exact email match (case-insensitive) |
| `linkedinUrl` | medium | Exact LinkedIn URL match |
| `fullName+companyName` | low | Combined name + company match |

**Response:**

```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "matchField": "email",
        "confidence": "high",
        "matchValue": "jane@example.com",
        "leadIds": ["id-1", "id-2"]
      }
    ],
    "totalLeadsScanned": 150,
    "totalDuplicateGroups": 3,
    "dryRun": true
  }
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"YOUR_CLIENT","matchFields":["email"],"dryRun":true}' \
  https://api.leadgenius.app/api/automation/leads/deduplicate | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts leads dedup --client YOUR_CLIENT --match email,linkedinUrl
```

---

### `POST /api/automation/leads/deduplicate/resolve`

Merge data from duplicate leads into a "keep" lead. Empty fields on the keep lead are filled from merge leads. Merge leads are marked with `status: 'duplicate'`.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `keepLeadId` | string | Yes | — | Lead ID to keep (receives merged data) |
| `mergeLeadIds` | array | Yes | — | Array of lead IDs to merge from (marked as duplicate) |

**Key behaviors:**
- Only empty fields on the keep lead are filled from merge leads
- System fields (`id`, `owner`, `company_id`, `client_id`, `createdAt`, `updatedAt`) are never merged
- First merge lead's value wins if multiple merge leads have a value for the same empty field
- All merge leads get `status: 'duplicate'`
- Conflicts (both leads have a value) are reported but the keep lead's value wins

**Response:**

```json
{
  "success": true,
  "data": {
    "keepLeadId": "lead-to-keep",
    "mergedFields": ["phoneNumber", "industry", "headline"],
    "conflicts": [
      {
        "field": "title",
        "keepValue": "VP Sales",
        "mergeValue": "Director of Sales",
        "mergeLeadId": "duplicate-1"
      }
    ],
    "mergeLeadsMarked": 2
  }
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"keepLeadId":"KEEP_ID","mergeLeadIds":["DUP_1","DUP_2"]}' \
  https://api.leadgenius.app/api/automation/leads/deduplicate/resolve | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts leads dedup-resolve --keep KEEP_ID --merge DUP_1,DUP_2
```

---

### `POST /api/automation/leads/transfer`

Transfer leads between clients within the same company. Includes duplicate detection against the target client.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `fromClientId` | string | Yes | — | Source client ID |
| `toClientId` | string | Yes | — | Target client ID |
| `leadIds` | array | No | — | Specific lead IDs to transfer (use this or `transferAll`) |
| `transferAll` | boolean | No | `false` | Transfer all leads from source client |
| `dryRun` | boolean | No | `false` | When `true`, simulate without making changes |

**Key behaviors:**
- Both clients must belong to your company
- Source and target must be different
- Duplicate detection by `email` and `linkedinUrl` against target client
- Duplicates are skipped (not overwritten)
- Only `client_id` is updated on transferred leads

**Response:**

```json
{
  "success": true,
  "data": {
    "transferred": 5,
    "skippedDuplicates": 1,
    "errors": [],
    "dryRun": false,
    "details": {
      "transferred": [{"leadId": "lead-1", "previousClientId": "source-client"}],
      "skippedDuplicates": [{"leadId": "lead-2", "duplicateId": "existing-lead", "matchField": "email"}]
    }
  }
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fromClientId":"SOURCE_CLIENT","toClientId":"TARGET_CLIENT","transferAll":true,"dryRun":true}' \
  https://api.leadgenius.app/api/automation/leads/transfer | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts leads transfer --from SOURCE_CLIENT --to TARGET_CLIENT --all --dry-run
```

---

### `GET /api/automation/leads/{id}/activities`

Return the engagement history for a lead.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | EnrichLead record ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "leadId": "lead-id",
    "totalActivities": 5,
    "engagementScore": 42,
    "lastEngagementAt": "2026-03-01T10:00:00.000Z",
    "activities": [
      {
        "type": "email_opened",
        "timestamp": "2026-03-01T10:00:00.000Z",
        "notes": "Opened Q1 campaign email",
        "metadata": {"campaignId": "camp-1"}
      }
    ]
  }
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/leads/LEAD_ID/activities" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts leads activities LEAD_ID
```

---

### `POST /api/automation/leads/{id}/activities`

Log one or more engagement activities on a lead. Appends to `engagementHistory`, updates `lastEngagementAt`, and recalculates `engagementScore`.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | EnrichLead record ID |

**Request Body — Single activity:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | string | Yes | — | Activity type (see valid types below) |
| `timestamp` | string | No | now | ISO 8601 date string |
| `notes` | string | No | — | Free-text notes |
| `metadata` | object | No | — | Arbitrary JSON data |

**Request Body — Batch:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `activities` | array | Yes | — | Array of activity objects (same fields as single activity) |

**Valid activity types:** `linkedin_connection_sent`, `linkedin_connection_accepted`, `linkedin_message_sent`, `linkedin_message_received`, `linkedin_profile_viewed`, `email_sent`, `email_opened`, `email_clicked`, `email_answered`, `email_bounced`, `call_completed`, `call_no_answer`, `meeting_scheduled`, `meeting_completed`, `form_submitted`, `website_visited`, `content_downloaded`, `demo_requested`, `proposal_sent`, `contract_signed`, `custom`.

**Engagement score weights:** Activities are scored with time decay. Recent activities (< 30 days) get full weight, older ones get 50%. Score is capped at 100.

| Activity | Points |
|----------|--------|
| `contract_signed`, `meeting_completed` | 30 |
| `meeting_scheduled`, `demo_requested` | 25 |
| `email_answered`, `proposal_sent`, `form_submitted` | 20 |
| `linkedin_message_received`, `call_completed` | 15 |
| `linkedin_connection_accepted`, `content_downloaded` | 10 |
| `email_clicked` | 8 |
| `email_opened` | 5 |
| `custom` | 5 |
| `linkedin_message_sent`, `email_sent`, `website_visited` | 2–3 |
| `linkedin_connection_sent`, `linkedin_profile_viewed`, `call_no_answer` | 1–2 |
| `email_bounced` | -5 |

**Response:**

```json
{
  "success": true,
  "data": {
    "leadId": "lead-id",
    "activitiesAdded": 3,
    "totalActivities": 8,
    "engagementScore": 55,
    "lastEngagementAt": "2026-03-01T10:05:00.000Z"
  },
  "message": "3 activity(ies) logged"
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"email_opened","notes":"Opened Q1 email"}' \
  https://api.leadgenius.app/api/automation/leads/LEAD_ID/activities | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts leads activity LEAD_ID --type email_opened --notes "Opened Q1 email"
```

---

### `POST /api/automation/leads/validate-ownership`

Scan all EnrichLeads for your company and report ownership issues.

**Request Body:** Empty `{}` or omit body.

**Checks performed:**
- Orphaned leads: `client_id` references a non-existent Client record
- Mismatched company: Client's `company_id` doesn't match lead's `company_id`
- Null owner: Lead has empty or null `owner` field

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "totalLeadsScanned": 200,
    "orphanedRecords": 0,
    "mismatchedCompany": 0,
    "nullOwner": 0,
    "totalIssues": 0,
    "details": []
  }
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  https://api.leadgenius.app/api/automation/leads/validate-ownership | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts leads validate-ownership
```


## Tasks

Background processing jobs (enrichment, copyright, scoring) run asynchronously via Trigger.dev. Use these endpoints to trigger jobs and monitor their progress.

### `GET /api/automation/tasks`

List background jobs for your company with optional status and type filters.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `status` | string | No | — | Filter by status: `running`, `completed`, `failed` |
| `type` | string | No | — | Filter by type: `enrichment`, `copyright`, `scoring` |
| `limit` | integer | No | 50 | Max records (capped at 500) |
| `nextToken` | string | No | — | Pagination token from previous response |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "jobId": "uuid-123",
        "userId": "user-sub-456",
        "company_id": "company-789",
        "type": "enrichment",
        "status": "running",
        "totalTasks": 3,
        "completedTasks": 1,
        "failedTasks": 0,
        "finishedAt": null,
        "createdAt": "2026-03-01T10:00:00.000Z",
        "updatedAt": "2026-03-01T10:01:00.000Z"
      }
    ],
    "count": 1,
    "nextToken": null
  }
}
```

**Pagination:** When `nextToken` is present in the response, pass it as a query parameter to fetch the next page. When `nextToken` is `null`, there are no more pages.

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/tasks?status=running" | jq
```

```bash
# Filter by type
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/tasks?status=running&type=enrichment" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts tasks list
npx tsx src/scripts/lgp.ts tasks list --status running --type enrichment
```

---

### `GET /api/automation/tasks/{jobId}`

Get a single job's status and progress.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `jobId` | string | Yes | The job UUID |

**Response:**

```json
{
  "success": true,
  "data": {
    "jobId": "uuid-123",
    "userId": "user-sub-456",
    "company_id": "company-789",
    "type": "enrichment",
    "status": "completed",
    "totalTasks": 3,
    "completedTasks": 3,
    "failedTasks": 0,
    "finishedAt": "2026-03-01T10:05:00.000Z",
    "createdAt": "2026-03-01T10:00:00.000Z",
    "updatedAt": "2026-03-01T10:05:00.000Z"
  }
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/tasks/JOB_ID" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts tasks status JOB_ID
```

---

### `POST /api/automation/tasks/enrich`

Trigger enrichment services for a single lead. Uses UrlSettings configuration to determine which services are available. Jobs run asynchronously — use `GET /api/automation/tasks/{jobId}` to monitor progress.

**Prerequisites:**
- **UrlSettings** must be configured for your company with service URLs. Create/update via `POST /api/automation/tables/UrlSettings`.
- Each service needs a URL configured in UrlSettings (e.g., the `enrichment1` field).
- Optional API keys per service (e.g., `enrichment1_Apikey`).

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `leadId` | string | Yes | — | EnrichLead record ID to enrich |
| `services` | array | No | all configured | Array of service keys to trigger. If omitted, triggers all configured services. |

**Available enrichment service identifiers:**

| Service Key | Description |
|-------------|-------------|
| `companyUrl` | Discover and verify the company website URL |
| `emailFinder` | Find and verify the lead's email address |
| `enrichment1` | Custom enrichment service 1 (configured in UrlSettings) |
| `enrichment2` | Custom enrichment service 2 (configured in UrlSettings) |
| `enrichment3` | Custom enrichment service 3 (configured in UrlSettings) |
| `enrichment4` | Custom enrichment service 4 (configured in UrlSettings) |
| `enrichment5` | Custom enrichment service 5 (configured in UrlSettings) |
| `enrichment6` | Custom enrichment service 6 (configured in UrlSettings) |
| `enrichment7` | Custom enrichment service 7 (configured in UrlSettings) |
| `enrichment8` | Custom enrichment service 8 (configured in UrlSettings) |
| `enrichment9` | Custom enrichment service 9 (configured in UrlSettings) |
| `enrichment10` | Custom enrichment service 10 (configured in UrlSettings) |

**Response:**

```json
{
  "success": true,
  "data": {
    "jobId": "uuid-456",
    "batchTag": "automation-enrich-1709...",
    "triggered": ["companyUrl", "enrichment1"],
    "skipped": ["enrichment2"],
    "leadId": "enrich-lead-id",
    "runIds": ["run_xxx", "run_yyy"]
  },
  "message": "Triggered 2 enrichment services, skipped 1"
}
```

**curl:**

```bash
# Trigger all configured services
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"leadId":"LEAD_ID"}' \
  https://api.leadgenius.app/api/automation/tasks/enrich | jq
```

```bash
# Trigger specific services
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"leadId":"LEAD_ID","services":["companyUrl","emailFinder","enrichment1"]}' \
  https://api.leadgenius.app/api/automation/tasks/enrich | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts tasks enrich --lead LEAD_ID
npx tsx src/scripts/lgp.ts tasks enrich --lead LEAD_ID --services companyUrl,emailFinder
```

---

### `POST /api/automation/tasks/copyright`

Trigger copyright (AI content generation) processes for a single lead. Uses AgentSettings configuration. Each process maps to an AI agent that generates content for the lead. Jobs run asynchronously — use `GET /api/automation/tasks/{jobId}` to monitor progress.

**Prerequisites:**
- **AgentSettings** must be configured for your company. Create/update via `POST /api/automation/tables/AgentSettings`.
- Each process needs an agent ID configured (e.g., `enrichment1AgentId` field in AgentSettings).
- A `projectId` must be set in AgentSettings for the AI platform.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `leadId` | string | Yes | — | EnrichLead record ID to process |
| `processes` | array | No | all configured | Array of process keys to trigger. If omitted, triggers all configured processes. |

**Available copyright process identifiers:**

Each process key maps to an AI agent configured in AgentSettings. The agent ID is stored in the corresponding `<key>AgentId` field (e.g., `enrichment1` → `enrichment1AgentId`).

| Process Key | AgentSettings Field | Description |
|-------------|---------------------|-------------|
| `enrichment1` | `enrichment1AgentId` | AI content generation process 1 |
| `enrichment2` | `enrichment2AgentId` | AI content generation process 2 |
| `enrichment3` | `enrichment3AgentId` | AI content generation process 3 |
| `enrichment4` | `enrichment4AgentId` | AI content generation process 4 |
| `enrichment5` | `enrichment5AgentId` | AI content generation process 5 |
| `enrichment6` | `enrichment6AgentId` | AI content generation process 6 |
| `enrichment7` | `enrichment7AgentId` | AI content generation process 7 |
| `enrichment8` | `enrichment8AgentId` | AI content generation process 8 |
| `enrichment9` | `enrichment9AgentId` | AI content generation process 9 |
| `enrichment10` | `enrichment10AgentId` | AI content generation process 10 |

**Response:**

```json
{
  "success": true,
  "data": {
    "jobId": "uuid-789",
    "batchTag": "automation-copyright-1709...",
    "triggered": ["enrichment1"],
    "skipped": ["enrichment2"],
    "leadId": "enrich-lead-id",
    "runIds": ["run_xxx"]
  },
  "message": "Triggered 1 copyright processes, skipped 1"
}
```

**curl:**

```bash
# Trigger all configured processes
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"leadId":"LEAD_ID"}' \
  https://api.leadgenius.app/api/automation/tasks/copyright | jq
```

```bash
# Trigger specific processes
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"leadId":"LEAD_ID","processes":["enrichment1","enrichment2"]}' \
  https://api.leadgenius.app/api/automation/tasks/copyright | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts tasks copyright --lead LEAD_ID
```

---

### `POST /api/automation/tasks/score`

Trigger SDR AI scoring for one or more leads. Supports single-lead and batch (up to 100 leads) variants. Uses SdrAiSettings configuration. Jobs run asynchronously — use `GET /api/automation/tasks/{jobId}` to monitor progress.

**Prerequisites:**
- **SdrAiSettings** must be configured for your company. Create/update via `POST /api/automation/tables/SdrAiSettings`.
- Each scoring field needs an agent ID configured (e.g., `aiLeadScoreAgentId` field in SdrAiSettings).
- A `projectId` must be set in SdrAiSettings for the AI platform.

**Request Body — Single lead:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `leadId` | string | One of `leadId`/`leadIds` | — | Single EnrichLead record ID |
| `fields` | array | No | all configured | Array of scoring field keys to trigger |

**Request Body — Batch (up to 100 leads):**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `leadIds` | array | One of `leadId`/`leadIds` | — | Array of EnrichLead record IDs (max 100) |
| `fields` | array | No | all configured | Array of scoring field keys to trigger |

**Available scoring field identifiers:**

| Field Key | Description |
|-----------|-------------|
| `aiLeadScore` | Numeric lead quality score (0–100) |
| `aiQualification` | Text qualification assessment (e.g., "Highly Qualified", "Not Qualified") |
| `aiNextAction` | Recommended next sales action for the lead |
| `aiColdEmail` | AI-generated cold email draft tailored to the lead |
| `aiInterest` | Assessed interest level based on lead data |
| `aiLinkedinConnect` | AI-generated LinkedIn connection request message |
| `aiCompetitorAnalysis` | Competitive landscape analysis for the lead's company |
| `aiEngagementLevel` | Predicted engagement level based on lead profile |
| `aiPurchaseWindow` | Estimated purchase timeline or buying window |
| `aiDecisionMakerRole` | Assessment of the lead's decision-making authority |
| `aiSentiment` | Sentiment analysis based on available lead data |
| `aiSocialEngagement` | Social media engagement analysis |
| `aiNurturingStage` | Recommended nurturing stage placement |
| `aiBudgetEstimation` | Estimated budget range for the lead's company |
| `aiRiskScore` | Risk assessment score for the opportunity |
| `aiProductFitScore` | Product-market fit score for the lead |

**Response:**

```json
{
  "success": true,
  "data": {
    "jobId": "uuid-012",
    "batchTag": "automation-score-1709...",
    "triggered": ["aiLeadScore", "aiQualification"],
    "skipped": ["aiColdEmail"],
    "leadIds": ["lead-1", "lead-2"],
    "runIds": ["run_xxx", "run_yyy"]
  },
  "message": "Triggered 2 scoring fields for 2 leads (4 total tasks), skipped 1 unconfigured fields"
}
```

**curl:**

```bash
# Score a single lead with all configured fields
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"leadId":"LEAD_ID"}' \
  https://api.leadgenius.app/api/automation/tasks/score | jq
```

```bash
# Score a single lead with specific fields
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"leadId":"LEAD_ID","fields":["aiLeadScore","aiQualification"]}' \
  https://api.leadgenius.app/api/automation/tasks/score | jq
```

```bash
# Batch score multiple leads (max 100)
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"leadIds":["LEAD_1","LEAD_2","LEAD_3"],"fields":["aiLeadScore","aiQualification"]}' \
  https://api.leadgenius.app/api/automation/tasks/score | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts tasks score --lead LEAD_ID
npx tsx src/scripts/lgp.ts tasks score --lead LEAD_ID --fields aiLeadScore,aiQualification
```


---

## Territory Companies

### `GET /api/automation/companies`

List TerritoryCompany records by `client_id` with optional filtering and sorting.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `client_id` | string | Yes | — | Client to list companies for |
| `sortBy` | string | No | — | Sort field: `totalLeads`, `qualifiedLeads`, `averageLeadScore`, `lastActivityDate`, `companyName` |
| `industry` | string | No | — | Filter by industry |
| `country` | string | No | — | Filter by country |
| `minLeads` | integer | No | — | Minimum total leads |
| `maxLeads` | integer | No | — | Maximum total leads |
| `minScore` | number | No | — | Minimum average lead score |
| `maxScore` | number | No | — | Maximum average lead score |
| `limit` | integer | No | 50 | Max records (capped at 500) |
| `nextToken` | string | No | — | Pagination token |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "tc-001",
        "companyName": "Acme Corp",
        "totalLeads": 25,
        "qualifiedLeads": 10,
        "averageLeadScore": 72,
        "industry": "SaaS",
        "country": "US",
        "client_id": "client-123"
      }
    ],
    "count": 1,
    "nextToken": null
  }
}
```

**Pagination:** When `nextToken` is present in the response, pass it as a query parameter to fetch the next page. When `nextToken` is `null`, there are no more pages.

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/companies?client_id=YOUR_CLIENT&sortBy=totalLeads" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts companies list --client YOUR_CLIENT
npx tsx src/scripts/lgp.ts companies list --client YOUR_CLIENT --sort totalLeads
```

---

### `GET /api/automation/companies/{id}`

Return a complete TerritoryCompany record with all metrics, content analysis fields, and a `leadsSummary` (count + IDs of associated EnrichLeads).

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | TerritoryCompany record ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "tc-001",
    "companyName": "Acme Corp",
    "totalLeads": 25,
    "qualifiedLeads": 10,
    "averageLeadScore": 72,
    "industry": "SaaS",
    "country": "US",
    "contentTopics": ["AI", "Automation"],
    "contentKeywords": ["machine learning", "workflow"],
    "painPoints": ["manual processes", "data silos"],
    "valuePropositions": ["efficiency", "integration"],
    "competitorMentions": ["CompetitorX"],
    "engagementInsights": "High email open rate",
    "contentRecommendations": "Focus on ROI case studies",
    "leadsSummary": {
      "count": 25,
      "leadIds": ["lead-1", "lead-2"]
    }
  }
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/companies/COMPANY_ID" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts companies get COMPANY_ID
```

---

### `GET /api/automation/companies/{id}/leads`

Return all EnrichLeads associated with a TerritoryCompany (matched by `companyName` and `client_id`).

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | TerritoryCompany record ID |

**Query Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `limit` | integer | No | 50 | Max records (capped at 500) |
| `nextToken` | string | No | — | Pagination token |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "lead-001",
        "firstName": "Jane",
        "lastName": "Doe",
        "fullName": "Jane Doe",
        "email": "jane@acme.com",
        "linkedinUrl": "https://linkedin.com/in/janedoe",
        "headline": "VP Sales at Acme",
        "title": "VP Sales",
        "companyName": "Acme Corp",
        "companyUrl": "https://acme.com",
        "companyDomain": "acme.com",
        "industry": "SaaS",
        "country": "US",
        "state": "CA",
        "city": "San Francisco",
        "status": "active",
        "aiScoreValue": "85",
        "aiQualification": "Highly Qualified",
        "client_id": "client-123",
        "company_id": "company-456",
        "createdAt": "2026-03-01T10:00:00.000Z",
        "updatedAt": "2026-03-15T14:30:00.000Z"
      }
    ],
    "count": 1,
    "nextToken": null
  }
}
```

**Pagination:** When `nextToken` is present in the response, pass it as a query parameter to fetch the next page. When `nextToken` is `null`, there are no more pages.

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/companies/COMPANY_ID/leads?limit=50" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts companies leads COMPANY_ID --limit 50
```

---

### `POST /api/automation/companies/aggregate`

Trigger company data aggregation from EnrichLeads into TerritoryCompany records.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `client_id` | string | Yes | — | Client to aggregate for |
| `companyName` | string | No | — | Aggregate a single company only |
| `forceRefresh` | boolean | No | `false` | Delete and re-create existing records |
| `maxLeads` | integer | No | — | Max leads to process |

**Response:**

```json
{
  "success": true,
  "data": {
    "companiesCreated": 15,
    "companiesUpdated": 3,
    "totalLeadsProcessed": 200,
    "errors": []
  }
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"YOUR_CLIENT"}' \
  https://api.leadgenius.app/api/automation/companies/aggregate | jq
```

```bash
# Aggregate a single company with force refresh
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"YOUR_CLIENT","companyName":"Acme Corp","forceRefresh":true}' \
  https://api.leadgenius.app/api/automation/companies/aggregate | jq
```

**CLI equivalent:**

No direct CLI command — use the API endpoint via curl. After aggregation completes, view results with:

```bash
npx tsx src/scripts/lgp.ts companies list --client YOUR_CLIENT
```

---

### `GET /api/automation/companies/events`

List CompanyEvent records by `client_id`, sorted by `eventDate` descending.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `client_id` | string | Yes | — | Client to list events for |
| `eventType` | string | No | — | Filter: `new_lead`, `lead_qualified`, `score_increased`, `new_company`, `custom` |
| `territoryCompanyId` | string | No | — | Filter by specific company |
| `dateFrom` | string | No | — | ISO date string lower bound |
| `dateTo` | string | No | — | ISO date string upper bound |
| `limit` | integer | No | 50 | Max records (capped at 500) |
| `nextToken` | string | No | — | Pagination token |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "event-001",
        "territoryCompanyId": "tc-001",
        "eventType": "new_lead",
        "eventTitle": "New lead added",
        "eventDescription": "Jane Doe added to Acme Corp",
        "eventDate": "2026-03-01T10:00:00.000Z",
        "client_id": "client-123"
      }
    ],
    "count": 1,
    "nextToken": null
  }
}
```

**Pagination:** When `nextToken` is present in the response, pass it as a query parameter to fetch the next page. When `nextToken` is `null`, there are no more pages.

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/companies/events?client_id=YOUR_CLIENT&eventType=new_lead" | jq
```

---

### `POST /api/automation/companies/events`

Create a manual CompanyEvent.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `territoryCompanyId` | string | Yes | — | TerritoryCompany record ID |
| `eventType` | string | Yes | — | One of: `new_lead`, `lead_qualified`, `score_increased`, `new_company`, `custom` |
| `eventTitle` | string | Yes | — | Short event title |
| `eventDescription` | string | No | — | Longer description |
| `eventData` | object | No | — | Arbitrary JSON data |
| `leadId` | string | No | — | Associated lead ID |
| `client_id` | string | No | — | Override client (defaults to TerritoryCompany's client) |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "event-002",
    "territoryCompanyId": "tc-001",
    "eventType": "custom",
    "eventTitle": "Partnership announced",
    "eventDescription": "Acme announced partnership with Beta Inc",
    "eventData": {"source": "press_release"},
    "client_id": "client-123"
  }
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"territoryCompanyId":"TC_ID","eventType":"custom","eventTitle":"Partnership announced","eventDescription":"Acme announced partnership with Beta Inc"}' \
  https://api.leadgenius.app/api/automation/companies/events | jq
```

---

### `DELETE /api/automation/companies/events`

Batch delete CompanyEvent records.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `eventIds` | array | Yes | — | Array of event IDs to delete |

**Response:**

```json
{
  "success": true,
  "data": {
    "deleted": 2
  }
}
```

**curl:**

```bash
curl -s -X DELETE -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"eventIds":["event-1","event-2"]}' \
  https://api.leadgenius.app/api/automation/companies/events | jq
```

---

### `POST /api/automation/companies/events/generate`

Auto-generate CompanyEvent records from recent EnrichLeads activity.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `client_id` | string | Yes | — | Client to generate events for |
| `since` | string | No | — | Only process leads created after this ISO date |
| `maxLeads` | integer | No | — | Max leads to process |

**Response:**

```json
{
  "success": true,
  "data": {
    "eventsCreated": 25,
    "eventsByType": {
      "new_lead": 15,
      "lead_qualified": 10
    },
    "errors": []
  }
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"YOUR_CLIENT","since":"2025-01-01T00:00:00Z"}' \
  https://api.leadgenius.app/api/automation/companies/events/generate | jq
```

---

### `GET /api/automation/companies/events/radar`

Return a radar dashboard summary with recent events, counts by type, top active companies, and timeline.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `client_id` | string | Yes | — | Client to get radar for |

**Response:**

```json
{
  "success": true,
  "data": {
    "recentEvents": [
      {
        "id": "event-001",
        "eventType": "new_lead",
        "eventTitle": "New lead added",
        "eventDate": "2026-03-01T10:00:00.000Z"
      }
    ],
    "eventCountsByType": {
      "new_lead": 50,
      "lead_qualified": 20
    },
    "topActiveCompanies": [
      {
        "companyName": "Acme Corp",
        "eventCount": 15
      }
    ],
    "timeline": [
      {
        "date": "2026-03-01",
        "count": 5
      }
    ]
  }
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/companies/events/radar?client_id=YOUR_CLIENT" | jq
```

---

### `POST /api/automation/companies/{id}/content-analysis`

Re-run content analysis aggregation for a TerritoryCompany. Fetches all associated EnrichLeads, extracts content insights, and updates the company record.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | TerritoryCompany record ID |

**Request Body:** Empty `{}` or omit body.

**Updated fields:** `contentTopics`, `contentKeywords`, `leadTitles`, `leadHeadlines`, `targetAudiences`, `painPoints`, `valuePropositions`, `competitorMentions`, `engagementInsights`, `contentRecommendations`, `lastContentAnalysisDate`.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "tc-001",
    "companyName": "Acme Corp",
    "contentTopics": ["AI", "Automation"],
    "contentKeywords": ["machine learning", "workflow"],
    "painPoints": ["manual processes", "data silos"],
    "valuePropositions": ["efficiency", "integration"],
    "competitorMentions": ["CompetitorX"],
    "engagementInsights": "High email open rate",
    "contentRecommendations": "Focus on ROI case studies",
    "lastContentAnalysisDate": "2026-03-15T14:30:00.000Z"
  }
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  https://api.leadgenius.app/api/automation/companies/COMPANY_ID/content-analysis | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts companies content-analysis COMPANY_ID
```


---

## Webhook Events

### `GET /api/automation/webhook-events`

List WebhookLog records for your company, sorted by `createdAt` descending.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `platform` | string | No | — | Filter by platform (e.g., `woodpecker`, `lemlist`) |
| `eventType` | string | No | — | Filter by event type |
| `matchStatus` | string | No | — | Filter by match status |
| `processingStatus` | string | No | — | Filter: `success` or `failure` |
| `clientId` | string | No | — | Filter by webhook ID / client |
| `dateFrom` | string | No | — | ISO date lower bound |
| `dateTo` | string | No | — | ISO date upper bound |
| `limit` | integer | No | 50 | Max records (capped at 500) |
| `nextToken` | string | No | — | Pagination token |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "wh-001",
        "webhookId": "hook-123",
        "webhookType": "inbound",
        "platform": "woodpecker",
        "eventType": "email_opened",
        "matchStatus": "matched",
        "matchedLeadId": "lead-001",
        "matchConfidence": "high",
        "normalizedData": {"email": "jane@example.com"},
        "requestMethod": "POST",
        "responseStatus": 200,
        "isSuccess": true,
        "processingTime": 150,
        "createdAt": "2026-03-01T10:00:00.000Z"
      }
    ],
    "count": 1,
    "nextToken": null
  }
}
```

**Pagination:** When `nextToken` is present in the response, pass it as a query parameter to fetch the next page. When `nextToken` is `null`, there are no more pages.

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/webhook-events?platform=woodpecker&limit=20" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts webhooks list
npx tsx src/scripts/lgp.ts webhooks list --platform woodpecker --limit 20
```

---

### `GET /api/automation/webhook-events/{id}`

Return a complete WebhookLog record including raw payload, normalized data, and processing details.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | WebhookLog record ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "wh-001",
    "webhookId": "hook-123",
    "webhookType": "inbound",
    "platform": "woodpecker",
    "eventType": "email_opened",
    "matchStatus": "matched",
    "matchedLeadId": "lead-001",
    "matchConfidence": "high",
    "normalizedData": {"email": "jane@example.com", "firstName": "Jane"},
    "requestMethod": "POST",
    "requestBody": "{\"prospect\":{\"email\":\"jane@example.com\"}}",
    "responseStatus": 200,
    "isSuccess": true,
    "errorMessage": null,
    "leadsCreated": 0,
    "eventHash": "abc123",
    "processingTime": 150,
    "createdAt": "2026-03-01T10:00:00.000Z"
  }
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/webhook-events/EVENT_ID" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts webhooks get EVENT_ID
```

---

### `PUT /api/automation/webhook-events/{id}`

Update specific fields on a WebhookLog record. Immutable fields (`owner`, `company_id`) cannot be modified.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | WebhookLog record ID |

**Request Body (all fields optional):**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `matchStatus` | string | No | — | Update match status |
| `matchedLeadId` | string | No | — | Link to a matched lead |
| `processingStatus` | string | No | — | `success` or `failure` (mapped to `isSuccess`) |
| `client_id` | string | No | — | Reassign to a different client |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "wh-001",
    "matchStatus": "matched",
    "matchedLeadId": "lead-123",
    "isSuccess": true
  }
}
```

**curl:**

```bash
curl -s -X PUT -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"matchStatus":"matched","matchedLeadId":"lead-123"}' \
  https://api.leadgenius.app/api/automation/webhook-events/EVENT_ID | jq
```

---

### `DELETE /api/automation/webhook-events`

Batch delete WebhookLog records by ID.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `eventIds` | array | Yes | — | Array of WebhookLog IDs to delete |

**Response:**

```json
{
  "success": true,
  "data": {
    "deleted": 2,
    "failed": 1,
    "results": [
      {"id": "event-1", "success": true},
      {"id": "event-2", "success": true},
      {"id": "event-3", "success": false, "error": "Not found"}
    ]
  }
}
```

**curl:**

```bash
curl -s -X DELETE -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"eventIds":["event-1","event-2"]}' \
  https://api.leadgenius.app/api/automation/webhook-events | jq
```

---

### `POST /api/automation/webhook-events/{id}/reprocess`

Re-run lead matching and engagement update logic for a specific webhook event. Useful when new leads have been imported since the original webhook was received.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | WebhookLog record ID |

**Request Body:** Empty `{}` or omit body.

**Matching priority:**
1. Email match (high confidence) — uses `email-index` GSI
2. LinkedIn URL match (medium confidence) — uses `company_id` GSI with filter
3. First name + last name match (low confidence) — uses `firstName-lastName-index` GSI

**Key behaviors:**
- Updates `matchStatus`, `matchedLeadId`, and `matchConfidence` on the WebhookLog
- If a lead is matched, appends the webhook event to the lead's `engagementHistory` and recalculates `engagementScore`
- Matching uses the `normalizedData` JSON field from the webhook event

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "wh-001",
    "matchStatus": "matched",
    "matchedLeadId": "lead-123",
    "matchConfidence": "high",
    "matchMethod": "email",
    "reprocessedAt": "2026-03-05T12:00:00.000Z",
    "platform": "woodpecker",
    "eventType": "email_opened"
  },
  "message": "Matched lead via email (high confidence)"
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  https://api.leadgenius.app/api/automation/webhook-events/EVENT_ID/reprocess | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts webhooks reprocess EVENT_ID
```


---

## Users

### `GET /api/automation/users`

List CompanyUser records in your company.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `group` | string | No | — | Filter by group: `admin`, `manager`, `user`, `viewer` |
| `limit` | integer | No | 50 | Max records (capped at 500) |
| `nextToken` | string | No | — | Pagination token |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cu-001",
        "user_id": "cognito-sub-123",
        "company_id": "company-456",
        "email": "jane@example.com",
        "role": "admin",
        "group": "admin",
        "menuAccess": ["dashboard", "enrich-leads", "sdr-ai"],
        "permissions": {"canExport": true},
        "clientAccessMode": "all",
        "allowedClientIds": [],
        "status": "active",
        "invitedBy": "owner-sub-789",
        "invitedAt": "2026-01-15T10:00:00.000Z",
        "acceptedAt": "2026-01-15T10:05:00.000Z",
        "createdAt": "2026-01-15T10:00:00.000Z"
      }
    ],
    "count": 1,
    "nextToken": null
  }
}
```

**Pagination:** When `nextToken` is present in the response, pass it as a query parameter to fetch the next page. When `nextToken` is `null`, there are no more pages.

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/users?group=admin" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts users list
npx tsx src/scripts/lgp.ts users list --group admin
```

---

### `GET /api/automation/users/{id}`

Get a single CompanyUser's details.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | CompanyUser record ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cu-001",
    "user_id": "cognito-sub-123",
    "company_id": "company-456",
    "email": "jane@example.com",
    "role": "admin",
    "group": "admin",
    "menuAccess": ["dashboard", "enrich-leads"],
    "permissions": {},
    "clientAccessMode": "all",
    "status": "active",
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/users/USER_ID" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts users get USER_ID
```

---

### `POST /api/automation/users`

Create/invite a new CompanyUser record.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `email` | string | Yes | — | User email |
| `role` | string | No | `member` | `owner`, `admin`, `member`, `viewer` |
| `group` | string | No | `user` | `admin`, `manager`, `user`, `viewer` |
| `user_id` | string | No | auto-generated | Cognito sub (if known) |
| `menuAccess` | array | No | — | Array of menu keys |
| `permissions` | object | No | — | Permissions object |
| `clientAccessMode` | string | No | — | `all`, `own`, `specific` |
| `allowedClientIds` | array | No | — | Array of client IDs (for `specific` mode) |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cu-002",
    "email": "newuser@example.com",
    "role": "member",
    "group": "user",
    "company_id": "company-456",
    "status": "pending",
    "createdAt": "2026-03-01T10:00:00.000Z"
  }
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","role":"member","group":"user"}' \
  https://api.leadgenius.app/api/automation/users | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts users create --email newuser@example.com --role member --group user
```

---

### `PUT /api/automation/users/{id}`

Update a CompanyUser's group, role, status, menu access, or permissions.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | CompanyUser record ID |

**Request Body (all fields optional):**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `group` | string | No | — | `admin`, `manager`, `user`, `viewer` |
| `role` | string | No | — | `owner`, `admin`, `member`, `viewer` |
| `status` | string | No | — | `pending`, `active`, `inactive`, `disabled` |
| `menuAccess` | array | No | — | Array of menu keys |
| `permissions` | object | No | — | Permissions object |
| `clientAccessMode` | string | No | — | `all`, `own`, `specific` |
| `allowedClientIds` | array | No | — | Client IDs for `specific` mode |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cu-001",
    "role": "admin",
    "group": "manager",
    "status": "active",
    "menuAccess": ["dashboard", "enrich-leads", "sdr-ai"]
  }
}
```

**curl:**

```bash
curl -s -X PUT -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin","group":"manager"}' \
  https://api.leadgenius.app/api/automation/users/USER_ID | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts users update USER_ID --role admin --group manager
```

---

### `DELETE /api/automation/users/{id}`

Remove a CompanyUser from the company. Cannot delete your own account.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | CompanyUser record ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cu-002",
    "deleted": true
  }
}
```

**curl:**

```bash
curl -s -X DELETE -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/users/USER_ID" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts users delete USER_ID
```

---

### `GET /api/automation/users/menu-config`

Returns the master list of available menu keys, categories, and default menus per group.

**Query Parameters:** None.

**Response:**

```json
{
  "success": true,
  "data": {
    "menus": [
      {"key": "dashboard", "label": "Dashboard", "category": "main"},
      {"key": "enrich-leads", "label": "Enrich Leads", "category": "leads"},
      {"key": "source-leads", "label": "Source Leads", "category": "leads"},
      {"key": "sdr-ai", "label": "SDR AI", "category": "ai"}
    ],
    "groupDefaults": {
      "admin": ["dashboard", "source-leads", "enrich-leads", "sdr-ai"],
      "manager": ["dashboard", "enrich-leads", "sdr-ai"],
      "user": ["dashboard", "enrich-leads"],
      "viewer": ["dashboard"]
    }
  }
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/users/menu-config" | jq
```

---

### `GET /api/automation/users/cognito`

Look up or list Cognito users.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `email` | string | No | — | Get a specific user by email |
| `limit` | integer | No | 20 | Max users to list (max 60) |

**Response (single user by email):**

```json
{
  "success": true,
  "data": {
    "username": "user@example.com",
    "sub": "f4a844a8-00c1-7087-b434-f6d681e1f269",
    "status": "CONFIRMED",
    "email": "user@example.com",
    "enabled": true,
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
}
```

**curl:**

```bash
# Get specific user
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/users/cognito?email=user@example.com" | jq

# List users
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/users/cognito?limit=10" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts cognito get --email user@example.com
npx tsx src/scripts/lgp.ts cognito list --limit 10
```

---

### `POST /api/automation/users/cognito`

Create a Cognito user with a permanent password (no force-change on first login).

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `email` | string | Yes | — | User email |
| `password` | string | Yes | — | Min 8 characters |
| `name` | string | No | — | Display name |

**Response:**

```json
{
  "success": true,
  "data": {
    "username": "newuser@example.com",
    "sub": "f4a844a8-00c1-7087-b434-f6d681e1f269",
    "status": "CONFIRMED",
    "email": "newuser@example.com"
  }
}
```

**Error Codes:**

| Condition | Error | Description |
|-----------|-------|-------------|
| Email already registered | `UsernameExistsException` | A Cognito user with this email already exists |
| Weak password | `InvalidPasswordException` | Password does not meet complexity requirements (min 8 chars) |

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"SecurePass123!","name":"Jane Doe"}' \
  https://api.leadgenius.app/api/automation/users/cognito | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts cognito create --email newuser@example.com --password "SecurePass123!"
```

---

### `PUT /api/automation/users/cognito`

Enable, disable, reset password, or set custom attributes on a Cognito user.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `email` | string | Yes | — | User email |
| `action` | string | Yes | — | `enable`, `disable`, `set-password`, `set-attributes` |
| `password` | string | For `set-password` | — | New password |
| `attributes` | object | For `set-attributes` | — | Object of attribute name → value |

**Response:**

```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "action": "set-attributes",
    "result": "success"
  }
}
```

**curl:**

```bash
# Enable a user
curl -s -X PUT -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","action":"enable"}' \
  https://api.leadgenius.app/api/automation/users/cognito | jq

# Set custom attributes
curl -s -X PUT -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","action":"set-attributes","attributes":{"custom:allowed_views":"role:companyAdmin|*"}}' \
  https://api.leadgenius.app/api/automation/users/cognito | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts cognito enable --email user@example.com
npx tsx src/scripts/lgp.ts cognito disable --email user@example.com
```

---

### `POST /api/automation/users/provision`

One-shot endpoint that creates a complete user setup: Cognito user → Company (new or existing) → CompanyUser → API key.

**Request Body — New company:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `email` | string | Yes | — | User email |
| `password` | string | Yes | — | Min 8 characters |
| `name` | string | No | — | Display name |
| `companyName` | string | No | Derived from email domain | New company name |
| `role` | string | No | `owner` | User role |
| `group` | string | No | `admin` | User group |
| `menuAccess` | array | No | — | Array of menu keys |
| `permissions` | object | No | — | Permissions object |
| `clientAccessMode` | string | No | — | `all`, `own`, `specific` |
| `allowedClientIds` | array | No | — | Client IDs for `specific` mode |
| `createApiKey` | boolean | No | `true` | Generate API key |
| `apiKeyName` | string | No | Auto-generated | API key display name |

**Request Body — Join existing company:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `email` | string | Yes | — | User email |
| `password` | string | Yes | — | Min 8 characters |
| `company_id` | string | Yes | — | Existing company ID to join |
| `role` | string | No | `member` | User role |
| `group` | string | No | `user` | User group |
| `createApiKey` | boolean | No | `false` | Generate API key |

**Response:**

```json
{
  "success": true,
  "data": {
    "cognito": {
      "sub": "f4a844a8-00c1-7087-b434-f6d681e1f269",
      "username": "newuser@example.com",
      "status": "CONFIRMED"
    },
    "company": {
      "id": "company-xxx",
      "name": "Acme Corp",
      "action": "created"
    },
    "companyUser": {
      "id": "user-xxx",
      "email": "newuser@example.com",
      "role": "owner"
    },
    "apiKey": {
      "id": "apikey-xxx",
      "name": "Jane's API Key",
      "keyPrefix": "lgp_6bd162",
      "plainTextKey": "lgp_xxxxxxxx..."
    },
    "companyId": "company-xxx"
  },
  "message": "User fully provisioned (new company)"
}
```

The `plainTextKey` is only returned once — store it securely.

**Error Codes:**

| Condition | Error | Description | Recovery |
|-----------|-------|-------------|----------|
| Email already registered | `UsernameExistsException` | A Cognito user with this email already exists | Use `GET /api/automation/users/cognito?email=...` to check first, or use `company_id` to join existing |
| Weak password | `InvalidPasswordException` | Password does not meet complexity requirements | Use min 8 characters with mixed case, numbers, and symbols |
| Company not found | `NOT_FOUND` | The `company_id` provided does not exist | Verify the company ID or create a new company instead |

**curl:**

```bash
# Provision with new company
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"SecurePass123!","name":"Jane Doe","companyName":"Acme Corp","createApiKey":true}' \
  https://api.leadgenius.app/api/automation/users/provision | jq

# Provision joining existing company
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"SecurePass123!","company_id":"COMPANY_ID","role":"member","group":"user"}' \
  https://api.leadgenius.app/api/automation/users/provision | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts users provision --email newuser@example.com --password "SecurePass123!" --company-name "Acme Corp"
```


---

## Organizations

### `GET /api/automation/companies/manage`

List companies owned by the authenticated user.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `limit` | integer | No | 50 | Max records (max 500) |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "company-001",
        "name": "Acme Corp",
        "owner": "owner-sub-789",
        "createdAt": "2026-01-01T10:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/companies/manage" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts org list
```

---

### `GET /api/automation/companies/manage?id={id}`

Get a single company by ID.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | — | Company record ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "company-001",
    "name": "Acme Corp",
    "owner": "owner-sub-789",
    "createdAt": "2026-01-01T10:00:00.000Z"
  }
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/companies/manage?id=COMPANY_ID" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts org get COMPANY_ID
```

---

### `POST /api/automation/companies/manage`

Create a new company. The authenticated user becomes the owner.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | — | Company display name |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "company-002",
    "name": "Acme Corp",
    "owner": "owner-sub-789",
    "createdAt": "2026-03-01T10:00:00.000Z"
  }
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp"}' \
  https://api.leadgenius.app/api/automation/companies/manage | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts org create --name "Acme Corp"
```

---

### `PUT /api/automation/companies/manage` — Rename

Rename an existing company.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | — | Company record ID |
| `name` | string | Yes | — | New company name |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "company-001",
    "name": "New Company Name"
  }
}
```

**curl:**

```bash
curl -s -X PUT -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id":"COMPANY_ID","name":"New Company Name"}' \
  https://api.leadgenius.app/api/automation/companies/manage | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts org rename COMPANY_ID --name "New Name"
```

---

### `DELETE /api/automation/companies/manage?id={id}`

Delete a company. Only the company owner can delete it. Does not cascade-delete users or data.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | — | Company record ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "company-001",
    "deleted": true
  }
}
```

**curl:**

```bash
curl -s -X DELETE -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/companies/manage?id=COMPANY_ID" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts org delete COMPANY_ID
```

---

### `GET /api/automation/companies/manage?id={id}&users=true`

List all CompanyUser records in a specific company.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | — | Company record ID |
| `users` | boolean | Yes | `true` | Must be `true` to list users |

**Response:**

```json
{
  "success": true,
  "data": {
    "company": {
      "id": "company-001",
      "name": "Acme Corp"
    },
    "users": [
      {
        "id": "cu-001",
        "email": "admin@acme.com",
        "role": "owner",
        "group": "admin",
        "status": "active"
      },
      {
        "id": "cu-002",
        "email": "member@acme.com",
        "role": "member",
        "group": "user",
        "status": "active"
      }
    ]
  }
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/companies/manage?id=COMPANY_ID&users=true" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts org users COMPANY_ID
```

---

### `PUT /api/automation/companies/manage` — Add User

Add a user to a company.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `action` | string | Yes | — | Must be `add-user` |
| `company_id` | string | Yes | — | Target company ID |
| `email` | string | Yes | — | User email |
| `user_id` | string | No | auto-generated | Cognito sub (if known) |
| `role` | string | No | `member` | `owner`, `admin`, `member`, `viewer` |
| `group` | string | No | `user` | `admin`, `manager`, `user`, `viewer` |
| `menuAccess` | array | No | — | Array of menu keys |
| `permissions` | object | No | — | Permissions object |
| `clientAccessMode` | string | No | — | `all`, `own`, `specific` |
| `allowedClientIds` | array | No | — | Client IDs for `specific` mode |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cu-003",
    "email": "newuser@example.com",
    "role": "member",
    "group": "user",
    "company_id": "company-001",
    "status": "pending"
  }
}
```

**curl:**

```bash
curl -s -X PUT -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"add-user","company_id":"COMPANY_ID","email":"newuser@example.com","role":"member","group":"user"}' \
  https://api.leadgenius.app/api/automation/companies/manage | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts org add-user COMPANY_ID --email newuser@example.com --role member --group user
```

---

### `PUT /api/automation/companies/manage` — Update User

Update a user's role, group, or status within a company.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `action` | string | Yes | — | Must be `update-user` |
| `id` | string | Yes | — | CompanyUser record ID |
| `role` | string | No | — | `owner`, `admin`, `member`, `viewer` |
| `group` | string | No | — | `admin`, `manager`, `user`, `viewer` |
| `status` | string | No | — | `active`, `inactive`, `pending` |
| `email` | string | No | — | Update email |
| `menuAccess` | array | No | — | Update menu access |
| `permissions` | object | No | — | Update permissions |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cu-003",
    "role": "admin",
    "group": "manager",
    "status": "active"
  }
}
```

**curl:**

```bash
curl -s -X PUT -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"update-user","id":"COMPANY_USER_ID","role":"admin","group":"manager"}' \
  https://api.leadgenius.app/api/automation/companies/manage | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts org update-user COMPANY_USER_ID --role admin --group manager
```

---

### `PUT /api/automation/companies/manage` — Remove User

Remove a user from a company.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `action` | string | Yes | — | Must be `remove-user` |
| `id` | string | Yes | — | CompanyUser record ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cu-003",
    "removed": true
  }
}
```

**curl:**

```bash
curl -s -X PUT -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"remove-user","id":"COMPANY_USER_ID"}' \
  https://api.leadgenius.app/api/automation/companies/manage | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts org remove-user COMPANY_USER_ID
```


---

## Tables (Generic CRUD with ICP Focus)

Generic CRUD operations for any supported DynamoDB table. The Tables API is the primary interface for managing configuration records (UrlSettings, AgentSettings, SdrAiSettings, Client, EmailPlatformSettings) and business data models (ICP, ABMCampaign, etc.). This section uses ICP (Ideal Customer Profile) as the primary example since it is central to FSD pipeline automation.

### `GET /api/automation/tables/{tableName}`

List records from any supported table, filtered by your `company_id`. Supports pagination.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tableName` | string | Yes | Exact model name (case-sensitive). See supported tables below. |

**Query Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `limit` | integer | No | 100 | Max records per page (capped at 1000) |
| `nextToken` | string | No | — | Pagination token from previous response |

**Supported Tables:**

| Category | Tables |
|----------|--------|
| Multi-Tenant Company | `Company`, `CompanyUser`, `CompanyInvitation` |
| Core Data & Leads | `Jobs`, `B2BLeads`, `EnrichLeads`, `SourceLeads`, `TerritoryCompany`, `CompanyEvent`, `LinkedInJobs` |
| Campaign & Targeting | `ICP`, `ABMCampaign`, `TargetAccount` |
| Outreach & Workflow | `OutreachSequence`, `SequenceEnrollment`, `Workflow`, `WorkflowExecution` |
| Webhook & Integration | `Integration`, `Webhook`, `WebhookLog`, `WebhookSettings`, `InboundWebhook`, `WebhookEvent` |
| AI & Agent Config | `Agent`, `AgentSettings`, `SdrAiSettings`, `CopyrightSettings`, `SdrSettings` |
| Service & Platform Config | `EnrichmentService`, `EmailPlatformSettings`, `OutreachCampaign`, `OutreachTemplate`, `BaserowSyncConfig`, `BaserowSyncHistory`, `BaserowConfig`, `UnipileSettings`, `UnipileAccount`, `UnipileMessage`, `UnipileChat`, `UnipileLog`, `UnipileCampaign`, `UnipileIntegration` |
| System & Settings | `AgentApiKey`, `UrlSettings`, `Client`, `SearchHistory`, `Maintenance`, `SidebarConfig`, `SharedView` |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "record-id",
        "name": "Enterprise SaaS ICP",
        "client_id": "client-123",
        "company_id": "company-456",
        "owner": "owner-sub-789",
        "createdAt": "2026-03-01T10:00:00.000Z",
        "updatedAt": "2026-03-15T14:30:00.000Z"
      }
    ],
    "count": 1,
    "nextToken": null
  }
}
```

**Pagination:** When `nextToken` is present in the response, pass it as a query parameter to fetch the next page. When `nextToken` is `null`, there are no more pages.

**curl:**

```bash
# List all ICP records
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/tables/ICP" | jq
```

```bash
# List ICP records with pagination
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/tables/ICP?limit=10" | jq
```

```bash
# List other table types
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/tables/Client?limit=50" | jq

curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/tables/UrlSettings?limit=10" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts tables list ICP
npx tsx src/scripts/lgp.ts tables list Client
npx tsx src/scripts/lgp.ts tables list UrlSettings --limit 10
```

---

### `POST /api/automation/tables/{tableName}`

Create a new record in any supported table. `owner` and `company_id` are auto-set from your API key.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tableName` | string | Yes | Exact model name (case-sensitive) |

**Request Body:** Any valid fields for the target model. See ICP field schema below for ICP-specific fields.

**Key behaviors:**
- `owner` is auto-set to your API key's owner
- `company_id` is auto-set to your API key's company
- If you provide `owner` or `company_id` that don't match your key, the request is rejected with `IMMUTABLE_FIELD`
- Unknown fields are passed through to GraphQL (may cause errors if not in schema)

**ICP Field Schema:**

The ICP (Ideal Customer Profile) model has four field groups:

**Targeting Criteria Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | ICP display name |
| `description` | string | No | ICP description |
| `industries` | JSON array | No | Target industries (e.g., `["SaaS", "FinTech", "Healthcare"]`) |
| `companySizes` | JSON array | No | Company size ranges (e.g., `["1-10", "11-50", "51-200", "201-500"]`) |
| `geographies` | JSON array | No | Target countries/regions (e.g., `["United States", "United Kingdom", "Germany"]`) |
| `jobTitles` | JSON array | No | Target job titles (e.g., `["VP Sales", "Head of Marketing", "CTO"]`) |
| `seniority` | JSON array | No | Seniority levels (e.g., `["Director", "VP", "C-Suite"]`) |
| `departments` | JSON array | No | Target departments (e.g., `["Sales", "Marketing", "Engineering"]`) |
| `functions` | JSON array | No | Target functions (e.g., `["Business Development", "Product Management"]`) |
| `keywords` | JSON array | No | Search keywords (e.g., `["AI", "machine learning", "automation"]`) |
| `technologies` | JSON array | No | Target technologies (e.g., `["Salesforce", "HubSpot", "AWS"]`) |

**Apify Configuration Fields (required for lead generation):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `apifyActorId` | string | Yes (for generation) | Apify actor ID for lead scraping (e.g., `"apify/linkedin-sales-navigator"`) |
| `apifyInput` | JSON string | No | Apify actor input configuration (search parameters as JSON string) |
| `apifySettings` | JSON string | No | Additional Apify settings (e.g., proxy, timeout) |
| `maxLeads` | integer | No (default 100) | Maximum leads per generation run |
| `leadSources` | JSON array | No | Lead source identifiers |

**Qualification Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `qualificationCriteria` | JSON string | No | Qualification rules as JSON string |
| `scoringWeights` | JSON string | No | Scoring weights per criterion as JSON string |

**Metadata Fields (mostly auto-managed):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isActive` | boolean | No (default `true`) | Whether the ICP is active |
| `lastUsedDate` | datetime | No (auto-updated) | Last time this ICP was used for generation |
| `totalLeadsGenerated` | integer | No (auto-updated) | Cumulative leads generated from this ICP |
| `client_id` | string | Yes | Client partition for data isolation |
| `company_id` | string | Auto-set | Company isolation (set from API key) |
| `owner` | string | Auto-set | Owner identity (set from API key) |

**Example — Create ICP with full targeting criteria:**

```json
{
  "client_id": "client-123",
  "name": "Enterprise SaaS Decision Makers",
  "description": "VP+ level contacts at mid-to-large SaaS companies in North America",
  "industries": ["SaaS", "Cloud Computing", "Enterprise Software"],
  "companySizes": ["51-200", "201-500", "501-1000", "1001-5000"],
  "geographies": ["United States", "Canada"],
  "jobTitles": ["VP Sales", "VP Marketing", "Head of Growth", "CTO", "CMO"],
  "seniority": ["VP", "C-Suite", "Director"],
  "departments": ["Sales", "Marketing", "Engineering"],
  "functions": ["Business Development", "Product Management", "Revenue Operations"],
  "keywords": ["B2B SaaS", "product-led growth", "enterprise sales"],
  "technologies": ["Salesforce", "HubSpot", "Outreach", "Gong"],
  "apifyActorId": "apify/linkedin-sales-navigator",
  "apifyInput": "{\"searchUrl\":\"https://www.linkedin.com/sales/search/people?query=...\",\"maxResults\":200}",
  "apifySettings": "{\"proxyConfiguration\":{\"useApifyProxy\":true}}",
  "maxLeads": 200,
  "leadSources": ["LinkedIn Sales Navigator"],
  "qualificationCriteria": "{\"minCompanySize\":50,\"requiredIndustries\":[\"SaaS\",\"Cloud Computing\"]}",
  "scoringWeights": "{\"industryMatch\":0.3,\"seniorityMatch\":0.25,\"companySize\":0.2,\"technologyFit\":0.25}",
  "isActive": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "record": {
      "id": "icp-generated-id",
      "name": "Enterprise SaaS Decision Makers",
      "client_id": "client-123",
      "owner": "your-owner",
      "company_id": "your-company",
      "isActive": true,
      "totalLeadsGenerated": 0,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  },
  "message": "ICP record created"
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT",
    "name": "Enterprise SaaS Decision Makers",
    "industries": ["SaaS", "Cloud Computing"],
    "companySizes": ["51-200", "201-500"],
    "geographies": ["United States"],
    "jobTitles": ["VP Sales", "CTO"],
    "seniority": ["VP", "C-Suite"],
    "apifyActorId": "apify/linkedin-sales-navigator",
    "apifyInput": "{\"searchUrl\":\"https://linkedin.com/sales/search/...\"}",
    "maxLeads": 200,
    "isActive": true
  }' \
  https://api.leadgenius.app/api/automation/tables/ICP | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts tables create ICP --data '{
  "client_id": "YOUR_CLIENT",
  "name": "Enterprise SaaS Decision Makers",
  "industries": ["SaaS", "Cloud Computing"],
  "companySizes": ["51-200", "201-500"],
  "geographies": ["United States"],
  "jobTitles": ["VP Sales", "CTO"],
  "seniority": ["VP", "C-Suite"],
  "apifyActorId": "apify/linkedin-sales-navigator",
  "apifyInput": "{\"searchUrl\":\"https://linkedin.com/sales/search/...\"}",
  "maxLeads": 200,
  "isActive": true
}'
```

---

### `GET /api/automation/tables/{tableName}/{id}`

Return a single record by ID. Verifies `company_id` match — you can only access records belonging to your company.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tableName` | string | Yes | Exact model name (case-sensitive) |
| `id` | string | Yes | Record ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "icp-123",
    "name": "Enterprise SaaS Decision Makers",
    "industries": ["SaaS", "Cloud Computing", "Enterprise Software"],
    "companySizes": ["51-200", "201-500", "501-1000"],
    "geographies": ["United States", "Canada"],
    "jobTitles": ["VP Sales", "VP Marketing", "CTO"],
    "seniority": ["VP", "C-Suite", "Director"],
    "departments": ["Sales", "Marketing"],
    "functions": ["Business Development"],
    "keywords": ["B2B SaaS"],
    "technologies": ["Salesforce", "HubSpot"],
    "apifyActorId": "apify/linkedin-sales-navigator",
    "apifyInput": "{\"searchUrl\":\"...\"}",
    "maxLeads": 200,
    "isActive": true,
    "totalLeadsGenerated": 450,
    "lastUsedDate": "2026-03-10T08:00:00.000Z",
    "client_id": "client-123",
    "company_id": "company-456",
    "owner": "owner-sub-789",
    "createdAt": "2026-03-01T10:00:00.000Z",
    "updatedAt": "2026-03-10T08:00:00.000Z"
  }
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/tables/ICP/ICP_ID" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts tables get ICP ICP_ID
```

---

### `PUT /api/automation/tables/{tableName}/{id}`

Update a record. Verifies `company_id` match. Rejects changes to immutable fields (`owner`, `company_id`).

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tableName` | string | Yes | Exact model name (case-sensitive) |
| `id` | string | Yes | Record ID |

**Request Body:** Any valid fields for the target model. Only provided fields are updated.

**Error Codes:**
- `IMMUTABLE_FIELD` (400) — Attempted to modify `owner` or `company_id`
- `NOT_FOUND` (404) — Record does not exist or belongs to a different company

**Example — Update ICP targeting criteria:**

```json
{
  "industries": ["SaaS", "Cloud Computing", "AI/ML"],
  "companySizes": ["201-500", "501-1000", "1001-5000"],
  "jobTitles": ["VP Sales", "VP Marketing", "CTO", "VP Engineering"],
  "keywords": ["B2B SaaS", "product-led growth", "AI-powered"]
}
```

**Example — Deactivate an ICP:**

```json
{
  "isActive": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "record": {
      "id": "icp-123",
      "name": "Enterprise SaaS Decision Makers",
      "isActive": false,
      "updatedAt": "2026-03-15T14:30:00.000Z"
    }
  },
  "message": "ICP record updated"
}
```

**curl:**

```bash
# Update targeting criteria
curl -s -X PUT -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"industries":["SaaS","Cloud Computing","AI/ML"],"companySizes":["201-500","501-1000"]}' \
  https://api.leadgenius.app/api/automation/tables/ICP/ICP_ID | jq
```

```bash
# Deactivate an ICP
curl -s -X PUT -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"isActive":false}' \
  https://api.leadgenius.app/api/automation/tables/ICP/ICP_ID | jq
```

**CLI equivalent:**

```bash
# Update targeting criteria
npx tsx src/scripts/lgp.ts tables update ICP ICP_ID --data '{"industries":["SaaS","Cloud Computing","AI/ML"]}'

# Deactivate an ICP
npx tsx src/scripts/lgp.ts tables update ICP ICP_ID --data '{"isActive":false}'
```

---

### `DELETE /api/automation/tables/{tableName}/{id}`

Delete a record. Verifies `company_id` match before deletion.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tableName` | string | Yes | Exact model name (case-sensitive) |
| `id` | string | Yes | Record ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "deleted": true,
    "id": "icp-123"
  },
  "message": "ICP record deleted"
}
```

**curl:**

```bash
curl -s -X DELETE -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/tables/ICP/ICP_ID" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts tables delete ICP ICP_ID
```


---

## Email Platforms

List configured email platforms and send leads to them for outreach campaigns.

### `GET /api/automation/email-platforms`

Return configured email platforms with connection status for your company.

**Query Parameters:** None.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "platform-1",
      "name": "My Woodpecker",
      "platform": "woodpecker",
      "isActive": true,
      "connectionStatus": "connected",
      "client_id": "client-123",
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-15T14:30:00.000Z"
    }
  ]
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/email-platforms" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts email-platforms list
```

---

### `POST /api/automation/email-platforms/send`

Send leads to a configured email platform for a campaign. Leads without a valid email are skipped.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `leadIds` | array | Yes | — | Array of EnrichLead IDs (max 200) |
| `platform` | string | Yes | — | Platform name (e.g., `woodpecker`, `lemlist`). Matches by `platform` type or display `name` (case-insensitive). |
| `campaignId` | string | Yes | — | Campaign identifier on the email platform |

**Key behaviors:**
- Platform must be active (`isActive: true`)
- Prefers `emailFinder` field over `email` for verified addresses
- Leads without any email are skipped with `missing_email` reason
- Leads from other companies are rejected

**Response:**

```json
{
  "success": true,
  "data": {
    "platform": "woodpecker",
    "platformName": "My Woodpecker",
    "campaignId": "campaign-123",
    "sent": 2,
    "skipped": [
      {"leadId": "lead-3", "reason": "missing_email"}
    ],
    "errors": [],
    "deliveryDetails": [
      {"leadId": "lead-1", "email": "jane@example.com", "status": "queued"},
      {"leadId": "lead-2", "email": "john@example.com", "status": "queued"}
    ]
  },
  "message": "Processed 3 leads: 2 queued, 1 skipped, 0 errors"
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"leadIds":["lead-1","lead-2","lead-3"],"platform":"woodpecker","campaignId":"campaign-123"}' \
  https://api.leadgenius.app/api/automation/email-platforms/send | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts email-platforms send --platform woodpecker --campaign campaign-123 --leads lead-1,lead-2,lead-3
```


---

## FSD Pipeline

Full-Stack Demand generation pipeline — create campaigns, run lead generation pipelines, and monitor stage-by-stage progress. The FSD pipeline orchestrates the entire demand generation flow: lead generation (via Apify) → enrichment → scoring → qualification → email delivery.

### `GET /api/automation/fsd/campaigns`

List all FsdCampaign records for your company with status and progress metrics.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `limit` | integer | No | 50 | Max records per page (capped at 500) |
| `nextToken` | string | No | — | Pagination token from previous response |

**Response fields per campaign:** `id`, `name`, `client_id`, `icpId`, `apifyActorId`, `apifyInput`, `frequency`, `targetLeadCount`, `isActive`, `nextRunAt`, `enrichAfterGeneration`, `scoreAfterEnrichment`, `sendToEmailPlatform`, `qualificationThreshold`, `emailCampaignId`, `totalRuns`, `totalLeadsGenerated`, `totalLeadsEnriched`, `totalLeadsScored`, `totalLeadsSent`, `lastRunAt`, `createdAt`.

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "campaign-001",
        "name": "Q1 Outreach Campaign",
        "client_id": "client-123",
        "icpId": "icp-456",
        "frequency": "weekly",
        "targetLeadCount": 200,
        "isActive": true,
        "enrichAfterGeneration": true,
        "scoreAfterEnrichment": true,
        "sendToEmailPlatform": "woodpecker",
        "qualificationThreshold": 60,
        "emailCampaignId": "camp-wp-001",
        "totalRuns": 4,
        "totalLeadsGenerated": 780,
        "totalLeadsEnriched": 750,
        "totalLeadsScored": 750,
        "totalLeadsSent": 320,
        "lastRunAt": "2026-03-10T08:00:00.000Z",
        "nextRunAt": "2026-03-17T08:00:00.000Z",
        "createdAt": "2026-02-15T10:00:00.000Z"
      }
    ],
    "count": 1,
    "nextToken": null
  }
}
```

**Pagination:** When `nextToken` is present in the response, pass it as a query parameter to fetch the next page. When `nextToken` is `null`, there are no more pages.

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/fsd/campaigns" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts fsd campaigns
```

---

### `GET /api/automation/fsd/campaigns/{id}`

Return a single FsdCampaign by ID with all fields and cumulative metrics.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | FsdCampaign record ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "campaign-001",
    "name": "Q1 Outreach Campaign",
    "client_id": "client-123",
    "icpId": "icp-456",
    "apifyActorId": "apify/linkedin-sales-navigator",
    "apifyInput": {"searchUrl": "https://linkedin.com/sales/search/..."},
    "frequency": "weekly",
    "targetLeadCount": 200,
    "isActive": true,
    "enrichAfterGeneration": true,
    "scoreAfterEnrichment": true,
    "sendToEmailPlatform": "woodpecker",
    "qualificationThreshold": 60,
    "emailCampaignId": "camp-wp-001",
    "totalRuns": 4,
    "totalLeadsGenerated": 780,
    "totalLeadsEnriched": 750,
    "totalLeadsScored": 750,
    "totalLeadsSent": 320,
    "lastRunAt": "2026-03-10T08:00:00.000Z",
    "nextRunAt": "2026-03-17T08:00:00.000Z",
    "createdAt": "2026-02-15T10:00:00.000Z",
    "updatedAt": "2026-03-10T08:05:00.000Z"
  }
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/fsd/campaigns/CAMPAIGN_ID" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts fsd campaign CAMPAIGN_ID
```

---

### `POST /api/automation/fsd/campaigns`

Create a new FSD campaign with lead generation configuration. A campaign defines recurring or one-time pipeline runs with automation flags.

**FSD Campaign Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `client_id` | string | Yes | — | Target client (must belong to your company) |
| `name` | string | No | — | Campaign display name |
| `icpId` | string | No | — | ICP record ID — the API resolves `apifyActorId` and `apifyInput` from the ICP automatically |
| `apifyActorId` | string | No | — | Direct Apify actor ID (alternative to `icpId`) |
| `apifyInput` | JSON | No | — | Apify actor input config (JSON object or string) |
| `frequency` | string | No | `once` | Run frequency: `once`, `daily`, `weekly`, `monthly` |
| `targetLeadCount` | integer | No | 100 | Target number of leads per pipeline run |
| `enrichAfterGeneration` | boolean | No | `false` | When `true`, automatically trigger enrichment after lead generation completes |
| `scoreAfterEnrichment` | boolean | No | `false` | When `true`, automatically trigger SDR AI scoring after enrichment completes |
| `sendToEmailPlatform` | string | No | — | Platform name to send qualified leads to (e.g., `woodpecker`, `lemlist`) |
| `qualificationThreshold` | integer | No | — | Minimum score (0–100) a lead must reach to be sent to the email platform |
| `emailCampaignId` | string | No | — | Campaign ID on the email platform for lead delivery |

**Automation Flags Logic:**
- `enrichAfterGeneration: true` → pipeline automatically moves to enrichment stage after generation completes
- `scoreAfterEnrichment: true` → pipeline automatically moves to scoring stage after enrichment completes
- `sendToEmailPlatform` set + `qualificationThreshold` defined → pipeline filters scored leads by threshold and sends qualifying leads to the email platform
- If automation flags are not set, the pipeline stops after generation and you must trigger subsequent stages manually

**Example — Create campaign with ICP and full automation:**

```json
{
  "client_id": "client-123",
  "name": "Q1 Enterprise Outreach",
  "icpId": "icp-456",
  "frequency": "weekly",
  "targetLeadCount": 200,
  "enrichAfterGeneration": true,
  "scoreAfterEnrichment": true,
  "sendToEmailPlatform": "woodpecker",
  "qualificationThreshold": 60,
  "emailCampaignId": "camp-wp-001"
}
```

**Example — Create campaign with direct Apify config (no ICP):**

```json
{
  "client_id": "client-123",
  "name": "Direct LinkedIn Scrape",
  "apifyActorId": "apify/linkedin-sales-navigator",
  "apifyInput": {"searchUrl": "https://www.linkedin.com/sales/search/people?query=..."},
  "frequency": "once",
  "targetLeadCount": 100,
  "enrichAfterGeneration": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "record": {
      "id": "campaign-new-id",
      "name": "Q1 Enterprise Outreach",
      "client_id": "client-123",
      "icpId": "icp-456",
      "frequency": "weekly",
      "targetLeadCount": 200,
      "isActive": true,
      "enrichAfterGeneration": true,
      "scoreAfterEnrichment": true,
      "sendToEmailPlatform": "woodpecker",
      "qualificationThreshold": 60,
      "emailCampaignId": "camp-wp-001",
      "totalRuns": 0,
      "totalLeadsGenerated": 0,
      "createdAt": "2026-03-01T10:00:00.000Z"
    }
  },
  "message": "FSD campaign created"
}
```

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT",
    "name": "Q1 Enterprise Outreach",
    "icpId": "ICP_ID",
    "frequency": "weekly",
    "targetLeadCount": 200,
    "enrichAfterGeneration": true,
    "scoreAfterEnrichment": true,
    "sendToEmailPlatform": "woodpecker",
    "qualificationThreshold": 60,
    "emailCampaignId": "camp-wp-001"
  }' \
  https://api.leadgenius.app/api/automation/fsd/campaigns | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts fsd create-campaign --client YOUR_CLIENT --name "Q1 Enterprise Outreach" --icp ICP_ID --frequency weekly --target 200
```

---

### `PUT /api/automation/fsd/campaigns/{id}`

Update campaign settings. Only allowed fields can be modified.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | FsdCampaign record ID |

**Allowed update fields:** `name`, `targetLeadCount`, `frequency`, `isActive`, `enrichAfterGeneration`, `scoreAfterEnrichment`, `sendToEmailPlatform`, `qualificationThreshold`, `emailCampaignId`, `apifyActorId`, `apifyInput`, `icpId`, `nextRunAt`.

**Request Body (all fields optional):**

```json
{
  "name": "Updated Campaign Name",
  "targetLeadCount": 300,
  "frequency": "daily",
  "isActive": true,
  "enrichAfterGeneration": true,
  "scoreAfterEnrichment": true,
  "qualificationThreshold": 70
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "record": {
      "id": "campaign-001",
      "name": "Updated Campaign Name",
      "targetLeadCount": 300,
      "frequency": "daily",
      "updatedAt": "2026-03-15T14:30:00.000Z"
    }
  },
  "message": "FSD campaign updated"
}
```

**curl:**

```bash
curl -s -X PUT -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","targetLeadCount":300,"frequency":"daily"}' \
  https://api.leadgenius.app/api/automation/fsd/campaigns/CAMPAIGN_ID | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts fsd update-campaign CAMPAIGN_ID --name "Updated Name" --target 300
```

---

### `DELETE /api/automation/fsd/campaigns/{id}`

Soft-delete a campaign by setting `isActive` to `false`. The record is not physically deleted — it can be reactivated via `PUT` with `{"isActive": true}`.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | FsdCampaign record ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "campaign-001",
    "isActive": false
  },
  "message": "FSD campaign deactivated"
}
```

**curl:**

```bash
curl -s -X DELETE -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/fsd/campaigns/CAMPAIGN_ID" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts fsd deactivate-campaign CAMPAIGN_ID
```

---

### `POST /api/automation/fsd/run`

Start a new FSD pipeline run. Creates an FsdPipelineRun record and initiates lead generation. The pipeline progresses through stages automatically based on automation flags.

**ICP-to-Generation Flow:**
When `icpId` is provided, the API automatically resolves `apifyActorId` and `apifyInput` from the ICP record. This is the recommended approach — define your Apify config once on the ICP, then reference it by ID in pipeline runs.

**ICP Validation Rules:**
- The ICP record must exist → error `ICP_NOT_FOUND` (404) if not found
- The ICP must have `apifyActorId` set → error `ICP_NO_APIFY` (400) if missing
- The ICP must belong to the same company as the API key → error `ICP_LOOKUP_FAILED` (500) on resolution failure

**Alternative Direct Apify Flow:**
Instead of using an ICP, you can provide `apifyActorId` and `apifyInput` directly in the request body. This is useful for one-off runs or testing without creating an ICP record.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `client_id` | string | Yes | — | Target client for generated leads |
| `icpId` | string | One of `icpId` / `apifyActorId` | — | ICP record ID — API resolves Apify config from ICP |
| `apifyActorId` | string | One of `icpId` / `apifyActorId` | — | Direct Apify actor ID (alternative to `icpId`) |
| `apifyInput` | JSON | With `apifyActorId` | — | Apify actor input configuration |
| `targetLeadCount` | integer | No | 100 | Target number of leads to generate |
| `enrichAfterGeneration` | boolean | No | `false` | Auto-enrich after generation completes |
| `scoreAfterEnrichment` | boolean | No | `false` | Auto-score after enrichment completes |
| `sendToEmailPlatform` | string | No | — | Platform name to send qualified leads |
| `qualificationThreshold` | integer | No | 50 | Min score (0–100) for qualification filtering |
| `campaignId` | string | No | — | Link run to an FsdCampaign record |

**Pipeline Stage Progression:**

```
generating → enriching → scoring → qualifying → sending → completed
                                                              ↘ failed
```

| Stage | Description | Metric Field |
|-------|-------------|--------------|
| `generating` | Apify actor is scraping leads | `leadsGenerated` |
| `enriching` | Enrichment services running on generated leads | `leadsEnriched` |
| `scoring` | SDR AI scoring leads | `leadsScored` |
| `qualifying` | Filtering leads by `qualificationThreshold` | `leadsQualified` |
| `sending` | Sending qualified leads to email platform | `leadsSent` |
| `completed` | Pipeline finished successfully | — |
| `failed` | Pipeline encountered an error (see `errorMessage`, `stageErrors`) | — |

**SearchHistory Integration:**
Each generation run creates a SearchHistory record tracking:
- `icpId` and `icpName` — which ICP was used
- `client_id` — target client
- `apifyActorId` — which actor ran
- `totalLeadsFound` — leads found by Apify
- `totalLeadsSaved` — leads saved to the client
- `status` — generation status (`running`, `completed`, `failed`)

**Example — Run with ICP (recommended):**

```json
{
  "client_id": "client-123",
  "icpId": "icp-456",
  "targetLeadCount": 100,
  "enrichAfterGeneration": true,
  "scoreAfterEnrichment": true,
  "sendToEmailPlatform": "woodpecker",
  "qualificationThreshold": 60
}
```

**Example — Run with direct Apify config (no ICP):**

```json
{
  "client_id": "client-123",
  "apifyActorId": "apify/linkedin-sales-navigator",
  "apifyInput": {"searchUrl": "https://www.linkedin.com/sales/search/people?query=..."},
  "targetLeadCount": 50
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "pipelineId": "pipeline-uuid-001",
    "stage": "generating",
    "targetLeadCount": 100,
    "flags": {
      "enrichAfterGeneration": true,
      "scoreAfterEnrichment": true,
      "sendToEmailPlatform": "woodpecker",
      "qualificationThreshold": 60
    }
  },
  "message": "FSD pipeline run created — lead generation initiated"
}
```

**Error Codes:**
- `ICP_NOT_FOUND` (404) — ICP record with the given `icpId` does not exist
- `ICP_NO_APIFY` (400) — ICP record exists but `apifyActorId` is not configured
- `ICP_LOOKUP_FAILED` (500) — Failed to resolve the ICP record (internal error)
- `MISSING_CLIENT_ID` (400) — `client_id` not provided
- `CLIENT_WRONG_COMPANY` (400) — Client does not belong to your company

**curl:**

```bash
# Run with ICP
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"YOUR_CLIENT","icpId":"ICP_ID","targetLeadCount":100,"enrichAfterGeneration":true,"scoreAfterEnrichment":true}' \
  https://api.leadgenius.app/api/automation/fsd/run | jq
```

```bash
# Run with direct Apify config (no ICP)
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"YOUR_CLIENT","apifyActorId":"apify/linkedin-scraper","apifyInput":{"searchUrl":"https://..."},"targetLeadCount":50}' \
  https://api.leadgenius.app/api/automation/fsd/run | jq
```

**CLI equivalent:**

```bash
# Run with ICP
npx tsx src/scripts/lgp.ts fsd run --client YOUR_CLIENT --icp ICP_ID --target 100

# Run with direct Apify config
npx tsx src/scripts/lgp.ts fsd run --client YOUR_CLIENT --actor apify/linkedin-scraper --input '{"searchUrl":"https://..."}' --target 50
```

---

### `GET /api/automation/fsd/run/{pipelineId}`

Return the status and progress of an FSD pipeline run, including per-stage counts, error info, and timing.

**Path Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pipelineId` | string | Yes | FsdPipelineRun record ID |

**Response fields:** `id`, `campaignId`, `client_id`, `stage`, `leadsGenerated`, `leadsEnriched`, `leadsScored`, `leadsQualified`, `leadsSent`, `targetLeadCount`, `enrichAfterGeneration`, `scoreAfterEnrichment`, `sendToEmailPlatform`, `qualificationThreshold`, `errorMessage`, `stageErrors`, `startedAt`, `finishedAt`, `createdAt`, `updatedAt`.

**Response — In progress:**

```json
{
  "success": true,
  "data": {
    "id": "pipeline-uuid-001",
    "campaignId": "campaign-001",
    "client_id": "client-123",
    "stage": "enriching",
    "leadsGenerated": 50,
    "leadsEnriched": 20,
    "leadsScored": 0,
    "leadsQualified": 0,
    "leadsSent": 0,
    "targetLeadCount": 50,
    "enrichAfterGeneration": true,
    "scoreAfterEnrichment": true,
    "sendToEmailPlatform": "woodpecker",
    "qualificationThreshold": 60,
    "errorMessage": null,
    "stageErrors": null,
    "startedAt": "2026-03-05T10:00:00.000Z",
    "finishedAt": null,
    "createdAt": "2026-03-05T10:00:00.000Z",
    "updatedAt": "2026-03-05T10:15:00.000Z"
  }
}
```

**Response — Completed:**

```json
{
  "success": true,
  "data": {
    "id": "pipeline-uuid-001",
    "campaignId": "campaign-001",
    "client_id": "client-123",
    "stage": "completed",
    "leadsGenerated": 50,
    "leadsEnriched": 48,
    "leadsScored": 48,
    "leadsQualified": 30,
    "leadsSent": 30,
    "targetLeadCount": 50,
    "enrichAfterGeneration": true,
    "scoreAfterEnrichment": true,
    "sendToEmailPlatform": "woodpecker",
    "qualificationThreshold": 60,
    "errorMessage": null,
    "stageErrors": null,
    "startedAt": "2026-03-05T10:00:00.000Z",
    "finishedAt": "2026-03-05T11:30:00.000Z"
  }
}
```

**Response — Failed:**

```json
{
  "success": true,
  "data": {
    "id": "pipeline-uuid-002",
    "stage": "failed",
    "leadsGenerated": 50,
    "leadsEnriched": 10,
    "leadsScored": 0,
    "errorMessage": "Enrichment service timeout after 3 retries",
    "stageErrors": {"enriching": "Service enrichment1 returned 503"},
    "startedAt": "2026-03-05T10:00:00.000Z",
    "finishedAt": "2026-03-05T10:45:00.000Z"
  }
}
```

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/fsd/run/PIPELINE_ID" | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts fsd status PIPELINE_ID
```


---

## Error Codes

All Automation API errors return a consistent JSON envelope with `success: false`, a human-readable `error` message, an optional `details` field, and a machine-readable `code`. Use the `code` field for programmatic error handling.

**Error response format:**

```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": "Additional context or validation errors",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "requestId": "uuid-v4"
}
```

---

### `UNAUTHORIZED`

**HTTP Status:** 401

Missing or invalid API key. The `X-API-Key` header is absent, malformed, or references a revoked/non-existent key.

**Example response:**

```json
{
  "success": false,
  "error": "Missing or invalid API key",
  "code": "UNAUTHORIZED",
  "requestId": "req-abc123"
}
```

**Recovery:** Verify the `X-API-Key` header is present and starts with `lgp_`. Confirm the key has not been revoked. Generate a new key via `POST /api/automation/users/provision` if needed.

---

### `RATE_LIMITED`

**HTTP Status:** 429

Too many requests. The API key has exceeded its rate limit for the current window (60/min, 1 000/hr, or 10 000/day).

**Example response:**

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "details": "60 requests per minute limit reached",
  "code": "RATE_LIMITED",
  "requestId": "req-abc124"
}
```

**Recovery:** Wait for the current rate-limit window to reset and retry. Reduce request frequency or implement exponential back-off. Check the `Retry-After` header if present.

---

### `MISSING_CLIENT_ID`

**HTTP Status:** 400

A required `client_id` parameter was not provided. Most list and mutation endpoints require a `client_id` to scope data.

**Example response:**

```json
{
  "success": false,
  "error": "client_id is required",
  "code": "MISSING_CLIENT_ID",
  "requestId": "req-abc125"
}
```

**Recovery:** Include the `client_id` query parameter or request body field. List available clients via `GET /api/automation/tables/Client` to find valid IDs.

---

### `CLIENT_WRONG_COMPANY`

**HTTP Status:** 400 / 403

The specified `client_id` belongs to a different company than the one associated with your API key.

**Example response:**

```json
{
  "success": false,
  "error": "Client does not belong to your company",
  "code": "CLIENT_WRONG_COMPANY",
  "requestId": "req-abc126"
}
```

**Recovery:** Verify the `client_id` belongs to your company. List your company's clients via `GET /api/automation/tables/Client` and use a valid ID.

---

### `NOT_FOUND`

**HTTP Status:** 404

The requested resource does not exist or belongs to another company (the API returns 404 instead of 403 for cross-company access to avoid leaking resource existence).

**Example response:**

```json
{
  "success": false,
  "error": "Resource not found",
  "code": "NOT_FOUND",
  "requestId": "req-abc127"
}
```

**Recovery:** Confirm the resource ID is correct. Use the appropriate list endpoint to verify the resource exists within your company.

---

### `VALIDATION_ERROR`

**HTTP Status:** 400

The request body failed schema validation. One or more fields have invalid types, missing required values, or out-of-range values.

**Example response:**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": "\"leadId\" is required; \"services\" must be an array",
  "code": "VALIDATION_ERROR",
  "requestId": "req-abc128"
}
```

**Recovery:** Check the `details` field for specific validation failures. Correct the request body to match the endpoint's schema and retry.

---

### `INVALID_BODY`

**HTTP Status:** 400

The request body is not valid JSON. The server could not parse the payload.

**Example response:**

```json
{
  "success": false,
  "error": "Invalid JSON in request body",
  "code": "INVALID_BODY",
  "requestId": "req-abc129"
}
```

**Recovery:** Ensure the request body is well-formed JSON. Verify the `Content-Type: application/json` header is set. Check for trailing commas, unquoted keys, or encoding issues.

---

### `IMMUTABLE_FIELD`

**HTTP Status:** 400

The request attempted to modify a read-only field. The `owner` and `company_id` fields are auto-set from the API key and cannot be changed via update operations.

**Example response:**

```json
{
  "success": false,
  "error": "Cannot modify immutable field",
  "details": "Fields 'owner', 'company_id' cannot be updated",
  "code": "IMMUTABLE_FIELD",
  "requestId": "req-abc130"
}
```

**Recovery:** Remove `owner` and `company_id` from the request body. These fields are automatically managed by the API based on your API key identity.

---

### `ICP_NOT_FOUND`

**HTTP Status:** 404

The ICP record referenced by `icpId` does not exist or belongs to another company. Returned by FSD pipeline endpoints when the specified ICP cannot be resolved.

**Example response:**

```json
{
  "success": false,
  "error": "ICP record not found",
  "details": "No ICP with id 'icp-xyz' found for your company",
  "code": "ICP_NOT_FOUND",
  "requestId": "req-abc131"
}
```

**Recovery:** Verify the `icpId` is correct. List available ICPs via `GET /api/automation/tables/ICP` to find valid IDs. Ensure the ICP belongs to your company.

---

### `ICP_NO_APIFY`

**HTTP Status:** 400

The ICP record exists but is missing the required `apifyActorId` field. An ICP must have Apify configuration to be used for lead generation via the FSD pipeline.

**Example response:**

```json
{
  "success": false,
  "error": "ICP missing Apify configuration",
  "details": "ICP 'icp-xyz' does not have apifyActorId configured",
  "code": "ICP_NO_APIFY",
  "requestId": "req-abc132"
}
```

**Recovery:** Update the ICP record to include `apifyActorId` (and optionally `apifyInput`, `apifySettings`) via `PUT /api/automation/tables/ICP/{id}`. Alternatively, use the direct Apify flow by providing `apifyActorId` and `apifyInput` directly in the FSD run request body.

---

### `ICP_LOOKUP_FAILED`

**HTTP Status:** 500

An internal error occurred while resolving the ICP record. The ICP may exist but the lookup operation failed due to a transient database or service error.

**Example response:**

```json
{
  "success": false,
  "error": "Failed to resolve ICP record",
  "details": "DynamoDB read failed for ICP 'icp-xyz'",
  "code": "ICP_LOOKUP_FAILED",
  "requestId": "req-abc133"
}
```

**Recovery:** Retry the request after a short delay. If the error persists, verify the ICP record exists via `GET /api/automation/tables/ICP/{id}`. Contact support if the issue continues.

---

## EpsimoAI User & Credit Management

All routes use `epsimoApiClient.ts` (`src/utils/epsimoApiClient.ts`) which centralizes HTTP calls to `https://backend.epsimoai.io`. The client throws `EpsimoApiError` with `statusCode`, `errorCode`, and `message` for all upstream failures. Error mapping: 401/403 → `EPSIMO_AUTH_FAILED`, 5xx/network → `EPSIMO_UNAVAILABLE`.

**Token convention:** `X-Epsimo-Token` header (preferred) or `epsimoToken` query parameter (GET fallback). Header takes precedence. Extracted by `extractEpsimoToken(request)`.

**Auth order:** All automation epsimo routes validate: (1) `X-API-Key` via `withAutomationAuth` → `AUTH_MISSING`/`AUTH_INVALID`, (2) EpsimoAI token → `MISSING_EPSIMO_TOKEN`, (3) upstream call → endpoint-specific errors.

**Workflow:** Activate → Info → Credits → Purchase → Verify

### Plan Derivation Logic

`derivePlan(threadMax, stripeClientId?)` evaluates in order:

| Condition | Plan |
|-----------|------|
| threadMax >= 120,000 | enterprise |
| threadMax >= 50,000 OR stripeClientId is truthy | premium |
| threadMax >= 10,000 | pro |
| default | free |

**Important:** `/users/info` calls `derivePlan(threadMax, stripeClientId)` (full). `/threads` calls `derivePlan(threadMax)` without `stripeClientId` (thread-info API doesn't return it). This means plan may differ between endpoints for users with `stripeClientId` and low `threadMax`.

---

### `POST /api/automation/epsimo/users/activate`

Activate an EpsimoAI user via email/password login or Cognito token exchange. Only epsimo endpoint that does not require an EpsimoAI token.

**Logic:**
- If `cognitoIdToken` present → calls `POST /auth/exchange`, returns `{ epsimoToken, userId: null, email: null }`
- If `email` + `password` present → calls `POST /auth/login`, returns `{ epsimoToken, userId, email }`
- If neither → 400 with missing field names
- Invalid JSON body → 400 `VALIDATION_ERROR`

**Request Body (login mode):**

```json
{ "email": "user@example.com", "password": "secret" }
```

**Request Body (exchange mode):**

```json
{ "cognitoIdToken": "<cognito-id-token>" }
```

**Response (login mode):**

```json
{
  "success": true,
  "data": {
    "epsimoToken": "eyJ...",
    "userId": "usr_123",
    "email": "user@example.com"
  },
  "requestId": "req-abc"
}
```

**Response (exchange mode):**

```json
{
  "success": true,
  "data": {
    "epsimoToken": "eyJ...",
    "userId": null,
    "email": null
  },
  "requestId": "req-abc"
}
```

**Errors:** 400 `VALIDATION_ERROR` (missing fields or invalid JSON), 401 `EPSIMO_AUTH_FAILED` (upstream 401/403), 502 `EPSIMO_UNAVAILABLE` (upstream 5xx/network).

**curl:**

```bash
# Login mode
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}' \
  https://api.leadgenius.app/api/automation/epsimo/users/activate | jq

# Exchange mode
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"cognitoIdToken":"eyJ..."}' \
  https://api.leadgenius.app/api/automation/epsimo/users/activate | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts epsimo activate --email user@example.com --password secret
npx tsx src/scripts/lgp.ts epsimo activate --cognito-token eyJ...
```

---

### `GET /api/automation/epsimo/users/info`

Retrieve EpsimoAI user profile and derived plan information.

**Headers:** `X-API-Key`, `X-Epsimo-Token`

**Logic:**
- Calls `GET /user/info` on EpsimoAI backend
- Derives plan via `derivePlan(thread_max, stripe_client_id)` — includes stripeClientId
- Maps upstream `EPSIMO_AUTH_FAILED` → `EPSIMO_TOKEN_INVALID` (401)
- All other upstream errors → `EPSIMO_UNAVAILABLE` (502)

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "usr_123",
    "email": "user@example.com",
    "projectId": "proj_456",
    "threadCounter": 5000,
    "threadMax": 50000,
    "stripeClientId": "cus_xxx",
    "plan": "premium"
  },
  "requestId": "req-abc"
}
```

**Field mapping:** `user_id` → `userId`, `project_id` → `projectId`, `thread_counter` → `threadCounter`, `thread_max` → `threadMax`, `stripe_client_id` → `stripeClientId` (defaults to `null`), `plan` derived.

**Errors:** 400 `MISSING_EPSIMO_TOKEN`, 401 `EPSIMO_TOKEN_INVALID` (upstream auth failure), 502 `EPSIMO_UNAVAILABLE`.

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  -H "X-Epsimo-Token: $EPSIMO_TOKEN" \
  https://api.leadgenius.app/api/automation/epsimo/users/info | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts epsimo info --token $EPSIMO_TOKEN
```

---

### `GET /api/automation/epsimo/credits/balance`

Check EpsimoAI credit balance (remaining AI threads).

**Headers:** `X-API-Key`, `X-Epsimo-Token`

**Logic:**
- Calls `GET /auth/thread-info` on EpsimoAI backend
- Computes `credits = Math.max(0, thread_max - thread_counter)` — never negative
- Adds `lastUpdated` as current ISO 8601 timestamp
- All `EpsimoApiError` → 502 `EPSIMO_UNAVAILABLE` (no token-invalid distinction)

**Response:**

```json
{
  "success": true,
  "data": {
    "credits": 45000,
    "threadCounter": 5000,
    "threadMax": 50000,
    "lastUpdated": "2026-03-05T12:00:00.000Z"
  },
  "requestId": "req-abc"
}
```

**Errors:** 400 `MISSING_EPSIMO_TOKEN`, 502 `EPSIMO_UNAVAILABLE` (any upstream error including invalid token).

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  -H "X-Epsimo-Token: $EPSIMO_TOKEN" \
  https://api.leadgenius.app/api/automation/epsimo/credits/balance | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts epsimo credits --token $EPSIMO_TOKEN
```

---

### `POST /api/automation/epsimo/credits/purchase`

Purchase additional EpsimoAI credits.

**Headers:** `X-API-Key`, `X-Epsimo-Token`

**Logic:**
- Validates `amount`: must be present, `Number.isInteger(amount)`, and `> 0`
- Invalid values: `null`, `0`, `-1`, `1.5`, `"10"` (string) → all fail validation
- Calls `POST /credits/purchase` on EpsimoAI backend
- If upstream `statusCode === 402` OR `errorCode === 'EPSIMO_PURCHASE_FAILED'` → 402
- All other upstream errors → 502 `EPSIMO_UNAVAILABLE`

**Request Body:**

```json
{ "amount": 10000 }
```

**Response:**

```json
{
  "success": true,
  "data": {
    "previousBalance": 5000,
    "purchasedAmount": 10000,
    "newBalance": 15000,
    "transactionId": "txn_789"
  },
  "requestId": "req-abc"
}
```

**Errors:** 400 `MISSING_EPSIMO_TOKEN`, 400 `VALIDATION_ERROR` (invalid amount or JSON), 402 `EPSIMO_PURCHASE_FAILED`, 502 `EPSIMO_UNAVAILABLE`.

**curl:**

```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "X-Epsimo-Token: $EPSIMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":10000}' \
  https://api.leadgenius.app/api/automation/epsimo/credits/purchase | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts epsimo purchase --token $EPSIMO_TOKEN --amount 10000
```

---

### `GET /api/automation/epsimo/threads`

Get detailed thread usage information including usage percentage and plan.

**Headers:** `X-API-Key`, `X-Epsimo-Token`

**Logic:**
- Calls `GET /auth/thread-info` on EpsimoAI backend
- `remainingThreads = Math.max(0, thread_max - thread_counter)`
- `usagePercentage`: if `thread_max === 0` → `0`, else `Math.round((thread_counter / thread_max) * 100 * 100) / 100`
- `plan = derivePlan(thread_max)` — **without stripeClientId** (thread-info doesn't return it)
- All `EpsimoApiError` → 502 `EPSIMO_UNAVAILABLE`

**Response:**

```json
{
  "success": true,
  "data": {
    "threadCounter": 5000,
    "threadMax": 50000,
    "remainingThreads": 45000,
    "usagePercentage": 10.00,
    "plan": "premium"
  },
  "requestId": "req-abc"
}
```

**Important:** `plan` may differ from `/users/info` for users with `stripeClientId` and low `threadMax` (< 50,000).

**Errors:** 400 `MISSING_EPSIMO_TOKEN`, 502 `EPSIMO_UNAVAILABLE`.

**curl:**

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  -H "X-Epsimo-Token: $EPSIMO_TOKEN" \
  https://api.leadgenius.app/api/automation/epsimo/threads | jq
```

**CLI equivalent:**

```bash
npx tsx src/scripts/lgp.ts epsimo threads --token $EPSIMO_TOKEN
```

---

### UI Route: `POST /api/credits/purchase`

Cookie-based route for frontend `CreditService.purchaseCredits()`. Does NOT use `withAutomationAuth` or standard JSON envelope.

**Auth:** `epsimo_token` cookie (via `getCookie('epsimo_token', { req: request })`)

**Logic:**
- Missing cookie → 401 `{ "error": "EpsimoAI token not found" }`
- Invalid JSON → 400 `{ "error": "Invalid JSON body" }`
- Invalid amount → 400 `{ "error": "Amount must be a positive integer" }`
- Calls `epsimoPurchaseCredits(token, amount)` from shared client
- On `EpsimoApiError`: returns `err.statusCode` (or 502 if >= 500) with `{ "error": message }`

**Request Body:**

```json
{ "amount": 10000 }
```

**Response (flat, no envelope):**

```json
{
  "success": true,
  "previousBalance": 5000,
  "purchasedAmount": 10000,
  "newBalance": 15000
}
```

---

### EpsimoAI Error Codes

| Code | HTTP Status | Description | Used by |
|------|-------------|-------------|---------|
| `EPSIMO_AUTH_FAILED` | 401 | EpsimoAI login credentials invalid (upstream 401/403) | activate |
| `EPSIMO_TOKEN_INVALID` | 401 | EpsimoAI token expired or invalid | info only |
| `EPSIMO_UNAVAILABLE` | 502 | EpsimoAI backend unreachable, 5xx, or other error | all endpoints |
| `EPSIMO_PURCHASE_FAILED` | 402 | Credit purchase rejected (upstream 402) | purchase |
| `MISSING_EPSIMO_TOKEN` | 400 | Required EpsimoAI token not provided | info, balance, purchase, threads |
| `VALIDATION_ERROR` | 400 | Missing/invalid request fields or invalid JSON | activate, purchase |

### Source Files

| File | Purpose |
|------|---------|
| `src/utils/epsimoApiClient.ts` | Shared API client, error class, plan derivation, token extraction |
| `src/app/api/automation/epsimo/users/activate/route.ts` | Activate endpoint |
| `src/app/api/automation/epsimo/users/info/route.ts` | User info endpoint |
| `src/app/api/automation/epsimo/credits/balance/route.ts` | Credit balance endpoint |
| `src/app/api/automation/epsimo/credits/purchase/route.ts` | Credit purchase (automation) endpoint |
| `src/app/api/automation/epsimo/threads/route.ts` | Thread usage endpoint |
| `src/app/api/credits/purchase/route.ts` | Credit purchase (UI/cookie) endpoint |
