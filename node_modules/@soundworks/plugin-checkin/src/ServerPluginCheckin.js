import { ServerPlugin } from '@soundworks/core/server.js';

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
export default class ServerPluginCheckin extends ServerPlugin {
  #availableIndices = []; // array of available indices
  #nextAscendingIndex = 0; // next index when #availableIndices is empty
  #clientIndexMap = new Map();

  /** @hideconstructor */
  constructor(server, id, options = {}) {
    super(server, id);

    const defaults = {
      order: 'ascending', // do not document, let's see if someone needs it
      capacity: Infinity,
      data: [],
    };

    this.options = Object.assign(defaults, options);

    if (this.options.order !== 'ascending' && this.options.order !== 'random') {
      throw new TypeError(`Cannot construct 'PluginCheckinServer': Invalid "order" option value (${this.options.order}), valid values are "ascending" or "random"`);
    }

    if (options.capacity < 1) {
      throw new TypeError(`Cannot construct 'PluginCheckinServer': Invalid "capacity" option value (${this.options.capacity}), must be strictly positive or Infinity`);
    }

    // clamp capacity to given data
    const numData = this.options.data.length > 0 ? this.options.data.length : Infinity;

    if (numData < this.options.capacity) {
      this.options.capacity = Math.min(this.options.capacity, numData);
      console.warn(`[${this.name}] capacity cropped to number of data: ${numData}`);
    }

    if (this.options.order === 'random' && this.options.capacity === Infinity) {
      throw new Error(`Cannot construct 'PluginCheckinServer': "capacity" option must be finite when "order" is set to "random"`);
    }
  }

  /** @private */
  async start() {
    await super.start();
  }

  /** @private */
  async stop()  {
    await super.stop();
  }

  /** @private */
  addClient(client) {
    super.addClient(client);

    client.socket.addListener(`sw:plugin:${this.id}:req`, () => {
      client.socket.removeAllListeners(`sw:plugin:${this.id}:req`);

      let index = null;
      let datum = null;

      if (this.options.order === 'random') {
        index = this.#getRandomIndex();
      } else {
        index = this.#getAscendingIndex();
      }

      if (index !== null && this.options.data[index]) {
        datum = this.options.data[index];
      }

      this.#clientIndexMap.set(client, index);

      client.socket.send(`sw:plugin:${this.id}:res`, index, datum);
    });
  }

  /** @private */
  removeClient(client) {
    const index = this.#clientIndexMap.get(client);
    this.#clientIndexMap.delete(client);
    this.#releaseIndex(index);

    super.removeClient(client);
  }

  /** @private */
  #getRandomIndex() {
    for (let i = this.#nextAscendingIndex; i < this.options.capacity; i++) {
      this.#availableIndices.push(i);
    }

    this.#nextAscendingIndex = this.options.capacity;
    const numAvailable = this.#availableIndices.length;

    if (numAvailable > 0) {
      const random = Math.floor(Math.random() * numAvailable);
      return this.#availableIndices.splice(random, 1)[0];
    }

    return null;
  }

  /** @private */
  #getAscendingIndex() {
    if (this.#availableIndices.length > 0) {
      this.#availableIndices.sort((a, b) => a - b);
      return this.#availableIndices.splice(0, 1)[0];
    } else if (this.#nextAscendingIndex < this.options.capacity) {
      return this.#nextAscendingIndex++;
    }

    return null;
  }

  /** @private */
  #releaseIndex(index) {
    if (Number.isInteger(index)) {
      this.#availableIndices.push(index);
    }
  }
}
