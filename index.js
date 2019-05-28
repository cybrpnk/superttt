/////// index.js
// load "express", a node library to pass variables to an HTML page server-side
// --tagged: model-view-controller (MVC) framework
// --credit: https://scotch.io/tutorials/use-ejs-to-template-your-node-application
///////

//require all needed modules
var express = require('express');
var app = express();
var socket = require('socket.io');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var csrf = require('csurf');
var sharedsession = require("express-socket.io-session");

// set the view engine to ejs
app.set('view engine', 'ejs');

//creating express session
var session = app.use(session({
    secret: '3037c64d4d5e35ef4779f2df135bb9c8',
    cookie: {
      httpOnly: true,
      secure: true,
    },
    resave: true,
    saveUninitialized: true
  }));
  
app.use(csrf());

// globally rename certain directories within the file structure 
// to simplify view files
// e.g. static/css/whatever.css redirects internally to /public/css/whatever.css
app.use('/static', express.static('public'))
//app.use('/modules', express.static('modules'))


// use res.render to load up an ejs view file

// index (aka "home") page 
app.get('/', function(req, res) {
    res.render('pages/index');
});

// main game page 
app.get('/play', function(req, res) {
    res.render('pages/play');
});


//start the server on localhost at the specified port
//call "  npm start  " in the terminal to begin the server
//i.e. go to firefox, etc: http://localhost:31415
var server = app.listen(31415, function(){
    console.log('Live on port :31415!');
});



//////////////////////////////////////
//GAME SERVER FRONT-END SERVER LOGIC//
//////////////////////////////////////
//set up websockets
const io = socket(server);

//all players active and online rn (array of players' socket.ids)
var players = [];

//all games in existence (array of board objects [games])
var games = [];

//import the board class from gameapi.js
var game = require("./modules/gameapi.js");

io.on('connection', function(socket){
    //identify connection the connection
    var connection = socket.id;
    //push to global players array
    players.push(connection);

    //log the id of the connection
    console.log("new game socket named: " + connection);

    //when recieving a command for a new room
    socket.on('newroom', function(pawnchoice){
        //create game board object
        var myboard = new game.Board(Date.now().toString() + "-" + games.length.toString(), socket.id, undefined);
        //push it to global games array
        games.push(board);
        
        //debugging:
        console.log(board);
        board.makeMove("XE5");
        console.log(board);
    });

    socket.on('matchmaking', function(){
        
    });
});