/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */
import "sst"
export {}
declare module "sst" {
  export interface Resource {
    "Config": {
      "rootDomainName": string
      "type": "sst.sst.Linkable"
    }
    "DnsTrigger": {
      "name": string
      "type": "sst.aws.Function"
    }
    "MountTargetIp": {
      "ip": string
      "type": "sst.sst.Linkable"
    }
    "SiteFunction": {
      "name": string
      "type": "sst.aws.Function"
      "url": string
    }
    "SiteRouter": {
      "type": "sst.aws.Router"
      "url": string
    }
    "SiteStaticAssets": {
      "name": string
      "type": "sst.aws.Bucket"
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
      "type": "sst.aws.Vpc"
    }
  }
}
