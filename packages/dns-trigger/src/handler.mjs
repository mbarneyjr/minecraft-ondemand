import { Resource } from 'sst';
import { gunzipSync } from 'zlib';
import { ECS, DescribeServicesCommand, UpdateServiceCommand } from '@aws-sdk/client-ecs';
import { SSM, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssm = new SSM();
const ecs = new ECS({
  region: Resource.TargetRegion.name,
});

/** @type {import('aws-lambda').CloudWatchLogsHandler} event */
export async function lambdaHandler(event, context) {
  console.log(`raw event: ${JSON.stringify(event)}`);
  /** @type {import('aws-lambda').CloudWatchLogsDecodedData} */
  const logData = JSON.parse(gunzipSync(Buffer.from(event.awslogs.data, 'base64')).toString());
  console.log(`parsed event: ${JSON.stringify(logData)}`);
  return await runService(logData);
}

/**
 * @param {import('aws-lambda').CloudWatchLogsDecodedData} logData
 */
async function runService(logData) {
  /** @type {Record<string, { cluster: string, service: string }>} */
  const services = {};
  for (const logEvent of logData.logEvents) {
    console.log(`parsing log event: ${JSON.stringify(logEvent)}`);
    const serviceDomainName = logEvent.message.split('_minecraft._tcp.')[1]?.split(' ')[0];
    if (!serviceDomainName) {
      throw new Error(`could not parse domain name from log message: ${logEvent.message}`);
    }
    const parameter = await ssm.send(
      new GetParameterCommand({
        Name: `/${Resource.App.name}/${Resource.App.stage}/trigger-params/${serviceDomainName}`,
      }),
    );
    if (!parameter.Parameter?.Value) {
      throw new Error(`could not find parameter for domain name: ${serviceDomainName}`);
    }
    const parsed = JSON.parse(parameter.Parameter.Value);
    if (!parsed.cluster || !parsed.service) {
      throw new Error(`invalid parameter for domain name: ${serviceDomainName}`);
    }
    services[parsed.service] = parsed;
  }

  console.log('starting services', JSON.stringify(services));

  for (const { cluster, service } of Object.values(services)) {
    const response = await ecs.send(
      new DescribeServicesCommand({
        cluster,
        services: [service],
      }),
    );
    console.log(`Service description: ${JSON.stringify(response)}`);
    const desired = response?.services?.[0]?.desiredCount;
    if (desired === undefined) throw new Error('No ECS service found');

    if (desired === 0) {
      console.log('Starting ECS service');
      await ecs.send(
        new UpdateServiceCommand({
          cluster,
          service,
          desiredCount: 1,
        }),
      );
    } else {
      console.log('ECS service  already running');
    }
  }
}
