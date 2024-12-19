/// <reference path="./.sst/platform/config.d.ts" />
import dockerBuild from '@pulumi/docker-build';

export default $config({
  app(input) {
    return {
      name: 'minecraft-ondemand-watchdog',
      removal: 'retain',
      home: 'aws',
      providers: {
        aws: {
          profile: 'CI' in process.env ? undefined : (process.env.AWS_PROFILE ?? 'devops'),
        },
      },
    };
  },
  async run() {
    const identity = await aws.getCallerIdentity();
    const region = await aws.getRegion();
    const organization = await aws.organizations.getOrganization();

    const repo = new aws.ecr.Repository('WatchdogRepository', {
      name: $app.name,
      imageTagMutability: 'IMMUTABLE',
    });

    new aws.ecr.RepositoryPolicy('WatchdogRepositoryPolicy', {
      repository: repo.name,
      policy: {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowSelfManage',
            Effect: 'Allow',
            Principal: {
              AWS: $interpolate`arn:aws:iam::${identity.accountId}:root`,
            },
            Action: 'ecr:*',
          },
          {
            Sid: 'AllowPull',
            Effect: 'Allow',
            Principal: {
              AWS: '*',
            },
            Action: ['ecr:GetDownloadUrlForLayer', 'ecr:BatchCheckLayerAvailability', 'ecr:BatchGetImage'],
            Condition: {
              StringLike: {
                'aws:PrincipalOrgID': organization.id,
              },
            },
          },
        ],
      },
    });

    const lifecyclePolicy = new aws.ecr.LifecyclePolicy('WatchdogLifecyclePolicy', {
      repository: repo.name,
      policy: {
        rules: [
          {
            rulePriority: 1,
            description: 'Expire untagged images',
            selection: {
              tagStatus: 'untagged',
              countType: 'sinceImagePushed',
              countUnit: 'days',
              countNumber: 1,
            },
            action: {
              type: 'expire',
            },
          },
          {
            rulePriority: 2,
            description: 'Expire locally published images',
            selection: {
              tagStatus: 'tagged',
              tagPrefixList: ['local-'],
              countType: 'sinceImagePushed',
              countUnit: 'days',
              countNumber: 1,
            },
            action: {
              type: 'expire',
            },
          },
        ],
      },
    });

    const authToken = aws.ecr.getAuthorizationTokenOutput({
      registryId: repo.registryId,
    });
    const dockerTags: Array<$util.Input<string>> = [];
    const cacheFrom: $util.Input<Array<$util.Input<dockerBuild.types.input.CacheFromArgs>>> = [];
    if (process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME) {
      dockerTags.push($interpolate`${repo.repositoryUrl}:${process.env.GITHUB_REF_NAME.replace('watchdog', '')}`);
      cacheFrom.push({
        registry: {
          ref: $interpolate`${repo.repositoryUrl}:${process.env.GITHUB_SHA}`,
        },
      });
    } else if (process.env.GITHUB_SHA) {
      dockerTags.push($interpolate`${repo.repositoryUrl}:${process.env.GITHUB_SHA}`);
    } else {
      const time = new Date().toISOString().replace(/[^0-9]/g, '');
      dockerTags.push($interpolate`${repo.repositoryUrl}:local-${time}`);
    }

    const image = new dockerBuild.Image('WatchdogImage', {
      tags: dockerTags,
      context: {
        location: '../../../../packages/watchdog',
      },
      platforms: ['linux/amd64', 'linux/arm64'],
      push: true,
      cacheFrom,
      cacheTo: [
        {
          inline: {},
        },
      ],
      registries: [
        {
          address: repo.repositoryUrl,
          password: authToken.password,
          username: authToken.userName,
        },
      ],
    });
    return {
      image: image.ref,
    };
  },
});
