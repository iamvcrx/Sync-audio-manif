import { html, render } from 'lit/html.js';
// i18n
import en from './i18n/en.js';
import fr from './i18n/fr.js';
// -----------------------------------------------------------------------------
// Backward compatibility for old applications might rely on this direct import:
// `import launcher from '@soundworks/helpers/launcher.js';`
import './components/sw-launcher.js';
import './components/sw-plugin-default.js';
import './components/sw-plugin-error.js';
// these were previously imported by their respective plugins
import './components/sw-plugin-platform-init.js';
import './components/sw-plugin-position.js';
// -----------------------------------------------------------------------------

/** @private */
const clients = new Set(); // <client, options>
/** @private */
const languageDataStore = { en, fr };
/** @private */
let language = null; // default to english
/** @private */
const ClientPluginPlatformInitClassName = 'ClientPluginPlatformInit';
const ClientPluginPositionClassName = 'ClientPluginPosition';

/** @private */
function renderLaunchScreens(client, $container) {
  let lang;

  // if language has not been set manually, pick language from the browser
  // and fallback to english if not supported
  if (language === null) {
    lang = navigator.language.split('-')[0];

    if (lang in languageDataStore) {
      language = lang;
    } else {
      language = 'en';
    }
  } else {
    lang = language;
  }

  // random id for the component to be able to retrieve the right DOM
  // element in case of emulated clients
  const launcherId = `launcher-${parseInt(Math.random() * 1e6)}`;

  render(html`
    <sw-launcher
      id="${launcherId}"
    ></sw-launcher>
  `, $container);

  const $launcher = document.querySelector(`#${launcherId}`);

  client.pluginManager.onStateChange(async (plugins, _updatedPlugin) => {
    const languageData = languageDataStore[language];

    // then check if we have some platform plugin registered
    let platformInit = null;

    for (let instance of Object.values(plugins)) {
      if (instance.type === ClientPluginPlatformInitClassName) {
        platformInit = instance;
      }
    }

    if (platformInit && platformInit.status !== 'started') {
      const pluginTexts = languageData['PluginPlatformInit'];
      const common = languageData.common;
      const localizedTexts = Object.assign({}, pluginTexts, common);

      $launcher.setScreen(html`
        <sw-plugin-platform-init
          localized-texts="${JSON.stringify(localizedTexts)}"
          .client="${client}"
          .plugin="${platformInit}"
        ></sw-plugin-platform-init>
      `);

      return;
    }

    let position = null;

    for (let instance of Object.values(plugins)) {
      if (instance.type === ClientPluginPositionClassName) {
        position = instance;
      }
    }

    if (position && position.status !== 'started') {
      const pluginTexts = languageData['PluginPosition'];
      const common = languageData.common;
      const localizedTexts = Object.assign({}, pluginTexts, common);

      $launcher.setScreen(html`
        <sw-plugin-position
          localized-texts="${JSON.stringify(localizedTexts)}"
          .client="${client}"
          .plugin="${position}"
        ></sw-plugin-position>
      `);

      return;
    }

    // then show default plugin screen until all started
    let allStarted = true;

    for (let name in plugins) {
      if (plugins[name].status !== 'started') {
        allStarted = false;
      }
    }

    if (allStarted) {
      // all started, remove &launcher view
      $launcher.parentNode.removeChild($launcher);
      return;
    } else {
      // pick the first non started plugin and push it in default view
      let plugin = null;

      for (let instance of Object.values(plugins)) {
        if (instance.status !== 'started') {
          plugin = instance;
          break;
        }
      }

      const pluginTexts = languageData[plugin.type];
      const common = languageData.common;
      const localizedTexts = Object.assign({}, pluginTexts, common);

      $launcher.setScreen(html`
        <sw-plugin-default
          localized-texts="${JSON.stringify(localizedTexts)}"
          .client="${client}"
          .plugin="${plugin}"
        ></sw-plugin-default>
      `);

      return;
    }
  });
}

function initQoS(client, reloadOnVisibilityChange, reloadOnSocketError) {
  if (reloadOnVisibilityChange) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // differ by a few milliseconds, as the event is triggered before the change
        // see. https://github.com/collective-soundworks/soundworks/issues/42
        setTimeout(() => window.location.reload(true), 50);
      }
    }, false);
  }

  // the "real" sockets are created at the beginning of the `client.init` step
  // but the event listener system is already ready to use
  //
  // @note: most of the time this should be set to `true` but it may be handy
  // to disable this behavior for debugging / development purposes
  if (reloadOnSocketError) {
    // give some time for the server to relaunch in dev mode
    client.socket.addListener('close', () => {
      setTimeout(() => window.location.reload(true), 500);
    });

    client.socket.addListener('error', () => {
      setTimeout(() => window.location.reload(true), 500);
    });
  }
}

/**
 * Launcher for clients running in browser runtime.
 *
 * @example
 * import launcher from '@soundworks/helpers/browser.js'
 */
