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
    tribute_timer: Date.now()+5*60*1000
}
let user_timers = {};
io.on('connection', (socket)=>{
    connections.push(socket.id);
    console.log("+ Пользователь", connections.length);

    socket.on('earn_money', async (callback) => {
        username = connections_names[socket.id];
        if (!user_timers[username]) {
            user_timers[username] = {}
            console.log("noname");
        }
        let earn_time = user_timers[username]["earn"];
        if (!earn_time || earn_time<Date.now()){
            user_timers[username]["earn"] = Date.now()+1*1000;
            console.log("new_earn_timer");
        }
        else{
            console.log("skip_earn_timer");
            return;
        }


        let query = `
        UPDATE public.players
        SET balance = balance+1, exp = exp+1
        WHERE login='${username}';
        SELECT balance FROM public.players WHERE login='${username}';
        `
        
        result = await pool.query(query);

        balance = result[1].rows[0].balance;
        callback(balance);
    });
    //Разместить товар на рынке
    socket.on('place_product', async(inventory_id) => {
        //Нужен good.id Убираем его из инвернторя и отправляем на маркет, игроку зачисляем стоимость товара
        let query = `
        INSERT INTO public.market
        (id, good_id, "cost", vendor_id, "date")
        VALUES(
        (select coalesce(max(id)+1, 1) from market), 
        (select good_id from inventory where id = ${inventory_id}), 
        (select cost from items where id = (select good.item_id from good where id = (select good_id from inventory where id = ${inventory_id}))), 
        (select player_id from inventory where id = ${inventory_id}), 
        CURRENT_TIMESTAMP);
        UPDATE public.players 
        SET balance = balance+(select cost from items where id = (select good.item_id from good where id = (select good_id from inventory where id = ${inventory_id})))
        WHERE id=(select player_id from inventory where id = ${inventory_id});
        delete from inventory where id = ${inventory_id};
        `;
        result = await pool.query(query);
        console.log(result);
    });
    //Кнопки для строительства
    socket.on('build_buttons', async (callback)=>{
        let query = `
        SELECT * FROM buildings
        WHERE position IS NULL
        ORDER BY cost
        `;
        try{
            const data = await pool.query(query);
            callback(data.rows)
        }catch{
            
        }
    })
    
    //Купить товар на рынке
    socket.on('buy_product', async(market_id) => {
        //Нужен good.id Убираем его из инвернторя и отправляем на маркет, игроку зачисляем стоимость товара
        let query =`
        WITH selected_market AS (
            SELECT good_id, vendor_id, cost
            FROM public.market
            WHERE id = ${market_id} -- здесь вы задаёте ID один раз
        )
        -- Вставить товар в инвентарь
        INSERT INTO public.inventory
            (id, player_id, good_id, count)
            SELECT (select coalesce(max(id)+1, 1) from inventory), selected_market.vendor_id, good_id, 1
            FROM selected_market;
        
        WITH selected_market AS (
            SELECT good_id, vendor_id, cost
            FROM public.market
            WHERE id = ${market_id} -- здесь вы задаёте ID один раз
        )
        -- Обновить баланс игрока
        UPDATE public.players 
            SET balance = balance - (SELECT cost FROM selected_market)
            WHERE id = (SELECT vendor_id FROM selected_market);
        
        -- Удалить товар с рынка
        DELETE FROM public.market
            WHERE id = ${market_id}
        `;
        result = await pool.query(query);
        console.log(result);
    });

    //события орды
    socket.on('orda_win', async () => {
        console.log("Сопротивление!");
    });
    socket.on('orda_lose', async () => {
        console.log("Дань");
    });
    //Получение всей информации доступной игроку
    
    async function get_info(token){
        let population, treasury, result, pole, query;
        // * POLE
        /**
         * Берём построеные здания
         * и выставляем их на поле
         */
        query = `
        SELECT *
        FROM public.buildings
        WHERE position IS NOT NULL
        `
        result = await pool.query(query);
        pole = [];
        for (cordX in [1,2,3,4,5,6,7,8]){
            pole[cordX] = [];
            for (cordY in [1,2,3,4,5,6,7,8]){
                if (cordX>0 && cordX<5 && cordY>0 && cordY<5){
                    pole[cordX][cordY] = 1;
                }else{
                    pole[cordX][cordY] = 0;
                }
            }
        }
        let pos = [0,0];
        for (building of result.rows){
            pos = building.position;
            pole[pos.x][pos.y] = building.type;
        }
        // * POPULATION
        query = `
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
        if (player.intelligence>(player.agility+player.strength)){
            //интеллект
            player.class = "Монах";
        }else if(player.agility>(player.strength+player.intelligence)){
            //ловкость
            player.class = "Витязь";
        }else if(player.strength>(player.agility+player.intelligence)){
            //сила
            player.class = "Богатырь";
        }else if((player.strength+player.agility+player.intelligence)>=10){
            // все и сразу
            player.class = "Князь";
        }else if((player.strength+player.agility+player.intelligence)>=4){
            // средне
            player.class = "Боярин";
        }else{
            // ничего
            player.class = "Крестьянин";
        }
        if ((timers.tribute_timer-Date.now())<0){
            tribute_cost = 5;
            //Орда наступает!
            if(player.balance<=0){
                socket.emit("tribute",-1);
                tribute_cost = 0;
            }else if(player.strength<1){
                socket.emit("tribute",0);
            }else if(player.strength<4){
                socket.emit("tribute",1);
            }else{
                socket.emit("tribute",2);
                tribute_cost = 6;
            }
            let query = `
            UPDATE public.players
            SET balance = balance-LEAST(balance, ${tribute_cost})
            WHERE login='${username}';
            `
            
            result = await pool.query(query);
            timers.tribute_timer = Date.now() +5*60*1000
            result = await pool.query(query);
        }
        inventory = await get_inventory(username);
        market = await get_market(username);
        // console.log(inventory);
        query = `
        UPDATE public.players
        SET level = level+1, exp = 0
        WHERE exp>(level*10+5);
        `
        result = await pool.query(query);
        return {
            inventory: inventory.rows,
            market: market.rows,
            player:player,
            population:population,
            treasury:treasury,
            id:socket.id,
            tribute_timer:timers.tribute_timer-Date.now(),
            pole:pole,
        }
    }
    socket.on('get_info', async (token, callback)=>{
        console.log("tick", Date.now());
        const data = await get_info(token)
        callback(data)
    })

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
    socket.on("place_building", async (info)=>{
        //размещение здания
        console.log(connections_names[socket.id], socket.id);
        user = connections_names[socket.id];
        query = `
        UPDATE public.buildings
        SET "date"=CURRENT_TIMESTAMP,
        "author_id"=(select id from players where login = '${user}'),
        "position"='${info.position}'
        WHERE id=${info.id};
        UPDATE public.players 
        SET balance = balance-(select cost from public.buildings where id = ${info.id})
        WHERE login='${user}';`;
        console.log(query);
        build = await pool.query(query);
        console.log(build);
        return build;
    })
    socket.on("tap_building", async (building_name)=>{

    })
    socket.on('craft_statuet', async (callback) => {
        console.log(connections_names[socket.id], socket.id);
        user = connections_names[socket.id];
        item_id = 1;
        // Крафт фигурки
        query = `
        INSERT INTO public.good
        (id, author_id, item_id)
        VALUES(
        (select coalesce(max(id)+1,1) from good), 
        (select id from players where login = '${user}'), 
        ${item_id});
        INSERT INTO public.inventory
        (id, player_id, good_id, count)
        VALUES(
        (select coalesce(max(id)+1,1) from public.inventory), 
        (select id from players where login = '${user}'), 
        (select max(id) from good),
        1);
        UPDATE public.players
        SET balance=balance-5, exp=exp+3
        WHERE login='${user}';
        `;
        craft = await pool.query(query);
        console.log(`${user} - крафтит статуэтку`);
        inventory = await get_inventory(user);
        callback(inventory);
    });
    async function get_inventory(user){
        // Получение инвентаря
        get_inventory_query = /**sql*/`
        SELECT inventory.id as inventory_id, player.name  as current_player, goods.author_id as author, items.*, inventory.count 
        FROM public.players as player
        left join public.inventory as inventory on inventory.player_id = player.id
        left join public.good as goods on good_id = goods.id
        left join public.items as items on goods.item_id = items.id
        where "login" = '${user}';
        `;
        inventory = await pool.query(get_inventory_query);
        return inventory;
    }
    async function get_market(user){
        // Получение инвентаря
        get_market_query = /**sql*/`
        SELECT market.id as market_id, vendor_id, items.name, items.level, market.cost, players.name as vendor
        FROM public.market as market
        left join public.good as goods on good_id = goods.id
        left join public.items as items on goods.item_id = items.id
        left join public.players as players on vendor_id = players.id;
        `;//where "vendor_id" != '${user}'
        market = await pool.query(get_market_query);
        return market;
    }
});