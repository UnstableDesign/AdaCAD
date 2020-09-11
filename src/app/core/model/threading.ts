import utilInstance from './util';

/**
 * Definition of threading class.
 * @class
 */
export class Threading {
    threading: Array<Array<boolean>>;
    wefts: Number;
    warps: Number;
    flipped_pattern: Array<Array<boolean>>;
    usedFrames: Array<number>;

    /*Input: the number of warps and wefts in this draft
    Result: A flipped pattern (flipped in comparison to the pattern used in draft.ts) that is constructed with all false values,
            A threading 2D array that is constructed with all false values*/
    constructor(wefts: number, warps: number) {
        this.flipped_pattern = [];
        this.wefts = wefts;
        this.warps = warps;
        for(var i = 0; i < this.warps; i++) {
          this.flipped_pattern.push([]);
          for (var j = 0; j < this.wefts; j++) {
            this.flipped_pattern[i].push(false);
          }
        }
        this.threading = [];
        for (var i = 0; i < this.wefts; i++) {
            this.threading.push([]);
            for(var j = 0; j < this.warps; j++) {
              this.threading[i].push(false);
            }
        }
        this.usedFrames = [];
    }

    /* Input: None
    Result: A threading updated to the current draw-down of the draft
    Algorithm modified from Laura Devendorf: https://unstable.design/prototyping-smart-textiles/_book/process/weaving/on-a-frame-loom.html
    */
    updateThreading() {
        //clears the threading to all false before processing (to account for the updating of threading while the draw-down is changing)
        for(var i = 0;i < this.threading.length; i++) {
            for (var j =0; j < this.threading[i].length; j++) {
                this.threading[i][j] = false;
            }
        }
        //defining helper variables:
        //marked_strings keeps track of bit strings (or in this app, bool strings) to check if a column that is currently been processed is a repeat of an already processed string
        var marked_strings = [];
        //corresponds to marked_strings so the frame for marked_strings[i] = marked_strings_frame_tracker[i]
        var marked_strings_frames_tracker =[];
        //acts as the counter for the next frame (increments so the threading is a straight draw when possible)
        var frame_count = 0;
        //keeps track of columns that have been proccessed before this update, so as to not have multiple versions of the same column accounted for in the threading
        var column_tracker = [];
        for (var c = 0; c < this.flipped_pattern.length; c++) {
          var contains = false;
          //if the current column's pattern already exists in marked_strings, contains is set to true
          for (var i = 0; i < marked_strings.length;i++) {
            if (utilInstance.equals(marked_strings[i], this.flipped_pattern[c])) {
              contains = true;
            }
          }
          //if this is a new pattern with at least 1 true marking
          if (!contains && (utilInstance.countOnes(this.flipped_pattern[c]) > 0)){
            var processed= false;
            var indx = 0;
            //checks if this column has already been added and if so processed is set to true and the index in marked strings is set
            for (var j = 0; j < column_tracker.length; j++ ) {
              if (column_tracker[j] == c) {
                processed =true;
                indx = j;
              }
            }
            //if already processed, then the marked_strings at the desired indx is set to this current column's pattern    
            if (processed) {
              marked_strings[indx] = this.flipped_pattern[c];
              column_tracker[indx] = c;
              marked_strings_frames_tracker[indx] = frame_count
            } else { //else the new patter is pushed
              marked_strings.push(this.flipped_pattern[c]);
              column_tracker.push(c);
              //the new frame for this "unprecedented" pattern is pushed
              marked_strings_frames_tracker.push(frame_count);
            }
            // //the new frame for this "unprecedented" pattern is pushed
            // marked_strings_frames_tracker.push(frame_count);
            //sets the threading at this frame and column to true and increments frame counter
            this.threading[frame_count][c] = true;
            frame_count = frame_count + 1;
          } else if (contains && utilInstance.countOnes(this.flipped_pattern[c]) > 0) { //otherwise if it is an old pattern with at least 1 true value
            //find the pattern in marked_strings and set threading at the corresponding frame of that original pattern and the new column to true
            for (var k = 0; k < marked_strings.length; k++) {
              if (utilInstance.equals(marked_strings[k], this.flipped_pattern[c])) {
                this.threading[marked_strings_frames_tracker[k]][c] = true;
              }
            }
          }
        }
        console.log("threading");
        console.log(this.threading);
        this.updateUsedFrames();
    }

    /* Input: the row and column of the adjusted draw-down point and the new bool value for this point
    Result: adjusts this.flipped_pattern at point to new bool value
    */
    updateFlippedPattern(row:number, j:number, bool:boolean) {
        this.flipped_pattern[j][row] = bool;
    }
    
    /* Input: None
    Result: Updates the used frames array to include only the index of the frames that has a true value in it
     */
    updateUsedFrames() {
        this.usedFrames =[];
        for (var i =0; i < this.threading.length; i++) {
            if (this.threading[i].includes(true)) {
                this.usedFrames.push(i);
            }
        }
    }
    /*
    Input: i for row of threading, j for column of threading
    Result: returns whether that frame is used and the column is valid
    Abdapted from draft.ts isUp*/
    isUp(i:number, j:number) : boolean{
        if ( this.usedFrames.indexOf(i) != -1 && j > -1 && j < this.threading[0].length) {
            return true
        } else {
            return false;
        }
    }
}