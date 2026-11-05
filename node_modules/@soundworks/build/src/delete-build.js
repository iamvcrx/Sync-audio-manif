import fs from 'node:fs/promises';
import chalk from 'chalk';

import { BUILD_DIR } from './utils.js';

export default async function deleteBuild() {
  await fs.rm(BUILD_DIR, { recursive: true, force: true });
  console.log(chalk.yellow(`+ deleted build folder`));
}

