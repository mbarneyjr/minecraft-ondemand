/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */
import "sst"
export {}
declare module "sst" {
  export interface Resource {
    "DnsTrigger": {
      "name": string
      "type": "sst.aws.Function"
    }
    "MountTargetIp": {
      "ip": string
      "type": "sst.sst.Linkable"
    }
    "TargetRegion": {
      "name": string
      "type": "sst.sst.Linkable"
    }
    "VanillaAddFileLambda": {
      "name": string
      "type": "sst.aws.Function"
    }
    "Vpc": {
      "bastion": string
      "type": "sst.aws.Vpc"
    }
  }
}
