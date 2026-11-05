/**
 * Server-side representation of the check-in plugin.
 *
 * The constructor should never be called manually. The plugin will be
 * automatically instantiated when registered in the `pluginManager`.
 *
 * Available options:
 * - `capacity` {number} [Infinity] - Number of available indexes
 * - `data` {array} - optional data associated to a given index.
 *
 * @example
 * import ServerPluginCheckin from '@soundworks/plugin-checkin/server.js';
 *
 * server.pluginManager.register('checkin', ServerPluginCheckin, {
 *   capacity: 3,
 *   data: [{ color: 'green' }, { color: 'yellow' }, { color: 'pink' }],
 * });
 */
export default class ServerPluginCheckin {
    /** @hideconstructor */
    constructor(server: any, id: any, options?: {});
    options: any;
    /** @private */
    private start;
    /** @private */
    private stop;
    /** @private */
    private addClient;
    /** @private */
    private removeClient;
    #private;
}
//# sourceMappingURL=ServerPluginCheckin.d.ts.map