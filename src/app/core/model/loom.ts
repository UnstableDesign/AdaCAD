import { WSAETOOMANYREFS } from 'constants';
import { Cell } from './cell';
import { Interlacement, InterlacementVal, LoomCoords, LoomUpdate } from './datatypes';
import { Draft } from './draft';
import utilInstance from './util';
/**
 * The Loom class stores the threading, tieup, and treadling informatino for a given draft.
 * @param draft_id an id of the draft for which this loom is currently corresponding
 * @param type 'frame' or 'jacquard'
 * @param epi  a number describing the density of the weave 
 * @param units a string fom the density units type that describes if it should be read in epi or ends per 10 cm
 * @param the width of the fabric given the epi and number of warps
 * @param threading array the same size as warps that has the id for the frame it is associated with or -1. 
 * @param min_frames the available number of frames on the loom (as defined by user)
 * @param num_frames the total number of frames required for the given drawdown
 * @param frame_mapping used to describe the ordering of frames in the view 
 * @param treadling array the same size as wefts that has the id for the frame it is associated with or -1. 
 * @param min_treadles the available number of treadles on the loom (as defined by user)
 * @param num_treadles the total number of treadles required for the given drawdown
 * @param tieup a 2D array of boooleans size frames x treadles that represents the tieup
 */ 
export class Loom{

    draft_id = -1;
    type: string = 'jacquard';
    epi: number = 10;
    units: string = 'in';
    width: number;


    // in our supported looms, each warp end can only be assigned to one frame
    threading: Array<number> = []; 
    min_frames: number = 8; 
    num_frames: number = 8; //the number frames in use
    frame_mapping: Array<number> = [];
    
    //in frame, threadling is 1 row to one treadle, in direct tieup, you can assign multiple
    treadling: Array<Array<number>> = [];
    min_treadles: number = 10;
    num_treadles: number = 10;

    // 2-d arraw of size frames x treadles
    tieup: Array<Array<boolean>> = []; 

    
    constructor(d: Draft, type: string, frames: number, treadles: number) {
      this.draft_id = d.id;
      this.width = d.warps / this.epi; 
      this.type = type;
      this.min_treadles = treadles;
      this.min_frames =frames;
      this.num_treadles = treadles;
      this.num_frames =frames;
      
      this.resetThreading(d.warps, this.type);
      this.resetTreadling(d.wefts);
        
      this.resetTieup(this.num_frames, this.num_treadles, this.type);
      this.resetFrameMapping(this.min_frames, this.type);
      this.recomputeWidth();
    }
    
    /**
     * this links a draft to the loom after it has been loaded or initialized. 
     * @param d the draft to link
     * @returns whether it was of the correct size and thus able to attach
     */
    overloadDraft(d: Draft) : boolean {
      if(d.warps !== this.threading.length) return false;
      if(d.wefts !== this.treadling.length) return false;

      this.draft_id = d.id;
      return true;

    }

    overloadEpi(epi:number){
      this.epi = epi;
      this.recomputeWidth();
    }

    overloadUnits(units:'in' | 'cm'){
      this.units = units;
      this.recomputeWidth();
    }


    overloadType(type:string){
      this.type = type;
    }

    changeType(type:string){
      this.type = type;
      //Write some code here to compute changes
    }


    overloadThreading(threading: Array<number>){
      this.threading = threading; 
      this.updateNumFramesFromThreading();
      this.updateTieupSize();
      this.recomputeWidth();
    }

    overloadTreadling(treadling: Array<Array<number>>){
      this.treadling = treadling; 
      this.updateNumTreadlesFromTreadling();
      this.updateTieupSize();
    }

    overloadTieup(tieup: Array<Array<boolean>>){
      this.tieup = tieup;
    }

    /**
     * loads a new set of data into this existing loom object
     * @param type 
     * @param wefts 
     * @param warps 
     * @param frames 
     * @param treadles 
     */
     load(type: string, wefts: number, warps: number, frames: number, treadles:number) {



        this.type = type;
        
        this.min_frames = frames;
        this.min_treadles = treadles;
        this.num_frames = frames;
        this.num_treadles = treadles;


        this.resetFrameMapping(frames, type);
        this.resetThreading(warps, type);
        this.resetTreadling(wefts);
        this.resetTieup(frames, treadles, type);
      
    }

