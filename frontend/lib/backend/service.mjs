import { Ecs } from '../aws/ecs.mjs';
import { config } from '../config/index.mjs';

export async function getServiceDetails() {
  const response = await Ecs.describeServices(config.service.cluster, [config.service.service]);
  const service = response?.services?.[0];
  if (!service) {
    throw new Error(`No service found for ${config.service.service} in cluster ${config.service.cluster}`);
  }
  /** @type {'off' | 'starting' | 'on'} */
  let status = 'off';
  if ((service.desiredCount ?? 0) !== 0) {
    if ((service.pendingCount ?? 0) > 0) {
      status = 'starting';
    } else if ((service.runningCount ?? 0) > 0) {
      status = 'on';
    }
  }

  return {
    status,
  };
}

export async function stopService() {
  const response = await Ecs.describeServices(config.service.cluster, [config.service.service]);
  const service = response?.services?.[0];
  if (!service) {
    throw new Error(`No service found for ${config.service.service} in cluster ${config.service.cluster}`);
  }
  if ((service.desiredCount ?? 0) !== 0) {
    await Ecs.updateService(config.service.cluster, config.service.service, 0);
  }
}

export async function startService() {
  const response = await Ecs.describeServices(config.service.cluster, [config.service.service]);
  const service = response?.services?.[0];
  if (!service) {
    throw new Error(`No service found for ${config.service.service} in cluster ${config.service.cluster}`);
  }
  if ((service.desiredCount ?? 0) === 0) {
    await Ecs.updateService(config.service.cluster, config.service.service, 1);
  }
}
