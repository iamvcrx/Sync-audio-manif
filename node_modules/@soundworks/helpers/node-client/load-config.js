import fs from 'node:fs';
import path from 'node:path';

import JSON5 from 'json5';
import YAML from 'yaml';

// for legacy apps
const DEFAULT_ENV_CONFIG = {
  type: 'development',
  port: 8000,
  useHttps: false,
  serverAddress: '',
};

function loadJSONConfig(ENV) {
  let env;
  let app;

  const envConfigFilepath = path.join('config', `env-${ENV}.json`);

  try {
    env = JSON5.parse(fs.readFileSync(envConfigFilepath, 'utf-8'));
  } catch {
    console.info('');
    console.info('--------------------------------------------------------');
    console.info(`- Environment config file not found: "${envConfigFilepath}"`);
    console.info(`- Using default config:`);
    console.info(DEFAULT_ENV_CONFIG);
    console.info('- run `npx soundworks --create-env` to create a custom environment file');
    console.info('--------------------------------------------------------');

    env = DEFAULT_ENV_CONFIG;
  }

  const appConfigFilepath = path.join('config', 'application.json');

  try {
    app = JSON5.parse(fs.readFileSync(appConfigFilepath, 'utf-8'));
  } catch {
    console.error(`Invalid app config file: ${appConfigFilepath}`);
    process.exit(1);
  }

  return { env, app };
}

function loadYAMLConfig(ENV) {
  let env;
  let app;

  const envConfigFilepath = path.join('config', `env-${ENV}.yaml`);

  try {
    env = YAML.parse(fs.readFileSync(envConfigFilepath, 'utf-8'));
  } catch {
    console.error(`Invalid env config file: ${envConfigFilepath}`);
    process.exit(1);
  }

  const appConfigFilepath = path.join('config', 'application.yaml');

  try {
    app = YAML.parse(fs.readFileSync(appConfigFilepath, 'utf-8'));
  } catch {
    console.error(`Invalid app config file: ${appConfigFilepath}`);
    process.exit(1);
  }

  return { env, app };
}

/**
 * Load configuration from files located in `/config` directory
 *
 * @param {String} [ENV='default'] - Name of the environment corresponding to the
 *  `config/env-${name}.{yaml|json}` file.
 * @param {String} [callerURL=null] - Module url of the calling file, used to
 *  automatically retrieve the `role` of node clients.
 * @return {ClientConfig|ServerConfig}
 */
export default function nodeLoadConfig(ENV = 'default', callerURL = null) {
  const projectConfig = JSON.parse(fs.readFileSync('.soundworks'));
  const configFormat = projectConfig.configFormat?.toLowerCase() || 'json';
  let config = null;

  switch (configFormat) {
    case 'json': {
      config = loadJSONConfig(ENV);
      break;
    }
    case 'yaml': {
      config = loadYAMLConfig(ENV);
      break;
    }
  }

  // retrieve role from caller URL
  if (callerURL !== null) {
    let role = null;

    if (callerURL.endsWith('index.js')) {
      // grab the role from the caller url dirname
      const dirname = path.dirname(callerURL);
      const parent = path.resolve(dirname, '..');
      role = path.relative(parent, dirname);
    } else {
      role = path.basename(callerURL, path.extname(callerURL));
    }

    if (role === null) {
      throw new Error(`[build] Could not retrieve role from callerURL: ${callerURL}`);
    }

    if (role !== 'server') {
      config.role = role;
    }
  }

  // override env configuration with given command line ENV variables
  if (process.env.PORT) {
    config.env.port = parseInt(process.env.PORT);
  }

  if (process.env.SERVER_ADDRESS) {
    config.env.serverAddress = process.env.SERVER_ADDRESS;
  }

  if (process.env.USE_HTTPS) {
    config.env.useHttps = !!process.env.USE_HTTPS;
  }

  return config;
}
