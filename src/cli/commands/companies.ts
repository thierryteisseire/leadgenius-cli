import { Command } from 'commander';
import { getClient, formatOutput } from '../index.js';

export function registerCompaniesCommands(program: Command) {
  const companies = program.command('companies').description('Territory company commands');

  companies
    .command('list')
    .description('List territory companies')
    .requiredOption('-c, --client <id>', 'Client ID')
    .option('--sort <field>', 'Sort field')
    .option('-l, --limit <n>', 'Maximum records')
    .action(async (options) => {
      const params = new URLSearchParams({ client_id: options.client });
      if (options.sort) params.append('sort', options.sort);
      if (options.limit) params.append('limit', options.limit);
      formatOutput(await getClient().get(`/companies?${params}`));
    });

  companies.command('get <id>').description('Get company detail').action(async (id) => {
    formatOutput(await getClient().get(`/companies/${id}`));
  });

  companies.command('leads <id>').description('List company leads').action(async (id) => {
    formatOutput(await getClient().get(`/companies/${id}/leads`));
  });

  companies.command('content-analysis <id>').description('Re-run content analysis').action(async (id) => {
    formatOutput(await getClient().post(`/companies/${id}/content-analysis`));
  });

  companies
    .command('aggregate')
    .description('Aggregate leads into TerritoryCompany records')
    .requiredOption('-c, --client <id>', 'Client ID')
    .action(async (options) => {
      formatOutput(await getClient().post('/companies/aggregate', { client_id: options.client }));
    });

  const events = companies.command('events').description('Company events');

  events
    .command('list')
    .description('List company events')
    .option('-c, --client <id>', 'Client ID')
    .action(async (options) => {
      const params = new URLSearchParams();
      if (options.client) params.append('client_id', options.client);
      formatOutput(await getClient().get(`/companies/events?${params}`));
    });

  events
    .command('create')
    .description('Create manual event')
    .requiredOption('--company-id <id>', 'Company ID')
    .requiredOption('--type <type>', 'Event type')
    .option('--description <text>')
    .action(async (options) => {
      formatOutput(await getClient().post('/companies/events', {
        companyId: options.companyId, type: options.type, description: options.description
      }));
    });

  events
    .command('generate')
    .description('Auto-generate events from lead activity')
    .requiredOption('-c, --client <id>', 'Client ID')
    .action(async (options) => {
      formatOutput(await getClient().post('/companies/events/generate', { client_id: options.client }));
    });

  events.command('radar').description('Radar dashboard summary').action(async () => {
    formatOutput(await getClient().get('/companies/events/radar'));
  });
}
