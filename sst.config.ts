/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'minecraft-ondemand',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
    };
  },
  async run() {
    const infra = await import('./infra/app');
    return {
      vanilla: infra.vanillaService.domainName,
    };
  },
});
