import { hrtime } from 'node:process';

const start = hrtime();

export function getTime() {
  const delta = hrtime(start);
  return delta[0] + delta[1] * 1e-9;
}
