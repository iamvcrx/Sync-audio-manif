/**
 * Structure of the definition for the test of a feature.
 *
 * @param {String} id - Id of the feature
 * @param {Object} - Definition of the feature
 * @param {Function} [obj.check=Promise.resolve(true)] - called *before* user gesture
 * @param {Function} [obj.activate=Promise.resolve(true)] - called on user gesture
 *
 * @private
 */
export function addFeatureDefinition(id: string, def: any): void;
/**
 * Client-side representation of the platform init plugin.
 *
 * The constructor should never be called manually. The plugin will be
 * instantiated by soundworks when registered in the `pluginManager`
 *
 * Available options:
 * - `audioContext` {AudioContext} - Instance of AudioContext to be resumed
 *   aliases: ['webaudio', 'audio-context', 'audioContext']
 * - `devicemotion` {DeviceMotion} - `@ircam/devicemotion` module.
 *   aliases: ['devicemotion', 'device-motion']
 * - `micro` {Boolean} - create a microphone stream with all feature (i.e.
 *   echoCancellation, noiseReduction, autoGainControl) set to false.
 *   + aliases: ['mic', 'micro']
 *   + todo: implement `deviceId`
 * - `video` {Boolean} - create a camera stream
 *   + todo: implement `deviceId`
 * - `onCheck` {Function} - function executed when the plugin is started to check
 *   for example if the feature is available. The provided function should return
 *   a Promise.
 * - `onActive` {Function} - function executed on the user gesture to init a feature.
 *   The provided function should return a Promise.
 *
 * @example
 * client.pluginManager.register('platform-init', platformInitPlugin, { audioContext });
 */
export default class ClientPluginPlatformInit {
    /** @hideconstructor */
    constructor(client: any, id: any, options: any);
    options: any;
    state: {
        userGestureTriggered: boolean;
        infos: any;
        check: any;
        activate: any;
    };
    /**
     * Method to be called by the application on the first user gesture, i.e. a 'click' event
     * (cf. {@link https://developers.google.com/web/updates/2017/09/autoplay-policy-changes})
     *
     * Calling this method several times will result in a no-op after the first call.
     *
     * By default, this method is automatically called by the launcher. Therefore, in
     * most cases, you should not have to call it manually.
     *
     * @example
     * myView.addEventListener('click', (e) => platformPlugin.onUserGesture(e));
     */
    onUserGesture(event: any): Promise<void>;
    _startPromiseResolve: (value: any) => void;
    _startPromiseReject: (reason?: any) => void;
    _features: Map<any, any>;
    /**
     * This is executed when the plugin manager starts but the returned promise
     * is resolved only on user gesture
     * @private
     */
    private start;
    /**
     * Returns the payload associated to a given feature.
     * @param {String} featureId - Id of the feature as given during plugin registration
     */
    get(featureId: string): any;
    #private;
}
//# sourceMappingURL=ClientPluginPlatformInit.browser.d.ts.map