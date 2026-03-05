# LeadGenius Pro — Common Workflows

Base URL: `https://api.leadgenius.app`
CLI: `npx tsx src/scripts/lgp.ts <command> [options]`

---

## 1. New User Provisioning

One-shot setup: Cognito user → Company → CompanyUser → API key.

```bash
# Create user with new company
lgp users provision --email user@example.com --password "SecurePass123!" --company-name "Acme Corp"
# Response includes plainTextKey — save it immediately!

# Or join existing company
lgp users provision --email user@example.com --password "SecurePass123!" --company-id "company-xxx"
```

**API equivalent:**
```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123!","companyName":"Acme Corp","createApiKey":true}' \
  https://api.leadgenius.app/api/automation/users/provision | jq
```

**Post-provisioning steps:**
1. Save the `plainTextKey` from response (only shown once)
2. Set menu access: `lgp users update USER_ID --menu-access dashboard,enrich-leads,sdr-ai`
3. Create a Client for the user: `lgp tables create Client --data '{"name":"Default Client","company_id":"xxx"}'`

---

## 2. Lead Import → Enrichment → Scoring Pipeline

The core workflow: import leads, enrich them with external data, then score with AI.

### Step 1: Import leads
```bash
# From JSON file
lgp leads import --file leads.json

# Single lead inline
lgp leads import --data '{"client_id":"CLIENT_ID","firstName":"Jane","lastName":"Doe","email":"jane@example.com","companyName":"Acme"}'
```

### Step 2: Enrich leads
```bash
# Enrich a single lead (all configured services)
lgp tasks enrich --lead LEAD_ID

# Enrich specific services only
lgp tasks enrich --lead LEAD_ID --services companyUrl,emailFinder,enrichment1
```

### Step 3: Monitor enrichment job
```bash
lgp tasks status JOB_ID
# Wait for status: "completed"
```

### Step 4: Score leads with AI
```bash
# Score a single lead
lgp tasks score --lead LEAD_ID --fields aiLeadScore,aiQualification,aiColdEmail

# Score multiple leads
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"leadIds":["lead-1","lead-2","lead-3"],"fields":["aiLeadScore","aiQualification"]}' \
  https://api.leadgenius.app/api/automation/tasks/score | jq
```

### Step 5: Review results
```bash
lgp leads get LEAD_ID
# Check aiLeadScore, aiQualification, enrichment fields
```

**Prerequisites:**
- UrlSettings configured with enrichment service URLs
- AgentSettings configured for copyright processes
- SdrAiSettings configured with scoring agent IDs

---

## 3. Deduplication Workflow

Find and resolve duplicate leads within a client.

### Step 1: Find duplicates
```bash
lgp leads dedup --client CLIENT_ID --match email,linkedinUrl,fullName+companyName
```

### Step 2: Review duplicate groups
Response shows groups with `matchField`, `confidence`, `matchValue`, and `leadIds[]`.

### Step 3: Resolve (merge) duplicates
```bash
# Dry run first — inspect which fields would merge
lgp leads dedup-resolve --keep BEST_LEAD_ID --merge DUP_1,DUP_2
```

Behavior:
- Empty fields on keep lead are filled from merge leads
- System fields (`id`, `owner`, `company_id`, `client_id`, `createdAt`) never merged
- Conflicts reported but keep lead's value wins
- Merge leads get `status: 'duplicate'`

---

## 4. FSD Campaign Setup & Execution

Full-Stack Demand: automated lead generation → enrichment → scoring → email outreach.

### Step 1: Create ICP (Ideal Customer Profile)
```bash
lgp tables create ICP --data '{"client_id":"CID","name":"Enterprise SaaS","industry":"Technology","companySize":"500+"}'
```

### Step 2: Create FSD campaign
```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "CID",
    "name": "Q1 Enterprise Outreach",
    "icpId": "ICP_ID",
    "frequency": "weekly",
    "targetLeadCount": 200,
    "enrichAfterGeneration": true,
    "scoreAfterEnrichment": true,
    "sendToEmailPlatform": "woodpecker",
    "qualificationThreshold": 60,
    "emailCampaignId": "woodpecker-campaign-id"
  }' \
  https://api.leadgenius.app/api/automation/fsd/campaigns | jq
```

### Step 3: Run the pipeline
```bash
lgp fsd run --client CID --icp ICP_ID --target 200 --enrich --score
```

### Step 4: Monitor progress
```bash
lgp fsd status PIPELINE_ID
# Stages: generating → enriching → scoring → qualifying → sending → completed
```

### Step 5: Review results
```bash
lgp fsd campaign CAMPAIGN_ID
# Check totalLeadsGenerated, totalLeadsEnriched, totalLeadsScored, totalLeadsSent
```

