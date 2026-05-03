import { select, input, password } from '@inquirer/prompts';
import { getOrCreateClient, menuSelect, EXIT, exitChoice } from './engine.js';
import { authMenu, leadsMenu, tasksMenu } from './menus-core.js';
import { fsdMenu, companiesMenu, webhooksMenu, tablesMenu } from './menus-data.js';
import { usersMenu, orgMenu, cognitoMenu, epsimoMenu } from './menus-users.js';
import { adminMenu, generateMenu, campaignsMenu, clientsMenu, sharesMenu, maintenanceMenu, pipelineMenu, accountAnalysisMenu } from './menus-extra.js';

async function setup(): Promise<boolean> {
  const apiKey = process.env.LGP_API_KEY || await input({ message: 'API Key (lgp_...):', validate: v => v.startsWith('lgp_') || 'Must start with lgp_' });
  const baseUrl = process.env.LGP_URL || await input({ message: 'Base URL:', default: 'https://api.leadgenius.app' });
  const adminKey = process.env.LGP_ADMIN_KEY || '';
  try {
    const client = getOrCreateClient(apiKey, baseUrl, adminKey || undefined);
    const res = await client.get('/auth/test');
    if (res.success) {
      console.log(`\n✓ Connected as ${res.data?.owner} (company: ${res.data?.companyId})\n`);
      return true;
    }
    console.error(`✗ Auth failed: ${res.error}`);
    return false;
  } catch (e: any) { console.error('Connection error:', e.message); return false; }
}

export async function startTui() {
  console.log('\n🚀 LeadGenius Pro — Interactive Mode\n');
  if (!await setup()) { process.exit(1); }

  while (true) {
    const group = await menuSelect('Main Menu', [
      { name: '🔑 Auth — Test connection', value: 'auth' },
      { name: '👥 Leads — Manage leads', value: 'leads' },
      { name: '⚡ Tasks — Background jobs', value: 'tasks' },
      { name: '🚀 FSD — Pipeline campaigns', value: 'fsd' },
      { name: '🏢 Companies — Territory intel', value: 'companies' },
      { name: '🔗 Webhooks — Inbound events', value: 'webhooks' },
      { name: '📋 Tables — Generic CRUD', value: 'tables' },
      { name: '👤 Users — User management', value: 'users' },
      { name: '🏛️  Org — Company management', value: 'org' },
      { name: '🔐 Cognito — User pool', value: 'cognito' },
      { name: '🤖 EpsimoAI — Credits & threads', value: 'epsimo' },
      { name: '🎯 Generate — Lead generation', value: 'generate' },
      { name: '📊 Campaigns — ABM campaigns', value: 'campaigns' },
      { name: '📁 Clients — Client management', value: 'clients' },
      { name: '🔗 Shares — Shared links', value: 'shares' },
      { name: '📈 Pipeline — Analytics', value: 'pipeline' },
      { name: '📉 Account Analysis', value: 'account-analysis' },
      { name: '🛠️  Maintenance — Bugs & requests', value: 'maintenance' },
      { name: '⚙️  Admin — Backups & system', value: 'admin' },
      exitChoice(),
    ]);

    if (group === EXIT) { console.log('Goodbye!'); process.exit(0); }

    try {
      const menus: Record<string, () => Promise<void>> = {
        auth: authMenu, leads: leadsMenu, tasks: tasksMenu, fsd: fsdMenu,
        companies: companiesMenu, webhooks: webhooksMenu, tables: tablesMenu,
        users: usersMenu, org: orgMenu, cognito: cognitoMenu, epsimo: epsimoMenu,
        generate: generateMenu, campaigns: campaignsMenu, clients: clientsMenu,
        shares: sharesMenu, pipeline: pipelineMenu, 'account-analysis': accountAnalysisMenu,
        maintenance: maintenanceMenu, admin: adminMenu,
      };
      await menus[group]();
    } catch (e: any) {
      if (e.name === 'ExitPromptError') { console.log('Goodbye!'); process.exit(0); }
      console.error('Error:', e.message);
    }
  }
}
