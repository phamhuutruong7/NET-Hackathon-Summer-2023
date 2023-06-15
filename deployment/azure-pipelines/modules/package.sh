#!/bin/bash

docker build -f ${DOCKER_FILE} ${BUILD_CONTEXT} --tag ${APP_NAME}:${APP_VERSION} 