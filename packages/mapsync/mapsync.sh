#!/bin/bash

## Required Environment Variables

[ -n "$BUCKET_NAME" ] || { echo "BUCKET_NAME env variable must be set to the nmae of the bucket to sync to"; exit 1; }

aws s3 sync --delete /data/plugins/dynmap/web s3://${BUCKET_NAME}

echo "Synced to S3 bucket ${BUCKET_NAME}"
