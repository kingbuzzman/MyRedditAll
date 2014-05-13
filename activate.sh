#!/bin/sh
export PATH=$(npm bin):$PATH

if [ ! -d node_modules ]; then
  npm install
fi

if [ ! -d bower_components ]; then
  bower install
fi