import chalk from 'chalk';
import columnify from 'columnify';

export function logRoutes(server) {
  const table = [];

  for (let [clientRole, clientConfig] of Object.entries(server.config.app.clients)) {
    if (clientConfig.runtime === 'node') {
      const line = {
        role: `> ${clientRole}`,
        runtime: chalk.red(clientConfig.runtime),
        path: `serverAddress: ${chalk.green(server.config.env.serverAddress || '127.0.0.1')}`,
        default: undefined,
        // auth: undefined,
      };

      table.push(line);
    } else if (clientConfig.runtime === 'browser') {
      const line = {
        role: `> ${clientRole}`,
        runtime: chalk.red(clientConfig.runtime),
        path: clientConfig.default ? `/` : `/${clientRole}`,
        default: (clientConfig.default ? 'x' : undefined),
        auth: server.isProtectedClientRole(clientRole) ? 'x' : undefined,
      };

      table.push(line);
    }
  }

  console.log(chalk.cyan(`+ configured clients and routing`));
  console.log(``);
  console.log(columnify(table, {
    showHeaders: true,
    minWidth: 6,
    columnSplitter: ' | ',
    config: {
      default: { align: 'center' },
      auth: { align: 'center' },
    },
  }));
  console.log(``);
}
