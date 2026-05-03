---
name: leadgenius-cli
description: Comprehensive skill for operating the LeadGenius Pro Automation API and lgp CLI. Covers ICP management, FSD pipeline automation, lead generation/enrichment/scoring, user provisioning, territory analysis, webhook management, and email platform integration.
---

# LeadGenius Pro — CLI & Automation API Skill

This skill teaches AI agents how to operate the **LeadGenius Pro Automation API** and the **`lgp` CLI tool**. It covers the full lifecycle of B2B lead management — from ICP (Ideal Customer Profile) definition and automated lead generation through enrichment, scoring, qualification, and email delivery via the FSD (Full-Stack Demand) pipeline.

> **Note:** This skill package is documentation-only. The `lgp` CLI script (`lgp.ts`) is part of the LeadGenius Pro application repository and is **not included** in this package. Obtain the CLI from your LeadGenius Pro deployment.

## Base URL

```
https://api.leadgenius.app
```

All API endpoints live under `/api/automation/`.

## Authentication

Every request must include an API key in the `X-API-Key` header:

```
X-API-Key: lgp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- Keys are prefixed with `lgp_` and tied to a specific company.
- The key determines `company_id`, `owner` identity, and rate limits.
- Keys are created via `POST /api/automation/users/provision` — the plain-text key is returned only once at creation time.
- Test your key with `GET /api/automation/auth/test`.

### Required Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `LGP_API_KEY` | **Yes** | API key with `lgp_` prefix. Required for all API and CLI operations. | — |
| `LGP_URL` | No | Base URL of the LeadGenius Pro API. | `http://localhost:3000` |
| `LGP_ADMIN_KEY` | No | Admin key to bypass rate limits. Sent as `X-Admin-Key` header alongside `X-API-Key`. Grants elevated access — use only for admin operations. | — |

### Rate Limits

| Window     | Default Limit    |
|------------|------------------|
| Per minute | 60 requests      |
| Per hour   | 1,000 requests   |
| Per day    | 10,000 requests  |

### Admin Key (Rate Limit Bypass)

An optional `X-Admin-Key` header can be sent alongside `X-API-Key` to bypass application-level rate limits:

```
X-API-Key: lgp_your_key_here
X-Admin-Key: your_admin_key_here
```

**Behavior:**
- When both `X-API-Key` and `X-Admin-Key` are present, the API key is validated normally (real company context is preserved) and rate limits are skipped.
- When only `X-Admin-Key` is present (no API key), the request runs as `admin-master-company` — only useful for admin-only endpoints like `/api/admin/*`.
- The admin key does **not** bypass AWS WAF rules. Rapid bursts of requests from the same IP will still be blocked at the infrastructure level regardless of the admin key.

**Important for AI agents:** Always include `X-API-Key` alongside `X-Admin-Key`. Using the admin key alone will cause company-scoped queries (leads, settings, tasks) to return empty results because they filter by `admin-master-company`.

### AWS WAF Throttling

The API is protected by AWS WAF, which blocks IPs after too many requests in a short window. This is separate from the application rate limiter and cannot be bypassed by the admin key.

**Best practices for AI agents:**
- Add 3-5 second delays between consecutive API calls
- Use exponential backoff on connection failures (`fetch failed` errors)
- Batch operations where possible (e.g., `leads import` with a `leads` array instead of individual imports)
- If you get repeated connection failures, wait 60 seconds before retrying

---

## Prerequisites Checklist

Before running enrichment, copyright, scoring, or FSD pipelines, the following configuration records must exist. Create them via the Tables API (`POST /api/automation/tables/{tableName}`).

> **Note on settings creation:** The `AgentSettings`, `SdrAiSettings`, and `UrlSettings` tables do not accept `company_id` or `owner` in the create input — these are managed automatically. The Tables API handles this by stripping these fields during creation and setting `company_id` via a post-creation update. When creating settings via direct GraphQL, create the record first, then update it to set `company_id`.

