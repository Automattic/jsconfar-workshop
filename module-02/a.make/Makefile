
# this dir
THIS_MAKEFILE_PATH:=$(word $(words $(MAKEFILE_LIST)),$(MAKEFILE_LIST))
THIS_DIR:=$(shell cd $(dir $(THIS_MAKEFILE_PATH));pwd)

# alias
NM := node_modules

# BIN directory
BIN := $(THIS_DIR)/$(NM)/.bin

# applications
NODE ?= node
BROWSERIFY ?= $(NODE) $(BIN)/browserify

build:
	@$(BROWSERIFY) \
		--debug \
		client.js \
		> public/app.js

.PHONY: build
