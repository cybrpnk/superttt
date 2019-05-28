////single game instance metaphor
////global game API

//toolbox
var isEqual = function (value, other) {

    // Get the value type
    var type = Object.prototype.toString.call(value);

    // If the two objects are not the same type, return false
    if (type !== Object.prototype.toString.call(other)) return false;

    // If items are not an object or array, return false
    if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;

    // Compare the length of the length of the two items
    var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
    var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
    if (valueLen !== otherLen) return false;

    // Compare two items
    var compare = function (item1, item2) {

        // Get the object type
        var itemType = Object.prototype.toString.call(item1);

        // If an object or array, compare recursively
        if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
            if (!isEqual(item1, item2)) return false;
        }

        // Otherwise, do a simple comparison
        else {

            // If the two items are not the same type, return false
            if (itemType !== Object.prototype.toString.call(item2)) return false;

            // Else if it's a function, convert to a string and compare
            // Otherwise, just compare
            if (itemType === '[object Function]') {
                if (item1.toString() !== item2.toString()) return false;
            } else {
                if (item1 !== item2) return false;
            }

        }
    };

    // Compare properties
    if (type === '[object Array]') {
        for (var i = 0; i < valueLen; i++) {
            if (compare(value[i], other[i]) === false) return false;
        }
    } else {
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                if (compare(value[key], other[key]) === false) return false;
            }
        }
    }

    // If nothing failed, return true
    return true;

};

//what are all the winning positions?
var winning = [ [1,1,1,0,0,0,0,0,0],
                [1,0,0,1,0,0,1,0,0],
                [1,0,0,0,1,0,0,0,1],
                [0,1,0,0,1,0,0,1,0],
                [0,0,1,0,1,0,1,0,0],
                [0,0,1,0,0,1,0,0,1],
                [0,0,0,1,1,1,0,0,0],
                [0,0,0,0,0,0,1,1,1]];



