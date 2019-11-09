#!/bin/bash

# exit on error
set -e

function log() {
  BLUE='\033[1;34m'
  NO_COLOR='\033[0m'
  echo -e "[$BLUE $1 $NO_COLOR]"
}

log "clean"
rm -rf build && mkdir build

log "manifest"
node chrome/manifest.build.js > build/manifest.json

log "locales"
cp -TR chrome/_locales build/_locales

log "images"
mkdir -p build/img
cp chrome/img/iconOff32.png chrome/img/iconOn32.png chrome/img/icon64.png build/img/

log "content"
cp -TR chrome/content build/content/

log "popup"
cp -TR chrome/popup build/popup/

log "background"
npm install --prefix chrome/background
npm run build --prefix chrome/background
cp -TR chrome/background/build build/background

log "options"