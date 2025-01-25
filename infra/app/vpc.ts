import { getIpv4Subnets, getIpv6Subnets } from './lib/cidr';
import { config } from './config';

const subnets = getIpv4Subnets(config.cidrBlock, 24);
const ipv6Subnets = getIpv6Subnets(config.ipv6CidrBlock, 64);

export const vpc = new sst.aws.Vpc('Vpc', {
  bastion: true,
  transform: {
    bastionInstance: {
      instanceType: 't4g.nano',
      tags: {
        Name: $interpolate`${$app.name}-${$app.stage}-bastion`,
      },
    },
    vpc: {
      cidrBlock: config.cidrBlock,
      ipv4IpamPoolId: config.ipv4IpamPoolId,
      ipv6CidrBlock: config.ipv6CidrBlock,
      ipv6IpamPoolId: config.ipv6IpamPoolId,
    },
    publicSubnet: (args, opts, name) => {
      const index = parseInt(name.split('PublicSubnet')[1], 10);
      args.cidrBlock = subnets[index];
      args.ipv6CidrBlock = ipv6Subnets[index];
      args.assignIpv6AddressOnCreation = true;
    },
    privateSubnet: (args, _, name) => {
      const index = parseInt(name.split('PrivateSubnet')[1], 10);
      args.cidrBlock = subnets[subnets.length - index];
      args.ipv6CidrBlock = ipv6Subnets[ipv6Subnets.length - index];
      args.assignIpv6AddressOnCreation = true;
    },
  },
});

const egressOnlyIgw = new aws.ec2.EgressOnlyInternetGateway('EgressOnlyIgw', {
  vpcId: vpc.id,
  tags: {
    Name: $interpolate`${$app.name}-${$app.stage}`,
  },
});
new aws.ec2.SecurityGroupRule('Ipv6EgressAll', {
  type: 'egress',
  securityGroupId: vpc.nodes.securityGroup.id,
  fromPort: -1,
  toPort: -1,
  protocol: '-1',
  ipv6CidrBlocks: ['::/0'],
});

$util.all([vpc.nodes.privateRouteTables]).apply(([routeTables]) => {
  for (let i = 0; i < routeTables.length; i++) {
    new aws.ec2.Route(`EgressOnlyIgwRoutePrivate${i}`, {
      destinationIpv6CidrBlock: '::/0',
      egressOnlyGatewayId: egressOnlyIgw.id,
      routeTableId: routeTables[i].id,
    });
  }
});
$util.all([vpc.nodes.publicRouteTables]).apply(([routeTables]) => {
  for (let i = 0; i < routeTables.length; i++) {
    new aws.ec2.Route(`IgwRoutePublic${i}`, {
      destinationIpv6CidrBlock: '::/0',
      gatewayId: vpc.nodes.internetGateway.id,
      routeTableId: routeTables[i].id,
    });
  }
});

new aws.ec2transitgateway.InstanceState('BastionState', {
  instanceId: vpc.bastion,
  state: process.env.SST_DEV === 'true' ? 'running' : 'stopped',
});
