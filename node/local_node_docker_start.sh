#! /bin/bash

docker run -it --rm --init --name my-running-script -v $PWD:/usr/src/app -w /usr/src/app/  -p 3030:3030 -p 9229:9229 node:latest /bin/bash -c 'cd node && npm install express && node --inspect=0.0.0.0:9229 app.js'