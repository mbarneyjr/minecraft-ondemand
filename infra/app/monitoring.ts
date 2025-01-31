import { config } from './config';
import { region } from './data';
import { cluster, services } from './service';

if (config.createDashboard) {
  const dashboard = new aws.cloudwatch.Dashboard('Dashboard', {
    dashboardName: $interpolate`${$app.name}-${$app.stage}`,
    dashboardBody: $util.all([region.id, cluster.name]).apply(([region, clusterName]) => {
      const widgets: Array<unknown> = [];
      let height = 0;
      for (const service of services) {
        widgets.push({
          type: 'text',
          x: 0,
          y: 0,
          width: 24,
          height: 1,
          properties: {
            markdown: `# Service: ${service.id}`,
            background: 'transparent',
          },
        });
        widgets.push({
          type: 'metric',
          x: 0,
          y: height + 1,
          width: 8,
          height: 6,
          properties: {
            title: 'Connections',
            metrics: [['Minecraft', 'Connections', 'ServiceId', service.id, { label: service.id }]],
            legend: {
              position: 'hidden',
            },
            yAxis: {
              left: {
                label: 'Connections',
              },
            },
            view: 'timeSeries',
            stacked: false,
            stat: 'Average',
            period: 60,
            region,
          },
        });
        widgets.push({
          type: 'metric',
          x: 8,
          y: height + 1,
          width: 8,
          height: 6,
          properties: {
            title: 'CPU Utilization',
            metrics: [
              [
                'AWS/ECS',
                'CPUUtilization',
                'ServiceName',
                service.serviceName,
                'ClusterName',
                clusterName,
                { label: service.id },
              ],
            ],
            view: 'timeSeries',
            region,
            stat: 'Average',
            period: 60,
            yAxis: {
              left: {
                min: 0,
                max: 100,
              },
            },
            legend: {
              position: 'hidden',
            },
            stacked: false,
          },
        });
        widgets.push({
          type: 'metric',
          x: 16,
          y: height + 1,
          width: 8,
          height: 6,
          properties: {
            title: 'Memory Utilization',
            metrics: [
              [
                'AWS/ECS',
                'MemoryUtilization',
                'ServiceName',
                service.serviceName,
                'ClusterName',
                clusterName,
                { label: service.id },
              ],
            ],
            view: 'timeSeries',
            region,
            stat: 'Average',
            period: 60,
            yAxis: {
              left: {
                min: 0,
                max: 100,
              },
            },
            legend: {
              position: 'hidden',
            },
            stacked: false,
          },
        });
        widgets.push({
          type: 'log',
          x: 0,
          y: height + 7,
          width: 24,
          height: 5,
          properties: {
            title: 'Logs',
            query: [
              "SOURCE '/minecraft-ondemand/mbarney/vanilla/game'",
              "| SOURCE '/minecraft-ondemand/mbarney/vanilla/watchdog'",
              '| fields @timestamp, @message, @logStream, @log',
              '| sort @timestamp desc',
              '| limit 10000',
            ].join('\n'),
            region,
            stacked: false,
            view: 'table',
          },
        });
        height += 12;
      }
      return JSON.stringify({
        widgets: widgets,
      });
    }),
  });
}
