import { config, providers } from './config';
import { cluster } from './service';

const identity = await aws.getCallerIdentity();
const region = await aws.getRegion();

const targetRegionLinkable = new sst.Linkable('TargetRegion', {
  properties: {
    name: region.id,
  },
});
export const dnsTrigger = new sst.aws.Function(
  'DnsTrigger',
  {
    dev: false,
    handler: 'packages/dns-trigger/src/handler.lambdaHandler',
    link: [targetRegionLinkable],
    timeout: '30 seconds',
    permissions: [
      {
        actions: ['ecs:DescribeServices', 'ecs:UpdateService'],
        resources: [$interpolate`arn:aws:ecs:${region.id}:${identity.accountId}:service/${cluster.name}/*`],
      },
      {
        actions: ['ssm:GetParameter'],
        resources: [
          $interpolate`arn:aws:ssm:us-east-1:${identity.accountId}:parameter/${$app.name}/${$app.stage}/trigger-params/*`,
        ],
      },
    ],
  },
  {
    provider: providers.useast1,
  },
);

const dnsTriggerLambdaPermission = new aws.lambda.Permission(
  'DnsTriggerLambdaPermission',
  {
    function: dnsTrigger.name,
    action: 'lambda:InvokeFunction',
    principal: 'logs.amazonaws.com',
    sourceArn: $interpolate`arn:aws:logs:us-east-1:${identity.accountId}:log-group:/aws/route53/${config.hostedZoneName}.:*`,
  },
  {
    provider: providers.useast1,
  },
);

const dnsTriggerSubscriptionFilter = new aws.cloudwatch.LogSubscriptionFilter(
  'DnsTriggerSubscriptionFilter',
  {
    logGroup: `/aws/route53/${config.hostedZoneName}.`,
    filterPattern: '"_minecraft._tcp"',
    destinationArn: dnsTrigger.arn,
  },
  {
    provider: providers.useast1,
    dependsOn: [dnsTriggerLambdaPermission],
  },
);
