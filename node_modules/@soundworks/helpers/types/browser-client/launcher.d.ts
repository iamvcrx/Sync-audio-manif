export default browserLauncher;
declare namespace browserLauncher {
    let language: string;
    /**
     * Allow to launch multiple clients at once in the same browser window by
     * adding `?emulate=numberOfClient` at the end of the url
     * e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients in parallel
     *
     * @param {Function} bootstrap - Bootstrap function to execute.
     * @param {object} options - Configuration object.
     * @param {number} [options.numClients=1] - Number of parallel clients.
     * @param {string} [options.width='20%'] - If numClient > 1, width of the container.
     * @param {string} [options.height='500px'] - If numClient > 1, height of the container.
     * @example
     * launcher.execute(main, {
     *   numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
     * });
     */
    function execute(bootstrap: Function, { numClients, width, height, }?: {
        numClients?: number;
        width?: string;
        height?: string;
    }): Promise<void>;
    /**
     * Register the client in the launcher.
     *
     * The launcher will do a bunch of stuff for you:
     * - Display default initialization screens. If you want to change the provided
     * initialization screens, you can import all the helpers directly in your
     * application by doing `npx soundworks --eject-helpers`. You can also
     * customize some global styles variables (background-color, text color etc.)
     * in `src/clients/components/css/app.scss`.
     * You can also change the default language of the initialization screen by
     * setting, the `launcher.language` property, e.g.:
     * `launcher.language = 'fr'`
     * - By default the launcher automatically reloads the client when the socket
     * closes or when the page is hidden. Such behavior can be quite important in
     * performance situation where you don't want some phone getting stuck making
     * noise without having any way left to stop it... Also be aware that a page
     * in a background tab will have all its timers (setTimeout, etc.) put in very
     * low priority, messing any scheduled events.
     *
     * @param {Client} client - The soundworks client.
     * @param {object} options - Configuration object.
     * @param {HTMLElement} options.initScreensContainer - The HTML container for
     *  the initialization screens.
     * @param {boolean} [options.reloadOnVisibilityChange=true] - Define if the client
     *  should reload on visibility change.
     * @param {boolean} [options.reloadOnSocketError=true] - Define if the client
     *  should reload on socket error and disconnection.
     * @example
     * launcher.register(client, { initScreensContainer: $container });
     */
    function register(client: Client, { initScreensContainer, reloadOnVisibilityChange, reloadOnSocketError, }?: {
        initScreensContainer: HTMLElement;
        reloadOnVisibilityChange?: boolean;
        reloadOnSocketError?: boolean;
    }): void;
    /**
     * Set the text to be used for a given language. Allows to override an existing
     * language as well as define a new one.
     *
     * @param {string} lang - Key corresponding to the language (e.g. 'fr', 'en', 'es')
     * @param {object} data - Key/value pairs defining the text strings to be used.
     */
    function setLanguageData(lang: string, data: object): void;
    /**
     * Retrieve the data for a given language.
     *
     * @param {string} lang - Key corresponding to the language (e.g. 'fr', 'en', 'es')
     */
    function getLanguageData(lang?: string): any;
}
//# sourceMappingURL=launcher.d.ts.map