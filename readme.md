# Minecraft Ondemand

This is an on-demand Minecraft server hosted on AWS Fargate.
It is largely inspired and driven by https://github.com/doctorray117/minecraft-ondemand.
It has been built for my specific personal AWS Organization.

## Architecture

![architecture-diagram](./docs/architecture.png)

## Features

- Minecraft server hosting on AWS Fargate
- On-demand trigger from a DNS log query
- Watchdog sidecar container to shut down the server after a period of inactivity

## Deployment

The IaC for this application is using [SST](https://sst.dev).
There are some pre-requisites for deploying this application, which includes things like a Hosted Zone for DNS.
Your Hosted Zone must also be configured to log to CloudWatch Logs that the lambda trigger is subscribed to.
See [./infra/app/config.ts](./infra/app/config.ts) for more details.

SST has been configured with a dev command to mount the EFS filesystem locally.
When running `npm run dev`, `efs.local` will be mounted through SST's tunnel to the FileSystem.
