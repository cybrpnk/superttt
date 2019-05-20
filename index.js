/////// index.js
// load "express", a node library to pass variables to an HTML page server-side
// --tagged: model-view-controller (MVC) framework
// --credit: https://scotch.io/tutorials/use-ejs-to-template-your-node-application
///////
var express = require('express');
var app = express();
var socket = require('socket.io');

// set the view engine to ejs
app.set('view engine', 'ejs');

// globally rename certain directories within the file structure 
// to simplify view files
// e.g. static/css/whatever.css redirects internally to /public/css/whatever.css
app.use('/static', express.static('public'))



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

//set up websockets
var io = socket(server);

io.on('connection', function(socket){
    console.log("new socket named: " + socket.id);
});