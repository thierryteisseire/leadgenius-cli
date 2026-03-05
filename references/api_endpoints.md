# LeadGenius Pro — API Endpoints Reference

Base URL: `https://api.leadgenius.app`

All requests require `X-API-Key: lgp_*` header. All responses use `{ success, data, message, requestId }` envelope. Paginated endpoints add `nextToken` and `count`.

---

## Authentication

### `GET /api/automation/auth/test`
Test API key validity. Returns `owner`, `companyId`, `apiKeyId`.

```bash
curl -s -H "X-API-Key: $LGP_API_KEY" https://api.leadgenius.app/api/automation/auth/test | jq
```

---

## Leads

### `GET /api/automation/leads`
List EnrichLeads by `client_id`, sorted by `createdAt` desc.

| Param | Required | Default | Notes |
|-------|----------|---------|-------|
| `client_id` | Yes | — | |
| `fields` | No | default set | Comma-separated field names |
| `limit` | No | 50 | Max 500 |
| `nextToken` | No | — | Pagination |

Default fields: `id`, `firstName`, `lastName`, `fullName`, `email`, `linkedinUrl`, `companyName`, `title`, `status`, `client_id`, `company_id`, `createdAt`, `updatedAt`

### `GET /api/automation/leads/{id}`
Full lead detail (100+ fields: identity, company, enrichment1-10, ai1-10, message1-10, scoring, engagement).

### `POST /api/automation/leads/import`
Import leads. Single or batch (max 500).

Single:
```json
{ "client_id": "xxx", "firstName": "Jane", "lastName": "Doe", "email": "jane@example.com", "companyName": "Acme" }
```

Batch:
```json
{ "leads": [{ "client_id": "xxx", "firstName": "Jane", ... }, ...] }
```

Response: `{ created, failed, createdIds, errors, warnings }`

- `client_id` required per lead, must belong to your company
- `owner`/`company_id` auto-set from API key
- Cross-client duplicate detection by email/linkedinUrl (warning only)

### `GET /api/automation/leads/search`
Search by email, name, companyUrl, or linkedinUrl. At least one search param required.

| Param | GSI Used |
|-------|----------|
| `email` | `email-index` |
| `firstName` + `lastName` | `firstName-lastName-index` |
| `companyUrl` | `company_id` GSI + filter |
| `linkedinUrl` | `company_id` GSI + filter |

Optional: `client_id` (post-filter), `limit`, `nextToken`

### `POST /api/automation/leads/deduplicate`
Find duplicate groups within a client.

```json
{ "client_id": "xxx", "matchFields": ["email", "linkedinUrl", "fullName+companyName"], "dryRun": true }
```

Match confidence: `email` = high, `linkedinUrl` = medium, `fullName+companyName` = low.
Response: `{ matches[], totalLeadsScanned, totalDuplicateGroups, dryRun }`

### `POST /api/automation/leads/deduplicate/resolve`
Merge duplicates into a "keep" lead. Empty fields on keep lead filled from merge leads. Merge leads marked `status: 'duplicate'`.

```json
{ "keepLeadId": "keep-id", "mergeLeadIds": ["dup-1", "dup-2"] }
```

Response: `{ keepLeadId, mergedFields[], conflicts[], mergeLeadsMarked }`

### `POST /api/automation/leads/transfer`
Transfer leads between clients within same company. Duplicate detection against target.

```json
{ "fromClientId": "src", "toClientId": "tgt", "leadIds": ["l1","l2"], "dryRun": true }
```
Or `"transferAll": true` instead of `leadIds`. Response: `{ transferred, skippedDuplicates, errors, details }`

### `GET /api/automation/leads/{id}/activities`
Get engagement history for a lead. Returns `activities[]`, `engagementScore`, `lastEngagementAt`.

### `POST /api/automation/leads/{id}/activities`
Log engagement activities. Single: `{ type, notes?, metadata? }`. Batch: `{ activities: [...] }`.

Valid types: `linkedin_connection_sent`, `linkedin_connection_accepted`, `linkedin_message_sent`, `linkedin_message_received`, `linkedin_profile_viewed`, `email_sent`, `email_opened`, `email_clicked`, `email_answered`, `email_bounced`, `call_completed`, `call_no_answer`, `meeting_scheduled`, `meeting_completed`, `form_submitted`, `website_visited`, `content_downloaded`, `demo_requested`, `proposal_sent`, `contract_signed`, `custom`

