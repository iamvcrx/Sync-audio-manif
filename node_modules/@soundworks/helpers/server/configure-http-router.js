import path from 'node:path';

import compression from 'compression';
import express from 'express';

import { clientIndex } from './routing/client-index.js';
import { httpAuthentication } from './routing/http-authentication.js';
import { logRoutes } from './routing/log.js';

/**
 * According to the clients definitions provided in `config.app.clients`, the
 * server will automatically create a dedicated route for each role declaring a
 * browser runtime.
 * For example, given the config object of the example above that defines two
 * different client roles for browser (i.e. `player` and `controller`):
 *
 * ```
 * config.app.clients = {
 *   player: { runtime: 'browser', default: true },
 *   controller: { runtime: 'browser' },
 * }
 * ```
 *
 * The server will listen to the following URLs:
 * - `http://127.0.0.1:8000/` for the `player` role, which is defined as the default client.
 * - `http://127.0.0.1:8000/controller` for the `controller` role.
 * @param {Server} server - The soundworks server instance
 * @example
 * import { Server } from '@soundworks/core/server.js';
 * import { configureHttpRouter, loadConfig } from '@soundworks/helpers/server.js';
 *
 * const server = new Server(loadConfig());
 * configureHttpRouter(server);
 */
export default async function configureHttpRouter(server) {
  // use express() instead of express.Router() to benefit from default handling of 404, etc.
  const router = express();
  router.use(compression());

  // middleware for crossOriginIsolated Headers: cf. https://web.dev/why-coop-coep/
  // enables `sharedArrayBuffers` and high precision timers
  router.use((_, res, next) => {
    if (server.config.env.crossOriginIsolated) {
      res.set({
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      });
    }

    next();
  });

  // create route for each browser client
  for (let [clientRole, clientDescription] of Object.entries(server.config.app.clients)) {
    if (clientDescription.runtime === 'node') {
      continue;
    }

    const requestCallbacks = [];

    if (server.isProtectedClientRole(clientRole)) {
      const authenticationMiddleware = httpAuthentication(server);
      requestCallbacks.push(authenticationMiddleware);
    };

    const indexRoute = clientIndex(clientRole, server.config);
    requestCallbacks.push(indexRoute);

    if (clientDescription.default === true) {
      router.get(`/`, ...requestCallbacks);
    }
    // keep the "explicit" route active even if default
    router.get(`/${clientRole}`, ...requestCallbacks);
  }

  // expose public static directories
  router.use(express.static('public'));
  router.use('/build', express.static(path.join('.build', 'public')));

  server.router = router;

  if (server.config.env.verbose) {
    logRoutes(server);
  }
}
