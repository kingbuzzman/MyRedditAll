#!/bin/sh
if [ -z "$__PS1" ]; then
  export PATH=$(npm bin):$PATH
  export __PS1=$PS1

  PS1="(${PWD##*/}) $__PS1"

  deactivate () {
    PS1="$__PS1"
    unset __PS1
  }
fi

npm install
bower install
