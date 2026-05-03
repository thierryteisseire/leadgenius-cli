import { Command } from 'commander';
import { getClient, formatOutput } from '../index.js';

export function registerMaintenanceCommands(program: Command) {
  const maintenance = program.command('maintenance').description('Maintenance commands');

  const bugs = maintenance.command('bugs').description('Bug reports');

  bugs.command('list').description('List bug reports').action(async () => {
    formatOutput(await getClient().get('/maintenance/bugs'));
  });

  bugs
    .command('report')
    .description('Report a bug')
    .requiredOption('--desc <text>', 'Bug description')
    .option('--email <email>', 'Contact email')
    .action(async (options) => {
      formatOutput(await getClient().post('/maintenance/bugs', { description: options.desc, email: options.email }));
    });

  const enhancements = maintenance.command('enhancements').description('Enhancement requests');

  enhancements.command('list').description('List enhancement requests').action(async () => {
    formatOutput(await getClient().get('/maintenance/enhancements'));
  });

  enhancements
    .command('request')
    .description('Request enhancement')
    .requiredOption('--desc <text>', 'Enhancement description')
    .option('--email <email>', 'Contact email')
    .action(async (options) => {
      formatOutput(await getClient().post('/maintenance/enhancements', { description: options.desc, email: options.email }));
    });
}