### UrlSettings (required for enrichment)

| Field                | Description                              |
|----------------------|------------------------------------------|
| `apifyApiKey`        | Apify API key for lead generation        |
| `companyUrl`         | Company URL lookup service endpoint      |
| `companyUrl_Apikey`  | API key for company URL service          |
| `emailFinder`        | Email finder service endpoint            |
| `emailFinder_Apikey` | API key for email finder service         |
| `enrichment1`–`enrichment10` | Enrichment service endpoints (up to 10) |
| `enrichment1_Apikey`–`enrichment10_Apikey` | Corresponding API keys |

### AgentSettings (required for copyright / AI content generation)

| Field                          | Description                                |
|--------------------------------|--------------------------------------------|
| `projectId`                    | EpsimoAI project ID                        |
| `enrichment1AgentId`–`enrichment10AgentId` | EpsimoAI agent IDs for each copyright process |

### SdrAiSettings (required for SDR AI scoring)

| Field                          | Description                                |
|--------------------------------|--------------------------------------------|
| `projectId`                    | EpsimoAI project ID                        |
| `aiLeadScoreAgentId`          | Agent for lead scoring                     |
| `aiQualificationAgentId`      | Agent for qualification assessment         |
| `aiNextActionAgentId`         | Agent for next-action recommendation       |
| `aiColdEmailAgentId`          | Agent for cold email generation            |
| `aiInterestAgentId`           | Agent for interest analysis                |
| `aiLinkedinConnectAgentId`    | Agent for LinkedIn connect messages        |
| `aiCompetitorAnalysisAgentId` | Agent for competitor analysis              |
| `aiEngagementLevelAgentId`    | Agent for engagement level assessment      |
| `aiPurchaseWindowAgentId`     | Agent for purchase window estimation       |
| `aiDecisionMakerRoleAgentId`  | Agent for decision-maker role detection    |
| `aiSentimentAgentId`          | Agent for sentiment analysis               |
| `aiSocialEngagementAgentId`   | Agent for social engagement scoring        |
| `aiNurturingStageAgentId`     | Agent for nurturing stage classification   |
| `aiBudgetEstimationAgentId`   | Agent for budget estimation                |
| `aiRiskScoreAgentId`          | Agent for risk scoring                     |
| `aiProductFitScoreAgentId`    | Agent for product-fit scoring              |

### ICP with Apify Config (required for lead generation)

| Field             | Description                                      |
|-------------------|--------------------------------------------------|
| `name`            | ICP display name                                 |
| `apifyActorId`    | Apify actor ID for lead scraping (required)      |
| `apifyInput`      | JSON string of actor input configuration         |
| `apifySettings`   | JSON string of additional Apify settings         |
| `maxLeads`        | Max leads per generation run (default 100)       |
| `industries`      | JSON array of target industries                  |
| `companySizes`    | JSON array of size ranges ("1-10", "51-200")     |
| `geographies`     | JSON array of countries/regions                  |
| `jobTitles`       | JSON array of target job titles                  |
| `seniority`       | JSON array of seniority levels                   |
| `client_id`       | Client partition for data isolation              |

---

## Quick-Reference: Endpoint Map

