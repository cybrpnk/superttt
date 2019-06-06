/////// app.js - main node.js server
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
const Random = require("random-js").Random;
const random = new Random(); // uses the nativeMath engine
const crypto = require('crypto');

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

// a request to the bare URL should take you to the home page
// index (aka "home") page 
app.get('/', function(req, res) {
    //send home, with no gameid
    res.render('pages/index', { gameid: 0 });
});


// game lobby page, for link sharing, etc 
app.get('/game/:id/lobby', function(req, res) {
    //request the specific board from games object, by board.id
    var findgame = games[req.params.id];
    //check the number of players in the lobby (if game exists)
    //if there is only one, go ahead and join
    //send main page with gameid passed

    //if you're allowed to sit with us
    if(findgame !== undefined && (findgame.players.x == undefined || findgame.players.o == undefined)){
        //pass found gameid from URL to EJS
        res.render('pages/index', { gameid: req.params.id });
    }
    else res.redirect("/");
    //if not, go home
});

// game specific page, for backtracking, etc 
app.get('/game/:id/:move', function(req, res) {
    var findgame = games[req.params.id];
    
    //if the game exist
    if(findgame !== undefined){
        //pass found gameid from URL to EJS
        res.render('pages/index', { gameid: req.params.id });
    }
    else res.redirect("/");
    //if not, go home
});

//transparent redirect to home, if no gameid specified
app.get('/game', function(req,res){
    res.redirect("/");
    //you're drunk, go home
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
var games = {};

//import the board class from gameapi.js
var game = require("./modules/gameapi.js");

//declare gameplay constants
var xopening = ["M0","M1","M2","M3","M4","M5","M6","M7","M8"];
//declare valid move notation format (in regex format)
//regex equivalent of [beginning of string](X or O)(A-I)(0-9)[end of string]
var validmove = /^(X|O)([A-I])\d$/


//////TO DO:   ///////////////////////////////
//////create disconnect and rejoining events//

//////////////////////////////////////////////

//when a user enters the site!
//note: we still need to make a disconnect event
io.on('connection', function(socket){
    //identify connection the connection
    var connection = socket.id;
    //push to global players array
    players.push(connection);

    //log the id of the connection
    console.log("new game socket named: " + connection);



    //when recieving a command for a new room
    socket.on('newroom', function(pawnchoice, callback){
        var p1pawnchoice;
        console.log(pawnchoice);
        //if pawnchoice isn't gibberish
        if (pawnchoice >= -1 && pawnchoice <= 1){
            //if random is chosen, decide for player1 here
            if (pawnchoice == -1) p1pawnchoice = (random.bool()) ? 1 : 0 ;
            //if a specific pawn is chosen by player1, they have dibs
            else p1pawnchoice = pawnchoice;

            //create game board object
            var board = new game.Board(crypto.randomBytes(8).toString('hex') + Object.keys(games).length.toString(), [socket.id, undefined], p1pawnchoice);
            //push it to global games array
            games[board.id]= board;

            //send the board.id property we just randomly set to the client to generate link
            callback(board.id);
            
            //debugging:
            console.log(board);
        }
        else {
            console.log("ERROR: MISTHROWN PAWNCHOICE");
        }
    });

    //handshake is run at the beginning of homepage.js, if gameid is preset
    //checks if user is joining an existing game, with passed gameid
    socket.on('handshake', function(gameid, callback){
        //get game object locally
        var findgame = games[gameid];
        //make sure the game exists
        if( findgame !== undefined){
            //if user is specifically joining a lobby that has been created
            if(findgame.players.o === undefined || findgame.players.x === undefined){
                //add this player's socket.id to the players property on the board
                if(findgame.players.o === undefined) findgame.players.o = connection;
                else findgame.players.x = connection;
                //send the command to initiate the game with pawns assigned to appropriate players
                io.to(findgame.players.x).emit("begingame", "X");
                io.to(findgame.players.o).emit("begingame", "O");
                //tell the clients to update board legalities, and prepare for the first move
                io.to(findgame.players.x).emit("updateboard", xopening, -1, 1);
                io.to(findgame.players.o).emit("updateboard", [], -1, 1);

                //debugging:
                console.log("connection successful! ... " + findgame.players.x + " vs. " + findgame.players.o);

                callback();
            }
            else {
                //error: game is full
                socket.emit('redirect', '/');
                console.log("game is full :(");
            }
        }
        else {
            //error: game does not exist
            socket.emit('redirect', '/');
        }
    });

    //when any client send the newmove command, it's run through here
    //socket.emit('newmove', saved-gameid, themove, callback())
    socket.on('newmove', function(gameid, move, callback){
        //debugging:
        console.log("Incoming: new move recieved: " + move);
        //get game object locally
        var findgame = games[gameid];

        //if game exists in games object
        //if games object isn't empty
        if(findgame !== undefined && Object.keys(games).length > 0){
            //simple server-side validation of the move argument
            //before we make a call to the API
            if(validmove.test(move)){
                //send the makeMove command to the Board API, and save the return as themove
                var themove = findgame.makeMove(move);
                //double check that the move validated through the notation API function
                if(themove !== false){
                    //debugging:
                    console.log("approved new move from client side socket event");
                    //return of makeMove function is saved, because makeMove() method
                    //should be in charge of all validation to pushing to the board array
                    //then should return any errors, and fail gracefully
                    //a future implementation of this socket event should have stricter rules based on makeMove()'s return
                    //if the move is from x
                    if(themove[0] === 1 ) {
                        //update both players local boards, updating new legal moves, and moves to be added to the board
                        io.to(findgame.players.o).emit("updateboard", ["M" + findgame.nextLegal.toString()], move, findgame.movelist.length);
                        io.to(findgame.players.x).emit("updateboard", [], move, findgame.movelist.length);
                    }
                    //if the move is from o
                    if(themove[0] === -1){
                        //update both players local boards, updating new legal moves, and moves to be added to the board
                        io.to(findgame.players.x).emit("updateboard", ["M" + findgame.nextLegal.toString()], move, findgame.movelist.length);
                        io.to(findgame.players.o).emit("updateboard", [], move, findgame.movelist.length);
                    }
                    
                    //if a winner was declared this move
                    if(themove[3] !== undefined){
                        //let the players know
                        io.to(findgame.players.x).emit("winner", themove[3]);
                        io.to(findgame.players.o).emit("winner", themove[3]);
                    }

                    //debugging
                    console.log(findgame.meta);
                    console.log("[" + findgame.movelist + "]");

                    //confirm newmove sucessfully passed, and callback
                    callback(true);
                }
                else {
                    console.log("Error: [f]ake moves! but it passed regex!");
                    callback(false);
                }
            }
            else {
                console.log("Error: [f]ake moves! it did NOT pass regex.");
                callback(false);
            }
        }
        else {
            console.log("Error on newmove: game does not exist");
            callback(false);
        }

    ////end of socket.on('newmove', function(gameid, move, callback) { ... });
    });

    
    //to be built "find game"/matchmaking function
    //potentially using OAUTH accounts and ELO
    socket.on('matchmaking', function(){
        
    });



    //end of io.on('connection', function(socket){ ... });
});

////--end of app.js--////