import { isPlainObject } from '@ircam/sc-utils';

// keys:
// - alias, optional aliased id
// - `check`: executed on start, before userGesture
// - `activate`: executed on userGesture

export default {
  // resume audio context
  'web-audio': {
    aliases: ['webaudio', 'audio-context', 'audioContext'],
    check: function(_plugin, _featureId, audioContext) {
      if (!audioContext || !(audioContext instanceof AudioContext)) {
        throw new TypeError(`Cannot execute 'check' for 'web-audio' feature: Argument must be an instance of AudioContext`);
      }

      return Promise.resolve(!!audioContext);
    },
    activate: async function(plugin, featureId, audioContext) {
      // Just implement a dummy resume for very old devices. Probably not needed
      // anymore, as even Safari implements that, but doesn't hurt
      if (!('resume' in audioContext)) {
        audioContext.resume = () => {
          return Promise.resolve();
        };
      }

      await audioContext.resume();

      if (plugin.state.infos.mobile) {
        const g = audioContext.createGain();
        g.connect(audioContext.destination);
        g.gain.value = 0.000000001; // -180dB

        const o = audioContext.createOscillator();
        o.connect(g);
        o.frequency.value = 20;
        o.start(0);

        // prevent android from stopping audio by keeping the oscillator active
        if (plugin.state.infos.os !== 'android') {
          o.stop(audioContext.currentTime + 0.01);
        }

        // in iPhones, sampleRate has been observed to be set at 16000Hz sometimes,
        // causing clicks and noise. Let's just assume < 40000 is a bad value.
        if (plugin.state.infos.os === 'ios') {
          if (audioContext.sampleRate < 40000) {
            window.location.reload(true);
          }
        }
      }

      plugin._features[featureId] = audioContext;

      return Promise.resolve(true);
    },
  },
  '@ircam/devicemotion': {
    aliases: ['devicemotion', 'device-motion'],
    check: async function(plugin, featureId, _devicemotion) {
      if (window.location.protocol === 'http:') {
        console.warn(`The '${featureId}' feature has been requested, but the page is accessed through the "http" protocol. Be aware that access to '${featureId}' requires a secure "https" context (except for localhost)`);
      }
    },
    activate: async function(plugin, featureId, devicemotion) {
      const result = await devicemotion.requestPermission();

      if (result === 'granted') {
        plugin._features[featureId] = devicemotion;
      }

      return (result === 'granted' ? true : false);
    },
  },
  // access to microphone
  'microphone': {
    aliases: ['mic', 'micro'],
    check: async function(plugin, featureId, _options) {
      if (window.location.protocol === 'http:') {
        console.warn(`The '${featureId}' feature has been requested, but the page is accessed through the "http" protocol. Be aware that access to '${featureId}' requires a secure "https" context (except for localhost)`);
      }

      return !!navigator.mediaDevices.getUserMedia;
    },
    activate: async function(plugin, featureId, options) {
      try {
        // remove all pre-processing by default
        let config = {
          echoCancellation: false,
          noiseReduction: false,
          autoGainControl: false,
        };

        if (isPlainObject(options)) {
          Object.assign(config, options);
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: config });
        plugin._features[featureId] = stream;

        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
    },
  },
  // access to microphone
  'camera': {
    check: async function(plugin, featureId, _options) {
      if (window.location.protocol === 'http:') {
        console.warn(`The '${featureId}' feature has been requested, but the page is accessed through the "http" protocol. Be aware that access to '${featureId}' requires a secure "https" context (except for localhost)`);
      }

      return !!navigator.mediaDevices.getUserMedia;
    },
    activate: async function(plugin, featureId, options) {
      try {
        let config = true;

        if (isPlainObject(options)) {
          config = options;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: config });
        plugin._features[featureId] = stream;

        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
    },
  },
};
