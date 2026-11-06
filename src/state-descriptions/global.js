export default {
  triggerId: {
    type: 'integer',
    default: 0,
  },
  startTime: {
    type: 'float',
    default: -1,
  },
  masterVolume: {
    type: 'float',
    min: 0,
    max: 1,
    default: 1,
  },
  masterMute: {
    type: 'boolean',
    default: false,
  },
  selectedFile: {
    type: 'string',
    default: 'The Hanging Tree - Hunger Games.mp3',
  },
  playbackState: {
    type: 'string',
    default: 'paused',
  },
  playbackStartTime: {
    type: 'float',
    default: -1,
  },
  playbackPosition: {
    type: 'float',
    min: 0,
    default: 0,
  },
  playbackCommandId: {
    type: 'integer',
    default: 0,
  },
};
