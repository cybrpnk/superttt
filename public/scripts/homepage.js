///////////static/scripts/homepage.js//////////////
/////////client side ui implementation/////////////
//\\//\\//\\//\\SUPERTTT 1.0.0//\\//\\//\\//\\//\\/
///////////////////////////////////////////////////

//toolbox methods
//function to copy string to clipboard
//copyToClipboard(link)
const copyToClipboard = str => {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
};

//function to dynamically change url
//pushAble(newtitle, targeturl)
const pushAble = function(title, targeturl){
    var obj = { url: targeturl };
    window.history.pushState(obj, title, targeturl);
}


//wait until the page is rendered in the DOM to bind all of our code
$(document).ready(function(){
    //////////---GAME DEPENDENCIES (imagine setup())---///////////
    //make a connection to the game api server
    var socket = io();

    //discover and store base URL
    var baseurl = window.location.href.split("/").slice(0,3).join("/");
    //remember to save the game id
    var gameid = $("#gameid").val();
    //save which pawn each player is
    var mypawn = undefined;
    //save the last move (mainly for the last person who moved)
    var lastmove = "O";
    //also save the state of a clicked square being processed (usabiliy fix 6/6)
    var squareclicked = false;

    //connect if default gameid is already set, if so make proper updates
    if(gameid !== 0){
        socket.emit('handshake', gameid, function callback(){
            //debugging:
            console.log("you are connected to the grid.");
        });
    }

    //update new move from client helper
    function newMove(element){
        //double check the NEXT player is taking their turn
        //no second turns
        if(lastmove !== mypawn && !squareclicked){
            //flip the state of global clicked variable, to not spam the newmove event
            squareclicked = true;
            //send newmove command to server with all the needed arguments from the HTML itself
            socket.emit('newmove', gameid, mypawn + element.attr("id"), function(pass){
                //callback (passed to client after updateboard emit)
                //if the move passed
                if(pass){
                    //save the last moved player
                    lastmove = mypawn;
                }
                else {
                    console.log("invalid move thrown");
                }
                //reset our clicked boolean, and allow clicks again
                squareclicked = false;
            });
        }
        else {
            //non-breaking, if erroneous click is sent, but server has not responded
            //don't block trying again after 1 second
            setTimeout(function(){
                squareclicked = false;
            }, 1000);
        }
    }
    //////////---GAME DEPENDENCIES---/////////////////////////////
    //////////////////////////////////////////////////////////////


    //basic resizing rules - all web design should be as responsive as contextually possible
    $(".square.micro > div").fitText(.125);
    $(".bigbutton").fitText(0.7);
    //if in portrait mode
    var prevwidth = 0;
    function portrait(){
        if($(window).height() > $(window).width() && Math.abs($(window).width() - prevwidth) > 5){
            $(".choosepawn[for=xchoice], .choosepawn[for=ochoice]").fitText(0.145);
            $(".choosepawn[for=randomchoice]").fitText(0.65);
        }
        else {
            $(".choosepawn").css("font-size", '1em');
            console.log("flippy");
        }
        prevwidth = $(window).height();
    }
    //call portrait resizer function
    //once on document ready
    portrait();
    //again whenever page scales
    $(window).resize(portrait);


    //interactivity modules - watch user interaction on certain specified HTML elements
    //"interavtive" refers to jQuery's $(~element~).on( _event_, _handler_ ) method to
    //handle user interaction with the DOM (rendered HTML)
    //big buttons should do big things
    //(also our close buttons should close things)
    $(".bigbutton#newroom, .pawnselect.modal .close-mobile").click(function(event){
        //prevent default button response? whatever that wouldve been
        event.preventDefault();
        //toggle hide/show on the pawn selection/link sharing modal
        $(".pawnselect.modal").toggleClass("hidden shown");
    });

    //copy buttons should copy
    $(".pawnselect.modal .copylink").click(function(){
        copyToClipboard($("input.linkshare").val());
    });

    //on change refers to when the value of a form element changes
    //neat fact about radio buttons: all of them with the same "name" attribute
    //are related, and only one can be selected at a time
    $("input[name=playerchoice]").change(function(){
        //when an option is selected in terms of pawn choice, send the newroom signal
        socket.emit('newroom', parseInt($(this).attr("value"),10), function(link){
            //when you get a callback, save the gameid
            gameid = link;
            //update the link sharing text box to the lobby of the game
            $("input.linkshare").val(baseurl + "/game/" + gameid + "/lobby");
            //unhide the copy button
            $(".pawnselect.modal .copylink").removeClass("hidden");
            //push the new URL
            pushAble("Super Tic-Tac-Toe - Waiting for Players!", $("input.linkshare").val());
            //push the gameid to the local cache
            $("#gameid").val(gameid); 
            //reset game board (empty all squares, and reset legalities)
            $(".square.micro > div").html("");
            $(".square.meta, .square.micro").addClass("illegal").removeClass("legal");
        });
    });


    //reacting to socket events from server - these events are emitted from the server,
    //and we process them on the server side to reflect the changes in the server copy of the game
    //we receive the begingame function
    socket.on("begingame", function(pawn){
        //callback(pawn)
        //which pawn is mine?
        mypawn = pawn;
        //whoami
        $("#names .player").html(mypawn);
    });
    //update board accepts an array of meta tiles labeled M0-M8 to make legal/illegal for local play
    socket.on("updateboard", function(legalities, newmove, moves){
        //if there is no move update for us
        if(newmove != -1){
            $("#"+newmove[1]+newmove[2]+" > div").html(newmove[0]);
        }

        //reset all meta and micro squares to illegal
        ////old: i feel like this line isn't doing it's job properly
        //update: i was right, the class and click actions should be on the > div element
        //within each .square.micro
        $(".square.meta, .square.micro").addClass("illegal").removeClass("legal");
        //loop through all new legal areas, if they exist
        for(var i = 0; i < legalities.length; i++){
            //toggle new legal plays to 9 squares on the board
            $(".square.meta#" + legalities[i] + ", #" + legalities[i] + "> .square.micro").toggleClass("illegal legal");
        }

        //save the person who moved locally as last move
        if(newmove !== -1) lastmove = newmove[0];

        ////////////////////////////////////HELLO!!!!////////////////////////////////////
        ///////////////THIS IS WHERE CLICKS ARE REGISTERED TO THE SERVER/////////////////
        ///////////////IT'S VERY EASY TO LOSE TRACK OF, SO I WROTE THIS//////////////////
        //gameplay functionality - determines how the HTML board interacts with the API//
        ////~~~~~~~~~~~~~~~~~~~~~~~~~~very early stages!~~~~~~~~~~~~~~~~~~~~~~~~~~~~~////
        /////////////////////////////////////////////////////////////////////////////////
        $(".square.micro.legal > div").on("click", function(){
            //send the .square.micro jquery DOM object to our newmove function
            newMove($(this).parent());
            
            //debugging
            console.log("got a click on: " + $(this).parent().attr("id"));
        });
        $(".square.micro.illegal > div").on("click", function(){ /*does nothing*/ });
        /////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////EIND!!!/////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////


        //push new url with updated move number
        var targeturl = baseurl + "/game/" + gameid + "/" + moves;
        pushAble("Super Tic-Tac-Toe - Play Now!!!", targeturl);

        //debugging:
        console.log("I received a board update!");
    });
    //announces the winner of the game
    socket.on("winner", function(pawn){
        alert(pawn + " Wins!!!");
    });
    //toolbox socket events
    server.on('redirect', function(destination) {
        window.location.href = destination;
    });



//end of $(document).ready(function(){ ... });
});

////end of homepage.js