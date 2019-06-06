////single game instance metaphor
////global game API

//TO DO   - build a mfkin robot 4 this
//        - send help


//toolbox
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
            //confusing! rows first, not columns [y][x]
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
            
            //stores a list of past moves
            this.movelist = [];
            

            //metadata about board objects generally:
            //store metadata about adressing squares
            this.columns = ["A","B","C","D","E","F","G","H","I"];
            this.rows = ["1","2","3","4","5","6","7","8","9"];   

            //what are all the winning positions?
            //UPDATE (6/04/19):
            //changed winning positions array from array of winning boards
            //to indexes of 1's within those boards
            //this allows for better pattern matching on boards
            //where the player has moves than just the ones that are winning
            //also allows for the removal of the isEqual function
            this.winning = [[0,1,2],
                            [0,3,6],
                            [0,4,8],
                            [1,4,7],
                            [2,4,6],
                            [2,5,8],
                            [3,4,5],
                            [6,7,8]];

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
        
        //update: moved current checkMeta function to its own function, from isWinning()
        //isWinning() is now a toolbox-y function to compare arrays against
        //codified win conditions/rules in this.winning
        //accepts [0-8] array of a 3x3 board, addressed top-left to bottom-right
        //board formatting must include 1 for X, 0 for nothing, and -1 for O
        //usage: isWinning([array]) returns [xwon, owon]
        isWinning(board) {
            //create win arrays for X and O
            //pos evaluates for 1, neg evaluates for -1
            var pos = [];
            var neg = [];                 
            //assume no wins so far
            var xwon = false;
            var owon = false;
            //break into individual squares
            //this loop will generate pos[0-8] and neg[0-8]
            //per local board
            for(var s=0; s<9; s++){
                //check in a positive direction (aka X)
                if(board[s] === 1){
                    pos[s] = 1;
                    neg[s] = 0;
                }
                //check in a negative direction (aka O)
                else if(board[s] === -1){
                    pos[s] = 0;
                    neg[s] = 1;
                }
                //check for neutrality
                else {
                    neg[s] = 0;
                    pos[s] = 0;
                }
            }
            //loop through win conditions
            for(var condition=0; condition<8; condition++){
                //local variable matching to looped win condition
                var thiswin = this.winning[condition];
                //pattern match to see if either palyer has won the meta
                //pattern matching is done by checking through each win condition
                //whether the values at each index indicate a win for that player
                //update local function variables, to later update global array
                if(pos[thiswin[0]] == 1 && pos[thiswin[1]] == 1 && pos[thiswin[2]] == 1){
                    xwon = true;
                    //break out of the loop
                    condition = 8;
                }
                if(neg[thiswin[0]] == 1 && neg[thiswin[1]] == 1 && neg[thiswin[2]] == 1){
                    owon = true;
                    //break out of the loop
                    condition = 8;
                }
                //if not, all is still false
            }
            //double check there's no error with our code
            if(xwon && owon) {
                console.log("MEGA-ERROR: I THINK BOTH OF YALL WON THE GAME");
                //return both xwon and owon as false, to not break game
                return [false, false];
            }
            else {
                //return array with wins or no wins
                return [xwon, owon];
            }
        }



        //primary tool used to validate moves on the local boards
        //this function updates master state function, which will ultimately
        //determine the game.
        checkLocales() {
            //determine if a player is winning in a local board
            //index m = board within metastate
            for(var m=0; m<9; m++){
                //check if specified meta locale has been won,
                //dont waste compute if it has
                if(this.meta[m] === 0){
                    //call our win condition function, save return as wins ([xwon],[owon])
                    var wins = this.isWinning(this.metastate[m]);

                    //debugging:
                    if(wins[0]) console.log("!!!X wins tile: M" + m + "!!!");
                    if(wins[1]) console.log("O wins tile: M" + m + "!!!");

                    //update "battle" win history/state board array,
                    //only if board is won, and has not previously been won
                    if(wins[0] && this.meta[m] === 0) this.meta[m] = 1;
                    if(wins[1] && this.meta[m] === 0) this.meta[m] = -1;
                //end if
                }
            //end for
            }
        //end of checkLocales()
        }

        checkMeta(){
            //call our win condition function, save return as wins ([xwon],[owon])
            var wins = this.isWinning(this.meta);

            //send out win statuses
            if(wins[0]){
                console.log(">>>>>>>>>>>>>>>>X Wins!<<<<<<<<<<<<<<<<<");
                return "X";
            }
            else if(wins[1]){
                console.log(">>>>>>>>>>>>>>>>O Wins!<<<<<<<<<<<<<<<<<");
                return "O";
            }
            else {
                return false;
            }
        }

        

        //function that updates movelists, validates, and publishes specified incoming move
        //move must be in three character notation form (string)
        //what's the (move)?
        makeMove(move){
            //if this is the first move, force X to move
            if(this.nextLegal == -1) var lastmove = ["O"];
            //if not, log the last move
            else var lastmove = this.notation(this.movelist[this.movelist.length-1], false);
            //estabilsh the move we're trying to make in computer readable notation
            var themove = this.notation(move, true);

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
                        //check local board wins
                        this.checkLocales();
                        //check the meta-game
                        var whowon = this.checkMeta();
                        //if a winner was declared with this move, 
                        //send it as a special 4th character in the return
                        if(whowon) themove[3] = whowon;
                        //update the next legal move class-wide
                        this.nextLegal = transtometa;

                        //spit back out the move that was made if valid
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