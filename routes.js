const express = require('express');
const app = express();
const path = require('path'); 
const pool = require("./db");
const multer = require("multer");
const upload = multer();

const { createServer } = require("http");
const authController = require('./authController');
app.use(express.json());

app.use(express.static('public'));
app.get("/", (req, res) => {
    if (!req.body.token) {
        console.log(req.body);
        res.redirect("/login");
    }
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post('/login',authController.login)
app.get('/login',(req,res)=>{
    res.sendFile(path.join(__dirname,"public" ,"login.html"));
})
app.post('/registration',authController.registration)
app.get('/registration', upload.none(),(req,res)=>{
    res.sendFile(path.join(__dirname,"public" ,"register.html"));
})
app.post('/users',authController.getUsers)

const server = createServer(app);
const port = 3000;
server.listen(port, async () => {
    console.log(`server running at http://localhost:${port}`);
});

module.exports = server;