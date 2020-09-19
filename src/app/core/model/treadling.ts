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
    }

    /* Input: None
    Result: A treadling updated to the current draw-down of the draft
    Algorithm modified from Laura Devendorf: https://unstable.design/prototyping-smart-textiles/_book/process/weaving/on-a-frame-loom.html
    */
    updateTreadling() {
        //clears the threading to all false before processing (to account for the updating of threading while the draw-down is changing)
        for(var i = 0;i < this.treadling.length; i++) {
            for (var j =0; j < this.treadling[i].length; j++) {
                this.treadling[i][j] = false;
            }
        }

        //defining helper variables:
        var marked_strings = [];
        var marked_strings_treadle_tracker = [];
        var treadle_count = 0;
        //keeps track of row that have been proccessed before this update, so as to not have multiple versions of the same column accounted for in the treadling
        var row_tracker = [];

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

                for (var j = 0; j < row_tracker.length; j++) {
                    if (row_tracker[j] == r) {
                        processed = true;
                        indx = j;
                    }
                }

                if (processed) {
                    marked_strings[indx] = this.pattern[r];
                    row_tracker[indx] = r;
                    marked_strings_treadle_tracker[indx] = treadle_count;
                } else {
                    marked_strings.push(this.pattern[r]);
                    row_tracker.push(r);
                    marked_strings_treadle_tracker.push(treadle_count);
                }
                this.treadling[r][treadle_count] = true;
                treadle_count = treadle_count + 1;
            } else if (contains && utilInstance.countOnes(this.pattern[r]) > 0) {
                for (var k = 0; k < marked_strings.length; k++) {
                    if (utilInstance.equals(marked_strings[k], this.pattern[r])) {
                        this.treadling[r][marked_strings_treadle_tracker[k]] = true;
                    }
                }
            }
        }
        console.log("treadling");
        console.log(this.treadling);
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
}