import { rootAccessPoint } from './efs';
import { vpc } from './vpc';
import { region, identity } from './data';

export const backupBucket = new aws.s3.Bucket('Backup', {
  bucket: $interpolate`${$app.name}-${$app.stage}-backup`,
  versioning: {
    enabled: true,
  },
});
new aws.s3.BucketOwnershipControls('Backup', {
  bucket: backupBucket.bucket,
  rule: {
    objectOwnership: 'BucketOwnerEnforced',
  },
});

const datasyncRole = new aws.iam.Role('DataSyncRole', {
  name: $interpolate`${$app.name}-${$app.stage}-datasync`,
  assumeRolePolicy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          Service: 'datasync.amazonaws.com',
        },
        Action: 'sts:AssumeRole',
      },
    ],
  },
  managedPolicyArns: ['arn:aws:iam::aws:policy/AmazonElasticFileSystemClientFullAccess'],
  inlinePolicies: [
    {
      name: 'datasync',
      policy: backupBucket.arn.apply((arn) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetBucketLocation', 's3:ListBucket', 's3:ListBucketMultipartUploads', 's3:HeadBucket'],
              Resource: arn,
            },
            {
              Effect: 'Allow',
              Action: [
                's3:AbortMultipartUpload',
                's3:DeleteObject',
                's3:GetObject',
                's3:ListMultipartUploadParts',
                's3:PutObject',
              ],
              Resource: `${arn}/*`,
            },
          ],
        }),
      ),
    },
  ],
});

const s3Location = new aws.datasync.S3Location('S3Location', {
  s3BucketArn: backupBucket.arn,
  s3StorageClass: 'STANDARD',
  s3Config: {
    bucketAccessRoleArn: datasyncRole.arn,
  },
  subdirectory: '/efs',
});

const securityGroupArns = $util.output(vpc.securityGroups).apply((sgs) => {
  return sgs.map((sg) => $interpolate`arn:aws:ec2:${region.name}:${identity.accountId}:security-group/${sg}`);
});
const efsLocation = new aws.datasync.EfsLocation('EfsLocation', {
  accessPointArn: rootAccessPoint.arn,
  subdirectory: '/',
  ec2Config: {
    subnetArn: $util
      .output(vpc.privateSubnets[0])
      .apply((subnetId) => `arn:aws:ec2:${region.name}:${identity.accountId}:subnet/${subnetId}`),
    securityGroupArns,
  },
  efsFileSystemArn: rootAccessPoint.fileSystemArn,
  fileSystemAccessRoleArn: datasyncRole.arn,
  inTransitEncryption: 'TLS1_2',
});

const datasyncLogs = new aws.cloudwatch.LogGroup('Datasync', {
  name: $interpolate`/aws/vendedlogs/datasync/${$app.name}-${$app.stage}`,
});

const backupTask = new aws.datasync.Task('Backup', {
  name: $interpolate`${$app.name}-${$app.stage}-backup`,
  sourceLocationArn: efsLocation.arn,
  destinationLocationArn: s3Location.arn,
  cloudwatchLogGroupArn: datasyncLogs.arn,
  options: {
    preserveDeletedFiles: 'REMOVE',
    logLevel: 'TRANSFER',
  },
});

const restoreTask = new aws.datasync.Task('Restore', {
  name: $interpolate`${$app.name}-${$app.stage}-restore`,
  sourceLocationArn: s3Location.arn,
  destinationLocationArn: efsLocation.arn,
  cloudwatchLogGroupArn: datasyncLogs.arn,
  options: {
    preserveDeletedFiles: 'REMOVE',
    logLevel: 'TRANSFER',
  },
});
