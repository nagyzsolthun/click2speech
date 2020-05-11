#!/bin/bash

# exit on error
set -e

function log() {
  BLUE='\033[1;34m'
  NO_COLOR='\033[0m'
  echo -e "[$BLUE $1 $NO_COLOR]"
}

action=$1

if [ -z "$action" ] || [ $action == "clean" ]; then
  log "clean"
  rm -rf build && mkdir build
fi

if [ -z "$action" ] || [ $action == "manifest" ]; then
  log "manifest"
  node chrome/manifest.build.js > build/manifest.json
fi

if [ -z "$action" ] || [ $action == "locales" ]; then
  log "locales"
  cp -TR chrome/_locales build/_locales
fi

if [ -z "$action" ] || [ $action == "images" ]; then
  log "images"
  mkdir -p build/img
  cp chrome/img/iconOff32.png chrome/img/iconOn32.png chrome/img/icon64.png build/img/
fi

if [ -z "$action" ] || [ $action == "content" ]; then
  log "content"
  cp -TR chrome/content build/content/
fi

if [ -z "$action" ] || [ $action == "popup" ]; then
  log "popup"
  cp -TR chrome/popup build/popup/
fi

if [ -z "$action" ] || [ $action == "background" ]; then
  log "background"
  npm install --prefix chrome/background
  npm run build --prefix chrome/background
  cp -TR chrome/background/build build/background
fi

if [ -z "$action" ] || [ $action == "options" ]; then
  log "options"
  npm run build --prefix chrome/options
  cp -TR chrome/options/build build/options
fi