| Category            | Reference Section                                    |
|---------------------|------------------------------------------------------|
| Auth                | [references/api_endpoints.md#auth](references/api_endpoints.md#auth) |
| Leads               | [references/api_endpoints.md#leads](references/api_endpoints.md#leads) |
| Tasks               | [references/api_endpoints.md#tasks-background-processing](references/api_endpoints.md#tasks-background-processing) |
| Territory Companies | [references/api_endpoints.md#territory-companies](references/api_endpoints.md#territory-companies) |
| Webhook Events      | [references/api_endpoints.md#webhook-events](references/api_endpoints.md#webhook-events) |
| Users               | [references/api_endpoints.md#users](references/api_endpoints.md#users) |
| Organizations       | [references/api_endpoints.md#organizations](references/api_endpoints.md#organizations) |
| Cognito             | [references/api_endpoints.md#cognito-user-pool](references/api_endpoints.md#cognito-user-pool) |
| Tables / ICP        | [references/api_endpoints.md#tables-generic-crud-with-icp-focus](references/api_endpoints.md#tables-generic-crud-with-icp-focus) |
| Email Platforms     | [references/api_endpoints.md#email-platforms](references/api_endpoints.md#email-platforms) |
| FSD Pipeline        | [references/api_endpoints.md#fsd-pipeline](references/api_endpoints.md#fsd-pipeline) |
| Job Ad Lead Triggering | [references/api_endpoints.md#job-ad-lead-triggering](references/api_endpoints.md#job-ad-lead-triggering) |
| Lead Notifications (Unipile) | [references/api_endpoints.md#lead-notifications-unipile](references/api_endpoints.md#lead-notifications-unipile) |
| EpsimoAI            | [references/api_endpoints.md#epsimoai-user--credit-management](references/api_endpoints.md#epsimoai-user--credit-management) |
| Account-Based Lead Analysis | [references/api_endpoints.md#account-based-lead-analysis](references/api_endpoints.md#account-based-lead-analysis) |
| Error Codes         | [references/api_endpoints.md#error-codes](references/api_endpoints.md#error-codes) |

## Quick-Reference: CLI Map

The `lgp` CLI is the recommended interface. Run via `npx tsx src/scripts/lgp.ts <command>`.

| Group              | Reference Section                                    |
|--------------------|------------------------------------------------------|
| `auth`             | [references/cli_reference.md#auth](references/cli_reference.md#auth) |
| `leads`            | [references/cli_reference.md#leads](references/cli_reference.md#leads) |
| `tasks`            | [references/cli_reference.md#tasks](references/cli_reference.md#tasks) |
| `companies`        | [references/cli_reference.md#companies](references/cli_reference.md#companies) |
| `webhooks`         | [references/cli_reference.md#webhooks](references/cli_reference.md#webhooks) |
| `tables`           | [references/cli_reference.md#tables](references/cli_reference.md#tables) |
| `email-platforms`  | [references/cli_reference.md#email-platforms](references/cli_reference.md#email-platforms) |
| `users`            | [references/cli_reference.md#users](references/cli_reference.md#users) |
| `cognito`          | [references/cli_reference.md#cognito](references/cli_reference.md#cognito) |
| `org`              | [references/cli_reference.md#org](references/cli_reference.md#org) |
| `fsd`              | [references/cli_reference.md#fsd](references/cli_reference.md#fsd) |
| `epsimo`           | [references/cli_reference.md#epsimoai-commands](references/cli_reference.md#epsimoai-commands) |
| `admin`            | [references/cli_reference.md#admin](references/cli_reference.md#admin) |
| `account-analysis` | [references/cli_reference.md#account-analysis](references/cli_reference.md#account-analysis) |

---

## E2E Pipeline Testing

A comprehensive E2E test script validates the full autonomous lead lifecycle across 15 pipeline phases:

```bash
# Run the full E2E test suite
LGP_API_KEY=your-key npx tsx src/scripts/test-e2e-pipeline.ts

# Run against a specific URL
LGP_API_KEY=your-key LGP_URL=https://api.leadgenius.app npx tsx src/scripts/test-e2e-pipeline.ts

# Preserve test data after execution
LGP_API_KEY=your-key npx tsx src/scripts/test-e2e-pipeline.ts --skip-cleanup
```

The test covers: auth → client management → settings verification → ICP creation → lead import/CRUD → lead search → lead generation → enrichment → copyright → scoring → task tracking → skill doc accuracy → pipeline analytics → campaigns → cleanup.

---

## Documentation Site

Docsify-based docs are served at `/docs` (e.g., `https://api.leadgenius.app/docs`). Source files in `/docs/`, copied to `public/docs-content/` at build time.
