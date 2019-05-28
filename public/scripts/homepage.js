$(document).ready(function(){
    //interactive modules
    $(".bigbutton#newroom").click(function(event){
        event.preventDefault();
        $(".pawnselect.modal").toggleClass("hidden shown");
        console.log("hey");
    });

    //make a connection to the game api server
    var socket = io();
});