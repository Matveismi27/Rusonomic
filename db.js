const { Pool } = require('pg');
const pool = new Pool({
    host:'45.146.165.71',
    port:5438,
    user: "postgres",
    password: "Mpxh3927",
    database: "rusonomic"
})
module.exports = pool;