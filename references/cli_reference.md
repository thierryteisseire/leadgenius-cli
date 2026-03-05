# LeadGenius Pro — CLI Reference (`lgp`)

The `lgp` CLI is a thin HTTP client wrapping the Automation API. All logic is server-side.

```bash
npx tsx src/scripts/lgp.ts <command> [options]
```

## Setup

```bash
export LGP_API_KEY="lgp_your_key"
export LGP_URL="https://api.leadgenius.app"   # default: http://localhost:3000
```

Or use flags: `--api-key lgp_xxx --url https://api.leadgenius.app`

## Global Options

| Option | Description |
|--------|-------------|
| `--api-key <key>` | API key (overrides `LGP_API_KEY`) |
| `--url <url>` | Base URL (overrides `LGP_URL`) |
| `--format <fmt>` | `json` (default) or `table` |

---

## auth

```bash
lgp auth test                              # Test API key
```

## leads

```bash
lgp leads list --client <id> [--limit <n>] [--fields <f1,f2>] [--next-token <t>]
lgp leads get <id>
lgp leads import --file <path.json>        # Or: --data '<json>'
lgp leads search [--email <e>] [--first-name <n>] [--last-name <n>]
                   [--company-url <u>] [--linkedin-url <u>] [--client <id>] [--limit <n>]
lgp leads dedup --client <id> --match <email,linkedinUrl,fullName+companyName>
lgp leads dedup-resolve --keep <id> --merge <id1,id2>
lgp leads transfer --from <clientId> --to <clientId> [--leads <id1,id2>] [--all] [--dry-run]
lgp leads validate-ownership
lgp leads activity <leadId> --type <type> [--notes <text>] [--metadata <json>]
lgp leads activities <leadId>
```

### Activity types
`linkedin_connection_sent`, `linkedin_connection_accepted`, `linkedin_message_sent`, `linkedin_message_received`, `linkedin_profile_viewed`, `email_sent`, `email_opened`, `email_clicked`, `email_answered`, `email_bounced`, `call_completed`, `call_no_answer`, `meeting_scheduled`, `meeting_completed`, `form_submitted`, `website_visited`, `content_downloaded`, `demo_requested`, `proposal_sent`, `contract_signed`, `custom`

## tasks

```bash
lgp tasks list [--status <running|completed|failed>] [--type <enrichment|copyright|scoring>] [--limit <n>]
lgp tasks status <jobId>
lgp tasks enrich --lead <id> [--services <s1,s2>]
lgp tasks copyright --lead <id> [--processes <p1,p2>]
lgp tasks score --lead <id> [--fields <f1,f2>]
```

### Enrichment services
`companyUrl`, `emailFinder`, `enrichment1` through `enrichment10`

### Scoring fields
`aiLeadScore`, `aiQualification`, `aiNextAction`, `aiColdEmail`, `aiInterest`, `aiLinkedinConnect`, `aiCompetitorAnalysis`, `aiEngagementLevel`, `aiPurchaseWindow`, `aiDecisionMakerRole`, `aiSentiment`, `aiSocialEngagement`, `aiNurturingStage`, `aiBudgetEstimation`, `aiRiskScore`, `aiProductFitScore`

## companies

```bash
lgp companies list --client <id> [--sort <field>] [--limit <n>]
lgp companies get <id>
lgp companies leads <id> [--limit <n>]
lgp companies content-analysis <id>
```

Sort values: `totalLeads`, `qualifiedLeads`, `averageLeadScore`, `lastActivityDate`, `companyName`

## webhooks

```bash
lgp webhooks list [--platform <name>] [--event-type <type>] [--limit <n>]
lgp webhooks get <id>
lgp webhooks reprocess <id>
```

## tables

```bash
lgp tables list <tableName> [--limit <n>]
lgp tables create <tableName> --data '<json>'
lgp tables get <tableName> <id>
lgp tables update <tableName> <id> --data '<json>'
lgp tables delete <tableName> <id>
```

