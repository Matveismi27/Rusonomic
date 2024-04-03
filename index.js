const express = require('express');
const path = require('node:path'); 
// import socket_server from "server.js";
const { createServer } = require("node:http");

const app = express();
const server = createServer(app);

app.get("/", (req, res) => {
    res.send("<h1>Hello world");
});

server.listen(3000, () => {
    console.log("server running at http://localhost:3000");
});