    copy(l: Loom){
      this.draft_id=  l.draft_id;
      this.type = l.type;
      this.epi = l.epi;
      this.units = l.units,
      this.width = l.width,
      
      this.threading = [];
      this.threading = l.threading.map(el => el);

      this.min_frames = l.min_frames;
      this.num_frames = l.num_frames;
      this.min_treadles = l.min_treadles;
      this.num_treadles = l.num_treadles;
  
      this.treadling = [];
      this.treadling = l.treadling.map(el => el);
      
      this.tieup = [];
      l.tieup.forEach((row, i) => {
        this.tieup.push([]);
        row.forEach((cell, ndx) => {
          this.tieup[i][ndx] = cell;
        });
      });

      this.frame_mapping = [];
      this.frame_mapping = l.frame_mapping.map(el => el);
    }

   

    insertCol(i: number){
      this.threading.splice(i, 0, -1);
      this.recomputeWidth();
    }

    cloneCol(i: number){
      this.threading.splice(i, 0, this.threading[i]);
      this.recomputeWidth();
    }

    deleteCol(i:number){
      this.threading.splice(i,1);
      this.recomputeWidth();
    }

    insertRow(i: number){
      this.treadling.splice(i, 0, []);
    }

    cloneRow(i:number){
      this.treadling.splice(i, 0, this.treadling[i-1]);
    }

    deleteRow(i: number){
      this.treadling.splice(i,1);
    }

    isFrame():boolean{
      return (this.type === "frame" || this.type == "direct");
    }


    /**
     * updates the size of min frames from load or UI
     * @param frames 
     */
    setMinFrames(frames:number){

      //get the max frame being used
      this.updateNumFramesFromThreading();

      if(frames >= this.num_frames){
        this.min_frames = frames;
        this.num_frames = frames;
        this.resetFrameMapping(frames, this.type);
      }else{
        this.min_frames = frames;
      }
     this.updateTieupSize();


    }

    setMinTreadles(treadles:number){

      this.updateNumTreadlesFromTreadling();

      if(treadles >= this.num_treadles){
        this.min_treadles = treadles;
        this.num_treadles = treadles;
      }else{
        this.min_treadles = treadles;
      }

      this.updateTieupSize();

    }

    /**
     * scans the current frames and treadles for unused and updates the size accordingly
     */
    updateTieupSize(){

      //if the tieup is larger than the num frames or treadles, trim it
      if(this.num_frames < this.tieup.length){
        var diff = this.tieup.length - this.num_frames;
        this.tieup.splice(this.num_frames-1, diff);
      }

      if(this.num_treadles < this.tieup[0].length){
        var diff = this.tieup[0].length - this.num_treadles;
        for(var i = 0; i < this.num_frames; i++){
          this.tieup[i].splice(this.num_treadles-1, diff);
        }
      }

      //if it got bigger, than add new values
      for(var i = 0; i < this.num_frames; i++){
        for(var j = 0; j < this.num_treadles; j++){
          if(i < this.tieup.length && j < this.tieup[0].length){
            //do nothing
          }else if(i < this.tieup.length && j >= this.tieup[0].length){
            this.tieup[i][j] = false;
          }else if(i >= this.tieup.length && j < this.tieup[0].length){
            this.tieup[i] = [];
            this.tieup[i][j] = false;
          }else{
            this.tieup[i] = [];
            this.tieup[i][j] = false;
          }
        }
      }
    }

    //always sets in reverse order (for now)
    resetFrameMapping(frames: number, type: string){
       this.frame_mapping = [];
        for(var i = 0; i < frames; i++){
          this.frame_mapping.push((frames-1)-i);
        }

    }

    /**
     * clears all the data in this object, resets to sizes described by warps and wefts
     * @param warps 
     * @param wefts 
     */
    clearAllData(warps:number, wefts:number){
      this.num_frames = this.min_frames;
      this.num_treadles = this.min_treadles;
      this.resetFrameMapping(this.min_frames, this.type);
      this.resetThreading(warps, this.type);
      this.resetTreadling(wefts);
      this.resetTieup(this.min_frames, this.min_treadles, this.type);
    }

    recomputeWidth(){
      this.width = (this.units === 'in') ? this.threading.length/this.epi : 10 * this.threading.length/this.epi;
    }



