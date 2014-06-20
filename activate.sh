#!/bin/sh
first_time=false
if [ -z "$__OLD_PS1" ]; then
  first_time=true
  export __OLD_PATH=$PATH
  export __OLD_PS1=$PS1

  export PATH=$(npm bin):$PATH

  PS1="(${PWD##*/}) $__OLD_PS1"

  deactivate () {
    # removes anything grunt may have done
    if hash grunt 2>/dev/null; then
      sudo -p "Enter the sudo password to remove the host entry: " grunt deactivate
    fi

    # adds the old bash prompt
    PS1=$__OLD_PS1

    # adds the old path varible
    export PATH=$__OLD_PATH

    # removes all variables used
    unset __OLD_PATH
    unset __OLD_PS1
    unset deactivate
    unset clean
  }

  clean () {
    rm -rf .css .html .js dist bower_components node_modules
  }
fi

npm install
bower install

if [ "$first_time" = true ]; then
  sudo -p "Enter the sudo password to insert the host entry: " grunt activate
  printf "\nEvironment set, to start type 'grunt'\n\n"
fi
