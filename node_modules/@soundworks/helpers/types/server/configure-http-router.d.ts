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
export default function configureHttpRouter(server: Server): Promise<void>;
//# sourceMappingURL=configure-http-router.d.ts.map