    resetThreading(warps:number, type: string){
      this.threading = [];
      

        if(type=='rigid'){
          for (var i = 0; i < warps; i++) {
            if(i%0 == 0) this.threading.push(0);
            else this.threading.push(1);
          }
        }else{
          for (var i = 0; i < warps; i++) {
            this.threading.push(-1);
          }
        }
    }



    getTreadle(i: number, j: number) : boolean{
      const value = this.treadling[i].find(el => el === j);
      if(value === undefined) return false;
      return true;
    }

    /**
     * creates an empty tieup. If direct tieup, instantiates a direct draw
     * @param frames 
     * @param treadles 
     * @param type 
     */
    resetTieup(frames:number, treadles:number, type:string){

      this.tieup = [];

      if(type == 'direct') treadles = frames;

        for (var i = 0; i < frames; i++) {
            this.tieup.push([]);
            for(var j = 0; j < treadles; j++){
              if(type == 'direct' && i == j) this.tieup[i].push(true);
              else this.tieup[i].push(false);
            }
        }
    }

    /**
     * creates an empty treadling pattern
     * @param wefts 
     */
    resetTreadling(wefts:number){

        this.treadling = [];
        for (var i = 0; i < wefts; i++) {
            this.treadling.push([]);
        }
    }


   /* updates the threading, tieup, and treadling based on a point in the drawdown
   * @param {i,j} the Row, Column of the changed pixel.
   * @returns {a list of updates made}
   */

    /**
     * updates the threading, tieup, and treadling in response to an update upon the drawdown
     * @param ndx the updated location 
     * @param drawdown an Array of Cells representing the drawdown
     * @returns a list of all the treadling, threading, and tieups that need to be updated
     */
    updateFromDrawdown(ndx: Interlacement, drawdown: Array<Array<Cell>>): LoomUpdate{
      return this.updateConfig(this.getConfig(ndx, drawdown));
    }


    /**
     * seaches through the current treadling to indentify any unassigned treadles
     * @returns the id of the unusued treadle or the current value of num_treadles if all are used.
     */
    getEmptyTreadle() : Array<number> {

      for(var i = 0; i < this.num_treadles; i++){
        const idx = this.treadling.find(el => (el.findIndex(subel => subel === i) !== -1));
        if(idx === undefined) return [i];
      }

      return [this.num_treadles];
    }

