#!/bin/bash

set -euo pipefail

echo "Deploying ${STACK_NAME} with changeset ${CHANGE_SET_NAME}."

export STACK_STATUS=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query Stacks[0].StackStatus --output text 2> /dev/null || echo "NO_STACK")
aws cloudformation create-change-set \
  --stack-name ${STACK_NAME} \
  --template-body file://artifacts/template.packaged.yml \
  --parameters \
			ParameterKey=ApplicationName,ParameterValue="${APPLICATION_NAME}" \
			ParameterKey=EnvironmentName,ParameterValue="${ENVIRONMENT_NAME}" \
			ParameterKey=HostedZoneName,ParameterValue="${HOSTED_ZONE_NAME}" \
			ParameterKey=DomainName,ParameterValue="${DOMAIN_NAME}" \
			ParameterKey=DnsLogGroupName,ParameterValue="${DNS_LOG_GROUP_NAME}" \
			ParameterKey=VpcName,ParameterValue="${VPC_NAME}" \
			ParameterKey=Memory,ParameterValue="${MEMORY}" \
			ParameterKey=Cpu,ParameterValue="${CPU}" \
			ParameterKey=WatchdogImageUri,ParameterValue="${WATCHDOG_IMAGE_URI}" \
			ParameterKey=OverviewerImageUri,ParameterValue="${OVERVIEWER_IMAGE_URI}" \
			ParameterKey=MinecraftVersion,ParameterValue="${MINECRAFT_VERSION}" \
			ParameterKey=MinecraftSeed,ParameterValue="${MINECRAFT_SEED}" \
			ParameterKey=MinecraftOps,ParameterValue="${MINECRAFT_OPS}" \
			ParameterKey=MinecraftMotd,ParameterValue="${MINECRAFT_MOTD}" \
  --tags \
      Key=ApplicationName,Value=${APPLICATION_NAME} \
      Key=EnvironmentName,Value=${ENVIRONMENT_NAME} \
  --capabilities CAPABILITY_AUTO_EXPAND CAPABILITY_NAMED_IAM CAPABILITY_IAM \
  --change-set-name "${CHANGE_SET_NAME}" \
  --description "${CHANGE_SET_DESCRIPTION}" \
  --include-nested-stacks \
  --change-set-type $(`echo "NO_STACK,REVIEW_IN_PROGRESS" | grep -w -q "${STACK_STATUS}"` && echo "CREATE" || echo "UPDATE")

echo "Waiting for change set to be created..."

export CHANGE_SET_STATUS=None 
while [[ "$CHANGE_SET_STATUS" != "CREATE_COMPLETE" && "$CHANGE_SET_STATUS" != "FAILED" ]]; do 
  export CHANGE_SET_STATUS=$(aws cloudformation describe-change-set --stack-name ${STACK_NAME} --change-set-name ${CHANGE_SET_NAME} --output text --query 'Status')
done

aws cloudformation describe-change-set --stack-name ${STACK_NAME} --change-set-name ${CHANGE_SET_NAME} > artifacts/${STACK_NAME}-${CHANGE_SET_NAME}.json

if [[ "$CHANGE_SET_STATUS" == "FAILED" ]]; then
  CHANGE_SET_STATUS_REASON=$(aws cloudformation describe-change-set --stack-name ${STACK_NAME} --change-set-name ${CHANGE_SET_NAME} --output text --query 'StatusReason')
  if [[ "$CHANGE_SET_STATUS_REASON" == "The submitted information didn't contain changes. Submit different information to create a change set." ]]; then
    echo "ChangeSet contains no changes."
  else
    echo "Change set failed to create."
    echo "$CHANGE_SET_STATUS_REASON"
    exit 1
  fi
fi
echo "Change set ${STACK_NAME} - ${CHANGE_SET_NAME} created."

npx cfn-changeset-viewer --stack-name ${STACK_NAME} --change-set-name ${CHANGE_SET_NAME}
