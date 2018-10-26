#!/usr/bin/env bash

if ng build; then
  rm -r ../ratheronfire.github.io/*

  cp -r dist/clicker-game/* ../ratheronfire.github.io/

  echo -n "Enter commit message: "
  read message

  git add *
  git commit -m $message
  git push
fi