Score weights (highest): `contract_signed`/`meeting_completed` = 30, `meeting_scheduled`/`demo_requested` = 25, `email_answered` = 20. `email_bounced` = -5. Time decay: >30 days = 50% weight. Cap: 100.

### `POST /api/automation/leads/validate-ownership`
Scan all leads for ownership issues: orphaned `client_id`, mismatched `company_id`, null `owner`.

---

## Tasks

### `GET /api/automation/tasks`
List Jobs. Optional filters: `status` (running/completed/failed), `type` (enrichment/copyright/scoring), `limit`, `nextToken`.

### `GET /api/automation/tasks/{jobId}`
Get single job status and progress.

### `POST /api/automation/tasks/enrich`
Trigger enrichment for a lead. Uses UrlSettings config.

```json
{ "leadId": "xxx", "services": ["companyUrl", "emailFinder", "enrichment1"] }
```

Services: `companyUrl`, `emailFinder`, `enrichment1`–`enrichment10`. Omit `services` for all configured.
Prerequisites: UrlSettings with service URLs configured.
Response: `{ jobId, batchTag, triggered[], skipped[], runIds[] }`

### `POST /api/automation/tasks/copyright`
Trigger AI content generation. Uses AgentSettings config.

```json
{ "leadId": "xxx", "processes": ["enrichment1", "enrichment2"] }
```

Processes: `enrichment1`–`enrichment10`. Prerequisites: AgentSettings with agent IDs + projectId.

### `POST /api/automation/tasks/score`
Trigger SDR AI scoring. Uses SdrAiSettings config.

Single: `{ "leadId": "xxx", "fields": ["aiLeadScore"] }`
Batch (max 100): `{ "leadIds": ["l1","l2"], "fields": ["aiLeadScore","aiQualification"] }`

Fields: `aiLeadScore`, `aiQualification`, `aiNextAction`, `aiColdEmail`, `aiInterest`, `aiLinkedinConnect`, `aiCompetitorAnalysis`, `aiEngagementLevel`, `aiPurchaseWindow`, `aiDecisionMakerRole`, `aiSentiment`, `aiSocialEngagement`, `aiNurturingStage`, `aiBudgetEstimation`, `aiRiskScore`, `aiProductFitScore`

Prerequisites: SdrAiSettings with agent IDs + projectId.

---

## Territory Companies

### `GET /api/automation/companies`
List TerritoryCompany by `client_id`. Filters: `sortBy`, `industry`, `country`, `minLeads`, `maxLeads`, `minScore`, `maxScore`.

Sort values: `totalLeads`, `qualifiedLeads`, `averageLeadScore`, `lastActivityDate`, `companyName`

### `GET /api/automation/companies/{id}`
Full company detail with metrics + `leadsSummary: { count, leadIds }`.

Fields: `companyName`, `totalLeads`, `qualifiedLeads`, `averageLeadScore`, `industry`, `country`, `contentTopics`, `contentKeywords`, `painPoints`, `valuePropositions`, `competitorMentions`, `engagementInsights`, `contentRecommendations`

### `GET /api/automation/companies/{id}/leads`
List EnrichLeads for a territory company. Params: `limit`, `nextToken`.

### `POST /api/automation/companies/{id}/content-analysis`
Re-run content analysis aggregation. Updates content fields on the company record.

### `POST /api/automation/companies/aggregate`
Aggregate EnrichLeads into TerritoryCompany records.

```json
{ "client_id": "xxx", "companyName": "Acme", "forceRefresh": false, "maxLeads": 1000 }
```

### `GET /api/automation/companies/events`
List CompanyEvent by `client_id`. Filters: `eventType`, `territoryCompanyId`, `dateFrom`, `dateTo`.

Event types: `new_lead`, `lead_qualified`, `score_increased`, `new_company`, `custom`

### `POST /api/automation/companies/events`
Create a CompanyEvent.