    /**
     * search for the first available emptry frame. 
     * @returns the id of the first empty frame
     */
    getEmptyFrame() : number{

      for(var i = 0; i < this.num_frames; i++){
        const idx = this.threading.find(element => element === i);
        if(idx === undefined) return i;
      }

      return this.num_frames;
    }


getConfig(ndx: Interlacement, drawdown: Array<Array<Cell>>){
  if(this.type === 'frame') return this.getFrameConfig(ndx, drawdown);
  if(this.type === 'direct') return this.getDirectConfig(ndx, drawdown);
}


/**
 * For a Frameloom. describes the required frame and treadle assignment for a given interlacement within the current drawdown
 * @param ndx 
 * @param drawdown 
 * @returns a description of the assigned frames and treadles
 */
getFrameConfig(ndx:Interlacement, drawdown: Array<Array<Cell>>):LoomCoords{


      var config: LoomCoords = {
        ndx: ndx,
        frame: -1,
        treadle:[],
        drawdown: drawdown
      }


      var j_pattern = drawdown.map(element => element[ndx.j]);
      var i_pattern = drawdown[ndx.i];
      

      //(1) check if the row is unique
      var found = false;
      for(var i = 0; i < drawdown.length && !found; i++){
        
        //don't check the row we are currently in
        if(i != ndx.i){

          const idx = drawdown[i].find((element, ndx) => element.isUp() !== i_pattern[ndx].isUp());
          if(idx === undefined){
              found = true;
              config.treadle = this.treadling[i].slice();
          }
        }
      }

      if(!found){
        //not remembering what is happening here but seems to be handling the case where we are moving this 
        //value from one to another
        var count = utilInstance.countOccurrences(this.treadling, this.treadling[ndx.i]);
        if(this.treadling[ndx.i].length != 0 && count == 1){
          config.treadle = this.treadling[ndx.i].slice();
        }else{
          config.treadle = this.getEmptyTreadle();          
        }
      }

     //(1) check if the column is unique
      found = false;
      for(var j = 0; j < drawdown[0].length && !found; j++){
        if(j != ndx.j){
          const col = drawdown.map(element => element[j]);
          const idx = col.find((element, ndx) => element.isUp() !== j_pattern[ndx].isUp());

          if(idx === undefined){
              found = true;
              config.frame = this.threading[j];
          }
        }
      }


      if(!found ){
        var count = utilInstance.countOccurrences(this.threading, this.threading[ndx.j]);
        if(this.threading[ndx.j] != -1 && count == 1){
          config.frame = this.threading[ndx.j];
        }else{
          config.frame = this.getEmptyFrame();
        }
      }

      return config;
    }

/**
 * For a Direct tieup. describes the required frame and treadle assignment for a given interlacement within the current drawdown
 * @param ndx 
 * @param drawdown 
 * @returns a description of the assigned frames and treadles
 */
getDirectConfig(ndx:Interlacement, drawdown: Array<Array<Cell>>):LoomCoords{


  //does this row already exist? if yes, just copy treadling
  //steps, decompose the row into the current list of frames. 
  //write all matching frames to treadles
  //create any new frames to handle cases where a complete match is not found. 


  var config: LoomCoords = {
    ndx: ndx,
    frame: -1,
    treadle:[],
    drawdown: drawdown
  }


  var j_pattern = drawdown.map(element => element[ndx.j]);
  var i_pattern = drawdown[ndx.i];
  

  //(1) check if the row is unique
  var found = false;
  for(var i = 0; i < drawdown.length && !found; i++){
    
    //don't check the row we are currently in
    if(i != ndx.i){

      const idx = drawdown[i].find((element, ndx) => element.isUp() !== i_pattern[ndx].isUp());
      if(idx === undefined){
          found = true;
          config.treadle = this.treadling[i].slice();
      }
    }
  }

  if(!found){
    //not remembering what is happening here but seems to be handling the case where we are moving this 
    //value from one to another
    var count = utilInstance.countOccurrences(this.treadling, this.treadling[ndx.i]);
    if(this.treadling[ndx.i].length != 0 && count == 1){
      config.treadle = this.treadling[ndx.i].slice();
    }else{
      config.treadle = this.getEmptyTreadle();          
    }
  }

 //(1) check if the column is unique
  found = false;
  for(var j = 0; j < drawdown[0].length && !found; j++){
    if(j != ndx.j){
      const col = drawdown.map(element => element[j]);
      const idx = col.find((element, ndx) => element.isUp() !== j_pattern[ndx].isUp());

      if(idx === undefined){
          found = true;
          config.frame = this.threading[j];
      }
    }
  }


  if(!found ){
    var count = utilInstance.countOccurrences(this.threading, this.threading[ndx.j]);
    if(this.threading[ndx.j] != -1 && count == 1){
      config.frame = this.threading[ndx.j];
    }else{
      config.frame = this.getEmptyFrame();
    }
  }

  return config;
}



  /**
   * takes a set of changes to make to the loom and implements those changes
   * @param config a sketch of the changes that need to be made
   * @returns a list of the changes made
   */
  updateConfig(config:LoomCoords):LoomUpdate{

    if(this.type === 'frame') return this.updateFrameConfig(config);
    else return this.updateFrameConfig(config);

  }


