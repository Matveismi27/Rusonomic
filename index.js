const server = require("./routes");
const { Server } = require("socket.io");
const pool = require("./db");
const crypto = require('node:crypto');
require("dotenv").config(); 
const jwt = require("jsonwebtoken"); 
const { log } = require("node:console");
const { platform } = require("node:os");
const io = new Server(server);

let connections = [];
let connections_names = {};
let timers = {
    tribute_timer: Date.now()+3*60*1000
}
io.on('connection', (socket)=>{
    connections.push(socket.id);
    console.log("+ Пользователь", connections.length);

    socket.on('earn_money', async (callback) => {
        username = connections_names[socket.id];
        let query = `
        UPDATE public.players
        SET balance = balance+1
        WHERE login='${username}';
        SELECT balance FROM public.players WHERE login='${username}';
        `
        
        result = await pool.query(query);

        balance = result[1].rows[0].balance;
        callback(balance);
        /*
        // if (server_data.players[id].timers.earn<Date.now())
        Promise.resolve().then(()=>{
            console.log(id+" earning wood");
            if (server_data.players[id].inventory["wood"]){
                server_data.players[id].inventory["wood"].count+=1;
            }else{
                server_data.players[id].inventory["wood"] = {
                    name:"wood",
                    count:1
                }
            }
            // server_data.players[id].timers.earn = Date.now()+60000;
        }).then(()=>{
            console.log(server_data.players);
            io.emit('data', server_data);
        })
        */
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
        if (!$player) { //Если есть игрок
            return;
        }
        if (!$player.inventory[data.product]) { //если есть товар
            return;
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
    //Получение всей информации доступной игроку
    
    async function get_info(token){
        let population, treasury, result;
        // * POPULATION
        let query = `
        SELECT count(login)
        FROM public.players;
        `
        result = await pool.query(query);
        population = result.rows[0].count;
        // * TREASURY
        query = `
        SELECT sum(balance)
        FROM public.players;
        `
        result = await pool.query(query);
        treasury = result.rows[0].sum;
        // * CURRENT PLAYER

        const claims = atob(token.split('.')[1])
        const username = JSON.parse(claims).username
        query = `
        SELECT "name", "level" , balance, strength, agility, intelligence
        FROM public.players
        where "login" = '${username}';
        `
        connections_names[socket.id] = username;
        result = await pool.query(query);
        player = result.rows[0];
        inventory = await get_inventory(username);
        if ((timers.tribute_timer-Date.now())<0){
            timers.tribute_timer = Date.now() +3*60*1000
        }
        return {
            inventory: inventory.rows,
            player:player,
            population:population,
            treasury:treasury,
            id:socket.id,
            tribute_timer:timers.tribute_timer-Date.now(),
        }
    }
    socket.on('get_info', async (token, callback)=>{
        const data = await get_info(token)
        callback(data)
    })
    function send_all_data(){
        // ? В данный момент не работает, по задумке отправляло всем пользователям всю дату
        // for (player_name of connections_names){
        //     get_info
        // }
    }
    //Отключение от сервера
    socket.on('disconnect', (user) => {
        console.log(connections_names[socket.id], socket.id);
        delete connections_names[socket.id];
        connections = connections.filter(function( obj ) {
            return obj != socket.id;
        });

        console.log('Пользователь -');
    });

    //Действия игрока
    socket.on('craft_statuet', async (callback) => {
        console.log(connections_names[socket.id], socket.id);
        user = connections_names[socket.id];
        item_name = "статуетка";
        // Крафт статуэтки
        query = /*sql*/`
        INSERT INTO public.good
        (id, author_id, item_id)
        VALUES(
        (select max(id)+1 from good), 
        (select id from players where login = '${user}'), 
        (select id from items where name = '${item_name}'));
        INSERT INTO public.inventory
        (id, player_id, good_id, count)
        VALUES(
        (select max(id)+1 from public.inventory), 
        (select id from players where login = '${user}'), 
        (select max(id) from good),
        1);
        UPDATE public.players
        SET balance=balance-2
        WHERE login='${user}';
        `;
        craft = await pool.query(query);
        console.log(`${user} - крафтит статуэтку`);
        inventory = await get_inventory(user);
        callback(inventory);
    });
    async function get_inventory(user){
        // Получение инвентаря
        query = /*sql*/`
        SELECT player.name  as current_player, goods.author_id as author, items.*, inventory.count 
        FROM public.players as player
        left join public.inventory as inventory on inventory.player_id = player.id
        left join public.good as goods on good_id = goods.id
        left join public.items as items on goods.item_id = items.id
        where "login" = '${user}';
        `;
        inventory = await pool.query(query);
        return inventory;
    }
});