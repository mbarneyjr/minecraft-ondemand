import { fileSystem, rootAccessPoint } from './efs';
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

export const datasyncLogs = new aws.cloudwatch.LogGroup('Datasync', {
  name: $interpolate`/aws/vendedlogs/datasync/${$app.name}-${$app.stage}`,
});

const datasyncLogsResourcePolicy = new aws.cloudwatch.LogResourcePolicy('Datasync', {
  policyName: $interpolate`${$app.name}-${$app.stage}-datasync`,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          Service: 'datasync.amazonaws.com',
        },
        Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        Resource: $interpolate`${datasyncLogs.arn}:*`,
        Condition: {
          StringEquals: {
            'aws:SourceAccount': identity.accountId,
          },
        },
      },
    ],
  },
});

export const datasyncRole = new aws.iam.Role('DataSyncRole', {
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
      policy: $util.all([backupBucket.arn, datasyncLogs.arn]).apply(([backupBucketArn, logGroupArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetBucketLocation', 's3:ListBucket', 's3:ListBucketMultipartUploads', 's3:HeadBucket'],
              Resource: backupBucketArn,
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
              Resource: `${backupBucketArn}/*`,
            },
            {
              Effect: 'Allow',
              Action: ['logs:PutLogEvents', 'logs:CreateLogStream'],
              Resource: `${logGroupArn}:*`,
            },
          ],
        }),
      ),
    },
  ],
});
