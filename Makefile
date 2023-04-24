MAKEFLAGS=--warn-undefined-variables

export STACK_NAME ?= ${APPLICATION_NAME}-${ENVIRONMENT_NAME}

node_modules: package-lock.json
	npm ci
	touch node_modules
backend/node_modules: backend/package-lock.json
	cd backend && npm ci
	touch backend/node_modules

artifacts/backend.zip: $(shell find ./backend -name '*.js') node_modules backend/node_modules
	./scripts/build-artifact.sh backend

artifacts/template.packaged.yml: template.yml $(shell find ./templates -name '*.yml') artifacts/backend.zip
	./scripts/package.sh
	touch artifacts/template.packaged.yml

.PHONY: lint build test coverage debug package deploy deploy-site delete diagrams-watch diagrams clean
dependencies: node_modules backend/node_modules
	pip install -r requirements.txt

lint:
	cfn-lint

package: artifacts/template.packaged.yml

create-change-set:
	./scripts/create-change-set.sh

deploy-change-set: node_modules
	./scripts/deploy-change-set.sh

deploy-site:
	aws s3 sync --delete site s3://${APPLICATION_NAME}-${ENVIRONMENT_NAME}-site

delete:
	aws cloudformation delete-stack \
		--stack-name ${APPLICATION_NAME}-${ENVIRONMENT_NAME}

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
	rm -rf backend/node_modules
	rm -rf images
