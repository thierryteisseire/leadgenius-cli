# LeadGenius CLI — AI Agent Skill

An AI agent skill for the [LeadGenius Pro](https://api.leadgenius.app) Automation API and `lgp` CLI tool.

## What is this?

This is a **skill** — a structured knowledge package that teaches AI coding agents (Kiro, Claude, Cursor, Copilot, etc.) how to work with the LeadGenius Pro platform. It contains:

- `SKILL.md` — Main skill file with authentication, endpoint map, and response format
- `references/api_endpoints.md` — Complete API endpoint reference (all `/api/automation/*` routes)
- `references/cli_reference.md` — Full `lgp` CLI command reference
- `references/workflows.md` — 10 common workflows (provisioning, enrichment, dedup, FSD, etc.)

## Installation

### Kiro / Claude Code / Cursor / Copilot

Copy or symlink into your agent's skills directory:

```bash
# Clone
git clone https://github.com/thierryteisseire/leadgenius-cli.git

# Symlink into your project (example for Kiro)
ln -s /path/to/leadgenius-cli .kiro/skills/leadgenius-cli

# Or for Claude Code
ln -s /path/to/leadgenius-cli .claude/skills/leadgenius-cli
```

### Manual

Just drop the files into your agent's skill directory. The agent will pick up `SKILL.md` automatically.

## What the agent learns

Once installed, your AI agent can:

- Authenticate with `X-API-Key: lgp_*` headers
- Manage leads (list, import, search, deduplicate, transfer, score)
- Trigger enrichment, copyright, and scoring jobs
- Work with territory companies, events, and radar dashboards
- Manage webhook events and reprocess lead matching
- Handle user provisioning (Cognito + Company + API key)
- Run FSD (Full-Stack Demand) pipelines
- Use the `lgp` CLI for all operations

## API Base URL

```
https://api.leadgenius.app
```

## Quick Example

```bash
# Set credentials
export LGP_API_KEY="lgp_your_key"
export LGP_URL="https://api.leadgenius.app"

# Test connection
npx tsx src/scripts/lgp.ts auth test

# Import a lead
npx tsx src/scripts/lgp.ts leads import --data \
  '{"client_id":"CID","firstName":"Jane","email":"jane@acme.com","companyName":"Acme"}'

# Enrich + score
npx tsx src/scripts/lgp.ts tasks enrich --lead LEAD_ID
npx tsx src/scripts/lgp.ts tasks score --lead LEAD_ID --fields aiLeadScore,aiQualification
```

## License

MIT
