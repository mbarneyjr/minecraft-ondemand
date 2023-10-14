/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
const AWS = require('aws-sdk');

const ecs = new AWS.ECS();

const ecsCluster = process.env.ECS_CLUSTER;
const ecsService = process.env.ECS_SERVICE;

/**
 * @param {import('aws-lambda').APIGatewayProxyEventV2} event
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResultV2>}
 */
exports.triggerHandler = async (event) => {
  console.log(`Event: ${JSON.stringify(event)}`);

  if (!ecsCluster || !ecsService) throw new Error('ECS_CLUSTER or ECS_SERVICE are not set');

  const response = await ecs
    .describeServices({
      cluster: ecsCluster,
      services: [ecsService],
    })
    .promise();
  console.log(`Service description: ${JSON.stringify(response)}`);

  const desired = response?.services?.[0]?.desiredCount;
  if (desired === undefined) throw new Error('No ECS service found');

  if (desired === 0) {
    console.log('Starting ECS service');
    await ecs
      .updateService({
        cluster: ecsCluster,
        service: ecsService,
        desiredCount: 1,
      })
      .promise();
  } else {
    console.log('ECS service  already running');
  }

  return {
    statusCode: 200,
    body: 'service starting',
  };
};