### Supported tables
**Company**: `Company`, `CompanyUser`, `CompanyInvitation`
**Leads**: `Jobs`, `B2BLeads`, `EnrichLeads`, `SourceLeads`, `TerritoryCompany`, `CompanyEvent`, `LinkedInJobs`
**Campaign**: `ICP`, `ABMCampaign`, `TargetAccount`
**Outreach**: `OutreachSequence`, `SequenceEnrollment`, `Workflow`, `WorkflowExecution`
**Webhook**: `Integration`, `Webhook`, `WebhookLog`, `WebhookSettings`, `InboundWebhook`, `WebhookEvent`
**AI Config**: `Agent`, `AgentSettings`, `SdrAiSettings`, `CopyrightSettings`, `SdrSettings`
**Platform Config**: `EnrichmentService`, `EmailPlatformSettings`, `OutreachCampaign`, `OutreachTemplate`, `BaserowSyncConfig`, `BaserowSyncHistory`, `BaserowConfig`, `UnipileSettings`, `UnipileAccount`, `UnipileMessage`, `UnipileChat`, `UnipileLog`, `UnipileCampaign`, `UnipileIntegration`
**System**: `AgentApiKey`, `UrlSettings`, `Client`, `SearchHistory`, `Maintenance`, `SidebarConfig`, `SharedView`

## email-platforms

```bash
lgp email-platforms list
lgp email-platforms send --platform <name> --campaign <id> --leads <id1,id2>
```

## users

```bash
lgp users list [--group <group>] [--limit <n>]
lgp users get <id>
lgp users create --email <email> [--role <role>] [--group <group>]
lgp users update <id> [--role <role>] [--group <group>] [--status <status>]
lgp users delete <id>
lgp users provision --email <email> --password <pass> [--company-name <name>] [--company-id <id>]
```

Roles: `owner`, `admin`, `member`, `viewer`
Groups: `admin`, `manager`, `user`, `viewer`
Statuses: `pending`, `active`, `inactive`, `disabled`

## cognito

```bash
lgp cognito list [--limit <n>]
lgp cognito get --email <email>
lgp cognito create --email <email> --password <pass> [--name <name>]
lgp cognito enable --email <email>
lgp cognito disable --email <email>
```

## org

```bash
lgp org list [--limit <n>]
lgp org get <id>
lgp org create --name <name>
lgp org rename <id> --name <newName>
lgp org delete <id>
lgp org users <companyId> [--limit <n>]
lgp org add-user <companyId> --email <email> [--role <role>] [--group <group>]
lgp org update-user <userId> [--role <role>] [--group <group>] [--status <status>]
lgp org remove-user <userId>
```

## fsd

```bash
lgp fsd campaigns
lgp fsd campaign <id>
lgp fsd update-campaign <id> [--name <n>] [--target <n>] [--frequency <f>] [--active <bool>]
lgp fsd deactivate-campaign <id>
lgp fsd run --client <id> [--icp <id>] [--actor <id>] [--input <json>] [--target <n>] [--enrich] [--score]
lgp fsd status <pipelineId>
```

Frequencies: `once`, `daily`, `weekly`, `monthly`

---

## Quick Examples

```bash
# Verify connection
lgp auth test

# List clients
lgp tables list Client

# Import + enrich + score a lead
lgp leads import --data '{"client_id":"CID","firstName":"Jane","email":"jane@acme.com","companyName":"Acme"}'
lgp tasks enrich --lead LEAD_ID
lgp tasks score --lead LEAD_ID --fields aiLeadScore,aiQualification

# Provision a new user
lgp users provision --email new@acme.com --password "Pass123!" --company-name "Acme"

# Run FSD pipeline
lgp fsd run --client CID --icp ICP_ID --target 100 --enrich --score
lgp fsd status PIPELINE_ID
```
