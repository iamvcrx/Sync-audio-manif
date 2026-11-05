import fs from 'node:fs';
import path from 'node:path';
import { fork } from 'node:child_process';

import loadConfig from '@soundworks/helpers/load-config.js';
import chalk from 'chalk';
import portfinder from 'portfinder';
import chokidar from 'chokidar';
import terminate from 'terminate/promise';

import {
  runtimeOrTarget,
  locateProcessEntryPoint,
  BUILD_DIR,
} from './utils.js';

export default async function watchProcess(processName, inspect) {
  // `--watch` flag has been declared stable in node v22.0.0
  // cf. https://nodejs.org/api/cli.html#--watch
  const [major, _minor, _patch] = process.versions.node.split('.').map(Number);
  if (major < 22) {
    console.log(chalk.red(`[@soundworks/build] watch-process rely on the "--watch" flag which has been declared stable in node v22.0.0, but your node version ${process.versions.node}. Please upgrade to node >= 22`));
  }

  // check that application has been built
  if (!fs.existsSync(path.join('.build'))) {
    console.log(chalk.red(`[@soundworks/build] Can't watch process, application has not been built yet, please run \`npm run build\` or \`npm run dev\` beforehand`));
    process.exit(1);
  }

  if (processName !== 'server') {
    // Get application config file and make sure client is declared as a "node" target
    const config = loadConfig(process.env.ENV);
    const clientsConfig = config.app.clients;

    if (!clientsConfig[processName]) {
      console.log(chalk.red(`[@soundworks/build] Process \`${processName}\` not declared in \`./config/application.yaml\``));
      process.exit(1);
    }

    if (runtimeOrTarget(clientsConfig[processName]) !== 'node') {
      console.log(chalk.red(`[@soundworks/build] Process \`${processName}\` not declared as a "node" runtime in \`./config/application.yaml\``));
      process.exit(1);
    }
  }

  const processPath = locateProcessEntryPoint(processName, BUILD_DIR);
  console.log(chalk.cyan(`> watching process\t ${processPath}`));

  // [2025-01] Notes on the different relaunch solution we explored here:
  // - `chokidar` does not provide a way to restart the process when a dependency,
  // which is outside the watched directory is changed. Which is rather bad DX
  // - `nodemon` has the same problem, while it may look like the opposite in a simple
  // testbed. It restarts the process even the changed does not concern it... probably
  // because it watches process.cwd() by default, so same behavior as with `chokidar`
  // but with larger "watch" scope
  // - `node --watch` looks like the most suited solution for our use-case:
  //  + released as stable in node v20.13 (May 7, 2024) and v22.0.0
  //  + when file is update through rsync, flag `--inplace` must be passed to
  //    trigger the restart on Linux.

  // default flags for node processes in watch/dev mode
  const options = {
    stdio: 'inherit',
    execArgv: [
      '--trace-warnings',
      '--enable-source-maps',
      '--watch',
    ],
  };

  // Only for server, not suited for node clients has the "real" client process
  // is forked by the launcher.
  // Must be inserted before --watch for some reason
  if (inspect) {
    const port = await portfinder.getPortPromise({ port: 9229 });
    options.execArgv.unshift(`--inspect=${port}`);
  }

  let proc = null;

  // restart watched process when a config file change
  chokidar
    .watch('config', { ignoreInitial: true })
    .on('all', async () => {
      if (proc) {
        await terminate(proc.pid);
      }

      proc = fork(processPath, [], options);
    });

  proc = fork(processPath, [], options);
}
