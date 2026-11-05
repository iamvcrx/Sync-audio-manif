import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';
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
  launcher.register(client, {
    initScreensContainer: $container,
    reloadOnVisibilityChange: false,
  });

  await client.start();
  const sync = await client.pluginManager.get('sync');
  const global = await client.stateManager.attach('global');
  const audit = await client.getAuditState();
  const output = audioContext.createGain();
  output.connect(audioContext.destination);
  let buffer;
  let loadedFile;
  let source;
  let lastCommandId = global.get('playbackCommandId');

  const setGain = () => {
    output.gain.value = global.get('masterMute') ? 0 : global.get('masterVolume');
  };
  const stopSource = () => {
    if (!source) {
      return;
    }
    source.stop();
    source.disconnect();
    source = null;
  };
  const scheduleTrigger = () => {
    if (!buffer || global.get('playbackState') !== 'playing') {
      return;
    }
    stopSource();
    const localStart = sync.getLocalTime(global.get('playbackStartTime'));
    const now = audioContext.currentTime;
    const offset = Math.max(0, now - localStart + global.get('playbackPosition'));
    if (offset >= buffer.duration) {
      return;
    }
    const scheduledSource = audioContext.createBufferSource();
    scheduledSource.buffer = buffer;
    scheduledSource.connect(output);
    scheduledSource.start(Math.max(now, localStart), offset);
    source = scheduledSource;
    scheduledSource.onended = () => {
      if (source === scheduledSource) {
        source = null;
      }
    };
  };
  const loadBuffer = async (fileName) => {
    if (loadedFile === fileName) {
      return;
    }
    stopSource();
    buffer = null;
    const response = await fetch(`/assets/${encodeURIComponent(fileName)}`);
    if (!response.ok) {
      throw new Error(`Impossible de charger ${fileName} (${response.status})`);
    }
    buffer = await audioContext.decodeAudioData(await response.arrayBuffer());
    loadedFile = fileName;
    scheduleTrigger();
  };
  const filesResponse = await fetch('/audio-files.json');
  if (!filesResponse.ok) {
    throw new Error(`Impossible de charger la liste audio (${filesResponse.status})`);
  }
  const audioFiles = await filesResponse.json();
  let playerCount = audit.get('numClients').player || 0;

  const renderApp = () => {
    const isPlaying = global.get('playbackState') === 'playing';
    render(html`
    <div class="app">
      <header>
        <p class="eyebrow">Soundworks · Controller</p>
        <h1>Audio Controller</h1>
        <p>Le controller joue aussi le son et pilote tous les players connectés.</p>
      </header>
      <section class="card">
        <h2>Lecture</h2>
        <label>Fichier audio
          <select id="audio-file">
            ${audioFiles.map((file) => html`<option value="${file.name}" ?selected="${file.name === global.get('selectedFile')}">${file.label}</option>`)}
          </select>
        </label>
        <button id="play-pause" class="primary">${isPlaying ? 'Ⅱ Pause' : '▶ Play'}</button>
        <p>${isPlaying ? 'Lecture synchronisée en cours.' : 'Lecture en pause.'}</p>
      </section>
      <section class="card">
        <h2>Players connectés</h2>
        <p class="player-count">${playerCount}</p>
      </section>
      <section class="card">
        <h2>Master</h2>
        <label>Volume global
          <input id="master-volume" type="range" min="0" max="1" step="0.01" .value="${global.get('masterVolume')}" />
        </label>
        <button id="master-mute">${global.get('masterMute') ? 'Réactiver tous les players' : 'Muter tous les players'}</button>
      </section>
    </div>
    `, $container);

    $container.querySelector('#audio-file').addEventListener('change', async (event) => {
      await global.set({
        selectedFile: event.target.value,
        playbackState: 'paused',
        playbackPosition: 0,
        playbackCommandId: global.get('playbackCommandId') + 1,
      });
    });
    $container.querySelector('#play-pause').addEventListener('click', async () => {
      const now = sync.getSyncTime();
      const currentlyPlaying = global.get('playbackState') === 'playing';
      const currentPosition = currentlyPlaying
        ? Math.max(0, now - global.get('playbackStartTime'))
        : global.get('playbackPosition');
      await global.set({
        playbackState: currentlyPlaying ? 'paused' : 'playing',
        playbackPosition: currentPosition,
        playbackStartTime: currentlyPlaying ? global.get('playbackStartTime') : now + 0.5 - currentPosition,
        playbackCommandId: global.get('playbackCommandId') + 1,
      });
    });
    $container.querySelector('#master-volume').addEventListener('input', (event) => {
      global.set({ masterVolume: Number(event.target.value) });
    });
    $container.querySelector('#master-mute').addEventListener('click', async () => {
      await global.set({ masterMute: !global.get('masterMute') });
      renderApp();
    });
  };

  global.onUpdate((updates) => {
    if ('selectedFile' in updates) {
      loadBuffer(updates.selectedFile).catch((error) => console.error(error));
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
      setGain();
    }
    if ('masterVolume' in updates || 'masterMute' in updates || 'selectedFile' in updates || 'playbackState' in updates) {
      renderApp();
    }
  });
  audit.onUpdate((updates) => {
    if ('numClients' in updates) {
      playerCount = updates.numClients.player || 0;
      renderApp();
    }
  });
  await loadBuffer(global.get('selectedFile'));
  setGain();
  renderApp();
}

launcher.execute(main, {
  numClients: 1,
  width: '100%',
});
