/**
 * Load configuration from files located in `/config` directory
 *
 * @param {String} [ENV='default'] - Name of the environment corresponding to the
 *  `config/env-${name}.{yaml|json}` file.
 * @param {String} [callerURL=null] - Module url of the calling file, used to
 *  automatically retrieve the `role` of node clients.
 * @return {ClientConfig|ServerConfig}
 */
export default function nodeLoadConfig(ENV?: string, callerURL?: string): ClientConfig | ServerConfig;
//# sourceMappingURL=load-config.d.ts.map