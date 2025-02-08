import { join } from 'path';
import { readFileSync } from 'fs';
import YAML from 'yaml';
import { containerDefinitions } from '../container-definition';
import { config, providers } from '../../config';
import { identity, region } from '../../data';
import { backupBucket, datasyncLogs, datasyncRole } from '../../backup';
import { vpc } from '../../vpc';
import { ipv6Proxy } from '../../ipv6-proxy';
import { configLink, email, mountPathLink, oidcLink, table } from '../../site';

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
  backup: boolean;
};

export class MinecraftService {
  id: string;
  serviceName: string;

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
    this.id = args.id;
    const serviceName = `${$app.name}-${$app.stage}-${args.id}`;
    const taskName = `${$app.name}-${$app.stage}-${args.id}`;
    this.serviceName = serviceName;
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
    if (args.backup) {
      this.#createBackup(name, args, {
        serviceName,
        accessPoint: this.accessPoint,
      });
    }
    this.#createNotifier(name, args, {
      serviceName,
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
            SERVICE_ID: args.id,
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
              {
                Effect: 'Allow',
                Action: ['events:PutEvents'],
                Resource: $interpolate`arn:aws:events:${region.name}:${identity.accountId}:event-bus/default`,
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

  #createBackup(
    name: string,
    args: MinecraftServiceArgs,
    options: {
      serviceName: string;
      accessPoint: aws.efs.AccessPoint;
    },
  ) {
    const s3Location = new aws.datasync.S3Location(`${name}S3Location`, {
      s3BucketArn: backupBucket.arn,
      s3StorageClass: 'STANDARD',
      s3Config: {
        bucketAccessRoleArn: datasyncRole.arn,
      },
      subdirectory: `/${args.id}`,
    });

    const securityGroupArns = $util.output(vpc.securityGroups).apply((sgs) => {
      return sgs.map((sg) => $interpolate`arn:aws:ec2:${region.name}:${identity.accountId}:security-group/${sg}`);
    });

    const efsLocation = new aws.datasync.EfsLocation(`${name}EfsLocation`, {
      accessPointArn: options.accessPoint.arn,
      subdirectory: '/',
      ec2Config: {
        subnetArn: $util
          .output(vpc.privateSubnets[0])
          .apply((subnetId) => `arn:aws:ec2:${region.name}:${identity.accountId}:subnet/${subnetId}`),
        securityGroupArns,
      },
      efsFileSystemArn: options.accessPoint.fileSystemArn,
      fileSystemAccessRoleArn: datasyncRole.arn,
      inTransitEncryption: 'TLS1_2',
    });

    const backupTask = new aws.datasync.Task(`${name}Backup`, {
      name: $interpolate`${options.serviceName}-backup`,
      sourceLocationArn: efsLocation.arn,
      destinationLocationArn: s3Location.arn,
      cloudwatchLogGroupArn: datasyncLogs.arn,
      schedule: {
        scheduleExpression: 'cron(0 0 ? * SUN *)',
      },
      options: {
        preserveDeletedFiles: 'REMOVE',
        logLevel: 'TRANSFER',
      },
    });

    const restoreTask = new aws.datasync.Task(`${name}Restore`, {
      name: $interpolate`${options.serviceName}-restore`,
      sourceLocationArn: s3Location.arn,
      destinationLocationArn: efsLocation.arn,
      cloudwatchLogGroupArn: datasyncLogs.arn,
      options: {
        preserveDeletedFiles: 'REMOVE',
        logLevel: 'TRANSFER',
      },
    });
  }

  #createNotifier(
    name: string,
    args: MinecraftServiceArgs,
    options: {
      serviceName: string;
    },
  ) {
    const notifier = new sst.aws.Function(`${name}Notifier`, {
      handler: 'packages/user-notifier/src/handler.lambdaHandler',
      link: [configLink, email, table, ipv6Proxy, oidcLink, mountPathLink],
      permissions: [
        {
          actions: ['ses:SendBulkEmail'],
          resources: ['*'],
        },
      ],
    });
    new aws.lambda.Permission(`${name}Notifier`, {
      statementId: 'AllowEventsInvoke',
      action: 'lambda:InvokeFunction',
      function: notifier.name,
      principal: 'events.amazonaws.com',
    });
    const rule = new aws.cloudwatch.EventRule(`${name}Notifier`, {
      name: `${options.serviceName}-notifier`,
      eventPattern: JSON.stringify({
        source: ['minecraft-ondemand'],
        detailType: ['ServiceListening'],
      }),
    });
    new aws.cloudwatch.EventTarget(`${name}Notifier`, {
      rule: rule.name,
      arn: notifier.arn,
    });
  }
}
