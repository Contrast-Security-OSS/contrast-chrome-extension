# !/bin/bash

PROJECT_ROOT=$(pwd)
DIST_DIR="$PROJECT_ROOT/dist"

rm -rf $DIST_DIR
mkdir -p $DIST_DIR
mkdir -p $DIST_DIR/js

# cp -r js $DIST_DIR
npm run gulp
cp -r img $DIST_DIR
cp -r html $DIST_DIR
cp -r scripts $DIST_DIR
cp style.css $DIST_DIR
cp manifest.json $DIST_DIR

rm -rfv $DIST_DIR/scripts/*.sh

timestamp=$(date +"%Y-%m-%d_%H-%M-%S")

mkdir -p $PROJECT_ROOT/builds
zip -r $PROJECT_ROOT/builds/contrast-${timestamp}.zip $DIST_DIR
