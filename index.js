
const pool = require("./db");
const server = require("./routes");
const { Server } = require("socket.io");

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
const server_market = {
    goods:[]
};

io.on('connection', (socket)=>{
    server_data.players[socket.id] = {
        name:"Имя",
        text : "игрок 1",
        level : 0,
        class : "Ремесленник",
        money: 0,
        inventory:{}
    };
    console.log("+ Пользователь", server_data.players.length, server_data.players);

    socket.on("get_data", (callback)=>{
        console.log("get_data...");
        callback({
            data:server_data,
            id:socket.id
        })
    })
    // socket.on('change_data', (data) => {
    //     server_data = update_server_data(data)
    //     console.log("change_data...");
    //     io.emit('data', server_data);
    // });
    socket.on('earn_wood', (id) => {
        
        console.log(id+" earning wood");
        if (server_data.players[id].inventory["wood"]){
            server_data.players[id].inventory["wood"].count+=1;
        }else{
            server_data.players[id].inventory["wood"] = {
                name:"wood",
                count:1
            }
        }
        server_data.players[id].timers.earn = Date.now()+60;
        io.emit('data', server_data);
    });
    //Разместить товар на рынке
    socket.on('place_product', (ctx) => {
        //Собираем данные
        const data = {
            player_id: ctx.player_id,
            product_label: ctx.product_label,
            product: ctx.product,
            product_cost: ctx.product_cost,
        };
        //Проводим валидацию
        $player = server_data.players[data.player_id];
        if ($player) { //Если есть игрок
            $player.inventory
        }
        //Отправляем товар на рынок
        server_market.goods.push(data);
    });
    //Запросить рынок
    socket.on('get_market', (callback) => {
        console.log("get_market...");
        callback({
            data:server_market,
            id:socket.id
        })
    });
    //Купить товар на рынке
    socket.on('buy_product', (ctx) => {
        const {player_id, product_id} = ctx;
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