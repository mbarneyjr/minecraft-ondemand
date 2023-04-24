#!/bin/bash

set -euo pipefail

# grab build directory from command line
BUILD_DIR=$1
if [ -z "$BUILD_DIR" ]; then
    echo "Usage: $0 <build directory>"
    exit 1
fi

mkdir -p artifacts
rm -rf artifacts/${BUILD_DIR}.zip

# touch all files to a fixed date so that the zip file is deterministic
find ./${BUILD_DIR}/* -exec touch -h -t 200101010000 {} +

pushd ${BUILD_DIR}
zip -r -D -9 -y --compression-method deflate -X -x @../package-exclusions.txt @ ../artifacts/${BUILD_DIR}.zip * | grep -v 'node_modules'
popd

echo "zip file MD5: $$(cat artifacts/${BUILD_DIR}.zip | openssl dgst -md5)"
