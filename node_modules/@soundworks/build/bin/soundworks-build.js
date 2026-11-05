#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';

import buildApplication from '../src/build-application.js';
import watchProcess from '../src/watch-process.js';
import deleteBuild from '../src/delete-build.js';

program
  .option('-b, --build', 'build application')
  .option('-w, --watch', 'watch file system to rebuild application, use in conjunction with --build flag')
  .option('-p, --watch-process <name>', 'restart a node process when its sources')
  .option('-i, --inspect', 'watch process with --inspect flag, use in conjunction with --watch-process flag')
  .option('-D, --delete-build', 'delete build directory')
  // deprecated since 1.0.0-alpha.1 - 2024/05/16
  .option('-d, --debug', '[deprecated] keep flag for legacy scripts')
  .option('-m, --minify', '[deprecated] keep flag for legacy scripts')
  .option('-C, --clear-cache', '[deprecated] keep flag for legacy scripts')
;

program.parse(process.argv);

const options = program.opts();

/**
 * Handle deprecated options
 */
if (options.clearCache) {
  console.warn(chalk.yellow(`[soundworks-build] The 'soundworks-build -C' (--clear-cache) option is obsolete since version 1.0.0-alpha.1, please consider removing it from your npm scripts`));
}

if (options.minify) {
  console.warn(chalk.yellow(`[soundworks-build] The 'soundworks-build -m' (--minify) option is obsolete since version 1.0.0-alpha.1, please consider removing it from your npm scripts`));
}

if (options.debug) {
  console.warn(chalk.yellow(`[soundworks-build] The 'soundworks-build -d' (--debug) option is obsolete since version 1.0.0-alpha.1, please consider replacing it with the 'soundworks-build -i' (--inspect) option in your npm scripts`));
}

/**
 * Run the scripts
 */
if (options.build) {
  buildApplication(options.watch);
}

if (options.watchProcess) {
  watchProcess(options.watchProcess, options.inspect || options.debug);
}

if (options.deleteBuild) {
  await deleteBuild();
}

