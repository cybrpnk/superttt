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
             result = false
          }else{
             result = true
          }
     })
   )
   
   return result
   
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



//everything that exists, and ever will
class Board {
    constructor(gameid, player1, player2){
        this.id = gameid;
        this.player1 = player1;
        this.player2 = player2;
        
        //X = 1, O = -1, Empty = 0
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

        

    }
    
    iswinning() {
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


    checklocales() {
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
                    if(compare(pos,winning[c])) xwon = true;
                    if(compare(neg,winning[c])) owon = true;
                }

                if(xwon && owon) console.log("MEGA-ERROR: I THINK BOTH OF YALL WON LOCALE #" + M + "!");
                else {
                    if(xwon) this.meta[m] = 1;
                    if(owon) this.meta[m] = -1;
                }

            }
        }
    }
}

//