import '@soundworks/helpers/polyfills.js';
import '@soundworks/helpers/catch-unhandled-errors.js';
import { readdir } from 'node:fs/promises';
import { Server } from '@soundworks/core/server.js';
import { loadConfig, configureHttpRouter } from '@soundworks/helpers/server.js';
import ServerPluginCheckin from '@soundworks/plugin-checkin/server.js';
import ServerPluginPlatformInit from '@soundworks/plugin-platform-init/server.js';
import ServerPluginSync from '@soundworks/plugin-sync/server.js';
import globalDescription from './state-descriptions/global.js';

const config = loadConfig(process.env.ENV, import.meta.url);
const server = new Server(config);

server.pluginManager.register('sync', ServerPluginSync);
server.pluginManager.register('checkin', ServerPluginCheckin, {
  capacity: 64,
});
server.pluginManager.register('platform-init', ServerPluginPlatformInit);
server.stateManager.defineClass('global', globalDescription);

await configureHttpRouter(server);
server.router.get('/audio-files.json', async (_request, response) => {
  const files = await readdir('public/assets');
  response.json(files
    .filter((file) => /\.(wav|mp3|ogg|m4a|aac)$/i.test(file))
    .map((name) => ({ name, label: name.replace(/\.[^.]+$/, '') })));
});

await server.start();
await server.stateManager.create('global');

console.log(`Soundworks audio manifold ready on port ${config.env.port}`);
