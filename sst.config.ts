/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: 'minecraft-ondemand',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
      providers: { random: '4.16.8' },
    };
  },
  async run() {
    const infra = await import('./infra/app');
    const services = infra.service.services.reduce((acc, service) => {
      return Object.assign(acc, { [service.id]: service.domainName });
    }, {});
    return {
      ...services,
    };
  },
});
