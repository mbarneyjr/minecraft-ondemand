import { ClusterServiceArgs } from '../../.sst/platform/src/components/aws';

const ipv4IpamPoolId = 'ipam-pool-012b363a9923156ca';
const ipv6IpamPoolId = 'ipam-pool-0ba13c470bd1131dc';

const baseDomainName = 'mc.barney.dev';

type Config = {
  ipv4IpamPoolId?: string;
  ipv6IpamPoolId?: string;
  cidrBlock: string;
  ipv6CidrBlock: string;
  cpu: number;
  memory: number;
  seed?: string;
  motd: string;
  ops: string[];
  watchdogImage: string;
  hostedZoneName: string;
  rootDomainName: string;
};

const envMap: Record<string, Partial<Config>> = {
  prod: {
    ipv4IpamPoolId,
    ipv6IpamPoolId,
    cidrBlock: '10.64.0.0/16',
    ipv6CidrBlock: '2600:1f26:17:c000::/56',
    seed: '-7390720122552741106',
    motd: '\u00a7bWelcome to the\u00a7e Salty Spatoon\u00a7r\n\u00a7oHow tough are ya?',
    hostedZoneName: `${baseDomainName}`,
    rootDomainName: `${baseDomainName}`,
  },
  qa: {
    ipv4IpamPoolId,
    ipv6IpamPoolId,
    cidrBlock: '10.65.0.0/16',
    ipv6CidrBlock: '2600:1f26:17:c100::/56',
    seed: '-7390720122552741106',
    motd: '\u00a7bWelcome to the\u00a7e Salty Spatoon\u00a7r\n\u00a7oHow tough are ya?',
    hostedZoneName: `qa.${baseDomainName}`,
    rootDomainName: `qa.${baseDomainName}`,
  },
  dev: {
    ipv4IpamPoolId,
    ipv6IpamPoolId,
    cidrBlock: '10.66.0.0/16',
    ipv6CidrBlock: '2600:1f26:17:c200::/56',
    seed: '-7390720122552741106',
    motd: '\u00a7bWelcome to the\u00a7e Salty Spatoon\u00a7r\n\u00a7oHow tough are ya?',
    hostedZoneName: `dev.${baseDomainName}`,
    rootDomainName: `dev.${baseDomainName}`,
  },
};

const defaultConfig: Config = {
  cidrBlock: '10.67.0.0/16',
  ipv6IpamPoolId,
  ipv6CidrBlock: '2600:1f26:17:cf00::/56',
  cpu: 2048,
  memory: 16 * 1024,
  motd: 'Minecraft On-Demand',
  ops: ['Lexicham', 'Lexicam'],
  watchdogImage: '512329539140.dkr.ecr.us-east-2.amazonaws.com/minecraft-ondemand-watchdog:0.0.1',
  hostedZoneName: process.env.HOSTED_ZONE_NAME ?? `dev.${baseDomainName}`,
  rootDomainName: process.env.DOMAIN_NAME ?? `${$app.stage}.dev.${baseDomainName}`,
};

const config: Config = Object.assign(defaultConfig, envMap[$app.stage]);

const providers = {
  useast1: new aws.Provider('useast1', {
    region: 'us-east-1',
  }),
};

export { config, providers };
