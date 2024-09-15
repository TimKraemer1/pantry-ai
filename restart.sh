#!/bin/bash

killall node

cd nodejs_server

echo "Restarting Node.js server..."

node app.js &

cd ../camera-app

echo "Restarting React app..."

npm start &

echo "Done."
