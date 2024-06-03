const pool = require("./db");
const crypto = require('node:crypto');
require("dotenv").config(); 
const jwt = require("jsonwebtoken"); 
var emailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
function isEmailValid(email) {
    if (!email)
        return false;
    if(email.length>254)
        return false;
    var valid = emailRegex.test(email);
    if(!valid)
        return false;
    // Further checking of some things regex can't handle
    var parts = email.split("@");
    if(parts[0].length>64)
        return false;
    var domainParts = parts[1].split(".");
    if(domainParts.some(function(part) { return part.length>63; }))
        return false;
    return true;
}
class authController{
    async registration(req, res){
        console.log("registration");
        try {
            if (!isEmailValid(req.body.email)){
                res.send("Некорректный email");
                return;
            }
            console.log(req.body);
            console.log(req.body.password);
            if (req.body.password == req.body.confirm_password && req.body.username && req.body.password){
                let password = crypto
                        .createHmac("sha256", process.env.HASH_SECRET)
                        .update(req.body.password)
                        .digest("base64");
                let query = `
                INSERT INTO public.players
                ("name", "level", balance, "date", "password", login)
                VALUES('${req.body.username}', 0, 0, CURRENT_TIMESTAMP, '${password}', '${req.body.username}');
                `;
                await pool.query(query);
                res.redirect("/login");

            }else{
                res.send("Проверьте правильность введённых данных");
            }
            
        } catch (error) {
            if (error.constraint == "players_unique"){
                await res.redirect("/registration");
            }
            console.log(error);
        }
    }

    async login(req, res){
        console.log("login");
        try {
            try {
                let query = `
                    SELECT login, password
                    FROM public.players;
                `;
                let result = await pool.query(query);
                console.log(result.rows);
                console.log(req.body);
                let rows = result.rows
                for (let row of rows){
                    if (row.login == req.body.username){
                        const username = req.body.username;
                        const hash = crypto
                            .createHmac("sha256", process.env.HASH_SECRET)
                            .update(req.body.password)
                            .digest("base64");
                        if( row.password == hash){
                            // Удачно
                            console.log("Удачная авторизация");
                            const token = jwt.sign({ username },  
                            process.env.JWT_SECRET_KEY, { 
                                expiresIn: "23h" 
                            }); 
                            req.body.token = token;
                            return res.json({ username, token, msg: "Login Success" });
                        }else{
                            console.log("Неудачная попытка авторизоваться");
                            return res.json({msg:"Пароли не совпадают", code:401});
                        }
                    }
                }
                console.log("Пользователь не найден");
                return res.json({msg: "Пользователь не найден", code:401});
            } catch (error) {
                console.log(error);
            }
        } catch (error) {
            console.log(error);
        }
    }

    async getUsers(req, res){
        console.log("getUsers");
        
    }
}
module.exports = new authController();