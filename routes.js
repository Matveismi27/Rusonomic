const express = require('express');
const app = express();
const path = require('path'); 

const { createServer } = require("http");
// const { Socket } = require('dgram');
// const { unlink } = require('fs');
// const { userInfo } = require('os');
// const { time } = require('console');
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,"public","index.html"));
});

const server = createServer(app);
const port = 3000;
server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
});

module.exports = server;