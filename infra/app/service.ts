import { join } from 'path';
import { readFileSync } from 'fs';
import { zone } from './data';
import { config } from './config';
import { vpc } from './vpc';
import { efs, fileSystem, rootAccessPoint } from './efs';
import { containerDefinitions } from './lib/container-definition';
import { MinecraftService } from './lib/components/minecraft-service';

export const cluster = new aws.ecs.Cluster('Cluster', {
  name: `${$app.name}-${$app.stage}`,
});

new aws.ecs.ClusterCapacityProviders('ClusterCapacityProviders', {
  capacityProviders: ['FARGATE'],
  clusterName: cluster.name,
});

export const vanillaService = new MinecraftService('Vanilla', {
  id: 'vanilla',
  displayName: 'Vanilla',
  domainName: config.rootDomainName,
  hostedZone: zone,
  cpu: config.cpu,
  memory: config.memory,
  environmentConfig: {
    EULA: 'TRUE',
    TYPE: 'PAPER',
    OVERRIDE_SERVER_PROPERTIES: 'true',
    VERSION: '1.21.4',
    MOTD: config.motd,
    SEED: config.seed,
    DIFFICULTY: 'hard',
    SPAWN_PROTECTION: '0',
    OPS: config.ops.join(','),
    MEMORY: `${config.memory / 1024 - 2}G`,
    USE_AIKAR_FLAGS: 'true',
    VIEW_DISTANCE: '24',
    SPIGET_RESOURCES: [
      '81534', // chunky, chunk pre-loader
    ].join(','),
    ENABLE_WHITELIST: 'true',
  },
  vpc,
  fileSystem,
  cluster,
  backup: true,
  map: true,
});

export const services = [vanillaService];

export const vanillaServiceLink = new sst.Linkable('VanillaServiceLink', {
  properties: {
    vanillaId: vanillaService.id,
    vanillaDomainName: vanillaService.domainName,
    vanillaSecurityGroup: vanillaService.securityGroup.id,
    vanillaCluster: cluster.arn,
    vanillaTaskDefinition: vanillaService.taskDefinition.arn,
    vanillaSubnets: vanillaService.vpc.publicSubnets,
    vanillaMapTaskDefinition: vanillaService.mapTaskDefinition?.arn,
  },
});
