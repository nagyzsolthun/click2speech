#!/bin/bash

# e.g. "bash build.sh" or "bash build.sh popup zip"


# exit on error
set -e

function log() {
  BLUE='\033[1;34m'
  NO_COLOR='\033[0m'
  echo -e "[$BLUE $1 $NO_COLOR]"
}

action=" $1 $2 $3 $4 $5 "
if [ ${#action}  == "6" ]; then
  action=""
fi;

if [ -z "$action" ] || [[ "$action" =~ " clean " ]]; then
  log "clean"
  rm -rf build && mkdir build
  rm -f build.zip
fi

if [ -z "$action" ] || [[ "$action" =~ " manifest " ]]; then
  log "manifest"
  node chrome/manifest.build.js > build/manifest.json
fi

if [ -z "$action" ] || [[ "$action" =~ " locales " ]]; then
  log "locales"
  cp -TR chrome/_locales build/_locales
fi

if [ -z "$action" ] || [[ "$action" =~ " images " ]]; then
  log "images"
  mkdir -p build/img
  cp chrome/img/iconOff32.png chrome/img/iconOn32.png chrome/img/icon64.png build/img/
fi

if [ -z "$action" ] || [[ "$action" =~ " content " ]]; then
  log "content"
  cp -TR chrome/content build/content/
fi

if [ -z "$action" ] || [[ "$action" =~ " popup " ]]; then
  log "popup"
  cp -TR chrome/popup build/popup/
fi

if [ -z "$action" ] || [[ "$action" =~ " background-npm-install " ]]; then
  log "background-npm-install"
  npm ci --prefix chrome/background
fi

if [ -z "$action" ] || [[ "$action" =~ " background-test " ]]; then
  log "background-test"
  npm run test --prefix chrome/background
fi

if [ -z "$action" ] || [[ "$action" =~ " background-build " ]]; then
  log "background-build"
  rm -rf chrome/background/build
  npm run build --prefix chrome/background
  cp -TR chrome/background/build build/background
fi

if [ -z "$action" ] || [[ "$action" =~ " options-npm-install " ]]; then
  log "options-npm-install"
  npm ci --prefix chrome/options
fi

if [ -z "$action" ] || [[ "$action" =~ " options-build " ]]; then
  log "options-build"
  npm run build --prefix chrome/options
  cp -TR chrome/options/build build/options
fi

if [ -z "$action" ] || [[ "$action" =~ " zip " ]]; then
  log "zip"
  cd build
  version=$(cat manifest.json | jq ".version" | tr -d ".\"")
  zip -rq build.zip ./*
  cd ..
  mv build/build.zip ./build$version.zip
fi