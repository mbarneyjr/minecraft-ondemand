#!/bin/bash

set -euo pipefail

mkdir -p artifacts

sam package \
  --template-file template.yml \
  --s3-bucket "${ARTIFACT_BUCKET}" \
  --s3-prefix "${ARTIFACT_PREFIX}" \
  --output-template-file artifacts/template.packaged.yml
