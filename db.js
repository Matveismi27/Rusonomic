const { Pool } = require('pg');
const pool = new Pool({
    host:'db',
    port:5432,
    user: "admin",
    password: "Mpxh3927",
    database: "rusonomic"
})
module.exports = pool;