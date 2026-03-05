---
name: leadgenius-cli
description: LeadGenius Pro Automation API and CLI skill. Use when working with the LeadGenius Pro platform — managing leads, clients, companies, users, webhooks, enrichment tasks, scoring, FSD pipelines, or any API integration. Covers all /api/automation/* endpoints, the `lgp` CLI tool, API key authentication, and common workflows like lead import, enrichment, deduplication, and full-stack demand generation.
---

# LeadGenius Pro — Automation API & CLI

Base URL: `https://api.leadgenius.app`
CLI: `npx tsx src/scripts/lgp.ts <command> [options]`

## Authentication

Every request requires an `X-API-Key` header with an `lgp_*` prefixed key. The key determines company scope, owner identity, and rate limits.

```bash
curl -H "X-API-Key: lgp_YOUR_KEY" https://api.leadgenius.app/api/automation/auth/test
```

For CLI, set environment variables:
```bash
export LGP_API_KEY="lgp_your_key"
export LGP_URL="https://api.leadgenius.app"
```

## API Sections

For detailed endpoint docs with request/response schemas, see the reference files:

- **Leads, Tasks, Companies, Webhooks, Users, Organizations, Tables, Email Platforms, FSD Pipeline**: See [references/api_endpoints.md](references/api_endpoints.md)
- **Common workflows and use cases**: See [references/workflows.md](references/workflows.md)
- **CLI command reference**: See [references/cli_reference.md](references/cli_reference.md)

## Quick Reference — Endpoint Map

| Section | Endpoints | Description |
|---------|-----------|-------------|
| Auth | `GET /api/automation/auth/test` | Test API key |
| Leads | `GET/POST /api/automation/leads/*` | List, import, search, deduplicate, transfer, activities |
| Tasks | `GET/POST /api/automation/tasks/*` | Enrichment, copyright, scoring jobs |
| Companies | `GET/POST /api/automation/companies/*` | Territory companies, events, radar |
| Webhooks | `GET/PUT/DELETE /api/automation/webhook-events/*` | Webhook log management |
| Users | `GET/POST/PUT/DELETE /api/automation/users/*` | User + Cognito management |
| Organizations | `GET/POST/PUT/DELETE /api/automation/companies/manage` | Company CRUD |
| Tables | `GET/POST/PUT/DELETE /api/automation/tables/{tableName}/*` | Generic CRUD |
| Email | `GET/POST /api/automation/email-platforms/*` | Platform integration |
| FSD | `GET/POST/PUT/DELETE /api/automation/fsd/*` | Full-stack demand pipelines |

## Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "requestId": "uuid-v4"
}
```

Paginated responses add `nextToken` and `count`. Errors return `error`, `details`, and `code` fields.

## Multi-Tenant Isolation

All data is scoped to the API key's company. The API automatically sets `owner` and `company_id` on created records and filters queries to your company.

## Rate Limits

60 req/min, 1000 req/hour, 10000 req/day per API key.
