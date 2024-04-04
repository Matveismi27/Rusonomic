const express = require('express');
const path = require('node:path'); 

const { createServer } = require("node:http");
const { Server } = require("socket.io");
const { Socket } = require('node:dgram');

const app = express();
const server = createServer(app);
const port = 3000;
const io = new Server(server);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,"index.html"));
});

server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
});

io.on('connection', (socket)=>{
    console.log("Пользователь +");
    socket.on('disconnect', () => {
        console.log('Пользователь -');
    });
});