```json
{ "territoryCompanyId": "tc-id", "eventType": "custom", "eventTitle": "Title", "eventDescription": "...", "eventData": {} }
```

### `DELETE /api/automation/companies/events`
Batch delete: `{ "eventIds": ["e1","e2"] }`

### `POST /api/automation/companies/events/generate`
Auto-generate events from recent lead activity.

```json
{ "client_id": "xxx", "since": "2025-01-01T00:00:00Z", "maxLeads": 500 }
```

### `GET /api/automation/companies/events/radar`
Radar dashboard: `recentEvents`, `eventCountsByType`, `topActiveCompanies`, `timeline`. Requires `client_id`.

---

## Webhook Events

### `GET /api/automation/webhook-events`
List WebhookLog records. Filters: `platform`, `eventType`, `matchStatus`, `processingStatus`, `clientId`, `dateFrom`, `dateTo`.

### `GET /api/automation/webhook-events/{id}`
Full webhook event detail with raw payload and processing info.

### `PUT /api/automation/webhook-events/{id}`
Update webhook event. Allowed fields: `matchStatus`, `matchedLeadId`, `processingStatus`, `client_id`.

### `DELETE /api/automation/webhook-events`
Batch delete: `{ "eventIds": ["e1","e2"] }`

### `POST /api/automation/webhook-events/{id}/reprocess`
Re-run lead matching. Priority: email (high) → LinkedIn URL (medium) → name (low). Updates match fields and appends to lead's engagement history.

---

## Users

### `GET /api/automation/users`
List CompanyUser records. Filter: `group` (admin/manager/user/viewer).

### `GET /api/automation/users/{id}`
Get user detail.

### `POST /api/automation/users`
Create/invite user.

```json
{ "email": "user@example.com", "role": "member", "group": "user", "menuAccess": ["dashboard"], "clientAccessMode": "all" }
```

Roles: `owner`, `admin`, `member`, `viewer`. Groups: `admin`, `manager`, `user`, `viewer`.

### `PUT /api/automation/users/{id}`
Update user role, group, status, menuAccess, permissions, clientAccessMode, allowedClientIds.

### `DELETE /api/automation/users/{id}`
Remove user. Cannot delete self.

### `GET /api/automation/users/menu-config`
Master menu list with group defaults.

### `GET /api/automation/users/cognito`
Lookup Cognito user by `email` or list with `limit`.

### `POST /api/automation/users/cognito`
Create Cognito user: `{ "email", "password", "name" }`. Permanent password, no force-change.

### `PUT /api/automation/users/cognito`
Manage Cognito user. Actions: `enable`, `disable`, `set-password`, `set-attributes`.

```json
{ "email": "user@example.com", "action": "set-attributes", "attributes": { "custom:allowed_views": "role:companyAdmin|*" } }
```

### `POST /api/automation/users/provision`
One-shot provisioning: Cognito → Company → CompanyUser → API key.

```json
{
  "email": "user@example.com", "password": "SecurePass123!",
  "companyName": "Acme Corp", "role": "owner", "group": "admin",
  "createApiKey": true, "apiKeyName": "My Key"
}
```

Or join existing: use `company_id` instead of `companyName`. `plainTextKey` returned once — store securely.

---

## Organizations

All via `/api/automation/companies/manage`.

### `GET /api/automation/companies/manage`
List companies. Optional: `id` for single, `id` + `users=true` for user list.

### `POST /api/automation/companies/manage`
Create company: `{ "name": "Acme Corp" }`

### `PUT /api/automation/companies/manage`
Rename: `{ "id": "xxx", "name": "New Name" }`
Add user: `{ "action": "add-user", "company_id": "xxx", "email": "user@example.com", "role": "member", "group": "user" }`
Update user: `{ "action": "update-user", "id": "user-id", "role": "admin" }`
Remove user: `{ "action": "remove-user", "id": "user-id" }`

### `DELETE /api/automation/companies/manage?id={id}`
Delete company (owner only). No cascade delete.

---

## Tables (Generic CRUD)

### `GET /api/automation/tables/{tableName}`
List records filtered by `company_id`. Params: `limit` (default 100, max 1000), `nextToken`.

### `POST /api/automation/tables/{tableName}`
Create record. `owner`/`company_id` auto-set. Unknown fields passed to GraphQL.

