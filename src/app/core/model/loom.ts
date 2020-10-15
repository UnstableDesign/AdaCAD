import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';
import utilInstance from './util';

/**
 * Definition of threading class.
 * @class
 */
const countOccurrences = (blah, val) => blah.reduce((a, v) => (v === val ? a + 1 : a), 0);

 
export class Loom{

    //1-d array the same size as warps that has the id for the frame it is associated with or -1. 
    threading: Array<number>; 
    min_frames: number; 
    num_frames: number; 
    
    //1-d array the same size as wefts that has the id for the frame it is associated with or -1. 
    treadling: Array<number>;
    min_treadles: number;
    num_treadles: number;

    // 2-d arraw of size frames x treadles
    tieup: Array<Array<Boolean>>; 


    constructor(wefts: number, warps: number, frames: number, treadles:number) {
        this.min_frames = frames;
        this.min_treadles = treadles;
        this.num_frames = frames;
        this.num_treadles = treadles;

        this.resetThreading(warps);
        this.resetTreadling(wefts);
        this.resetTieup(frames, treadles);
      
    }


    resetThreading(warps){
      this.threading = [];
        for (var i = 0; i < warps; i++) {
            this.threading.push(-1);
        }
    }

    resetTieup(frames, treadles){

      this.tieup = [];
        for (var i = 0; i < frames; i++) {
            this.tieup.push([]);
            for(var j = 0; j < treadles; j++){
              this.tieup[i].push(false);
            }
        }
    }

    resetTreadling(wefts){

        this.treadling = [];
        for (var i = 0; i < wefts; i++) {
            this.treadling.push(-1);
        }
    }

    repopulateLoomFromDrawdown(drawdown){

      for(var i in drawdown){
        for(var j in drawdown[i]){
          this.updateConfig(this.getConfig({i: i, j:j, drawdown: drawdown}));
        }
      }

    }


   /* updates the threading, tieup, and treadling based on a point in the drawdown
   * @param {i,j} the Row, Column of the changed pixel.
   * @returns {a list of updates made}
   */
    updateFromDrawdown(i, j, drawdown){
      return this.updateConfig(this.getConfig({i: i, j:j, drawdown: drawdown}));
    }


    getEmptyTreadle(){

      for(var i = 0; i < this.num_treadles; i++){
        const idx = this.treadling.find(element => element === i);
        if(idx === undefined) return i;
      }

      return this.num_treadles;
    }

    getEmptyFrame(){

      for(var i = 0; i < this.num_frames; i++){
        const idx = this.threading.find(element => element === i);
        if(idx === undefined) return i;
      }

      return this.num_frames;
    }




   /* This function takes a point from the draw down [i,j] representing rows and columns 
and returns an associated value for threading frames and treadles
   * @param obj{i: i,j: j} the Row, Column of the changed pixel.
   * @returns {obj{i: i, j: j, frame: number, treadle: number}}
   */

    getConfig(obj){


      var config = {
        i: obj.i, 
        j: obj.j,
        frame: -1,
        treadle:-1,
        drawdown: obj.drawdown
      }

      var j_pattern = obj.drawdown.map(element => element[obj.j]);
      var i_pattern = obj.drawdown[obj.i];


      //(1) check if the row is unique
      var found = false;
      for(var i = 0; i < obj.drawdown.length && !found; i++){
        //don't check the row we are currently in
        if(i != obj.i){
          //need a way to check here if it is the ONLY one assigned to this frame, or if others are as well
          const idx = obj.drawdown[i].find((element, ndx) => element !== i_pattern[ndx]);
          if(idx === undefined){
              found = true;
              config.treadle = this.treadling[i];
          }
        }
      }


      if(!found){
        var count = countOccurrences(this.treadling, this.treadling[obj.i]);
        if(this.treadling[obj.i] != -1 && count == 1){
          config.treadle = this.treadling[obj.i];
        }else{
          config.treadle = this.getEmptyTreadle();
        }
      }

     //(1) check if the column is unique
      found = false;
      for(var j = 0; j < obj.drawdown[0].length && !found; j++){
        if(j != obj.j){
          const col = obj.drawdown.map(element => element[j]);
          const idx = col.find((element, ndx) => element !== j_pattern[ndx]);

          if(idx === undefined){
              found = true;
              config.frame = this.threading[j];
          }
        }
      }


      if(!found ){
        var count = countOccurrences(this.threading, this.threading[obj.j]);
        if(this.threading[obj.j] != -1 && count == 1){
          config.frame = this.threading[obj.j];
        }else{
          config.frame = this.getEmptyFrame();

        }
      }

      return config;
    }





/***
   /* This function updates the values of the treadles, threading and tie up based on a returned value 
   from get config
   * @param obj{i: i,j: j} the Row, Column of the changed pixel.
   * @returns a list of the updated points {obj{threading: array<{i,j}>, treadling: array<{i,j}>, tieup  array<{i,j}}}
   */   
      
