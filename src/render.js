const AWS = require('aws-sdk');

const ecs = new AWS.ECS();

const taskDefinition = process.env.TASK_DEFINITION;
const cluster = process.env.ECS_CLUSTER;
const subnets = process.env.SUBNETS?.split(',');
const securityGroups = process.env.SECURITY_GROUPS?.split(',');

exports.renderHandler = async (event, context) => {
  console.log(`Event: ${JSON.stringify(event)}`);

  if (!taskDefinition || !cluster || !subnets || !securityGroups) throw new Error('TASK_DEFINITION, ECS_CLUSTER, SUBNETS, or SECURITY_GROUPS not set');

  console.log(`Listing tasks: ${JSON.stringify({
    cluster,
    family: taskDefinition.split(':')[5],
    desiredStatus: 'RUNNING',
  })}`)
  const runningTasks = await ecs.listTasks({
    cluster,
    family: taskDefinition.split(':')[5].split('/')[1],
    desiredStatus: 'RUNNING',
  }).promise();
  console.log(`Running tasks: ${JSON.stringify(runningTasks)}`);

  if (runningTasks.taskArns.length > 0) {
    console.log('Task already running');
  } else {
    console.log('Running task');
    await ecs.runTask({
      cluster,
      taskDefinition,
      count: 1,
      capacityProviderStrategy: [{
        capacityProvider: 'FARGATE',
        base: 0,
        weight: 1,
      }],
      platformVersion: 'LATEST',
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: 'ENABLED',
          subnets,
          securityGroups,
        },
      },
    }).promise();
  }

  return {
    statusCode: 200,
    body: 'task run',
  };
};
