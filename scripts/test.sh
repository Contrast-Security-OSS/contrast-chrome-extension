#!/bin/bash

DIR=$(pwd)
SNAP_DIR="__snapshots__"

echo "$(tput setaf 2) Running Mocha tests...$(tput sgr0)"
node ./node_modules/nyc/bin/nyc.js ./node_modules/mocha/bin/mocha ${DIR}/test/spec/*
echo ""

echo "$(tput setaf 2) Creating a new __snapshots__ folder in project root.$(tput sgr0)"
mkdir -p ${DIR}/${SNAP_DIR}
echo ""

echo "$(tput setaf 2) Copying snapshot files from test dir to snapshot dir.$(tput sgr0)"
cp -r ${DIR}/test/${SNAP_DIR}/ ${DIR}/${SNAP_DIR}
echo ""

echo "$(tput setaf 2) Running Snapshot tests...$(tput sgr0)"
./node_modules/mocha/bin/mocha test/snapshots/*
echo ""

echo "$(tput setaf 2) Cleaning up snapshot directory in project root. $(tput sgr0)"
rm -rf ${DIR}/${SNAP_DIR}
echo ""
