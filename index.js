const express = require('express');
const path = require('path'); 

const { createServer } = require("http");
const { Server } = require("socket.io");
const { Socket } = require('dgram');
const { unlink } = require('fs');
const { userInfo } = require('os');

const app = express();
const server = createServer(app);
const port = 3000;
const io = new Server(server);
let server_data={ //Значение по умолчанию
    players : {},
    town : {
        population:0,
        name: "Город Топск",
        text: "",
        money: 100,
    }
}
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,"public","index.html"));
});

server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
});

io.on('connection', (socket)=>{
    server_data.players[socket.id] = {
        name:"Имя",
        text : "игрок 1",
        level : 0,
        class : "Ремесленник",
        money: 0,
    };
    console.log("+ Пользователь",server_data.players.length, server_data.players);

    socket.on("get_data", (callback)=>{
        console.log("get_data...");
        callback({
            data:server_data,
            id:socket.id
        })
    })
    socket.on('change_data', (data) => {
        server_data = update_server_data(data)
        console.log("change_data...");
        io.emit('data', server_data);
    });
    socket.on('disconnect', (user) => {
        delete server_data.players[socket.id]
        update_server_data(server_data)
        console.log('Пользователь -');
    });
    function update_server_data(data){
        server_data = data;
        server_data.town.money = 0;
        let player_count = 0;
        for(const [key, player] of Object.entries(server_data.players))
        {
            player_count+=1;
            server_data.town.money+=player.money;
        }
        server_data.town.population = player_count;
        return server_data;
    }

});