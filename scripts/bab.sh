#!/bin/bash


DIR=$(pwd)
SNAP_DIR="__snapshots__"

echo "$(tput setaf 2) Running Babel, placing transpiled files into lib directory.$(tput sgr0)"
babel ${DIR}/js --out-dir ${DIR}/lib
echo ""

echo "$(tput setaf 2) Running Mocha tests...$(tput sgr0)"
nyc mocha ${DIR}/test/spec/*
echo ""

echo "$(tput setaf 2) Creating a new __snapshots__ folder in project root.$(tput sgr0)"
mkdir -p ${DIR}/${SNAP_DIR}
echo ""

echo "$(tput setaf 2) Copying snapshot files from test dir to snapshot dir.$(tput sgr0)"
cp -r ${DIR}/test/${SNAP_DIR}/ ${DIR}/${SNAP_DIR}
echo ""

echo "$(tput setaf 2) Running Snapshot tests...$(tput sgr0)"
mocha test/snapshots/*
echo ""

echo "$(tput setaf 2) Copying Snapshots back to test directory $(tput sgr0)"
cp -r ${DIR}/${SNAP_DIR} ${DIR}/test/${SNAP_DIR}

echo "$(tput setaf 2) Cleaning up snapshot directory in project root. $(tput sgr0)"
rm -rf ${DIR}/${SNAP_DIR}
echo ""
