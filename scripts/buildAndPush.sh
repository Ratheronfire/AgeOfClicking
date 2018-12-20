#!/usr/bin/env bash

if ng build --prod --output-path ~/ratheronfire.github.io; then
  echo -n "Enter commit message: "
  read message

  cd ../ratheronfire.github.io/

  git reset
  git add *
  git commit -m "$message"
  git push
fi
