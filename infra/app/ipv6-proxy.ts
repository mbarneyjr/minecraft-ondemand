import { config, providers } from './config';
import { zone } from './data';

const proxyDomainName = $interpolate`ipv6.${config.rootDomainName}`;
const wildcardDomainName = $interpolate`*.ipv6.${config.rootDomainName}`;

const originRewriteFunction = new aws.cloudfront.Function('OriginRewrite', {
  name: $interpolate`${$app.name}-${$app.stage}-origin-rewrite`,
  runtime: 'cloudfront-js-2.0',
  comment: 'Rewrite origin to proxy ipv6',
  code: [
    "import cf from 'cloudfront';",
    'async function handler(event) {',
    '  console.log(JSON.stringify(event))',
    '  const hostValue = event.request.headers.host.value.toLowerCase();',
    "  const target = hostValue.split('.')[0];",
    "  const endpoint = target.replace(/--/g, '.');",
    "  console.log(JSON.stringify({ message: 'changing origin', newOrigin: endpoint }));",
    '  cf.updateRequestOrigin({',
    '      domainName: endpoint,',
    '  });',
    '  return event.request;',
    '}',
  ].join('\n'),
});

const cert = new sst.aws.DnsValidatedCertificate(
  'Ipv6ProxyCert',
  {
    domainName: proxyDomainName,
    alternativeNames: $util.output([wildcardDomainName]),
    dns: sst.aws.dns({
      zone: zone.id,
    }),
  },
  {
    provider: providers.useast1,
  },
);
const proxy = new aws.cloudfront.Distribution('Ipv6Proxy', {
  enabled: true,
  isIpv6Enabled: true,
  comment: 'ipv6 proxy',
  httpVersion: 'http2',
  aliases: [proxyDomainName, wildcardDomainName],
  viewerCertificate: {
    acmCertificateArn: cert.arn,
    sslSupportMethod: 'sni-only',
    minimumProtocolVersion: 'TLSv1.2_2019',
  },
  origins: [
    {
      originId: 'proxy',
      domainName: 'ec2.us-east-1.amazonaws.com',
      customOriginConfig: {
        originProtocolPolicy: 'https-only',
        originSslProtocols: ['SSLv3', 'TLSv1'],
        httpPort: 80,
        httpsPort: 443,
      },
    },
  ],
  restrictions: {
    geoRestriction: {
      restrictionType: 'none',
    },
  },
  defaultCacheBehavior: {
    targetOriginId: 'proxy',
    viewerProtocolPolicy: 'redirect-to-https',
    cachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // caching disabled
    originRequestPolicyId: '216adef6-5c7f-47e4-b989-5492eafa07d3', // AllViewer,
    allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'POST', 'DELETE'],
    cachedMethods: ['GET', 'HEAD'],
    functionAssociations: [
      {
        eventType: 'viewer-request',
        functionArn: originRewriteFunction.arn,
      },
    ],
  },
});
const dnsRecordIpv4 = new aws.route53.Record('Ipv6ProxyDnsRecordIpv4', {
  name: proxyDomainName,
  type: 'A',
  zoneId: zone.id,
  aliases: [
    {
      name: proxy.domainName,
      zoneId: proxy.hostedZoneId,
      evaluateTargetHealth: false,
    },
  ],
});
const wildcardDnsRecordIpv4 = new aws.route53.Record('Ipv6ProxyWildcardDnsRecordIpv4', {
  name: wildcardDomainName,
  type: 'A',
  zoneId: zone.id,
  aliases: [
    {
      name: proxy.domainName,
      zoneId: proxy.hostedZoneId,
      evaluateTargetHealth: false,
    },
  ],
});
const dnsRecord = new aws.route53.Record('Ipv6ProxyDnsRecord', {
  name: proxyDomainName,
  type: 'AAAA',
  zoneId: zone.id,
  aliases: [
    {
      name: proxy.domainName,
      zoneId: proxy.hostedZoneId,
      evaluateTargetHealth: false,
    },
  ],
});
const wildcardDnsRecord = new aws.route53.Record('Ipv6ProxyWildcardDnsRecord', {
  name: wildcardDomainName,
  type: 'AAAA',
  zoneId: zone.id,
  aliases: [
    {
      name: proxy.domainName,
      zoneId: proxy.hostedZoneId,
      evaluateTargetHealth: false,
    },
  ],
});

export const ipv6Proxy = new sst.Linkable('Ipv6Proxy', {
  properties: {
    domainName: proxyDomainName,
  },
});
