MAKEFLAGS=--warn-undefined-variables

export STACK_NAME ?= ${APPLICATION_NAME}-${ENVIRONMENT_NAME}

node_modules: package-lock.json
	npm ci
	touch node_modules
frontend/node_modules: frontend/package-lock.json
	cd frontend && npm ci
	touch frontend/node_modules
backend/node_modules: backend/package-lock.json
	cd backend && npm ci
	touch backend/node_modules

artifacts/frontend.zip: $(shell find ./frontend -name '*.*js') node_modules frontend/node_modules
	./scripts/build-artifact.sh frontend

artifacts/backend.zip: $(shell find ./backend -name '*.js') node_modules backend/node_modules
	./scripts/build-artifact.sh backend

artifacts/template.packaged.yml: template.yml $(shell find ./templates -name '*.yml') artifacts/frontend.zip artifacts/backend.zip
	./scripts/package.sh
	touch artifacts/template.packaged.yml

.PHONY: frontend/.env
frontend/.env:
	rm -rf frontend/.env
	echo "LOCAL=true" >> frontend/.env
	echo "APP_CLIENT_ID=$$(aws ssm get-parameter --query Parameter.Value --output text --name /${APPLICATION_NAME}/${ENVIRONMENT_NAME}/auth/app-client-id)" >> frontend/.env
	echo "AUTH_BASE_URL=$$(aws ssm get-parameter --query Parameter.Value --output text --name /${APPLICATION_NAME}/${ENVIRONMENT_NAME}/auth/auth-base-url)" >> frontend/.env
	echo "APP_ENDPOINT=http://localhost:3000" >> frontend/.env
	touch frontend/.env

.PHONY: lint build test coverage debug package deploy delete diagrams-watch diagrams clean
dependencies: node_modules backend/node_modules
	pip install -r requirements.txt

lint: node_modules frontend/node_modules backend/node_modules
	./node_modules/.bin/tsc -p ./tsconfig.json
	./node_modules/.bin/eslint . --max-warnings=0 --ext .mjs,.js,.ts,.mts,.d.mts,.d.ts
	cfn-lint

package: artifacts/template.packaged.yml

create-change-set:
	./scripts/create-change-set.sh

deploy-change-set: node_modules
	./scripts/deploy-change-set.sh

delete:
	aws cloudformation delete-stack \
		--stack-name ${APPLICATION_NAME}-${ENVIRONMENT_NAME}

.PHONY: local-server
local-server: node_modules frontend/node_modules
	cd frontend && npm start

images:
	curl -L https://d1.awsstatic.com/webteam/architecture-icons/AWS-Architecture-Icons_PNG_20200430.1f43d2dd713164497d228e77bd7542ff7b504bd4.zip -o images.temp.zip
	unzip -j -q -o images.temp.zip "AWS-Architecture-Icons_PNG_20200430/PNG Light/*" -d images
	rm images.temp.zip
	for file in images/*; do mv "$${file}" "$${file/@/}"; done
	mkdir images/64x-padded
	for file in images/*; do mogrify -background none -resize 104x64 -extent 64x104 -gravity north -path images/64x-padded "$${file}"; done

%.png: %.dot images
	dot -Tpng -o $*.png $*.dot

diagrams-watch:
	fswatch -r . -e ".*" -i "\\.dot$$" | sed -u 's/\.dot/\.png/g' | xargs -n 1 -I {} $(MAKE) {}

diagrams: images
	find . -name "*.dot" -exec echo {} \; | sed -u 's/\.dot/\.png/g' | xargs -n 1 -I {} $(MAKE) {}

clean:
	rm -rf artifacts
	rm -rf node_modules
	rm -rf frontend/node_modules
	rm -rf backend/node_modules
	rm -rf images