---

## 5. Webhook Reprocessing

When new leads are imported after webhooks were received, reprocess to match them.

### Step 1: List unmatched webhooks
```bash
lgp webhooks list --platform woodpecker --limit 50
# Look for matchStatus != "matched"
```

### Step 2: Reprocess individual events
```bash
lgp webhooks reprocess EVENT_ID
```

Matching priority:
1. Email match (high confidence) — `email-index` GSI
2. LinkedIn URL match (medium) — `company_id` GSI + filter
3. Name match (low) — `firstName-lastName-index` GSI

If matched, the webhook event is appended to the lead's `engagementHistory` and `engagementScore` is recalculated.

### Step 3: Verify match
```bash
lgp webhooks get EVENT_ID
# Check matchStatus, matchedLeadId, matchConfidence
```

---

## 6. Territory Analysis

Build company-level intelligence from your lead data.

### Step 1: Aggregate companies
```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"CID","forceRefresh":false}' \
  https://api.leadgenius.app/api/automation/companies/aggregate | jq
```

### Step 2: List territory companies
```bash
lgp companies list --client CID --sort totalLeads
```

### Step 3: Deep-dive a company
```bash
lgp companies get COMPANY_ID
# See: totalLeads, qualifiedLeads, averageLeadScore, contentTopics, painPoints, etc.
```

### Step 4: Run content analysis
```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  https://api.leadgenius.app/api/automation/companies/COMPANY_ID/content-analysis | jq
```

### Step 5: Generate events timeline
```bash
curl -s -X POST -H "X-API-Key: $LGP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"CID","since":"2025-01-01T00:00:00Z"}' \
  https://api.leadgenius.app/api/automation/companies/events/generate | jq
```

### Step 6: View radar dashboard
```bash
curl -s -H "X-API-Key: $LGP_API_KEY" \
  "https://api.leadgenius.app/api/automation/companies/events/radar?client_id=CID" | jq
```

---

## 7. Lead Transfer Between Clients

Move leads from one client to another within the same company.

```bash
# Dry run first
lgp leads transfer --from SOURCE_CLIENT --to TARGET_CLIENT --all --dry-run

# Execute transfer
lgp leads transfer --from SOURCE_CLIENT --to TARGET_CLIENT --all

# Or transfer specific leads
lgp leads transfer --from SOURCE_CLIENT --to TARGET_CLIENT --leads lead1,lead2,lead3
```

Behavior:
- Both clients must belong to your company
- Duplicate detection by email + linkedinUrl against target client
- Duplicates are skipped (not overwritten)
- Only `client_id` field is updated on transferred leads

---

## 8. Multi-User Company Setup

Set up a company with multiple users and role-based access.

### Step 1: Provision the admin
```bash
lgp users provision --email admin@acme.com --password "AdminPass123!" --company-name "Acme Corp"
# Save the API key from response
```

### Step 2: Add team members
```bash
# Create Cognito accounts
lgp cognito create --email manager@acme.com --password "MgrPass123!"
lgp cognito create --email user@acme.com --password "UserPass123!"

# Add to company with roles
lgp org add-user COMPANY_ID --email manager@acme.com --role admin --group manager
lgp org add-user COMPANY_ID --email user@acme.com --role member --group user
```

### Step 3: Configure menu access
```bash
lgp users update MANAGER_USER_ID --menu-access dashboard,enrich-leads,sdr-ai,source-leads
lgp users update USER_ID --menu-access dashboard,enrich-leads
```

### Step 4: Set client access
```bash
# Manager sees all clients
lgp users update MANAGER_USER_ID --client-access-mode all

# User sees specific clients only
lgp users update USER_ID --client-access-mode specific --allowed-clients client-1,client-2
```

---

## 9. Email Platform Integration

Send qualified leads to email outreach platforms.

### Step 1: Check configured platforms
```bash
lgp email-platforms list
```

### Step 2: Identify qualified leads
```bash
# List leads and check scores
lgp leads list --client CID --fields email,aiLeadScore,aiQualification
```

### Step 3: Send to platform
```bash
lgp email-platforms send --platform woodpecker --campaign CAMPAIGN_ID --leads lead1,lead2,lead3
```

Behavior:
- Max 200 leads per request
- Prefers `emailFinder` field over `email` for verified addresses
- Leads without email are skipped
- Platform must be active

---

## 10. Data Health Check

Validate data integrity across your company.

```bash
# Check lead ownership
lgp leads validate-ownership

# List all clients
lgp tables list Client

# Check for orphaned leads (client_id pointing to non-existent Client)
# The validate-ownership endpoint checks this automatically
```

Reports: orphaned records, mismatched company IDs, null owner fields.