   /**
   * takes a set of changes to make to the loom and implements those changes
   * @param config a sketch of the changes that need to be made
   * @returns a list of the changes made
   */
    updateFrameConfig(config:LoomCoords):LoomUpdate{

      var updates:LoomUpdate = {
        threading: [],
        treadling: [],
        tieup: []
      }
  
  
      //if this is within the existing frames
      if(config.frame < this.num_frames){
        
        if(this.threading[config.ndx.j] != -1){
          updates.threading.push({i: this.threading[config.ndx.j], j: config.ndx.j, val: false});
        }
  
        this.threading[config.ndx.j] = config.frame;
        updates.threading.push({i: config.frame, j: config.ndx.j, val: true});
  
  
  
      }else{
        
        //add a frame and then assign this to it
        this.threading[config.ndx.j] = config.frame;
        updates.threading.push({i: config.frame, j: config.ndx.j, val: true})
        this.updateNumFramesFromThreading();
        this.resetFrameMapping(this.num_frames, this.type);
      }
  
  
  
  
      if(config.treadle.length == 0 || config.treadle[0] < this.num_treadles){
        //if there is somethign already assigned at this locatino, unassign it
        if(this.treadling[config.ndx.i].length > 0){
          updates.treadling.push({i: config.ndx.i, j: this.treadling[config.ndx.i][0], val: false});
          this.treadling[config.ndx.i] = [];
  
        }
        //now sit it to this treadle
        this.treadling[config.ndx.i] = config.treadle.slice();
        config.treadle.forEach(treadle => {
          updates.treadling.push({i: config.ndx.i, j: treadle, val: true});

        })
  
      }else{
  
  
        this.treadling[config.ndx.i] = config.treadle;
        updates.treadling.push({i: config.ndx.i, j:  config.treadle[0], val: true});
  
        //this.num_treadles = (config.treadle+1);
        this.updateNumTreadlesFromTreadling();
  
      }
  
      //make the tieups match the size
      for(var i = 0; i < this.num_frames; i++){
        updates.tieup.push([]);
        for(var j = 0; j < this.num_treadles; j++){
          if(i < this.tieup.length && j < this.tieup[0].length){
            updates.tieup[i][j] = ({i: i, j:j, val: this.tieup[i][j]});
          }else if(i < this.tieup.length && j >= this.tieup[0].length){
            this.tieup[i][j] = false;
            updates.tieup[i][j] = ({i: i, j:j, val: false});
          }else if(i >= this.tieup.length && j < this.tieup[0].length){
            this.tieup[i] = [];
            this.tieup[i][j] = false;
            updates.tieup[i][j] = ({i: i, j:j, val: false});
          }else{
            this.tieup[i] = [];
            this.tieup[i][j] = false;
            updates.tieup[i][j] = ({i: i, j:j, val: false});
          }
        }
      }
  
      
      //look through each treadle, and see if the tie up needs to be updated
      for(var j = 0; j < this.num_treadles; j++){
          const idx = this.treadling.findIndex(element => element.findIndex(subel => subel === j));
  
        if(idx !== -1){
            //clear the tieup associated with this treadle
            for(var i = 0; i < this.num_frames; i++){
                this.tieup[i][j] = false;
                updates.tieup[i][j].val = false; 
            }
  
            //iterate through the draft row in question and update tieups
            for(var jj = 0; jj < config.drawdown[idx].length; jj++){
              if(config.drawdown[idx][jj].isUp()){
                  var frame = this.threading[jj];
                  this.tieup[frame][j] = true;                  
                  updates.tieup[this.threading[jj]][j].val = true; 
              }
            }
        }
      }
  
      return updates;
  
    }
   

