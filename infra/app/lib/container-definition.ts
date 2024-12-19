const region = await aws.getRegion();

type ContainerDefinition = {
  name: string;
  image: string;
  essential: boolean;
  portMappings?: Array<{
    containerPort: number;
    hostPort: number;
    protocol: 'tcp' | 'udp';
  }>;
  environment: Record<string, $util.Input<string>>;
  mountPoints?: Array<{
    sourceVolume: string;
    containerPath: string;
    readOnly: boolean;
  }>;
  logGroupName: $util.Input<string>;
};

export function containerDefinitions(input: Array<ContainerDefinition>) {
  return $jsonStringify(
    input.map((c) => {
      return {
        Name: c.name,
        Image: c.image,
        Essential: c.essential,
        PortMappings: c.portMappings
          ? c.portMappings.map((p) => ({
              ContainerPort: p.containerPort,
              HostPort: p.hostPort,
              Protocol: p.protocol,
            }))
          : undefined,
        Environment: Object.entries(c.environment).map(([k, v]) => ({
          Name: k,
          Value: v,
        })),
        MountPoints: c.mountPoints
          ? c.mountPoints.map((m) => ({
              SourceVolume: m.sourceVolume,
              ContainerPath: m.containerPath,
              ReadOnly: m.readOnly,
            }))
          : undefined,
        LogConfiguration: {
          LogDriver: 'awslogs',
          Options: {
            'awslogs-region': region.name,
            'awslogs-group': c.logGroupName,
            'awslogs-stream-prefix': 'ecs',
          },
        },
      };
    }),
  );
}
