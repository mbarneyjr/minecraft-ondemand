MAKEFLAGS=--warn-undefined-variables

STACK_NAME ?= ${APPLICATION_NAME}-${ENVIRONMENT_NAME}

node_modules: package-lock.json
	npm ci
	touch node_modules
src/node_modules: src/package-lock.json
	cd src && npm ci
	# touch src/node_modules

images:
	curl -L https://d1.awsstatic.com/webteam/architecture-icons/AWS-Architecture-Icons_PNG_20200430.1f43d2dd713164497d228e77bd7542ff7b504bd4.zip -o images.temp.zip
	unzip -j -q -o images.temp.zip "AWS-Architecture-Icons_PNG_20200430/PNG Light/*" -d images
	rm images.temp.zip
	for file in images/*; do mv "$${file}" "$${file/@/}"; done
	mkdir images/64x-padded
	for file in images/*; do mogrify -background none -resize 104x64 -extent 64x104 -gravity north -path images/64x-padded "$${file}"; done

%.png: %.dot images
	dot -Tpng -o $*.png $*.dot

artifacts/dist.zip: $(shell find ./src -name '*.js') node_modules src/node_modules
	mkdir -p artifacts
	rm -rf artifacts/dist.zip
	find ./src/* -exec touch -h -t 200101010000 {} +
	cd src && zip -r -D -9 -y --compression-method deflate -X -x @../package-exclusions.txt @ ../artifacts/dist.zip * | grep -v 'node_modules'
	@echo "zip file MD5: $$(cat artifacts/dist.zip | openssl dgst -md5)"

artifacts/template.packaged.yml: template.yml $(shell find ./templates -name '*.yml') artifacts/dist.zip
	mkdir -p artifacts
	sam package \
		--s3-bucket "${ARTIFACT_BUCKET}" \
		--s3-prefix "${ARTIFACT_PREFIX}" \
		--output-template-file artifacts/template.packaged.yml
	touch artifacts/template.packaged.yml

.PHONY: lint build test coverage debug package deploy deploy-site delete diagrams-watch diagrams clean
dependencies: node_modules src/node_modules
	pip install -r requirements.txt

lint:
	cfn-lint

package: artifacts/template.packaged.yml

create-change-set:
	@echo "Deploying ${STACK_NAME} with changeset ${CHANGE_SET_NAME}"
	aws cloudformation create-change-set \
		--stack-name ${STACK_NAME} \
		--template-body file://artifacts/template.packaged.yml \
		--parameters \
			ParameterKey=ApplicationName,ParameterValue='"${APPLICATION_NAME}"' \
			ParameterKey=EnvironmentName,ParameterValue='"${ENVIRONMENT_NAME}"' \
			ParameterKey=HostedZoneName,ParameterValue='"${HOSTED_ZONE_NAME}"' \
			ParameterKey=DomainName,ParameterValue='"${DOMAIN_NAME}"' \
			ParameterKey=DnsLogGroupName,ParameterValue='"${DNS_LOG_GROUP_NAME}"' \
			ParameterKey=VpcName,ParameterValue='"${VPC_NAME}"' \
			ParameterKey=Memory,ParameterValue='"${MEMORY}"' \
			ParameterKey=Cpu,ParameterValue='"${CPU}"' \
			ParameterKey=WatchdogImageUri,ParameterValue='"${WATCHDOG_IMAGE_URI}"' \
			ParameterKey=OverviewerImageUri,ParameterValue='"${OVERVIEWER_IMAGE_URI}"' \
			ParameterKey=MinecraftVersion,ParameterValue='"${MINECRAFT_VERSION}"' \
			ParameterKey=MinecraftSeed,ParameterValue='"${MINECRAFT_SEED}"' \
			ParameterKey=MinecraftOps,ParameterValue='"${MINECRAFT_OPS}"' \
			ParameterKey=MinecraftMotd,ParameterValue='"${MINECRAFT_MOTD}"' \
		--tags \
			Key=ApplicationName,Value=${APPLICATION_NAME} \
			Key=EnvironmentName,Value=${ENVIRONMENT_NAME} \
			Key=workload,Value=${APPLICATION_NAME}-${ENVIRONMENT_NAME} \
		--capabilities CAPABILITY_AUTO_EXPAND CAPABILITY_NAMED_IAM CAPABILITY_IAM \
		--change-set-name ${CHANGE_SET_NAME} \
		--description "${CHANGE_SET_DESCRIPTION}" \
		--include-nested-stacks \
		--change-set-type $$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} > /dev/null && echo "UPDATE" || echo "CREATE")
	@echo "Waiting for change set to be created..."
	@CHANGE_SET_STATUS=None; \
	while [[ "$$CHANGE_SET_STATUS" != "CREATE_COMPLETE" && "$$CHANGE_SET_STATUS" != "FAILED" ]]; do \
		CHANGE_SET_STATUS=$$(aws cloudformation describe-change-set --stack-name ${STACK_NAME} --change-set-name ${CHANGE_SET_NAME} --output text --query 'Status'); \
	done; \
	aws cloudformation describe-change-set --stack-name ${STACK_NAME} --change-set-name ${CHANGE_SET_NAME} > artifacts/${STACK_NAME}-${CHANGE_SET_NAME}.json; \
	if [[ "$$CHANGE_SET_STATUS" == "FAILED" ]]; then \
		CHANGE_SET_STATUS_REASON=$$(aws cloudformation describe-change-set --stack-name ${STACK_NAME} --change-set-name ${CHANGE_SET_NAME} --output text --query 'StatusReason'); \
		if [[ "$$CHANGE_SET_STATUS_REASON" == "The submitted information didn't contain changes. Submit different information to create a change set." ]]; then \
			echo "ChangeSet contains no changes."; \
		else \
			echo "Change set failed to create."; \
			echo "$$CHANGE_SET_STATUS_REASON"; \
			exit 1; \
		fi; \
	fi;
	@echo "Change set ${STACK_NAME} - ${CHANGE_SET_NAME} created."
	npx cfn-changeset-viewer --stack-name ${STACK_NAME} --change-set-name ${CHANGE_SET_NAME}

deploy-change-set: node_modules
	CHANGE_SET_STATUS=$$(aws cloudformation describe-change-set --stack-name ${STACK_NAME} --change-set-name ${CHANGE_SET_NAME} --output text --query 'Status'); \
	if [[ "$$CHANGE_SET_STATUS" == "FAILED" ]]; then \
		CHANGE_SET_STATUS_REASON=$$(aws cloudformation describe-change-set --stack-name ${STACK_NAME} --change-set-name ${CHANGE_SET_NAME} --output text --query 'StatusReason'); \
		echo "$$CHANGE_SET_STATUS_REASON"; \
		if [[ "$$CHANGE_SET_STATUS_REASON" == "The submitted information didn't contain changes. Submit different information to create a change set." ]]; then \
			echo "ChangeSet contains no changes."; \
		else \
			echo "Change set failed to create."; \
			exit 1; \
		fi; \
	else \
		aws cloudformation execute-change-set \
			--stack-name ${STACK_NAME} \
			--change-set-name ${CHANGE_SET_NAME}; \
	fi;
	npx cfn-event-tailer ${STACK_NAME}

deploy-site:
	aws s3 sync --delete site s3://${APPLICATION_NAME}-${ENVIRONMENT_NAME}-site

delete:
	aws cloudformation delete-stack \
		--stack-name ${APPLICATION_NAME}-${ENVIRONMENT_NAME}

diagrams-watch:
	fswatch -r . -e ".*" -i "\\.dot$$" | sed -u 's/\.dot/\.png/g' | xargs -n 1 -I {} $(MAKE) {}

diagrams: images
	find . -name "*.dot" -exec echo {} \; | sed -u 's/\.dot/\.png/g' | xargs -n 1 -I {} $(MAKE) {}

clean:
	rm -rf artifacts
	rm -rf images
