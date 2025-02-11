import { Resource } from 'sst';
import { ECS, DescribeServicesCommand, UpdateServiceCommand } from '@aws-sdk/client-ecs';

export class Service {
  static #ecs: ECS | null = null;

  static ecs(): ECS {
    if (!Service.#ecs) {
      const endpoint = `https://ecs--us-east-2--amazonaws--com.${Resource.Ipv6Proxy.domainName}`;
      Service.#ecs = new ECS({ endpoint });
    }
    return Service.#ecs;
  }

  static async getStatus() {
    const services = await Service.ecs().send(
      new DescribeServicesCommand({
        cluster: `${Resource.App.name}-${Resource.App.stage}`,
        services: [`${Resource.App.name}-${Resource.App.stage}-vanilla`],
      }),
    );
    const service = services.services?.[0];
    if (!service) return null;
    if ((service.desiredCount ?? 0) < 1) {
      if ((service.runningCount ?? 0) < 1) {
        return 'stopped';
      }
      return 'stopping';
    } else {
      if ((service.runningCount ?? 0) < 1) {
        return 'starting';
      }
      return 'running';
    }
  }

  static async startService() {
    const response = await Service.ecs().send(
      new UpdateServiceCommand({
        cluster: `${Resource.App.name}-${Resource.App.stage}`,
        service: `${Resource.App.name}-${Resource.App.stage}-vanilla`,
        desiredCount: 1,
      }),
    );
  }

  static async stopService() {
    const response = await Service.ecs().send(
      new UpdateServiceCommand({
        cluster: `${Resource.App.name}-${Resource.App.stage}`,
        service: `${Resource.App.name}-${Resource.App.stage}-vanilla`,
        desiredCount: 0,
      }),
    );
  }
}
