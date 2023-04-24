#!/bin/bash

set -euo pipefail

export CHANGE_SET_STATUS=$(aws cloudformation describe-change-set --stack-name ${STACK_NAME} --change-set-name ${CHANGE_SET_NAME} --output text --query 'Status')
if [[ "$CHANGE_SET_STATUS" == "FAILED" ]]; then
  export CHANGE_SET_STATUS_REASON=$(aws cloudformation describe-change-set --stack-name ${STACK_NAME} --change-set-name ${CHANGE_SET_NAME} --output text --query 'StatusReason')
  echo "$CHANGE_SET_STATUS_REASON"
  if [[ "$CHANGE_SET_STATUS_REASON" == "The submitted information didn't contain changes. Submit different information to create a change set." ]]; then
    echo "ChangeSet contains no changes."
  else
    echo "Change set failed to create."
    exit 1
  fi
else
  aws cloudformation execute-change-set \
    --stack-name ${STACK_NAME} \
    --change-set-name ${CHANGE_SET_NAME}; \
fi

npx cfn-event-tailer ${STACK_NAME}

aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query Stacks[0].Outputs[].[OutputKey,OutputValue] \
  --output table