const browserLauncher = {
  /**
   * Set the language to be used in the initialization screens.
   *
   * By default, picks language from the browser and fallback to english if not
   * supported. For now, available languages are 'fr' and 'en'.
   *
   * @type {string}
   */
  get language() {
    return language;
  },

  set language(lang) {
    if (!(lang in languageDataStore)) {
      throw new Error(`Cannot execute 'set' on launcher: no data available for language "${lang}"`);
    }

    language = lang;
  },

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
  async execute(bootstrap, {
    numClients = 1,
    width = '20%',
    height = '500px',
  } = {}) {
    const $container = document.body;
    $container.classList.remove('loading');
    // override container style so that emulated client are rendered horizontally
    // $container.style.

    // special logic for emulated clients (1 click to rule them all)
    if (numClients > 1) {
      // @note - we use raw lit-html and style injection to avoid problems
      // with shadow DOM, scoped styles and so on... As this is a development
      // tool only, we don't really care of hardcoding things here
      $container.classList.add('emulated');

      const style = document.createElement('style');
      style.innerText = `
        body.emulated {
          display: flex;
          flex-direction: row;
        }

        .emulated-client-container {
          float: left;
          width: ${width};
          min-width: 300px;
          height: ${height};
          outline: 1px solid #aaaaaa;
          position: relative;
          overflow: auto;
          display: flex;
        }

        .emulated-clients-init-all {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 10;
          width: 100%;
          height: 100%;
          background-color: rgba(45, 45, 45, 0.6);
          color: white;
          text-align: center;
          font-size: 2rem;
          cursor: pointer;
        }

        .emulated-clients-init-all p {
          line-height: 100px;
          max-width: 400px;
          margin: 200px auto;
          background-color: rgba(0, 0, 0, 1);
          border: 1px solid #454545;
          border-radius: 2px;
          box-shadow: 0px 0px 2px 0px #787878;
        }
      `;

      document.querySelector('head').appendChild(style);

      // create the containers before bootstrapping clients
      // we also create the start button now and remove it later
      render(html`
        <div class="emulated-clients-init-all" style="display: none">
          <p>click to start</p>
        </div>
        ${Array(numClients).fill(null).map(() => {
          return html`<div class="emulated-client-container"></div>`;
        })}
      `, $container);

      const $startButton = $container.querySelector('.emulated-clients-init-all');
      const $containers = $container.querySelectorAll('.emulated-client-container');

      // bootstrap all clients
      Array.from($containers).forEach($container => bootstrap($container));

      // clients are now registered, i.e.  `launcher.register(client);` has been called
      // check if @soundworks/plugin-platform-init plugins have been registered
      const platformInitPromises = Array.from(clients).map(client => {
        return new Promise(resolve => {
          const unsubscribe = client.pluginManager.onStateChange(plugins => {
            unsubscribe();

            for (let [_id, plugin] of Object.entries(plugins)) {
              if (plugin.type === ClientPluginPlatformInitClassName) {
                resolve(plugin);
              }
            }

            resolve(null);
          });
        });
      });

      const pluginOrNull = await Promise.all(platformInitPromises);
      const platformInitPlugins = pluginOrNull.filter(e => e !== null);

      // if platform plugins found, show the big "rule them all" button
      if (platformInitPlugins.length > 0) {
        $startButton.style.display = 'block';

        function launchPlatformInitPlugins(e) {
          platformInitPlugins.forEach(plugin => plugin.onUserGesture(e));

          $startButton.removeEventListener('click', launchPlatformInitPlugins);
          $startButton.remove();
        }

        $startButton.addEventListener('click', launchPlatformInitPlugins);
      } else {
        $startButton.remove();
      }
    } else {
      bootstrap($container);
    }
  },

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
  register(client, {
    initScreensContainer = null,
    reloadOnVisibilityChange = true,
    reloadOnSocketError = true,
  } = {}) {
    // record the clients into the launcher, so that we can click / initialize
    // them all at once if needed, i.e. if the PlatformInit plugin is registered
    clients.add(client);

    if (!(initScreensContainer instanceof HTMLElement)) {
      throw new Error(`[@soundowrks/helpers] the "initScreenContainer" option of "launcher.register(client, options) should be an instance of DOMElement`);
    }

    // render init views
    renderLaunchScreens(client, initScreensContainer);
    // basic "QoS" strategies
    initQoS(client, reloadOnVisibilityChange, reloadOnSocketError);
  },

  /**
   * Set the text to be used for a given language. Allows to override an existing
   * language as well as define a new one.
   *
   * @param {string} lang - Key corresponding to the language (e.g. 'fr', 'en', 'es')
   * @param {object} data - Key/value pairs defining the text strings to be used.
   */
  setLanguageData(lang, data) {
    languageDataStore[lang] = data;
  },

  /**
   * Retrieve the data for a given language.
   *
   * @param {string} lang - Key corresponding to the language (e.g. 'fr', 'en', 'es')
   */
  getLanguageData(lang = null) {
    if (lang !== null) {
      if (!(lang in languageDataStore)) {
        throw new Error(`[soundworks:helpers] Undefined language data for "${lang}"`);
      }

      return languageDataStore[lang];
    } else {
      return languageDataStore;
    }
  },
};

export default browserLauncher;
