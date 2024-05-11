const express = require('express');
const app = express();
const path = require('path'); 
const pool = require("./db");
const multer = require("multer");
const upload = multer();
const urlencodedParser = express.urlencoded({extended: false});
require("dotenv").config(); 
const jwt = require("jsonwebtoken"); 
const cookieParser = require("cookie-parser");

const { createServer } = require("http");
const authController = require('./authController');
app.use(express.json());
app.use(cookieParser());

app.use(express.static('public'));
app.get("/", (req, res) => {
    if (!req.cookies.token) {
        return res.redirect("/login");
    }
    const token = req.cookies.token;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); 
        req.user = decoded; 
    } catch (error) {
        console.log(error);
        return res.redirect("/login"); 
    }
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post('/login',urlencodedParser,authController.login)
app.get('/login',(req,res)=>{
    res.sendFile(path.join(__dirname,"public" ,"login.html"));
})
app.post('/registration',urlencodedParser,authController.registration)
app.get('/registration',(req,res)=>{
    res.sendFile(path.join(__dirname,"public" ,"registration.html"));
})
app.post('/users',authController.getUsers)

const server = createServer(app);
const port = 3000;
server.listen(port, async () => {
    console.log(`server running at http://localhost:${port}`);
});

module.exports = server;