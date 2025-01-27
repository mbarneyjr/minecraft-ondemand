import { join } from 'path';
import { readFileSync } from 'fs';
import YAML from 'yaml';
import { containerDefinitions } from '../container-definition';
import { config, providers } from '../../config';
import { identity, region } from '../../data';

type MinecraftServiceArgs = {
  id: string;
  displayName: string;
  hostedZone: aws.route53.Zone;
  domainName: string;
  cluster: aws.ecs.Cluster;
  fileSystem: aws.efs.FileSystem;
  vpc: sst.aws.Vpc;
  cpu: number;
  memory: number;
  environmentConfig: Record<string, string | undefined>;
};

export class MinecraftService {
  resourceName: string;
  domainName: string;
  hostedZone: aws.route53.Zone;
  securityGroup: aws.ec2.SecurityGroup;
  accessPoint: aws.efs.AccessPoint;
  executionRole: aws.iam.Role;
  taskRole: aws.iam.Role;
  service: aws.ecs.Service;
  taskDefinition: aws.ecs.TaskDefinition;
  addFileLambda: sst.aws.Function;

  constructor(name: string, args: MinecraftServiceArgs) {
    const serviceName = `${$app.name}-${$app.stage}-${args.id}`;
    const taskName = `${$app.name}-${$app.stage}-${args.id}`;
    this.resourceName = name;
    this.domainName = args.domainName;
    this.hostedZone = args.hostedZone;

    this.accessPoint = this.#createAccessPoint(name, args);
    this.securityGroup = this.#createSecurityGroup(name, args);
    const { executionRole, taskRole } = this.#createServiceRoles(name, args, {
      serviceName,
      accessPoint: this.accessPoint,
    });
    this.executionRole = executionRole;
    this.taskRole = taskRole;
    const { service, taskDefinition } = this.#createService(name, args, {
      serviceName,
      taskName,
      executionRole: this.executionRole,
      taskRole: this.taskRole,
      fileSystem: args.fileSystem,
      accessPoint: this.accessPoint,
      securityGroup: this.securityGroup,
    });
    this.service = service;
    this.taskDefinition = taskDefinition;
    this.#registerDnsTrigger(name, args, {
      cluster: args.cluster,
      service: this.service,
    });
    this.addFileLambda = this.#createAddFileLambda(name, args, {
      accessPoint: this.accessPoint,
    });
  }

  addFile(path: string, data: $util.Input<string>) {
    new aws.lambda.Invocation(`${this.resourceName}:${path}`, {
      functionName: this.addFileLambda.name,
      input: $jsonStringify({
        path,
        data,
      }),
      lifecycleScope: 'CRUD',
    });
  }

  #createAddFileLambda(
    name: string,
    args: MinecraftServiceArgs,
    options: {
      accessPoint: aws.efs.AccessPoint;
    },
  ) {
    return new sst.aws.Function(`${name}AddFileLambda`, {
      dev: false,
      handler: 'packages/efs-file/src/handler.lambdaHandler',
      volume: { efs: options.accessPoint.arn, path: '/mnt/efs' },
      vpc: {
        privateSubnets: args.vpc.privateSubnets,
        securityGroups: args.vpc.securityGroups,
      },
    });
  }

  #registerDnsTrigger(
    name: string,
    args: MinecraftServiceArgs,
    options: {
      cluster: aws.ecs.Cluster;
      service: aws.ecs.Service;
    },
  ) {
    new aws.ssm.Parameter(
      `${name}DnsTriggerParams`,
      {
        name: `/${$app.name}/${$app.stage}/trigger-params/${args.domainName}`,
        type: 'String',
        value: $jsonStringify({
          cluster: options.cluster.arn,
          service: options.service.id, // service.id is the arn
        }),
      },
      {
        provider: providers.useast1,
      },
    );
  }

  #createService(
    name: string,
    args: MinecraftServiceArgs,
    options: {
      serviceName: string;
      taskName: string;
      executionRole: aws.iam.Role;
      taskRole: aws.iam.Role;
      fileSystem: aws.efs.FileSystem;
      accessPoint: aws.efs.AccessPoint;
      securityGroup: aws.ec2.SecurityGroup;
    },
  ) {
    const minecraftLogGroup = new aws.cloudwatch.LogGroup(`${name}GameLogGroup`, {
      name: `/${$app.name}/${$app.stage}/${args.id}/game`,
    });

    const watchdogLogGroup = new aws.cloudwatch.LogGroup(`${name}WatchdogLogGroup`, {
      name: `/${$app.name}/${$app.stage}/${args.id}/watchdog`,
    });

    // filter out undefined values
    const appEnvironment: Record<string, string> = {};
    for (const key in args.environmentConfig) {
      if (args.environmentConfig[key]) {
        appEnvironment[key] = args.environmentConfig[key]!;
      }
    }

    const taskDefinition = new aws.ecs.TaskDefinition(`${name}TaskDefinition`, {
      family: options.taskName,
      executionRoleArn: options.executionRole.arn,
      taskRoleArn: options.taskRole.arn,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: args.cpu.toString(),
      memory: args.memory.toString(),
      volumes: [
        {
          name: args.id,
          efsVolumeConfiguration: {
            transitEncryption: 'ENABLED',
            fileSystemId: options.fileSystem.id,
            authorizationConfig: {
              accessPointId: options.accessPoint.id,
              iam: 'ENABLED',
            },
          },
        },
      ],
      containerDefinitions: containerDefinitions([
        {
          name: `${$app.name}-${$app.stage}-${args.id}-game`,
          image: 'itzg/minecraft-server',
          essential: false,
          portMappings: [
            {
              containerPort: 25565,
              hostPort: 25565,
              protocol: 'tcp',
            },
          ],
          environment: appEnvironment,
          mountPoints: [
            {
              containerPath: '/data',
              sourceVolume: args.id,
              readOnly: false,
            },
          ],
          logGroupName: minecraftLogGroup.name,
        },
        {
          name: `${$app.name}-${$app.stage}-${args.id}-watchdog`,
          image: config.watchdogImage,
          essential: true,
          environment: {
            CLUSTER: args.cluster.name,
            SERVICE: options.serviceName,
            SERVERNAME: args.domainName,
            DNSZONE: args.hostedZone.id,
            STARTUPMIN: '10',
            SHUTDOWNMIN: '20',
          },
          logGroupName: watchdogLogGroup.name,
        },
      ]),
    });

    const service = new aws.ecs.Service(`${name}Service`, {
      name: options.serviceName,
      cluster: args.cluster.arn,
      desiredCount: 0,
      taskDefinition: taskDefinition.arn,
      enableEcsManagedTags: true,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE',
          base: 1,
          weight: 1,
        },
      ],
      platformVersion: 'LATEST',
      networkConfiguration: {
        assignPublicIp: true,
        subnets: args.vpc.publicSubnets,
        securityGroups: [options.securityGroup.id],
      },
    });

    return {
      service,
      taskDefinition,
    };
  }

  #createSecurityGroup(name: string, args: MinecraftServiceArgs) {
    return new aws.ec2.SecurityGroup(`${name}SecurityGroup`, {
      vpcId: args.vpc.id,
      name: `${$app.name}-${$app.stage}-${args.id}`,
      description: 'Service security group',
      egress: [
        {
          cidrBlocks: ['0.0.0.0/0'],
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
        },
      ],
      ingress: [
        {
          cidrBlocks: ['0.0.0.0/0'],
          protocol: 'tcp',
          fromPort: 25565,
          toPort: 25565,
        },
      ],
    });
  }

  #createAccessPoint(name: string, args: MinecraftServiceArgs) {
    return new aws.efs.AccessPoint(`${name}AccessPoint`, {
      fileSystemId: args.fileSystem.id,
      tags: {
        name: `${$app.name}-${$app.stage}-${args.id}`,
      },
      posixUser: {
        uid: 1000,
        gid: 1000,
      },
      rootDirectory: {
        path: `/${args.id}`,
        creationInfo: {
          ownerUid: 1000,
          ownerGid: 1000,
          permissions: '0777',
        },
      },
    });
  }

  #createServiceRoles(
    name: string,
    args: MinecraftServiceArgs,
    options: {
      serviceName: string;
      accessPoint: aws.efs.AccessPoint;
    },
  ) {
    const executionRole = new aws.iam.Role(`${name}ExecutionRole`, {
      name: `${$app.name}-${$app.stage}-${args.id}-ecs-execution`,
      assumeRolePolicy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      managedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'],
    });
    const taskRole = new aws.iam.Role(`${name}TaskRole`, {
      name: `${$app.name}-${$app.stage}-${args.id}-ecs-task`,
      assumeRolePolicy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      inlinePolicies: [
        {
          name: 'task-permissions',
          policy: $jsonStringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'elasticfilesystem:ClientMount',
                  'elasticfilesystem:ClientWrite',
                  'elasticfilesystem:DescribeFileSystems',
                ],
                Resource: [args.fileSystem.arn],
                Condition: {
                  StringEquals: {
                    'elasticfilesystem:AccessPointArn': options.accessPoint.arn,
                  },
                },
              },
              {
                Effect: 'Allow',
                Action: ['ecs:*'],
                Resource: [
                  $interpolate`arn:aws:ecs:${region.name}:${identity.accountId}:service/${args.cluster.name}/${options.serviceName}`,
                  $interpolate`arn:aws:ecs:${region.name}:${identity.accountId}:task/${args.cluster.name}/*`,
                ],
              },
              {
                Effect: 'Allow',
                Action: 'ec2:DescribeNetworkInterfaces',
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['route53:GetHostedZone', 'route53:ChangeResourceRecordSets', 'route53:ListResourceRecordSets'],
                Resource: $interpolate`arn:aws:route53:::hostedzone/${args.hostedZone.id}`,
              },
            ],
          }),
        },
      ],
    });

    return {
      executionRole,
      taskRole,
    };
  }
}
