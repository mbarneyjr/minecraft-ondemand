import { vpc } from './vpc';

const rawFileSystem = new aws.efs.FileSystem('RawFileSystem', {
  performanceMode: 'generalPurpose',
  throughputMode: 'elastic',
  encrypted: true,
});
export const mountTargets = vpc.privateSubnets.apply((subnets) => {
  return $util.all(
    subnets.map((subnet, i) => {
      return new aws.efs.MountTarget(`MountTarget${i}`, {
        fileSystemId: rawFileSystem.id,
        subnetId: subnet,
      });
    }),
  );
});
export const rawRootAccessPoint = new aws.efs.AccessPoint('RootAccessPoint', {
  fileSystemId: rawFileSystem.id,
  tags: {
    name: `${$app.name}-${$app.stage}-root`,
  },
  posixUser: {
    uid: 1000,
    gid: 1000,
  },
  rootDirectory: {
    path: '/',
    creationInfo: {
      ownerUid: 1000,
      ownerGid: 1000,
      permissions: '0777',
    },
  },
});

export const rootAccessPoint = aws.efs.AccessPoint.get(
  'AccessPointRoot',
  rawRootAccessPoint.id,
  {},
  {
    dependsOn: $util.all([mountTargets]).apply(([mountTargets]) => [...mountTargets]),
  },
);

export const efs = sst.aws.Efs.get('Efs', rawFileSystem.id, {
  dependsOn: $util
    .all([mountTargets, rootAccessPoint])
    .apply(([mountTargets, rootAccessPoint]) => [...mountTargets, rootAccessPoint]),
});

const mountTargetIpLink = new sst.Linkable('MountTargetIp', {
  properties: {
    ip: mountTargets[0].ipAddress,
  },
});
export const fileSystem = aws.efs.FileSystem.get(
  'FileSystem',
  rawFileSystem.id,
  {},
  {
    dependsOn: $util
      .all([mountTargets, rootAccessPoint])
      .apply(([mountTargets, rootAccessPoint]) => [...mountTargets, rootAccessPoint]),
  },
);

const efsMount = new sst.x.DevCommand('EfsMount', {
  dev: {
    autostart: false,
    title: 'Mount EFS',
    command: './scripts/mount-efs.sh',
  },
  link: [efs, mountTargetIpLink],
});
