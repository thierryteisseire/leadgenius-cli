---
name: leadgenius-cli
description: Operate the LeadGenius Pro platform via the lgp CLI — lead management, enrichment, AI scoring, FSD pipeline, user provisioning, territory analysis, and EpsimoAI integration.
---

# LeadGenius CLI Skill

This skill provides the `lgp` CLI for managing the LeadGenius Pro platform.

## Install

```bash
npm install -g leadgenius-cli
```

## Authentication

```bash
lgp config set api-key lgp_YOUR_KEY
lgp auth test
```

Credentials persist to `~/.leadgenius-cli/session.json`.

## Key Commands

| Task | Command |
|------|---------|
| List leads | `lgp leads list` (shows client picker) |
| Search leads | `lgp leads search -q "Jane Doe"` |
| Import CSV | `lgp leads import --file leads.csv` |
| Enrich lead | `lgp tasks enrich --lead <id>` |
| Score lead | `lgp tasks score --lead <id>` |
| Run FSD pipeline | `lgp fsd run -c <client> --icp <id> --enrich --score` |
| Provision user | `lgp users provision -e user@example.com -p "Pass123!"` |
| List companies | `lgp companies list -c <client>` |
| Report bug | `lgp maintenance bugs report --desc "..." --email dev@co.com` |
| Interactive mode | `lgp` (no args) |

## Command Groups

`auth` · `leads` · `tasks` · `fsd` · `companies` · `webhooks` · `tables` · `users` · `org` · `cognito` · `epsimo` · `generate` · `campaigns` · `clients` · `shares` · `maintenance` · `pipeline` · `account-analysis` · `admin` · `config`

Run `lgp <group> --help` for full options.

## API Base URL

```
https://api.leadgenius.app/api/automation/
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `LGP_API_KEY` | API key (lgp_ prefix) |
| `LGP_URL` | Base URL (default: https://api.leadgenius.app) |
| `LGP_ADMIN_KEY` | Admin key for cognito/admin commands |

## Reference

- [Full README](README.md)
- [API Endpoints](references/api_endpoints.md)
- [CLI Reference](references/cli_reference.md)
- [Workflows](references/workflows.md)
- [Use Cases](references/use_cases.md)