    /**
   * takes a set of changes to make to the loom and implements those changes
   * @param config a sketch of the changes that need to be made
   * @returns a list of the changes made
   */
     updateDirectConfig(config:LoomCoords):LoomUpdate{

      var updates:LoomUpdate = {
        threading: [],
        treadling: [],
        tieup: []
      }
  
  
      //if this is within the existing frames
      if(config.frame < this.num_frames){
        
        if(this.threading[config.ndx.j] != -1){
          updates.threading.push({i: this.threading[config.ndx.j], j: config.ndx.j, val: false});
        }
  
        this.threading[config.ndx.j] = config.frame;
        updates.threading.push({i: config.frame, j: config.ndx.j, val: true});
  
  
  
      }else{
        
        //add a frame and then assign this to it
        this.threading[config.ndx.j] = config.frame;
        updates.threading.push({i: config.frame, j: config.ndx.j, val: true})
        this.updateNumFramesFromThreading();
        this.resetFrameMapping(this.num_frames, this.type);
      }
  
  
      //TODO - handle treadling assignments 
      config.treadle.forEach(treadle => {
          //make sure conig nums are in treadling nums
          const ndx = this.treadling[config.ndx.i].find(el => el == treadle);
          if(ndx === undefined){
            this.treadling[config.ndx.i].push(treadle);
            updates.threading.push({i: config.ndx.i, j: treadle, val: true})
          }
       })

       const todelete = [];
       this.treadling[config.ndx.i].forEach((treadle, ndx) => {
        //make sure conig nums are in treadling nums
        const found = config.treadle.findIndex(el => el == treadle);
        if(found === -1){
          todelete.push(ndx);
          updates.threading.push({i: config.ndx.i, j: treadle, val: false})
        }
     });
     todelete.forEach(del => {
      this.treadling[config.ndx.i].splice(del, 1);
    });
  
      return updates;
  
    }
  

/***
   * takes in an object describing where the change in loom took place and returns a list of affected rows and columns in the draw dow
   * @param i: the tieup frame, j: the tieup treadle, value: true or false
   * @returns (wefts: array of affected rows, warps: array of affected columns)
   */  
    getAffectedDrawdownPoints(obj){


          var active_thread_cols = [];
          var active_tieup_rows = [];
          var active_tieup_cols = [];
          var active_treadle_rows = [];


      //this is a point in the threading
      if(obj.frame !== undefined && obj.warp !== undefined){
    


          //get any treadles that are connected to this frame in the tieup
          for(var j = 0; j < this.num_treadles; j++){
            if(this.tieup[obj.frame][j]){
              active_tieup_cols.push(j);
            }
          }
          for(var i = 0; i < this.treadling.length; i++){
            for(var t = 0; t < active_tieup_cols.length; t++){
              var treadle_id = active_tieup_cols[t];
              if(this.treadling[i] == treadle_id) active_treadle_rows.push(i); 
            }
          }          
          return {wefts: active_treadle_rows, warps: [obj.warp]};
      }

      //this is in the tie-up
      if(obj.frame !== undefined && obj.treadle !== undefined){

          //get all 
          for(var i = 0; i < this.treadling.length; i++){
              if(this.treadling[i] === obj.treadle) active_treadle_rows.push(i); 
          }

          for(var j = 0; j < this.threading.length; j++){
              if(this.threading[j] === obj.frame) active_thread_cols.push(j);
               
          }
          return {wefts: active_treadle_rows, warps: active_thread_cols};
      }

      //this is an action within the treadling
      if(obj.treadle !== undefined && obj.weft !== undefined){


          //whcih frames are associated with this treadle via tie up?
          for(var i = 0; i < this.tieup.length; i++){
            if(this.tieup[i][obj.treadle]){
              active_tieup_rows.push(i);
            }
          }


          //get the cells linked with these frames
          for(var ii = 0; ii < active_tieup_rows.length; ii++){
              for(var j = 0; j < this.threading.length; j++){
                if(this.threading[j] == active_tieup_rows[ii]) active_thread_cols.push(j);
              }
          }


          return {wefts: [obj.weft], warps: active_thread_cols};
      }

       return {wefts:[], warps:[]};
    }


    
    inTieupRange(ndx: Interlacement):boolean{
      if(ndx.i >= 0 && ndx.i < this.tieup.length) return true;
      if(ndx.j >= 0 && ndx.j < this.tieup[0].length) return true;
      return false;
    }

    hasTieup(ndx: Interlacement):boolean{
      if(!this.inTieupRange(ndx)) return null;
      else return (this.tieup[ndx.i][ndx.j]); 

    }


    inThreadingRange(ndx: Interlacement):boolean{
      if(ndx.j >= 0 && ndx.j < this.threading.length) return true;
      if(ndx.i >= 0 && ndx.i < this.num_frames) return true;
      return false;
    }


    /**
     * checks if the given warp is assigned to the given frame
     * @param warp the warm in the draft
     * @param frame the frame in question
     * @returns null if out of range or true/false if it is in this warp
     */
    isInFrame(warp:number, frame:number):boolean{
      if(!this.inThreadingRange({i:frame, j:warp, si: -1})){
        return null;
      } 
      else return (this.threading[warp] === frame); 

    }

    inTreadlingRange(ndx: Interlacement):boolean{
      if(ndx.j >= 0 && ndx.j < this.treadling.length) return true;
      if(ndx.i >= 0 && ndx.i < this.num_treadles) return true;
      return false;
    }

    /**
     * checks if the given weft is assigned to the given treadle
     * @param weft the weft in the draft
     * @param treadle the treadle in question
     * @returns null if out of range or true/false if it is in this weft
     */
    isInTreadle(weft:number, treadle:number):boolean{
      if(!this.inTreadlingRange({i: weft, j:treadle, si: -1})) return null;
      else return this.treadling[weft].findIndex(el => el === treadle) !== -1; 
    }



    updateTieup(ndx: InterlacementVal): Array<InterlacementVal>{
       var updates:Array<InterlacementVal> = [];
        this.tieup[ndx.i][ndx.j] = ndx.val;
        updates.push({i:ndx.i, j:ndx.j, val:ndx.val});
        return updates;
    }



