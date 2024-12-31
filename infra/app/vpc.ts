import { getSubnets } from './lib/cidr';
import { config } from './config';

const subnets = getSubnets(config.cidrBlock, 24);

export const vpc = new sst.aws.Vpc('Vpc', {
  bastion: process.env.SST_DEV === 'true',
  transform: {
    bastionInstance: {
      instanceType: 't4g.nano',
    },
    vpc: {
      cidrBlock: config.cidrBlock,
      ipv4IpamPoolId: config.ipv4IpamPoolId,
    },
    publicSubnet: (args, _, name) => {
      const index = parseInt(name.split('PublicSubnet')[1], 10);
      args.cidrBlock = subnets[index];
    },
    privateSubnet: (args, _, name) => {
      const index = parseInt(name.split('PrivateSubnet')[1], 10);
      args.cidrBlock = subnets[subnets.length - index];
    },
  },
});
