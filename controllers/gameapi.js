////single game instance metaphor
////global game API

//toolbox
function compare(arr1,arr2){
  
    if(!arr1  || !arr2) return
   
     let result;
   
   arr1.forEach((e1,i)=>arr2.forEach(e2=>{
     
          if(e1.length > 1 && e2.length){
             result = compare(e1,e2);
          }else if(e1 !== e2 ){
             result = false;
          }else{
             result = true;
          }
     })
   )
   
   return result;
   
}

//notation accepts THREE CHARACTERS ONLY
//[PLAYER][X IN A,B,C...I COLUMNS][Y IN 1,2,3...9 ROWS]
//examples: XE5- X to center of the board
//examples: OI9- O to bottom right corner
//this function intakes a notated move, and spits out details as an array
//outputs: ["X",4,4]
//outputs: ["O",8,8]
//remember off by zero, board is a multidimensional array [0-8][0-8]
function notation(move) {
    if(move.length === 3){
        //break move argument into pieces
        var firstchar = move[0];
        var Xinput = move[1];
        var Yinput = move[2];

        //validate move,
        //first by checking if player is only X or O
        if(firstchar == "X" || firstchar  == "O"){
            //check if input position is found in available rows and columns
            var boardX = this.columns.indexOf[Xinput];
            var boardY = this.rows.indexOf[Yinput];

            //second, if valid move positions are found in both domains, move on
            if(boardX != -1 && boardY != -1){
                //third, if boardX, boardY have not been filled in yet, move on
                if(this.state[boardX[boardY]] == 0){
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
                return [-1,-1,-1];
            }
        }
        else { 
            console.log("Non-breaking: Erroneous player thrown in move notation");
            return [-1,-1,-1];
        }
    }
    else { 
        console.log("Non-breaking: Erroneously short or long argument thrown into move notation"); 
        return [-1,-1,-1];
    }
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



//everything that exists in this game, and ever will
export default class Board {
    constructor(gameid, player1, player2){
        //stores session info about the two players, 
        //to be updated when called by function
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
    
    //codified win conditions/rules
    isWinning() {
        var pos = [];
        var neg = [];

        var xwon = false;
        var owon = false;

        //evaluate macro board by breaking it up into wins per team arrays
        for(m=0; m<8; m++){
            //check in a positive direction (aka X)
            if(this.meta[m] === 1) pos[m] = 1;
            //check in a negative direction (aka O)
            if(this.meta[m] === -1) neg[m] = 1;
        }

        //loop through win conditions
        for(c=0; c<8; c++){
            if(compare(pos,winning[c])) xwon = true;
            if(compare(neg,winning[c])) owon = true;
        }

        if(xwon && owon) console.log("MEGA-ERROR: I THINK BOTH OF YALL WON THE GAME");
        else {
            if(xwon) alert("X Wins!");
            if(owon) alert("O Wins!");
        }
    }



    //primary tool used to validate moves on the local boards
    //this function updates master state function, which will ultimately
    //determine the game.
    checkLocales() {
        //determine if a player is winning in a local board
        for(m=0; m<8; m++){
            //check if specified meta locale has been won,
            //dont waste compute if it has
            if(this.meta[m] === 0){

                var pos = [];
                var neg = [];
    
                var xwon = false;
                var owon = false;

                //break into individual squares
                for(l=0; l<8; l++){
                    //check in a positive direction (aka X)
                    if(this.state[m][l] === 1) pos[l] = 1;

                    //check in a negative direction (aka O)
                    if(this.state[m][l] === -1) neg[l] = 1;
                }
                
                //loop through win conditions
                for(c=0; c<8; c++){
                    // update local function variables, to later update global array
                    if(compare(pos,winning[c])) xwon = true;
                    if(compare(neg,winning[c])) owon = true;
                    //if not, all is still false
                }

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
    //what's the (player,move)?
    makeMove(player,move){
        var lastmove = notation(this.movelist[this.movelist.length-1]);
        var themove = notation(move);

        //check if the opposite player is moving
        //ensure move validated, if not throw breaking error and do nothing
        if(themove[0] != -1 && themove[1] != -1 && themove[2] != -1){

            //make sure the next player is taking their turn
            if(themove[0] != lastmove[0]){
                //manipulate the board object's properties to make all the moves
                this.meta[themove[1]][themove[2]] = themove[0];
                this.movelist.push(move);
                //check win statuses
                this.checkLocales();
                this.isWinning();
            }
            //no second turns
            else console.log("Illegal: Player cannot move twice in a row");

        }
        else console.log("Invalid: move, ya dunce");

    }




}

//////////////////////////////////////////
//end of gameapi.js///////////////////////