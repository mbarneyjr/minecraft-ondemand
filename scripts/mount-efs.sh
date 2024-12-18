#!/bin/bash

set +euo pipefail

cleanup() {
  umount "$MOUNT_DIR"
}
trap cleanup EXIT

MOUNT_DIR=${MOUNT_DIR:-efs.local}

if [ ! -d $MOUNT_DIR ]; then
  mkdir $MOUNT_DIR
fi

MOUNT_IP=$(echo ${SST_RESOURCE_MountTargetIp} | jq .ip -r)

echo "Mounting $MOUNT_DIR"
mount -t nfs,rw -o nfsvers=4.0,rsize=65536,wsize=65536,hard,timeo=600,rw,mountport=2049 -w ${MOUNT_IP}:/ $MOUNT_DIR

sudo su -l $(whoami) -c "sleep infinity" &
wait
