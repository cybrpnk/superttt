//make a connection to the game api server
var socket = io();

setTimeout(function(){
    socket.emit('newroom', -1);
    console.log("msg sent");

},3000);
