import { ECSClient, DescribeServicesCommand, UpdateServiceCommand } from '@aws-sdk/client-ecs';

export class Ecs {
  /** @type {ECSClient | null} */
  static _ecsClient = null;

  /* c8 ignore start */
  static getEcsClient() {
    if (Ecs._ecsClient) return Ecs._ecsClient;
    const ecsClient = new ECSClient();
    Ecs._ecsClient = ecsClient;
    return ecsClient;
  }
  /* c8 ignore end */

  /**
   * @param {string} cluster
   * @param {string[]} services
   */
  static describeServices = async (cluster, services) => {
    const client = Ecs.getEcsClient();
    return client.send(
      new DescribeServicesCommand({
        cluster,
        services,
      }),
    );
  };

  /**
   * @param {string} cluster
   * @param {string} service
   * @param {number} desiredCount
   */
  static updateService = async (cluster, service, desiredCount) => {
    const client = Ecs.getEcsClient();
    return client.send(
      new UpdateServiceCommand({
        cluster,
        service,
        desiredCount,
      }),
    );
  };
}