    /**
     * updates the therading given this interlacement val
     * @param ndx 
     * @returns a list of the updates made
     */
    updateThreading(ndx: InterlacementVal):Array<InterlacementVal>{
      var updates = [];
      var frame = this.threading[ndx.j];
      if(!this.inThreadingRange({i:ndx.i, j:ndx.j, si: -1})) return updates;

      //a new value is coming in
      if(ndx.val){

        //nothing is assigned to this frame, send an update to unset the pixel
        if(frame !== -1) updates.push({i:frame, j: ndx.j, val:false});
        this.threading[ndx.j] = ndx.i;
        updates.push({i:ndx.i, j: ndx.j, val:ndx.val});

      }else{

        if(frame === ndx.i){
          updates.push({i:ndx.i, j: ndx.j, val:ndx.val});
          this.threading[ndx.j] = -1;
        }

      }
      
      return updates;
    }


    /**
     * adds the interlacement specified to the treadling list
     * @param ndx 
     * @returns 
     */
    updateTreadling(ndx: InterlacementVal):Array<InterlacementVal>{
      var updates = [];
      var treadle_arr: Array<number> = this.treadling[ndx.i].slice();


      if(!this.inTreadlingRange({i:ndx.i, j:ndx.j, si: -1})) return updates;

      // if(ndx.val){
      const to_delete = [];
      if(treadle_arr.length !== 0){
        treadle_arr.forEach((treadle, arr_ndx) => {
          if(this.type === 'frame'){
            to_delete.push(treadle);
            updates.push({i:ndx.i, j: arr_ndx, val:false});
          } 
        });

        to_delete.forEach(del => {
          this.treadling[ndx.i] = this.treadling[ndx.i].filter(el => el !== del);
        })
      }
       
      if(treadle_arr.find(el => el === ndx.j) === undefined){
        this.treadling[ndx.i].push(ndx.j);
        updates.push({i:ndx.i, j: ndx.j, val:true});
      } 

      return updates;

    }

    /**
     * dynamically updates the num of frames based on what has been assigned in the threading
     */
    updateNumFramesFromThreading(){
      //sets num_frames from values in the threading draft
      var max = -1;

      for(var j= 0; j < this.threading.length; j++){
        if(this.threading[j] > max) max = this.threading[j];
      }

      this.num_frames = max + 1;
      if(this.num_frames < this.min_frames) this.num_frames = this.min_frames;
    }

    /**
     * dynamically updates the num of treadles based on what has been assigned in the treadling
     */
    updateNumTreadlesFromTreadling(){
      //sets num_frames from values in the threading draft

      const max_used:number = this.treadling.reduce((acc, row, ndx) => {
        const max_in_row = row.reduce((subacc, treadle_val) => {
          if(treadle_val > subacc) subacc = treadle_val;
          return subacc;
        }, 0);
        if(max_in_row > acc) acc = max_in_row;
        return acc;
      }, 0);

  
      this.num_treadles = max_used + 1;
      if(this.num_treadles < this.min_treadles) this.num_treadles = this.min_treadles;
    }

      /***
       This function takes a point added to the draft and updates and redraws the loom states
      It takes current position of a point on the currently visible draft
      ***/
     updateLoomFromDraft(currentPos:Interlacement, draft: Draft):boolean{


        var updates = this.updateFromDrawdown({i:currentPos.i,j:currentPos.j,si:currentPos.si}, draft.pattern);
        var u_threading = this.updateUnused(this.threading, this.min_frames, this.num_frames, "threading");
        var u_treadling = this.updateUnused(this.treadling, this.min_treadles, this.num_treadles, "treadling");

        return true;
          
      }



    clearTieupCol(i:number){
       for(var j = 0; j < this.tieup.length; j++){
            this.tieup[j][i] = false;
        }
    }

    clearTieupRow(i:number){
       for(var j = 0; j < this.tieup[0].length; j++){
            this.tieup[i][j] = false;
       }
    }
  