////send Board class as export through nodejs module
module.exports = {
    //everything that exists in this game, and ever will
    Board: class {
        constructor(gameid, player1, player2){
            //stores session info about the two players, 
            //to be updated when called by function
            this.xplayer, this.oplayer, 
                this.players = [player1, player2];
            

            //stores gameid for future server-side processin
            this.id = gameid;
            
            //X = 1, O = -1, Empty = 0
            //address state multidimensional array with
            //example: this.state[4][4] 
            this.state= [   [0,0,0,0,0,0,0,0,0],
                            [0,0,0,0,0,0,0,0,0],
                            [0,0,0,0,0,0,0,0,0],
                            [0,0,0,0,0,0,0,0,0],
                            [0,0,0,0,0,0,0,0,0],
                            [0,0,0,0,0,0,0,0,0],
                            [0,0,0,0,0,0,0,0,0],
                            [0,0,0,0,0,0,0,0,0],
                            [0,0,0,0,0,0,0,0,0]];

            //THIS DETERMINES THE ENTIRE WIN/LOSS FOR THE WHOLE GAME
            this.meta = [0,0,0,
                        0,0,0,
                        0,0,0];



            
            this.columns = ["A","B","C","D","E","F","G","H","I"];
            this.rows = ["1","2","3","4","5","6","7","8","9"];            
            //stores a list of past moves
            this.movelist = [];
            

        }

        //notation accepts THREE CHARACTERS ONLY
        //[PLAYER][X IN A,B,C...I COLUMNS][Y IN 1,2,3...9 ROWS]
        //examples: XE5- X to center of the board
        //examples: OI9- O to bottom right corner
        //this function intakes a notated move, and spits out details as an array
        //outputs: ["X",4,4]
        //outputs: ["O",8,8]
        //remember off by zero, board is a multidimensional array [0-8][0-8]
        notation(move) {
            if(move.length === 3){
                //break move argument into pieces
                var firstchar = move[0];
                var Xinput = move[1];
                var Yinput = move[2];

                //validate move,
                //first by checking if player is only X or O
                if(firstchar == "X" || firstchar  == "O"){
                    //check if input position is found in available rows and columns
                    var boardX = this.columns.indexOf(Xinput);
                    var boardY = this.rows.indexOf(Yinput);

                    //second, if valid move positions are found in both domains, move on
                    if(boardX != -1 && boardY != -1){
                        //third, if boardX, boardY have not been filled in yet, move on
                        if(this.state[boardX][boardY] == 0){
                            var player = (firstchar == "X")? 1 : -1;
                            return [player,boardX,boardY];
                        }
                        else {
                            console.log("Illegal: board position already claimed, thrown in move notation");
                            return ['"' + firstchar + '"',-1,-1];
                        }
                    }
                    else { 
                        console.log("Non-breaking: Erroneous board position thrown in move notation");
                        return [0,-1,-1];
                    }
                }
                else { 
                    console.log("Non-breaking: Erroneous player thrown in move notation");
                    return [0,-1,-1];
                }
            }
            else { 
                console.log("Non-breaking: Erroneously short or long argument thrown into move notation"); 
                return [0,-1,-1];
            }
        }
        
        //codified win conditions/rules
        isWinning() {
            //create win arrays for X and O
            //pos evaluates for 1, neg evaluates for -1
            var pos = [];
            var neg = [];


            //assume no wins so far
            var xwon = false;
            var owon = false;

            //evaluate macro board by breaking it up into wins per team arrays
            for(var m=0; m<8; m++){
                //check in a positive direction (aka X)
                if(this.meta[m] === 1) pos[m] = 1;
                //check in a negative direction (aka O)
                if(this.meta[m] === -1) neg[m] = 1;
            }

            //loop through win conditions
            for(var c=0; c<8; c++){
                //pattern match to see if either palyer has won the meta
                if(isEqual(pos,winning[c])) xwon = true;
                if(isEqual(neg,winning[c])) owon = true;
            }

            //double check there's no error with our code
            if(xwon && owon) console.log("MEGA-ERROR: I THINK BOTH OF YALL WON THE GAME");
            else {
                //log final victory
                if(xwon) console.log("X Wins!");
                if(owon) console.log("O Wins!");
            }
        }



        //primary tool used to validate moves on the local boards
        //this function updates master state function, which will ultimately
        //determine the game.
        checkLocales() {
            //determine if a player is winning in a local board
            for(var m=0; m<8; m++){
                //check if specified meta locale has been won,
                //dont waste compute if it has
                if(this.meta[m] === 0){
                    //create win arrays for X and O
                    //pos evaluates for 1, neg evaluates for -1
                    var pos = [];
                    var neg = [];
                    
                    //assume no wins so far
                    var xwon = false;
                    var owon = false;

                    //break into individual squares
                    for(var l=0; l<8; l++){
                        //check in a positive direction (aka X)
                        if(this.state[m][l] === 1) pos[l] = 1;

                        //check in a negative direction (aka O)
                        if(this.state[m][l] === -1) neg[l] = 1;
                    }
                    
                    //loop through win conditions
                    for(var c=0; c<8; c++){
                        //pattern match to see if either palyer has won the meta
                        //update local function variables, to later update global array
                        if(isEqual(pos,winning[c])) xwon = true;
                        if(isEqual(neg,winning[c])) owon = true;
                        //if not, all is still false
                    }

                    //double check there's no error with our code
                    if(xwon && owon) console.log("MEGA-ERROR: I THINK BOTH OF YALL WON LOCALE #" + M + "!");
                    else {
                        //update "battle" win history/state board array,
                        //only if board is won
                        if(xwon) this.meta[m] = 1;
                        if(owon) this.meta[m] = -1;
                    }

                }
            }
        }

        

        //function that updates movelists, validates, and publishes specified incoming move
        //move must be in three character notation form (string)
        //what's the (move)?
        makeMove(move){
            //if this is the first move, force X to move
            if(this.movelist.length == 0) var lastmove = ["O"];
            //if not, log the last move
            else var lastmove = this.notation(this.movelist[this.movelist.length-1]);
            var themove = this.notation(move);

            //check if the opposite player is moving
            //ensure move validated, if not throw breaking error and do nothing
            if(themove[0] != 0 && themove[1] != -1 && themove[2] != -1){

                //make sure the next player is taking their turn
                if(themove[0] != lastmove[0]){
                    //manipulate the board object's properties to make all the moves
                    this.state[themove[1]][themove[2]] = themove[0];
                    this.movelist.push(move);
                    //check win statuses
                    this.checkLocales();
                    this.isWinning();
                }
                //no second turns
                else console.log("Illegal: Player cannot move twice in a row");

            }
            //this.notation function could not validate the move
            else console.log("Invalid: move, ya dunce");

        }


    }
};

//////////////////////////////////////////
//end of gameapi.js///////////////////////