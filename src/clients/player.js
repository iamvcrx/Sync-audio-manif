import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';
import ClientPluginCheckin from '@soundworks/plugin-checkin/client.js';
import ClientPluginPlatformInit from '@soundworks/plugin-platform-init/client.js';
import ClientPluginSync from '@soundworks/plugin-sync/client.js';

async function main($container) {
  const config = loadConfig();
  const audioContext = new AudioContext();
  const client = new Client(config);

  client.pluginManager.register('platform-init', ClientPluginPlatformInit, { audioContext });
  client.pluginManager.register('sync', ClientPluginSync, {
    getTimeFunction: () => audioContext.currentTime,
  }, ['platform-init']);
  client.pluginManager.register('checkin', ClientPluginCheckin);
  launcher.register(client, { initScreensContainer: $container });

  await client.start();
  const sync = await client.pluginManager.get('sync');
  const checkin = await client.pluginManager.get('checkin');
  const global = await client.stateManager.attach('global');
  const audit = await client.getAuditState();
  const index = checkin.getIndex();
  let playerCount = audit.get('numClients').player || 0;

  const output = audioContext.createGain();
  const playerGain = audioContext.createGain();
  const masterGain = audioContext.createGain();
  playerGain.connect(masterGain);
  masterGain.connect(output);
  output.connect(audioContext.destination);

  let buffer;
  let loadedFile;
  let source;
  let localVolume = 1;
  let lastCommandId = global.get('playbackCommandId');
  let renderApp = () => {};

  const setGains = () => {
    playerGain.gain.value = localVolume;
    masterGain.gain.value = global.get('masterMute') ? 0 : global.get('masterVolume');
  };
  const stopSource = () => {
    if (!source) {
      return;
    }
    const currentSource = source;
    source = null;
    currentSource.onended = null;
    currentSource.stop();
    currentSource.disconnect();
  };
  const scheduleTrigger = () => {
    if (!buffer || global.get('playbackState') !== 'playing') {
      return;
    }
    stopSource();
    const startTime = global.get('playbackStartTime');
    const localStart = sync.getLocalTime(startTime);
    const now = audioContext.currentTime;
    const startAt = Math.max(now, localStart);
    const offset = Math.max(0, startAt - localStart + global.get('playbackPosition'));
    if (offset >= buffer.duration) {
      return;
    }
    const scheduledSource = audioContext.createBufferSource();
    scheduledSource.buffer = buffer;
    scheduledSource.connect(playerGain);
    scheduledSource.start(startAt, offset);
    source = scheduledSource;
    scheduledSource.onended = () => {
      if (source === scheduledSource) {
        source = null;
      }
    };
  };

  global.onUpdate(async (updates) => {
    if ('selectedFile' in updates) {
      await loadBuffer(updates.selectedFile);
    }
    if ('playbackCommandId' in updates && updates.playbackCommandId !== lastCommandId) {
      lastCommandId = updates.playbackCommandId;
      if (global.get('playbackState') === 'playing') {
        scheduleTrigger();
      } else {
        stopSource();
      }
    }
    if ('playbackState' in updates && updates.playbackState === 'paused') {
      stopSource();
    }
    if ('masterVolume' in updates || 'masterMute' in updates) {
      setGains();
    }
  });

  async function loadBuffer(fileName) {
    if (loadedFile === fileName) {
      return;
    }
    stopSource();
    buffer = null;
    try {
      const response = await fetch(`/assets/${encodeURIComponent(fileName)}`);
      if (!response.ok) {
        throw new Error(`Impossible de charger ${fileName} (${response.status})`);
      }
      buffer = await audioContext.decodeAudioData(await response.arrayBuffer());
      loadedFile = fileName;
      renderApp();
      if (global.get('playbackState') === 'playing') {
        scheduleTrigger();
      }
    } catch (error) {
      loadedFile = null;
      console.error(error);
    }
  }

  try {
    await loadBuffer(global.get('selectedFile'));
  } catch (error) {
    console.error(error);
  }

  renderApp = () => {
    const playbackState = global.get('playbackState');
    const selectedFile = global.get('selectedFile');
    render(html`
    <div class="app">
      <header>
        <p class="eyebrow">Faisons entendre nos ${playerCount} voix !</p>
        <h1>Voix ${index+1}</h1>
        <p>Votre appareil va servir d'enceinte synchronisée avec le reste de la manifestation. Veuillez retirer le mode silencieux et monter le volume.</p>
        <p>En cas de problème (pas de son, décalage temporel...), rechargez la page.</p>
      </header>
      <section class="card">
        <h2>État général</h2>
        <p class="playback-state">${playbackState === 'playing' ? '▶ Lecture en cours' : 'Ⅱ En pause'}</p>
        <p class="track-name"> Vous allez diffuser l'audio : ${selectedFile}</p>
      </section>
      <section class="card">
        <h2>Volume personnel</h2>
        <label>
          <input id="volume" type="range" min="0" max="1" step="0.01" .value="${localVolume}" />
        </label>
        <p class="status">${buffer ? 'Fichier prêt' : 'Chargement du fichier…'}</p>
      </section>
    </div>
    `, $container);
    $container.querySelector('#volume').addEventListener('input', (event) => {
      localVolume = Number(event.target.value);
      setGains();
    });
  };

  global.onUpdate((updates) => {
    if ('selectedFile' in updates || 'playbackState' in updates || 'playbackCommandId' in updates) {
      renderApp();
    }
  });
  audit.onUpdate((updates) => {
    if ('numClients' in updates) {
      playerCount = updates.numClients.player || 0;
      renderApp();
    }
  });

  setGains();
  renderApp();
}

launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate') || '') || 1,
});
