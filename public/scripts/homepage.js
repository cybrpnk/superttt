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
        if(lastmove !== mypawn){
            //send newmove command to server with all the needed arguments from the HTML itself
            socket.emit('newmove', gameid, mypawn + element.attr("id"), function(){
                element.children("div").html(mypawn);
            });
        }
    }
    //////////---GAME DEPENDENCIES---/////////////////////////////
    //////////////////////////////////////////////////////////////


    //basic resizing rules - all web design should be as responsive as contextually possible
    $(".square.micro > div").fitText(.125);


    //interactivity modules - watch user interaction on certain specified HTML elements
    //"interavtive" refers to jQuery's $(~element~).on( _event_, _handler_ ) method to
    //handle user interaction with the DOM (rendered HTML)
    //big buttons should do big things
    $(".bigbutton#newroom").click(function(event){
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

        //reset all meta squares to illegal
        //i feel like this line isn't doing it's job properly
        $(".square.meta").addClass("illegal").removeClass("legal");
        //loop through all new legal areas, if they exist
        for(var i = 0; i < legalities.length; i++){
            //toggle new legal plays
            $(".square.meta#" + legalities[i]).toggleClass("illegal legal")
        }

        //save the person who moved locally as last move
        if(newmove !== -1) lastmove = newmove[0];

        //gameplay functionality - determines how the HTML board interacts with the API
        //very early stages!
        $(".square.meta.legal > .square.micro").on("click", function(){
            newMove($(this));
            
            //debugging
            console.log("got a click on: " + $(this).attr("id"));
        });
        $(".square.meta.illegal > .square.micro").on("click", function(){});

        //push new url with updated move number
        var targeturl = baseurl + "/game/" + gameid + "/" + moves;
        pushAble("Super Tic-Tac-Toe - Play Now!!!", targeturl);

        //debugging:
        console.log("I received a board update!");
    });



//end of $(document).ready(function(){ ... });
});

////end of homepage.js