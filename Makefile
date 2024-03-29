##############################################################################
# Includes
##############################################################################
include .env

##############################################################################
# Prologue
##############################################################################
# MAKEFLAGS += --warn-undefined-variables

ifndef ENV
$(info Please set ENV to 'dev' or 'prod' in your .env file.)
endif

ifndef CONFIRM
CONFIRM := 0
endif

ifndef UID
UID := $(shell id -u)
endif
ifndef GID
GID := $(shell id -g)
endif

ENV_PATH := .env

NODE_DIRS := client server ingest dashboard-search node-admin-client

TEMPLATES_DIR := templates
TEMPLATES_FILES := $(shell find $(TEMPLATES_DIR) -type f)

BUILD_TEMPLATES_DIR := build/templates

SERVER_DIR := server
SERVER_FILES := $(shell find $(SERVER_DIR) ! -path '*node_modules*' ! -path '*dist*' -type f)

CLIENT_DIR := client
CLIENT_FILES := $(shell find $(CLIENT_DIR) ! -path '*node_modules*' -type f)

BUILD_SPA_DIR := build/spa

CURRENT_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

WSL := $(if $(shell command -v bash.exe 2> /dev/null),1,0)
UNAME := $(shell uname -s)
DOCKER_HOST_IP := host.docker.internal
ifeq ($(UNAME),Linux)
	ifneq ($(WSL),1)
		DOCKER_HOST_IP := $(shell ip -4 addr show docker0 | grep -Po 'inet \K[\d.]+')
	endif
endif

ifeq ($(NGINX_PORT),443)
DC_prod := -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.prod.ssl.yml
else
DC_prod := -f docker-compose.yml -f docker-compose.prod.yml
endif
DC_dev := -f docker-compose.yml

RUN_MAKE := ENV=$(ENV) CONFIRM=$(CONFIRM) $(MAKE)

##############################################################################
# Primary Commands
##############################################################################

include makeparts/dependencies.mk
include makeparts/ingest.mk
include makeparts/hasura.mk
include makeparts/docker.mk
include makeparts/cleanup.mk
include makeparts/aliases.mk

######################################
### Client

WEBAPP_REQS := \
	GRAPHQL_END_POINT \
	MEILI_PUBLIC_KEY

.PHONY: webapp
#: Start the client dev server
webapp: $(addprefix env-, $(WEBAPP_REQS)) client/node_modules
	cd client && quasar dev && cd ..

######################################
### Server
	
.PHONY: express
#: Start the express server
express: server/node_modules
	cd server && REDIS_HOST=localhost REDIS_DOCKER_PORT=6379 ts-node src/index.ts && cd ..

ADD_DEV_USER_REQS := \
	AUTH_SERVER_URL \
	KEYCLOAK_USERNAME \
	KEYCLOAK_PASSWORD \
	KEYCLOAK_REALM \
	GRAPHQL_END_POINT \
	HASURA_SECRET \
	DEV_USER_EMAIL \
	DEV_USER_FIRST_NAME \
	DEV_USER_LAST_NAME \
	DEV_USER_PASSWORD

ADD_PROD_USER_REQS := \
	AUTH_SERVER_URL \
	KEYCLOAK_USERNAME \
	KEYCLOAK_PASSWORD \
	KEYCLOAK_REALM \
	GRAPHQL_END_POINT \
	HASURA_SECRET \
	ADD_USER_CSV_PATH

.PHONY: add-dev-user
add-dev-user: node-admin-client/node_modules $(addprefix env-, $(ADD_DEV_USER_REQS))
	@cd node-admin-client && yarn run add-users && cd ..

.PHONY: add-csv-user
add-csv-user: node-admin-client/node_modules $(addprefix env-, $(ADD_PROD_USER_REQS))
	@cd node-admin-client && yarn run add-csv-users && cd ..

.PHONY: setup-restore
setup-restore: docker-database-restore sleep-45 docker sleep-25 migrate add-dev-user dashboard-ingest

.PHONY: setup-new
setup-new: docker sleep-15 migrate add-dev-user

.PHONY: setup
setup:
ifdef HASURA_DUMP
	$(info Restoring database from $(HASURA_DUMP))
	@$(RUN_MAKE) setup-restore
else
	$(info Creating new database)
	@$(RUN_MAKE) setup-new
endif

$(BUILD_SPA_DIR): $(ENV_PATH) $(CLIENT_DIR) $(CLIENT_FILES)
	@cd client && yarn run build
	@touch $(BUILD_SPA_DIR)

.PHONY: prod
#: Running production: build spa and then run docker
prod: $(BUILD_TEMPLATES_DIR) $(BUILD_SPA_DIR) docker

git-pull:
	git pull

.PHONY: prod-restart
prod-restart: stop-docker git-pull prod

.PHONY: certs
certs: prod 
	@bash $(BUILD_TEMPLATES_DIR)/letsencrypt/init-letsencrypt.sh

.PHONY: ssh
ssh:
	@ssh -i ~/.ssh/rick_johnson.pem ubuntu@pace.nd.edu

##############################################################################
# Epilogue
##############################################################################
include makeparts/utilities.mk
.DEFAULT_GOAL := help
