////single game instance metaphor
////global game API

//TO DO   - checkLocales and isWinning are completely broken
//        - send help


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

var address = function(x,y) {
    var xtrans = false;
    var ytrans = false;
    if(x >= 0 && x <= 2) xtrans = 0;
        else if(x >= 3 && x <= 5) xtrans = 1;
        else if(x >= 6 && x <= 8) xtrans = 2;
    
    if(y >= 0 && y <= 2) ytrans = 0;
        else if(y >= 3 && y <= 5) ytrans = 3;
        else if(y >= 6 && y <= 8) ytrans = 6;
    
    if(xtrans !== false && ytrans !== false) return xtrans + ytrans;
}

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
        constructor(gameid, playerarray, p1pawnchoice){
            //stores session info about the two players, 
            //to be updated when called by function
            this.players = {};
            
            //set x and o player key values to appropriately in players object
            if (p1pawnchoice == 0 || p1pawnchoice == 1){
                this.players["x"] = playerarray[p1pawnchoice];
                this.players["o"] = playerarray[Math.abs(p1pawnchoice-1)];
            }
            else console.log("ERROR: MALFORMED PAWN CHOICE");

            //stores gameid for future server-side processing
            this.id = gameid;
            
            //X = 1, O = -1, Empty = 0
            //address state multidimensional array with
            //example: this.state[4][4]
            //state property is a human readable duplicate of the ui board
            //confusing! rows first, not columns [x][y]
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

            //IMPORTANT UPDATE (5/29/19):
            //METASTATE PROPERTY ADDED
            //refers to 9 distinct grids within the tic tac toe grid
            //addressed:
            //    0 | 1 | 2
            //    3 | 4 | 5
            //    6 | 7 | 8
            //with each first dimension array leading to a board state
            //that could be matched by the checkLocales() function
            this.metastate= [   [0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0]];

            //stores next legal meta tile index [0-8] as a property
            this.nextLegal = -1;

            //store metadata about adressing squares
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
        notation(move, valid) {
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
                        //third, if boardY, boardX have not been filled in yet, move on
                        if(this.state[boardY][boardX] == 0 || !valid){
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
                if(this.meta[m] === 1){
                    pos[m] = 1;
                    neg[m] = 0;
                }
                //check in a negative direction (aka O)
                if(this.meta[m] === -1){
                    pos[m] = 0;
                    neg[m] = 1;
                }
                //check for neutrality
                if(this.meta[m] === 0){
                    neg[m] = 0;
                    pos[m] = 0;
                }
            }

            console.log(pos);
            console.log(neg);

            //loop through win conditions
            for(var condition=0; condition<8; condition++){
                //pattern match to see if either palyer has won the meta
                if(isEqual(pos,winning[condition])){ 
                    xwon = true;
                    condition = 8;
                }
                if(isEqual(neg,winning[condition])){
                    owon = true;
                    condition = 8;
                }
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
            for(var m=0; m<9; m++){
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
                    //this loop will create pos[0-8] and neg[0-8]
                    //per local board
                    for(var l=0; l<9; l++){
                        //check in a positive direction (aka X)
                        if(this.metastate[m][l] === 1){
                            pos[l] = 1;
                            neg[l] = 0;
                        }
                        //check in a negative direction (aka O)
                        else if(this.metastate[m][l] === -1){
                            pos[l] = 0;
                            neg[l] = 1;
                        }
                        //check for neutrality
                        else {
                            neg[l] = 0;
                            pos[l] = 0;
                        }
                    }

                    //console.log("board - M" + m + "pos: [" + pos + "]");
                    //console.log("board - M" + m + "neg: [" + neg + "]");
                    
                    //loop through win conditions
                    for(var condition=0; condition<8; condition++){
                        //pattern match to see if either palyer has won the meta
                        //update local function variables, to later update global array
                        if(isEqual(pos,winning[condition])){
                            xwon = true;
                            condition = 8;
                        }
                        if(isEqual(neg,winning[condition])){
                            owon = true;
                            condition = 8;
                        }
                        //if not, all is still false
                    }

                    //debugging:
                    if(xwon) console.log("!!!X wins tile: M" + m + "!!!");
                    if(owon) console.log("O wins tile: M" + m + "!!!");

                    //double check there's no error with our code
                    if(xwon && owon) console.log("MEGA-ERROR: I THINK BOTH OF YALL WON LOCALE #" + M + "!");
                    else {
                        //update "battle" win history/state board array,
                        //only if board is won, and has not previously been won
                        if(xwon && this.meta[m] === 0) this.meta[m] = 1;
                        if(owon && this.meta[m] === 0) this.meta[m] = -1;

                        //debugging:
                        //console.log(this.metastate[m]);
                    }

                }
            }
        }

        

        //function that updates movelists, validates, and publishes specified incoming move
        //move must be in three character notation form (string)
        //what's the (move)?
        makeMove(move){
            console.log("just got makeMove");
            //if this is the first move, force X to move
            if(this.nextLegal == -1) var lastmove = ["O"];
            //if not, log the last move
            else var lastmove = this.notation(this.movelist[this.movelist.length-1], false);
            console.log("just set lastmove");
            //estabilsh the move we're trying to make in computer readable notation
            var themove = this.notation(move, true);
            console.log("just set new move");

            //check if the opposite player is moving
            //ensure move validated, if not throw breaking error and do nothing
            if(themove[0] != 0 && themove[1] != -1 && themove[2] != -1){

                //make sure the next player is taking their turn
                if(themove[0] != lastmove[0]){
                    //make sure players are moving through the board according to the rules
                    if(this.nextLegal == address(themove[1],themove[2]) || this.nextLegal == -1){
                        //manipulate the board object's properties to make all the moves
                        this.state[themove[2]][themove[1]] = themove[0];
                        this.movelist.push(move);
                        //you dont need to try to follow my mental math gymnastics here
                        //pretty much im taking 0-2, 3-5, 6-8 indexes 
                        //rounded to 0,1,2 and 0,3,6 and adding them respectively
                        //to get a final index that addresses the metastate
                        //don't worry about it
                        var transtometa = (themove[1]%3)+(3*(themove[2]%3));
                        this.metastate[address(themove[1],themove[2])][transtometa] = themove[0];
                        //check win statuses
                        this.checkLocales();
                        this.isWinning();
                        this.nextLegal = transtometa;

                        return themove;
                    }
                    else {
                        console.log("Illegal: next turn must occur in determined meta tile");
                        return false;
                    } 
                }
                //no second turns
                else {
                    console.log("Illegal: Player cannot move twice in a row");
                    return false;
                }

            }
            //this.notation function could not validate the move
            else {
                console.log("Invalid: move, ya dunce");
                return false;
            }

        }


    }
};

//////////////////////////////////////////
//end of gameapi.js///////////////////////