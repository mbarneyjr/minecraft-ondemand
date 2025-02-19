import { ECS, RunTaskCommand } from '@aws-sdk/client-ecs';
import { Resource } from 'sst';

export class Mapsync {
  static #ecs: ECS | null = null;

  static ecs(): ECS {
    if (!Mapsync.#ecs) {
      const endpoint = `https://ecs--us-east-2--amazonaws--com.${Resource.Ipv6ProxyLink.domainName}`;
      Mapsync.#ecs = new ECS({ endpoint });
    }
    return Mapsync.#ecs;
  }

  static async startMapsync() {
    const clusterArn = Resource.VanillaServiceLink.vanillaCluster;
    const launchType = 'FARGATE';
    const taskDefinition = Resource.VanillaServiceLink.vanillaMapTaskDefinition;
    const subnets = Resource.VanillaServiceLink.vanillaSubnets;
    const securityGroup = Resource.VanillaServiceLink.vanillaSecurityGroup;
    const assignPublicIp = 'ENABLED';

    const response = await this.ecs().send(
      new RunTaskCommand({
        cluster: clusterArn,
        launchType: launchType,
        taskDefinition: taskDefinition,
        networkConfiguration: {
          awsvpcConfiguration: {
            subnets: subnets,
            securityGroups: [securityGroup],
            assignPublicIp: assignPublicIp,
          },
        },
      }),
    );
  }
}
