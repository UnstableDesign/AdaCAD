import utilInstance from './util';
import { CompileSummaryKind } from '@angular/compiler';

/**
 * Definition of threading object.
 * @class
 */
export class Treadling {
    treadling: Array<Array<boolean>>;
    wefts: Number;
    pattern: Array<Array<boolean>>;
    treadle_count: number;
    userInputCoordinates: Array<Array<number>>;

    constructor(wefts: number, pattern: Array<Array<boolean>>) {
        this.pattern=pattern;
        this.wefts = wefts;
        this.treadling =[];
        for (var i = 0; i < this.wefts; i++) {
            this.treadling.push([]);
            //assumed standard number of treadles
            for (var j = 0; j < 10; j++) {
                this.treadling[i].push(false);
            }
        }
        this.treadle_count = 0;
        this.userInputCoordinates = [];
    }

    /* Input: None
    Result: A treadling updated to the current draw-down of the draft
    Algorithm modified from Laura Devendorf: https://unstable.design/prototyping-smart-textiles/_book/process/weaving/on-a-frame-loom.html
    */
    updateTreadling() {
        //clears the threading to all false before processing (to account for the updating of threading while the draw-down is changing)
        this.treadling = this.treadling.map(x => x.map(y => false));

        //defining helper variables:
        var marked_strings = [];
        var marked_strings_treadle_tracker = [];
        var treadle_count = 0;
        //keeps track of row that have been proccessed before this update, so as to not have multiple versions of the same column accounted for in the treadling
        var row_tracker = [];

        for(var i = 0; i < this.userInputCoordinates.length; i++) {
            var weft_thread = this.userInputCoordinates[i][0];
            var treadle = this.userInputCoordinates[i][1];
            var userMiscalc = false;
            for (var j = 0; j < marked_strings.length; j++) {
              if (marked_strings_treadle_tracker[j] == treadle && !utilInstance.equals(this.pattern[weft_thread], marked_strings[j])) {
                userMiscalc = true;
              }
            }
            if (!userMiscalc) {
              this.treadling[weft_thread][treadle] = true;
              marked_strings.push(this.pattern[weft_thread]);
              marked_strings_treadle_tracker.push(treadle);
              row_tracker.push(weft_thread);
            }
        }
        for (var r = 0; r < this.pattern.length; r++) {
            var contains = false;
            for (var i = 0; i < marked_strings.length; i++) {
                if (utilInstance.equals(marked_strings[i], this.pattern[r])) {
                    contains = true;
                }
            }
            if (!contains && (utilInstance.countOnes(this.pattern[r]) >0)) {
                var processed = false;
                var indx = 0;
                var treadle = utilInstance.findSmallestGap(marked_strings_treadle_tracker);
                this.treadling[r][treadle] = true;

                for (var j = 0; j < row_tracker.length; j++) {
                    if (row_tracker[j] == r) {
                        processed = true;
                        indx = j;
                    }
                }

                if (processed) {
                    marked_strings[indx] = this.pattern[r];
                    row_tracker[indx] = r;
                    marked_strings_treadle_tracker[indx] = treadle;
                } else {
                    marked_strings.push(this.pattern[r]);
                    row_tracker.push(r);
                    marked_strings_treadle_tracker.push(treadle);
                }
                //treadle_count = treadle_count + 1;
            } else if (contains && utilInstance.countOnes(this.pattern[r]) > 0) {
                for (var k = 0; k < marked_strings.length; k++) {
                    if (utilInstance.equals(marked_strings[k], this.pattern[r])) {
                        this.treadling[r][marked_strings_treadle_tracker[k]] = true;
                    }
                }
            }
        }
        this.updateTreadleCount();
    }

    updateTreadleCount() {
        this.treadle_count = 0;
        var checked_treadles = []
        for (var i =0; i < this.treadling.length; i++) {
            var counter = 0;
            for (var j = 0; j < this.treadling[i].length; j++) {
                if(this.treadling[i][j] == true && !checked_treadles.includes[j]) {
                    counter += 1;
                    checked_treadles.push(j);
                }
            }
            this.treadle_count += counter;
        }
    }

    updatePattern(pattern: Array<Array<boolean>>) {
        this.pattern = pattern;
    }

      
    //Returns whether or not a particular location of the Treadling grid is marked true or false
    isUp(i: number, j: number) : boolean { //TODO: will need to change as treadle_count exceeds 10
        if (i > -1 && i < this.wefts && j > -1 && j < 10) {
            return this.treadling[i][j];
        }
        return false;
    }

    addUserInput(i:number, j:number) {
        var tempList = [i,j];
        var contains = false;
        for (var k = 0; k < this.userInputCoordinates.length;k++) {
          if (utilInstance.equals(tempList, this.userInputCoordinates[k])) {
            contains = true;
          }
        }
        if (!contains) {
          this.userInputCoordinates.push([]);
          this.userInputCoordinates[this.userInputCoordinates.length -1].push(i);
          this.userInputCoordinates[this.userInputCoordinates.length -1].push(j);
        }
      }
    
      deleteUserInput(i:number, j:number) {
        var tempList = [i,j];
        var contains = false;
        var newUserInput = [];
        for (var i = 0; i < this.userInputCoordinates.length; i++) {
          if (utilInstance.equals(tempList, this.userInputCoordinates[i])) {
            contains = true;
          } else {
            newUserInput.push(this.userInputCoordinates[i]);
          }
        }
        if(contains) {
          this.userInputCoordinates = newUserInput;
        }
      }

}