    updateConfig(config){


      var updates = {
        threading: [],
        treadling: [],
        tieup: []
      }

      for(var i = 0; i < this.tieup.length; i++){
        updates.tieup.push([]);
        for(var j = 0; j < this.tieup[i].length; j++){
            updates.tieup[i].push({i: i, j:j, val: this.tieup[i][j]});
        }
      }
      

      //if this is within the existing frames
      if(config.frame < this.num_frames){
        if(this.threading[config.j] != -1){
          updates.threading.push({i: this.threading[config.j], j: config.j, val: false});
        }

        this.threading[config.j] = config.frame;
        updates.threading.push({i: config.frame, j: config.j, val: true});

      }else{
        this.num_frames++;
        this.threading[config.j] = config.frame;
        
        updates.threading.push({i: config.frame, j: config.j, val: true})

        this.tieup.push([]); //add a new row to the tieup, fill it with false
        updates.tieup.push([]);
        for(var t = 0; t < this.num_treadles; t++){
          this.tieup[config.frame].push(false);
          updates.tieup[config.frame].push({i: config.frame, j: t, val: false});

        }
      }

      if(config.treadle < this.num_treadles){
        
        if(this.treadling[config.i] != -1){
          updates.treadling.push({i: config.i, j: this.treadling[config.i], val: false});
          this.treadling[config.i] = -1;

        }

        this.treadling[config.i] = config.treadle;
        updates.treadling.push({i: config.i, j:  config.treadle, val: true});

      }else{
        this.num_treadles++;
        this.treadling[config.i] = config.treadle;
        updates.treadling.push({i: config.i, j:  config.treadle, val: true});

        for(var f = 0; f < this.num_frames; f++){
          this.tieup[f].push(false);
          updates.tieup[f].push({i: f, j: config.treadle, val: false});

        }
      }


      //set all tie ups in this treadle column to false
      // for(var i = 0; i < this.tieup.length; i++){
      //   for(var j = 0; j < this.tieup[i].length; j++){
      //     this.tieup[i][j] = false;
      //     updates.tieup[i][j] = {i: i, j: config.treadle, val: false};
      //   }

      // }

      
      //look through each treadle, and see if the tie up needs to be updated
      for(var j = 0; j < this.num_treadles; j++){
        const idx = this.treadling.findIndex(element => element === j);
        if(idx !== -1){
            //clear the tieup associated with this treadle
            for(var i = 0; i < this.num_frames; i++){
                this.tieup[i][j] = false;
                updates.tieup[i][j].val = false; 
            }



            //iterate through the row in question and update tieups
            for(var jj = 0; jj < config.drawdown[idx].length; jj++){
              if(config.drawdown[idx][jj]){
                this.tieup[this.threading[jj]][j] = true;
                updates.tieup[this.threading[jj]][j].val = true; 
              }
            }
        }
      }


      console.log("update res", updates);

      return updates;

    }


/***
This function takes an object with vars frame, warp, weft, treadle as input and returns 
indicies for the drawdown cells that will be affected apply to this selection
*/
    getAffectedDrawdownPoints(obj){
          var active_thread_cols = [];
          var active_tieup_rows = [];
          var active_tieup_cols = [];
          var active_treadle_rows = [];

      //this is a point in the threading
      if(obj.frame !== null && obj.warp !== null){

          for(var j = 0; j < this.tieup[0].length; j++){
            if(this.tieup[obj.frame][j]){
              active_tieup_cols.push(j);
            }
          }

          for(var i = 0; i < this.treadling.length; i++){
            for(var t = 0; t < active_tieup_cols.length; t++){
              if(this.treadling[i][t]) active_treadle_rows.push(i); 
            }
          }          

          return {wefts: active_treadle_rows, warps: [obj.warp]};
      }

      //this is in the tie-up
      if(obj.frame !== undefined && obj.treadle !== undefined){

          for(var i = 0; i < this.treadling.length; i++){
              if(this.treadling[i][t]) active_treadle_rows.push(i); 
          }

          for(var j = 0; j < this.threading.length; j++){
              if(this.threading[j] === obj.frame){
                active_thread_cols.push(j);
              } 
          }
          return {wefts: active_treadle_rows, warps: active_thread_cols};
      }

      //this is an action within the treadling
      if(obj.treadle !== undefined && obj.weft !== undefined){

          for(var i = 0; i < this.tieup.length; i++){
            if(this.tieup[i][obj.treadle]){
              active_tieup_rows.push(i);
            }
          }

          for(var ii = 0; ii < active_tieup_rows.length; ii++){
              for(var j = 0; j < this.threading.length; j++){
                if(this.threading[j] == ii) active_thread_cols.push(j);
              }
          }

          return {wefts: [obj.weft], warps: active_thread_cols};
      }
       return null;
    }

    inTieupRange(i, j){
      if(j > 0 && j < this.tieup.length) return true;
      if(i > 0 && i < this.tieup[0].length) return true;
      return false;
    }

    inThreadingRange(i, j){
      if(j > 0 && j < this.threading.length) return true;
      if(i > 0 && i < this.num_frames) return true;
      return false;
    }

    inTreadlingRange(i, j){
      if(j > 0 && j < this.treadling.length) return true;
      if(i > 0 && i < this.num_treadles) return true;
      return false;
    }


}