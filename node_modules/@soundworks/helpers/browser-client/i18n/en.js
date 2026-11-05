export default {
  common: {
    sorry: 'Sorry,',
    defaultInited: 'Initializing', // ${plugin.id}
    defaultErrored: 'An error occured while initializing', // ${plugin.id}
  },
  PluginPlatformInit: {
    initializing: 'Initializing...',
    click: 'Click to start',
    activating: 'Activating...',
    finalizing: 'Finalizing...',
    checkError: 'The device is not compatible with the application',
    activateError: 'An error occured while initializing the application',
  },
  PluginPosition: {
    selectPosition: 'Please, select your position',
    sendButton: 'Send',
  },
  // default plugin view
  // if inited or errored are defined they will be used as message,
  // else use common.defaultInited and/or common.defaultErrored
  PluginSync: {
    inited: 'Synchronizing',
  },
  PluginAudioBufferLoader: {
    inited: 'Loading sound files',
  },
  PluginCheckin: {
    errored: 'No place left, try again later',
  },
};
