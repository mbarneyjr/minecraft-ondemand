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
    securityGroup: (args, _, name) => {
      if (args.egress) {
        args.egress = $util.output(args.egress).apply((egress) => {
          return [
            ...egress,
            {
              fromPort: 0,
              toPort: 0,
              protocol: '-1',
              ipv6CidrBlocks: ['::/0'],
            },
          ];
        });
      }
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
    publicRouteTable: (args, _, name) => {
      const index = parseInt(name.split('PublicRouteTable')[1], 10);
      if (args.routes) {
        args.routes = $util.output(args.routes).apply((routes) => {
          return [
            ...routes,
            {
              ipv6CidrBlock: '::/0',
              egressOnlyGatewayId: $util.output(egressOnlyIgw.id),
            },
          ];
        });
      }
    },
    privateRouteTable: (args, _, name) => {
      const index = parseInt(name.split('PrivateRouteTable')[1], 10);
      if (args.routes) {
        args.routes = $util.output(args.routes).apply((routes) => {
          return [
            ...routes,
            {
              ipv6CidrBlock: '::/0',
              egressOnlyGatewayId: $util.output(egressOnlyIgw.id),
            },
          ];
        });
      }
    },
  },
});

const egressOnlyIgw = new aws.ec2.EgressOnlyInternetGateway('EgressOnlyIgw', {
  vpcId: vpc.id,
  tags: {
    Name: $interpolate`${$app.name}-${$app.stage}`,
  },
});

new aws.ec2transitgateway.InstanceState('BastionState', {
  instanceId: vpc.bastion,
  state: process.env.SST_DEV === 'true' ? 'running' : 'stopped',
});
