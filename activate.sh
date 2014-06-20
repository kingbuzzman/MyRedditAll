#!/bin/sh
if [ -z "$__PS1" ]; then
  export PATH=$(npm bin):$PATH
  export __PS1=$PS1

  PS1="(${PWD##*/}) $__PS1"

  deactivate () {
    PS1="$__PS1"
    unset __PS1
  }

  clean () {
    rm -rf .css .html .js dist bower_components node_modules
  }
fi

npm install
bower install
