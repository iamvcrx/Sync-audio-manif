export default nodeLauncher;
declare namespace nodeLauncher {
    /**
     * The "execute" function allows to fork multiple clients in the same terminal window
     * by defining the `EMULATE` env process variable
     * e.g. `EMULATE=10 npm run watch-process thing` to run 10 clients side-by-side
     *
     * @param {function} bootstrap - Bootstrap function to execute.
     * @param {object} options - Configuration object.
     * @param {string} options.moduleURL - Module url of the calling file, used as
     *  current working directory of the subprocesses.
     * @param {number} [options.numClients=1] - Number of parallel clients.
     * @example
     * launcher.execute(bootstrap, {
     *   numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
     *   moduleURL: import.meta.url,
     * });
     */
    function execute(bootstrap: Function, { numClients, moduleURL, }?: {
        moduleURL: string;
        numClients?: number;
    }): Promise<void>;
    /**
     * Register the soundworks client into the launcher
     *
     * Automatically restarts the process when the socket closes or when an
     * uncaught error occurs in the program.
     *
     * @param {Client} client - The soundworks client.
     * @param {object} options - Configuration object.
     * @param {boolean} [options.restartOnError=false] - Define if the client should
     *  restart on uncaught errors.
     * @param {boolean} [options.restartOnSocketClose=true] - Define if the client should
     *  restart on socket disconnection.
     * @param {boolean} [options.exitParentProcess=false] - If true, exit the parent "launcher"
     *  process on both error and socket close, may be useful in production settings
     *  if the application is e.g. managed by a daemon at the system level.
     * @example
     * launcher.register(client);
     */
    function register(client: Client, { restartOnError, restartOnSocketClose, exitParentProcess, }?: {
        restartOnError?: boolean;
        restartOnSocketClose?: boolean;
        exitParentProcess?: boolean;
    }): Promise<void>;
}
//# sourceMappingURL=launcher.d.ts.map