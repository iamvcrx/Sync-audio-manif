export default {
  common: {
    sorry: 'Désolé,',
    defaultInited: 'Initialisation de', // ${plugin.id}
    defaultErrored: `Une erreur est survenue pendant l'initialisation de`, // ${plugin.id}
  },
  PluginPlatformInit: {
    initializing: 'Initialisation...',
    click: `Cliquez pour démarrer`,
    activating: 'Activation...',
    finalizing: 'Finalisation...',
    checkError: `L'appareil n'est pas compatible avec l'application`,
    activateError: `Une erreur est survenue pendant l'initialisation de l'application`,
  },
  PluginPosition: {
    selectPosition: 'Merci de sélectionner votre position',
    sendButton: 'Envoyer',
  },
  // default plugin view
  // if `inited` or `errored` are defined they will be used as message,
  // else use common.defaultInited and/or common.defaultErrored
  PluginSync: {
    inited: 'Synchonisation',
  },
  PluginAudioBufferLoader: {
    inited: 'Chargement des fichiers audio',
  },
  PluginCheckin: {
    errored: `Aucune place disponible, merci d'essayer plus tard`,
  },
};
