import { Command } from 'commander';
import { getClient, formatOutput } from '../index.js';

export function registerAccountAnalysisCommands(program: Command) {
  const aa = program.command('account-analysis').description('Account analysis commands');

  aa
    .command('list')
    .description('List company groups')
    .requiredOption('-c, --client <id>', 'Client ID')
    .option('--sort <field>', 'Sort field')
    .option('--min-leads <n>', 'Minimum leads filter')
    .action(async (options) => {
      const params = new URLSearchParams({ client_id: options.client });
      if (options.sort) params.append('sort', options.sort);
      if (options.minLeads) params.append('minLeads', options.minLeads);
      formatOutput(await getClient().get(`/account-analysis?${params}`));
    });

  aa
    .command('analyze')
    .description('Detailed metrics')
    .requiredOption('-c, --client <id>', 'Client ID')
    .option('--company <name>', 'Company name filter')
    .action(async (options) => {
      const params = new URLSearchParams({ client_id: options.client });
      if (options.company) params.append('company', options.company);
      formatOutput(await getClient().get(`/account-analysis/analyze?${params}`));
    });

  aa
    .command('export')
    .description('Export to CSV/JSON')
    .requiredOption('-c, --client <id>', 'Client ID')
    .requiredOption('--format <fmt>', 'Format: csv|json')
    .option('--output <path>', 'Output file path')
    .action(async (options) => {
      const params = new URLSearchParams({ client_id: options.client, format: options.format });
      const response = await getClient().get(`/account-analysis/export?${params}`);
      if (options.output && response.success && response.data) {
        const { writeFileSync } = await import('fs');
        writeFileSync(options.output, typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2));
        console.log(`Exported to ${options.output}`);
      } else {
        formatOutput(response);
      }
    });

  aa
    .command('cache-clear')
    .description('Clear local cache')
    .option('-c, --client <id>', 'Client ID')
    .action(async (options) => {
      const body: any = {};
      if (options.client) body.client_id = options.client;
      formatOutput(await getClient().post('/account-analysis/cache-clear', body));
    });
}
