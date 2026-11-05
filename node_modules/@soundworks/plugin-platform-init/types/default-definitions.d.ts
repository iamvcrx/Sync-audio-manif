declare const _default: {
    'web-audio': {
        aliases: string[];
        check: (_plugin: any, _featureId: any, audioContext: any) => Promise<boolean>;
        activate: (plugin: any, featureId: any, audioContext: any) => Promise<boolean>;
    };
    '@ircam/devicemotion': {
        aliases: string[];
        check: (plugin: any, featureId: any, _devicemotion: any) => Promise<void>;
        activate: (plugin: any, featureId: any, devicemotion: any) => Promise<boolean>;
    };
    microphone: {
        aliases: string[];
        check: (plugin: any, featureId: any, _options: any) => Promise<boolean>;
        activate: (plugin: any, featureId: any, options: any) => Promise<boolean>;
    };
    camera: {
        check: (plugin: any, featureId: any, _options: any) => Promise<boolean>;
        activate: (plugin: any, featureId: any, options: any) => Promise<boolean>;
    };
};
export default _default;
//# sourceMappingURL=default-definitions.d.ts.map