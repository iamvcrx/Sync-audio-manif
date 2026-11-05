/**
 * Client-side representation of the check-in plugin.
 *
 * The constructor should never be called manually. The plugin will be
 * automatically instantiated when registered in the `pluginManager`.
 */
export default class ClientPluginCheckin {
    /** @hideconstructor */
    constructor(client: any, id: any, options: any);
    options: any;
    /** @private */
    private start;
    /**
     * Return the unique index given to the client
     * @return {number}
     */
    getIndex(): number;
    /**
     * Return the associated data given to the client (if any)
     * @return {any}
     */
    getData(): any;
    #private;
}
//# sourceMappingURL=ClientPluginCheckin.d.ts.map