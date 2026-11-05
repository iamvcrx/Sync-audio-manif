import { ClientPlugin } from '@soundworks/core/client.js';

/**
 * Client-side representation of the check-in plugin.
 *
 * The constructor should never be called manually. The plugin will be
 * automatically instantiated when registered in the `pluginManager`.
 */
export default class ClientPluginCheckin extends ClientPlugin {
  #state = {
    index: null,
    data: null,
  };

  /** @hideconstructor */
  constructor(client, id, options) {
    super(client, id);

    const defaults = {};

    this.options = Object.assign(defaults, options);
  }

  /** @private */
  async start() {
    await super.start();

    return new Promise((resolve, reject) => {
      this.client.socket.addListener(`sw:plugin:${this.id}:res`, async (index, data) => {
        if (index === null) {
          reject(new DOMException(`Cannot execute 'start' on PluginCheckinClient: No index available`, 'IndexSizeError'));
        } else {
          this.#state.index = index;
          this.#state.data = data;
          resolve();
        }
      });

      this.client.socket.send(`sw:plugin:${this.id}:req`);
    });
  }

  /**
   * Return the unique index given to the client
   * @return {number}
   */
  getIndex() {
    return this.#state.index;
  }

  /**
   * Return the associated data given to the client (if any)
   * @return {any}
   */
  getData() {
    return this.#state.data;
  }
}

