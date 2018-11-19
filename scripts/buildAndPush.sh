#!/usr/bin/env bash

if ng build --prod; then
  rm -r ../ratheronfire.github.io/*

  cp -r dist/clicker-game/* ../ratheronfire.github.io/

  echo -n "Enter commit message: "
  read message

  cd ../ratheronfire.github.io/

  git reset
  git add *
  git commit -m "$message"
  git push
fi