    /**
     * scans through the loom and reorients the assignments to condense into the minimum number of frames and columns
     * @param struct the array of threading/treadling to check
     * @param min the min number of this struct
     * @param num the current number used in this struct
     * @param type describes if it is threadling or threading
     * @returns boolean indicating whether or not condensing took place
     */
    updateUnused(struct:Array<number> | Array<Array<number>>, min:number, num:number, type:string):boolean{

        var status = [];
        var zeros = []; 
        var map = [];        //map [new-index] = old-index

        //first check if the frames/treadles are being used or not
        //push unusued frames to zero:
        for(var i = 0; i < num; i++){
          var occurances = utilInstance.countOccurrences(struct, i);
          status[i] = occurances;
          if(occurances === 0) zeros.push(i);
        }

        
        //if all the frames/treadles have assignments- don't do anything
        if(zeros.length == 0) return false;
        
        //push non-zero rows in order to map first
        for(var i = 0; i < num; i++){
          if(utilInstance.countOccurrences(zeros, i) == 0){
            map.push(i);
          }
        }

        //then add zero rows
        for(var i = 0; i < zeros.length; i++){
          map.push(zeros[i]);
        }

        var swap_happened = false;
        var old_struct = struct.slice();
        var old_tieup = [];
        
        for(var i = 0; i < this.tieup.length; i++){
          old_tieup.push(this.tieup[i].slice());
        }

        
        //reassign the frames/treadles and tieup 
        for(var i = 0; i < map.length; i++){
          var new_ndx = i; 
          var old_ndx = map[i];

          if(new_ndx != old_ndx){

            swap_happened = true;


            for(var j = 0; j < struct.length; j++){
              
              if(old_struct[j] === old_ndx){ 
                struct[j] = new_ndx;
              }
            }

            if(type === "threading"){
              for(var j = 0; j < this.tieup[old_ndx].length; j++){
                this.tieup[new_ndx][j] = old_tieup[old_ndx][j]; 
              }
            }else{
              for(var j = 0; j < this.tieup.length; j++){
                this.tieup[j][new_ndx] = old_tieup[j][old_ndx];
              }
            }
          }
        }


        for(var i = 0; i < num; i++){

           var old_index = map[i];

           if(status[old_index] === 0){

              if(type === "threading"){
                
                if(i > (min-1)){
                  //delete a frame
                  //this.num_frames--;
                  this.updateNumFramesFromThreading();
                  this.resetFrameMapping(this.num_frames, this.type);
                  this.tieup.splice(i, 1);
                }else{
                  this.clearTieupRow(i);
                }

              } else{

                if(i > (min-1)){
                  this.updateNumTreadlesFromTreadling();
                  //this.num_treadles--;
                  for(var j = 0; j < this.tieup.length; j++){
                    this.tieup[j].splice(i, 1);
                  }
                }else{
                  this.clearTieupCol(i)
                }
              }
           }
        }


        for(var i = (num-1); i > (min-1); i--){
           
           var old_index = map[i];
           
           
           if(status[old_index] === 0){
              if(type === "threading"){
                //this.num_frames--;
                this.updateNumFramesFromThreading();
                this.resetFrameMapping(this.num_frames, this.type);
                this.tieup.splice(i, 1);

              } else{
                this.updateNumTreadlesFromTreadling();
                //this.num_treadles--;
                for(var j = 0; j < this.tieup.length; j++){
                  this.tieup[j].splice(i, 1);
                }
              }
           }
        }

        return (swap_happened || this.num_frames < num);
  }

   //this recomputes the state of the frames, treadles and threading from the draft
   recomputeLoom(draft:Draft){

    let mock = [];

    this.clearAllData(draft.warps, draft.wefts);

    //pretendd that we are computing the values as though they were added one by one
    for (var i = 0; i < draft.pattern.length; i++) {
        mock.push([]);
      for(var j = 0; j < draft.pattern[0].length; j++){
        mock[i].push(new Cell(null));
      }
    }

    //compute full rows and for speed
    for (var i = 0; i < draft.pattern.length; i++) {
      for(var j = 0; j < draft.pattern[0].length; j++){
            
          if(draft.pattern[i][j].isUp()){
              mock[i][j].setHeddle(draft.pattern[i][j].isUp());
              this.updateFromDrawdown({i:i,j:j, si:-1}, mock);
              var u_threading = this.updateUnused(this.threading, this.min_frames, this.num_frames, "threading");
              var u_treadling = this.updateUnused(this.treadling, this.min_treadles, this.num_treadles, "treadling");
          }
      }
    }
  }


}//end class
