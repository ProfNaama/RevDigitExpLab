#! /bin/bash

docker run -it --rm --init --name my-running-script -v $PWD:/usr/src/app -w /usr/src/app/  -p 3030:3030 node:latest /bin/bash -c 'cd node && npm install express && node app.js'