const express = require('express');
const path = require('path'); 

const { createServer } = require("http");
const { Server } = require("socket.io");
const { Socket } = require('dgram');

const app = express();
const server = createServer(app);
const port = 3000;
const io = new Server(server);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,"public","index.html"));
});
app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname,"public",req.path));
});

server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
});

io.on('connection', (socket)=>{
    console.log("Пользователь +");
    
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
    socket.on('disconnect', () => {
        console.log('Пользователь -');
    });

});