import path from 'node:path';
import fs from 'node:fs';

export const SRC_DIR = 'src';
export const BUILD_DIR = '.build';

/**
 * backward compatibility for old "target" vs new "runtime" client description from
 */
export function runtimeOrTarget(clientDescription) {
  return clientDescription.target || clientDescription.runtime;
}

export function locateProcessEntryPoint(role, basePathname) {
  if (role !== 'server') {
    basePathname = path.join(basePathname, 'clients');
  }

  const patterns = [
    path.join(basePathname, `${role}.js`),
    path.join(basePathname, `${role}.ts`),
    path.join(basePathname, role, `index.js`),
    path.join(basePathname, role, `index.tx`),
  ];

  for (let i = 0; i < patterns.length; i++) {
    const pathname = patterns[i];
    if (fs.existsSync(pathname)) {
      return pathname;
    }
  }

  throw new Error(`Cannot execute 'locateProcessEntryPoint': No entry point found for process ${role}`);
}
