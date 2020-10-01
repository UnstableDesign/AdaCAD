import utilInstance from './util';

/**
 * Definition of tie-ups class.
 * @class
 */
export class TieUps {
    tieups: Array<Array<boolean>>;
    usedFrames: Number;
    threading: Array<Array<boolean>>;
    treadling: Array<Array<boolean>>;
    pattern: Array<Array<boolean>>;
    treadle_count: Number;
    
    /*Input: the threading 2D array associated with the draft, the number of usedFrames, the treadling pattern, the pattern itself, the number of treadles required
    */
    constructor(threading: Array<Array<boolean>>, usedFrames: Number, treadling: Array<Array<boolean>>, pattern: Array<Array<boolean>>, treadle_count: number) {
        this.usedFrames = usedFrames;
        this.threading = threading;
        this.treadling = treadling;
        this.pattern = pattern;
        this.treadle_count = treadle_count;
        this.tieups = [];

        for (var i = 0; i < 10; i++) {
            this.tieups.push([]);
            for (var j = 0; j < 8; j++) {
                this.tieups[i].push(false);
            }
        }
    }

    /*Input: the pattern associated with the draft (2D array of booleans)
    */
    updatePattern(pattern: Array<Array<boolean>>) {
        this.pattern = pattern;
    }

    /*Input: the threading associated with the draft (2D array of booleans)
    */
    updateThreading(threading: Array<Array<boolean>>) {
        this.threading = threading;
    }

    /*Input: the treadling associated with the draft (2D array of booleans)
    */
    updateTreadling(treadling: Array<Array<boolean>>) {
        this.treadling = treadling;
    }

    /*Input: the number of treadles required by the draft's pattern
    */
    updateTreadleCount(treadle_count: number) {
        this.treadle_count = treadle_count;
        if (this.treadle_count >10) {
            this.tieups = [];
            for (var i =0; i < this.treadle_count; i++) {
                this.tieups.push([]);
                if (this.usedFrames > 8) {
                    for (var j= 0; j < this.usedFrames; j++) {
                        this.tieups[i].push(false);
                    }
                } else {
                    for (var j =0;j <8;j++){
                        this.tieups[i].push(false);
                    }
                }
            }
        }
    }

    //may not be a necessary function but you know i think it might be
    updateUsedFrames(usedFrames: number) {
        this.usedFrames = usedFrames;
        if (this.usedFrames > 8) {
            this.tieups = [];
            if(this.treadle_count > 10) {
                for (var i =0; i < this.treadle_count; i++) {
                    this.tieups.push([]);
                    for (var j= 0; j < this.usedFrames; j++) {
                        this.tieups[i].push(false);
                    }
                }
            } else {
                for (var i = 0; i < 10; i++) {
                    this.tieups.push([]);
                    for (var j = 0; j < this.usedFrames;j++) {
                        this.tieups[i].push(false);
                    }
                }
            }
        }
    }

    /*Input: None
    Result: Calculates the tieups for the pattern, treadling, and threading
    */
    updateTieUps() {
        //"empties" the pre-existing true values from the tie-ups (to protect from stale changes to the pattern still persisting in the tie-ups)
        var tie_up_counter = 0;
        this.tieups = this.tieups.map(x => x.map(y => false));
        var effective_treadles:Number = 10;
        if (this.treadle_count > 10) {
            effective_treadles = this.treadle_count;
        }
        //iterates through each row of the pattern
        for (var r = 0; r < this.pattern.length; r++) {
            var adjusted = false;
            //iterates through each row of the threading
            for (var tr = 0; tr < this.threading.length; tr++) {
                //if the number of true values when the current pattern row is XORed with this threading row is less than the number of true values in the original pattern row
                if (utilInstance.countOnes(utilInstance.xor(this.pattern[r], this.threading[tr])) < utilInstance.countOnes(this.pattern[r])) {
                    adjusted = true;
                    // then mark the tie ups to include this frame (aka threading row) at the current column of the tieups (the "activated" treadle in this row of the pattern)
                    for (var j = 0; j < effective_treadles; j++) {
                        if (this.treadling[r][j] == true) {
                            this.tieups[j][tr] = true;
                        }
                    }
                }
            }
            //if we made changes then we add to our tie_up counter
            if (adjusted) {
                tie_up_counter = tie_up_counter +1;
            }
            //assuming we can't have more tie-ups than treadles, we break if we reach this point
            if (tie_up_counter >= this.treadle_count) {
                break;
            }
        }
    }


  //Returns whether or not a particular location of the TieUps grid is marked true or false
  isUp(i: number, j:number) : boolean { //TODO: Change this to either variables or size of the array (kind of favoring size of array) but we don't want literals
    if (i > -1 && i < 8 && j > -1 && j < 10) {
      return this.tieups[i][j];
    }
    return false;
  }

}