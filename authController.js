const pool = require("./db");


class authController{
    async registration(req, res){
        console.log("registration");
        try {
            console.log(req.body);
            console.log(req.body.password);
        } catch (error) {
            console.log(error);
        }
    }

    async login(req, res){
        console.log("login");
        try {
            console.log(req);
        } catch (error) {
            console.log(error);
        }
    }

    async getUsers(req, res){
        console.log("getUsers");
        try {
            let query = `
            SELECT id, "name", "level", balance, "date", login
            FROM public.players;
            `;
            let result = await pool.query(query);
            res.json(result.rows);
        } catch (error) {
            console.log(error);
        }
    }
}
module.exports = new authController();