### `GET /api/automation/tables/{tableName}/{id}`
Get single record. Verifies company match.

### `PUT /api/automation/tables/{tableName}/{id}`
Update record. Rejects `owner`/`company_id` changes.

### `DELETE /api/automation/tables/{tableName}/{id}`
Delete record. Verifies company match.

**Supported tables:** Company, CompanyUser, CompanyInvitation, Jobs, B2BLeads, EnrichLeads, SourceLeads, TerritoryCompany, CompanyEvent, LinkedInJobs, ICP, ABMCampaign, TargetAccount, OutreachSequence, SequenceEnrollment, Workflow, WorkflowExecution, Integration, Webhook, WebhookLog, WebhookSettings, InboundWebhook, WebhookEvent, Agent, AgentSettings, SdrAiSettings, CopyrightSettings, SdrSettings, EnrichmentService, EmailPlatformSettings, OutreachCampaign, OutreachTemplate, BaserowSyncConfig, BaserowSyncHistory, BaserowConfig, UnipileSettings, UnipileAccount, UnipileMessage, UnipileChat, UnipileLog, UnipileCampaign, UnipileIntegration, AgentApiKey, UrlSettings, Client, SearchHistory, Maintenance, SidebarConfig, SharedView

---

## Email Platforms

### `GET /api/automation/email-platforms`
List configured platforms with connection status.

### `POST /api/automation/email-platforms/send`
Send leads to platform for campaign.

```json
{ "leadIds": ["l1","l2"], "platform": "woodpecker", "campaignId": "camp-1" }
```

Max 200 leads. Prefers `emailFinder` over `email`. Skips leads without email.

---

## FSD Pipeline

### `GET /api/automation/fsd/campaigns`
List FsdCampaign records with progress metrics.

### `GET /api/automation/fsd/campaigns/{id}`
Single campaign detail.

### `POST /api/automation/fsd/campaigns`
Create campaign.

```json
{
  "client_id": "xxx", "name": "Q1 Campaign", "icpId": "icp-id",
  "frequency": "weekly", "targetLeadCount": 200,
  "enrichAfterGeneration": true, "scoreAfterEnrichment": true,
  "sendToEmailPlatform": "woodpecker", "qualificationThreshold": 60
}
```

Frequencies: `once`, `daily`, `weekly`, `monthly`.

### `PUT /api/automation/fsd/campaigns/{id}`
Update campaign. Allowed: `name`, `targetLeadCount`, `frequency`, `isActive`, `enrichAfterGeneration`, `scoreAfterEnrichment`, `sendToEmailPlatform`, `qualificationThreshold`, `emailCampaignId`, `apifyActorId`, `apifyInput`, `icpId`, `nextRunAt`.

### `DELETE /api/automation/fsd/campaigns/{id}`
Soft-delete (sets `isActive: false`).

### `POST /api/automation/fsd/run`
Start pipeline run. Requires `client_id` + (`icpId` OR `apifyActorId` + `apifyInput`).

```json
{
  "client_id": "xxx", "icpId": "icp-id", "targetLeadCount": 100,
  "enrichAfterGeneration": true, "scoreAfterEnrichment": true,
  "sendToEmailPlatform": "woodpecker", "qualificationThreshold": 50
}
```

Stages: `generating` → `enriching` → `scoring` → `qualifying` → `sending` → `completed` (or `failed`).

### `GET /api/automation/fsd/run/{pipelineId}`
Pipeline run status with per-stage counts and timing.

---

## Common Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Missing/invalid API key |
| `RATE_LIMITED` | 429 | Too many requests |
| `MISSING_CLIENT_ID` | 400 | Required `client_id` missing |
| `CLIENT_WRONG_COMPANY` | 400/403 | Client belongs to different company |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Body validation failed |
| `INVALID_BODY` | 400 | Not valid JSON |
| `IMMUTABLE_FIELD` | 400 | Tried to modify `owner`/`company_id` |

## Rate Limits

60/min, 1000/hour, 10000/day per API key.

## Pagination

All list endpoints: `limit` (default 50, max 500) + `nextToken`. When `nextToken` is null, no more pages.
