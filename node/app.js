const http = require('http');
const express = require('express');
const path = require('path');
const port = process.env.PORT || 3030;
var app = express();

app.use(function (req, res, next) {
    console.log(req.url);
    next();
});

app.use(express.static(path.join(__dirname, '../')))
const server = http.createServer(app);
console.log("\n\n Debug.. Listening on port: " + port);
server.listen(port)
