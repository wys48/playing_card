#!/bin/sh
while sleep 1
do
  echo
  echo "*** To exit server, Press Ctrl+C Twice! ****"
  node server/app.js
done
