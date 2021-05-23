import { Shuttle } from './shuttle';
import { System } from './system';
import { Loom } from './loom';
import { Cell } from './cell';
import { Pattern } from './pattern';
import { Selection } from './selection';
import { Point } from '../model/point';

import * as _ from 'lodash';

/**
 * Definition of draft interface.
 * @interface inteface to a draft object
 */
export interface DraftInterface {

  id: number;
  name: string;



  pattern: Array<Array<Cell>>; // the single design pattern
  shuttles: Array<Shuttle>;    //the shuttles used in this draft 
  notes: string;

  //tracks stores row/col index, shuttle index
  rowShuttleMapping: Array<number>;
  colShuttleMapping: Array<number>;  
  rowShuttlePattern: Array<number>;
  colShuttlePattern: Array<number>;

  rowSystemMapping: Array<number>;
  colSystemMapping: Array<number>;
  rowSystemPattern: Array<number>;
  colSystemPattern: Array<number>;

  visibleRows: Array<number>;

  patterns: Array<Pattern>; //the collection of smaller subpatterns from the pattern bar 
 
  masks: Array<String>; //associates a mask id with a name
  
  weft_systems: Array<System>; //weft-systems
  warp_systems: Array<System>; //warp-systems


  connections: Array<any>;
  labels: Array<any>;
  
  wefts: number;
  warps: number;
  width: number;
  epi: number;
  units: string;
  loom: Loom;


}

/**
 * Definition and implementation of draft object.
 * @class stores the draft 
 * @param a user defined for this draft used for saving
 * @param a unique id for this draft
 */
export class Draft implements DraftInterface {
  name: string;
  id: number;

  pattern: Array<Array<Cell>>; // the single design pattern
  shuttles: Array<Shuttle>;    //the shuttles used in this draft 
  notes: string;

  //tracks stores row/col index, shuttle index
  rowShuttleMapping: Array<number>;
  colShuttleMapping: Array<number>;  
  rowShuttlePattern: Array<number>;
  colShuttlePattern: Array<number>;
  
  //tracks stores row/col index with the system index
  rowSystemMapping: Array<number>;
  colSystemMapping: Array<number>;
  rowSystemPattern: Array<number>; //stores a pattern used for rows
  colSystemPattern: Array<number>; //stores a pattern of ids of cols

  visibleRows: Array<number>;

  patterns: Array<Pattern>; //the collection of smaller subpatterns from the pattern bar 
  masks: Array<String>; //associates a mask id with a name
  
  weft_systems: Array<System>; //weft-systems
  warp_systems: Array<System>; //warp-systems

  // rowMaterialMap: Array<number>;
  // colMaterialMap: Array<number>;


  connections: Array<any>;
  labels: Array<any>;
  
  wefts: number;
  warps: number;
  width: number;
  epi: number;
  units: string;
  loom: Loom;

  constructor({...params}) {
    this.id = Date.now();

    this.name = (params.name === undefined) ?  'adacad-draft' : params.name;
    this.wefts = (params.wefts === undefined) ?  8 : params.wefts;
    this.warps = (params.warps === undefined) ? 8 : params.warps;
    this.epi = (params.epi === undefined) ? 10 : params.epi;
    this.units = (params.units === undefined) ? "in" : params.units;
    this.visibleRows = (params.visibleRows === undefined) ? [] : params.visibleRows;
    this.pattern = (params.pattern === undefined) ? [] : params.pattern;
    this.connections = (params.connections === undefined)? [] : params.connections;
    this.labels = (params.labels === undefined)? [] : params.labels;
    this.masks = (params.masks === undefined)? [] : params.masks;
    this.notes = (params.notes === undefined)? "" : params.notes;



    if(params.loom === undefined) {
      this.loom = new Loom('frame', this.wefts, this.warps, 8, 10);

    } else {

      this.loom = new Loom(params.loom.type, this.wefts, this.warps, params.loom.num_frames, params.loom.num_treadles);
      if(params.loom.threading != undefined) this.loom.threading = params.loom.threading;
      if(params.loom.tieup != undefined) this.loom.tieup = params.loom.tieup;
      if(params.loom.treadling != undefined) this.loom.treadling = params.loom.treadling;
    }

  

    //nothing has been added, load with 2 mateials and 1 shuttle on each material
    if(params.shuttles === undefined){

      const randomColor = Math.floor(Math.random()*16777215).toString(16);

      let s0 = new Shuttle({id: 0, name: 'Color 1', type: 0,  thickness:50, color: '#333333', visible: true, insert:false, notes: ""});
      let s1 = new Shuttle({id: 1, name: 'Color 2', type: 0, thickness:50, color: '#'+randomColor, visible:true, insert:false, notes: ""});
      let s2 = new Shuttle({id: 2, name: 'Conductive', type: 1, thickness:50, color: '#61c97d', visible:true, insert:false, notes: ""});
      this.shuttles = [s0, s1, s2];

    }else{

      var shuttles = params.shuttles
      var sd = [];
      for (var i in shuttles) {
        var s = new Shuttle(shuttles[i]);
        sd.push(s);
      }
      this.shuttles = sd;
    }


    //automatically create 4
    if(params.warp_systems === undefined){

      let s0 = new System({id: 0, name: 'Warp System 1', visible: true, notes: ""});
      let s1 = new System({id: 1, name: 'Warp System 2', visible: true, notes: ""});
      let s2 = new System({id: 2, name: 'Warp System 3', visible: true, notes: ""});
      let s3 = new System({id: 3, name: 'Warp System 4', visible: true, notes: ""});
      this.warp_systems = [s0, s1, s2, s3];
    }else{
      var systems = params.warp_systems
          var sd = [];
          for (var i in systems) {
            var sys = new System(systems[i]);
            sd.push(sys);
          }
        this.warp_systems = sd;
      
      while(this.warp_systems.length < 4){
        this.warp_systems.push( new System({id: this.warp_systems.length, name: 'Warp System '+this.warp_systems.length, visible: false, notes: ""}));
      }
    }

    this.colSystemPattern = [];
    if(params.colSystemPattern === undefined){
      for(let i = 0; i < this.warp_systems.length; i++){
        this.colSystemPattern.push(i);
      }
    }else{
      this.colSystemPattern = params.colSystemPattern;
    }


    if(params.weft_systems === undefined){
      let s0 = new System({id: 0, name: 'Weft System 1', visible: true, notes: ""});
      let s1 = new System({id: 1, name: 'Weft System 2', visible: true, notes: ""});
      let s2 = new System({id: 2, name: 'Weft System 3', visible: true, notes: ""});
      let s3 = new System({id: 3, name: 'Weft System 4', visible: true, notes: ""});
      this.weft_systems = [s0, s1, s2, s3];
    }else{
      var systems = params.weft_systems
      var sd = [];
      for (var i in systems) {
        var sys = new System(systems[i]);
        sd.push(sys);
      }
      this.weft_systems = sd;

      while(this.weft_systems.length < 4){
        this.weft_systems.push( new System({id: this.weft_systems.length, name: 'Weft System '+this.weft_systems.length, visible: false, notes: ""}));
      }
    }

    this.rowSystemPattern = [];
    if(params.rowSystemPattern === undefined){
      for(let i = 0; i < this.weft_systems.length; i++){
        this.rowSystemPattern.push(i);
      }
    }else{
      this.rowSystemPattern = params.rowSystemPattern;
    }

    if(params.rowSystemMapping === undefined){
      this.rowSystemMapping = [];
      for(var ii = 0; ii < this.wefts; ii++) {
          let repeat_id:number = ii % this.rowSystemPattern.length;
          this.rowSystemMapping.push(this.rowSystemPattern[repeat_id]); 
      }
    }else{
        this.rowSystemMapping = params.rowSystemMapping;
    }

    if(params.colSystemMapping === undefined){
      this. colSystemMapping = [];
    for(var ii = 0; ii < this.warps; ii++) {
          let repeat_id = ii % this.colSystemPattern.length;
          this.colSystemMapping.push(this.colSystemPattern[repeat_id]);
        }
      }else{
        this.colSystemMapping = params.colSystemMapping;
      }


    this.rowShuttlePattern = [];
    if(params.rowShuttlePattern === undefined){
      for(let i = 0; i < this.shuttles.length; i++){
        this.rowShuttlePattern.push(i);
      }
    }else{
      this.rowShuttlePattern = params.rowShuttlePattern;
    }

    if(params.rowShuttleMapping === undefined){
      this.rowShuttleMapping = [];
      for(var ii = 0; ii < this.wefts; ii++) {
          let repeat_id:number = ii % this.rowShuttlePattern.length;
          this.rowShuttleMapping.push(this.rowShuttlePattern[repeat_id]); 
          this.visibleRows.push(ii);
      }
    }else{
        this.rowShuttleMapping = params.rowShuttleMapping;
    }


    this.colShuttlePattern = [];
    if(params.colShuttlePattern === undefined){
      for(let i = 0; i < this.shuttles.length; i++){
        this.colShuttlePattern.push(i);
      }
    }else{
      this.colShuttlePattern = params.colShuttlePattern;
    }



    if(params.colShuttleMapping === undefined){
      this. colShuttleMapping = [];
    for(var ii = 0; ii < this.warps; ii++) {
          this.colShuttleMapping.push(0);
        }
      }else{
        this.colShuttleMapping = params.colShuttleMapping;
      }


    if(params.patterns !== undefined){
          var patterns = params.patterns
          var pts = [];
          for (i in patterns) {
            pts.push(patterns[i]);
          }
        this.patterns = pts;
    }



    var fill_pattern = this.makeRandomPattern(this.loom.num_frames, this.loom.num_treadles);

    this.pattern = [];
    for(var ii = 0; ii < this.wefts; ii++) {
        this.pattern.push([]);

        for (var j = 0; j < this.warps; j++){
          if (params.pattern === undefined) {
            this.pattern[ii].push(new Cell(null));
            this.pattern[ii][j].setHeddle(fill_pattern[ii%fill_pattern.length][j%fill_pattern[0].length]);
            this.pattern[ii][j].unsetHeddle(); //unset all the patterns
            
          }else{

            this.pattern[ii][j]= new Cell(null);
            
            if(params.pattern[ii][j].is_up === undefined){
              this.pattern[ii][j].setHeddle(params.pattern[ii][j]);
            }else{
              this.pattern[ii][j].setHeddle(params.pattern[ii][j].is_up);
            }

            if(params.pattern[ii][j].mask_id !== undefined){
              this.pattern[ii][j].setMaskId(params.pattern[ii][j].mask_id);
            }

          }
        }
    }

    // if (params.masks === undefined) {
    //   // this.masks = [];
    //   // for(var ii = 0; ii < this.wefts; ii++) {
    //   //   this.masks.push([]);
    //   //   for (var j = 0; j < this.warps; j++)
    //   //     this.masks[ii].push(0);
    //   // }
    // }else{
    //   this.masks = params.masks;
    // } 

    if(this.loom.type == "frame"){
      this.recomputeLoom();
    }

    this.computeYarnPaths();
    this.recomputeWidth();

  }

  //must keep old array references to keep links in tact
  reload({...params}) {


    console.log(params);

    this.name = (params.name === undefined) ?  'adacad-draft' : params.name;


    this.wefts = (params.wefts === undefined) ?  30 : params.wefts;
    this.warps = (params.warps === undefined) ? 40 : params.warps;
    this.epi = (params.epi === undefined) ? 10 : params.epi;
    this.units = (params.units === undefined) ? "in" : params.units;
    this.visibleRows = (params.visibleRows === undefined) ? [] : params.visibleRows;
    this.pattern = (params.pattern === undefined) ? [] : params.pattern;
    this.connections = (params.connections === undefined)? [] : params.connections;
    this.labels = (params.labels === undefined)? [] : params.labels;
    this.masks = (params.masks === undefined)? [] : params.masks;

    this.loom.loadNew('frame', this.wefts, this.warps, 8, 10);


    if(params.loom === undefined) {
        this.loom.loadNew('frame', this.wefts, this.warps, 8, 10);
    } else {
        this.loom.loadNew(params.loom.type, this.wefts, this.warps, params.loom.num_frames, params.loom.num_treadles);
        if(params.loom.threading != undefined) this.loom.threading = params.loom.threading;
        if(params.loom.tieup != undefined) this.loom.tieup = params.loom.tieup;
        if(params.loom.treadling != undefined) this.loom.treadling = params.loom.treadling;
    }

  

    //nothing has been added, load with 2 mateials and 1 shuttle on each material
    if(params.shuttles === undefined){

      this.shuttles = [];
      //this would have already been declared 
      const randomColor = Math.floor(Math.random()*16777215).toString(16);

      let s0 = new Shuttle({id: 0, name: 'Color 1', type: 0,  thickness:50, color: '#333333', visible: true, insert:false, notes: ""});
      let s1 = new Shuttle({id: 1, name: 'Color 2', type: 0, thickness:50, color: '#'+randomColor, visible:true, insert:false, notes: ""});
      let s2 = new Shuttle({id: 2, name: 'Conductive', type: 1, thickness:50, color: '#61c97d', visible:true, insert:false, notes: ""});
      this.shuttles = [s0, s1, s2];

    }else{

      var shuttles = params.shuttles
      var sd = [];
      for (var i in shuttles) {
        var s = new Shuttle(shuttles[i]);
        sd.push(s);
      }
      this.shuttles = sd;
    }


    //automatically create 4
    if(params.warp_systems === undefined){

      // let s0 = new System({id: 0, name: 'Warp System 1', visible: true, notes: ""});
      // let s1 = new System({id: 1, name: 'Warp System 2', visible: false, notes: ""});
      // let s2 = new System({id: 2, name: 'Warp System 3', visible: false, notes: ""});
      // let s3 = new System({id: 3, name: 'Warp System 4', visible: false, notes: ""});
      // this.warp_systems = [s0, s1, s2, s3];
    
    }else{
      var systems = params.warp_systems
          var sd = [];
          for (var i in systems) {
            var sys = new System(systems[i]);
            sd.push(sys);
          }
        this.warp_systems = sd;
      
      while(this.warp_systems.length < 4){
        this.warp_systems.push( new System({id: this.warp_systems.length, name: 'Warp System '+this.warp_systems.length, visible: false, notes: ""}));
      }

    }


    if(params.weft_systems === undefined){
      // let s0 = new System({id: 0, name: 'Weft System 1', visible: true, notes: ""});
      // let s1 = new System({id: 1, name: 'Weft System 2', visible: false, notes: ""});
      // let s2 = new System({id: 2, name: 'Weft System 3', visible: false, notes: ""});
      // let s3 = new System({id: 3, name: 'Weft System 4', visible: false, notes: ""});
      // this.weft_systems = [s0, s1, s2, s3];
    }else{
      var systems = params.weft_systems
      var sd = [];
      for (var i in systems) {
        var sys = new System(systems[i]);
        sd.push(sys);
      }
      this.weft_systems = sd;

      while(this.weft_systems.length < 4){
        this.weft_systems.push( new System({id: this.weft_systems.length, name: 'Weft System '+this.weft_systems.length, visible: true, notes: ""}));
      }
    }

    if(params.rowSystemMapping === undefined){
      this.rowSystemMapping = [];
      for(var ii = 0; ii < this.wefts; ii++) {
          this.rowSystemMapping.push(0); 
      }
    }else{
        this.rowSystemMapping = params.rowSystemMapping;
    }

    if(params.colSystemMapping === undefined){
      this. colSystemMapping = [];
    for(var ii = 0; ii < this.warps; ii++) {
          this.colSystemMapping.push(0);
        }
      }else{
        this.colSystemMapping = params.colSystemMapping;
      }

    if(params.rowShuttleMapping === undefined){
      this.rowShuttleMapping = [];
      for(var ii = 0; ii < this.wefts; ii++) {
          this.rowShuttleMapping.push(1); 
          this.visibleRows.push(ii); //curious why this is here - LD 3/20
      }
    }else{
        this.rowShuttleMapping = params.rowShuttleMapping;
    }

    if(params.colShuttleMapping === undefined){
      this. colShuttleMapping = [];
    for(var ii = 0; ii < this.warps; ii++) {
          this.colShuttleMapping.push(0);
        }
      }else{
        this.colShuttleMapping = params.colShuttleMapping;
      }


    if(params.patterns !== undefined){
          var patterns = params.patterns
          var pts = [];
          for (i in patterns) {
            pts.push(patterns[i]);
          }
        this.patterns = pts;
    } else if (params.loom.threading !== undefined && params.loom.treadling !== undefined && params.loom.tieup !== undefined) {
      this.recalculateDraft(params.loom.tieup, params.loom.treadling, params.loom.threading);
    }



  
    var fill_pattern = this.makeRandomPattern(this.loom.num_frames, this.loom.num_treadles);

    this.pattern = [];
    for(var ii = 0; ii < this.wefts; ii++) {
        this.pattern.push([]);

        for (var j = 0; j < this.warps; j++){
          if (params.pattern === undefined) {
            this.pattern[ii].push(new Cell(null));
            this.pattern[ii][j].setHeddle(fill_pattern[ii%fill_pattern.length][j%fill_pattern[0].length]);

          }else{

            this.pattern[ii][j]= new Cell(null);
            
            if(params.pattern[ii][j].is_up === undefined){
              this.pattern[ii][j].setHeddle(params.pattern[ii][j]);
            }else{
              this.pattern[ii][j].setHeddle(params.pattern[ii][j].is_up);
            }

            if(params.pattern[ii][j].mask_id !== undefined){
              this.pattern[ii][j].setMaskId(params.pattern[ii][j].mask_id);
            }

          }
        }
    }


    if(this.loom.type == "frame"){
      this.recomputeLoom();
    }

    this.computeYarnPaths();
    this.recomputeWidth();

  }

  //this just makes a random pattern of a given size;
  makeRandomPattern(w: number, h: number){
      var random = Array<Array<boolean>>();
      for(var i = 0; i < h; i++) {
         random.push([]);
        for(var j = 0; j < w; j++) {
          //random[i].push(Math.random()*10%2 < 1);
          if(i == j) random[i].push(true);
          else random[i].push(false);
        }
      }
      return random;
  }

  recomputeWidth(){
    this.width = (this.units === 'in') ? this.warps/this.epi : 10 * this.warps/this.epi;
  }

  //assumes i is the draft row
  hasCell(i:number, j:number) : boolean{
    //var row = this.visibleRows[i];
    if(i < 0 || i > this.wefts) return false;
    if(j < 0 || j > this.warps) return false;
    return true;
  }
  //assumes i is the draft row
  isUp(i:number, j:number) : boolean{
    if ( i > -1 && i < this.pattern.length && j > -1 && j < this.pattern[0].length) {
      return this.pattern[i][j].isUp();
    } else {
      return false;
    }
  }

    //assumes i is the draft row
    isSet(i:number, j:number) : boolean{
      if ( i > -1 && i < this.pattern.length && j > -1 && j < this.pattern[0].length) {
        return this.pattern[i][j].isSet();
      } else {
        return false;
      }
    }

  // idFromString(s: string){
  //   console.log("id from string: ", s);
  //   return s.charCodeAt(0)-97;
  // }

  //gets a string from interface and updates accordingly
  updateWarpSystemsFromPattern(pattern:Array<number>){

    //repopulate the system map
    this.colSystemPattern = [];
    for(let i = 0; i < pattern.length; i++){
      this.colSystemPattern.push(pattern[i]);
    }

    //update the colSystemMapping
    for(let i = 0; i < this.colSystemMapping.length; i++){
      let ndx = i % this.colSystemPattern.length;
      this.colSystemMapping[i] = this.colSystemPattern[ndx];
    }
  }


  //gets a string from interface and updates accordingly
  updateWeftSystemsFromPattern(pattern:Array<number>){

    //repopulate the system map
    this.rowSystemPattern = [];
    for(let i = 0; i < pattern.length; i++){
      this.rowSystemPattern.push(pattern[i]);
    }

    //update the rowSystemMapping
    for(let i = 0; i < this.rowSystemMapping.length; i++){
      let ndx = i % this.rowSystemPattern.length;
      this.rowSystemMapping[i] = this.rowSystemPattern[ndx];
    }
  }

    //any{id, name, color}
  updateWeftShuttlesFromPattern(pattern:Array<number>){

    //repopulate the system map
    this.rowShuttlePattern = []
    for(let i = 0; i < pattern.length; i++){
      this.rowShuttlePattern.push(pattern[i]);
    }

    //update the rowShuttleMapping
    for(let i = 0; i < this.rowShuttleMapping.length; i++){
      let ndx = i % this.rowShuttlePattern.length;
      this.rowShuttleMapping[i] = this.rowShuttlePattern[ndx];
    }
  }

      //any{id, name, color}
  updateWarpShuttlesFromPattern(pattern:Array<number>){

    //repopulate the system map
    this.colShuttlePattern = []
    for(let i = 0; i < pattern.length; i++){
      this.colShuttlePattern.push(pattern[i]);
    }

    //update the rowShuttleMapping
    for(let i = 0; i < this.colShuttleMapping.length; i++){
      let ndx = i % this.colShuttlePattern.length;
      this.colShuttleMapping[i] = this.colShuttlePattern[ndx];
    }
  }



  //assumes i is the draft row
  isMask(i:number, j:number) : boolean{
    // //var row = this.visibleRows[i];
    // if ( i > -1 && i < this.mask.length && j > -1 && j < this.mask[0].length) {
    //   return this.mask[i][j];
    // } else {
    //   return false;
    // }
    return false;
  }

  setMask(i:number, j:number, bool:boolean) {
    //var row = this.visibleRows[i];
    //this.mask[i][j] = bool;
  }  

  //everytime we set a heddle - update the poles 
  setHeddle(i:number, j:number, bool:boolean) {
    this.pattern[i][j].setHeddle(bool);
  }



  rowToSystem(screen_row: number) {
    let index = this.visibleRows[screen_row];
    return this.rowSystemMapping[index];
  }

  rowToShuttle(screen_row: number) {
    let index = this.visibleRows[screen_row];
    return this.rowShuttleMapping[index];
  }

  colToSystem(col: number){
     return this.colSystemMapping[col];
  }

  colToShuttle(col: number) {
    return this.colShuttleMapping[col];
  }

  updateVisible() {
    var i = 0;
    var systems = [];
    var visible = [];

    for (i = 0; i < this.weft_systems.length; i++) {
      systems.push(this.weft_systems[i].visible);
    }

    for (i = 0; i< this.rowSystemMapping.length; i++) {
      var show = systems[this.rowSystemMapping[i]];

      if (show) {
        visible.push(i);
      }
    }

    this.visibleRows = visible;
  }

  addLabel(row: number, label: any) {

  }

  createConnection(shuttle: Shuttle, line: any) {

  }

  deleteConnection(lineId: number) {

  }

    //insert a number of rows after the one shown at screen index si
  insertRows(amount: number) {
    
    var row = [];
    for(var i = 0; i < amount; i++){
      this.rowShuttleMapping.push(0);
      this.rowSystemMapping.push(0);
      this.loom.treadling.push(-1);
      //this.mask.splice(i,0,col);

      row = [];
      for (var j = 0; j < this.warps; j++) {
          row.push(new Cell(null));
      }

      this.pattern.push(row);

    }
  
    this.wefts += amount;
    this.updateVisible();


  }

  insertRow(i: number, shuttleId: number, systemId:number) {
    

    var col = [];

    for (var j = 0; j < this.warps; j++) {
      col.push(new Cell(null));
    }

    this.wefts += 1;

    this.rowShuttleMapping.splice(i,0,shuttleId);
    this.rowSystemMapping.splice(i,0,systemId);
    
    this.pattern.splice(i,0,col);
    //this.mask.splice(i,0,col);

    this.loom.treadling.splice(i, 0, -1);


    this.updateVisible();

  }

  //assumes i is the screen index
  cloneRow(i: number, c: number, shuttleId: number, systemId:number) {
    
    var row = this.visibleRows[c];
    var col = [];

    //copy the selected row
    for(var ndx = 0; ndx < this.warps; ndx++){
      col[ndx] = new Cell(null);
      col[ndx].setHeddle(this.pattern[c][ndx].isUp());
    }

    this.wefts += 1;

    this.rowShuttleMapping.splice(i, 0, shuttleId);
    this.rowSystemMapping.splice(i, 0, systemId);
    this.pattern.splice(i, 0, col);
    //this.mask.splice(i, 0, col);
    this.loom.treadling.splice(i, 0, this.loom.treadling[i-1]);

    this.updateVisible();
  }

  //assumes i is the screen index
  deleteRow(i: number) {
    var row = this.visibleRows[i];
    this.wefts -= 1;
    this.rowShuttleMapping.splice(i, 1);
    this.rowSystemMapping.splice(i, 1);
    this.pattern.splice(i, 1);
    //this.mask.splice(i, 1);
    this.loom.treadling.splice(i,1);

    this.updateVisible();
  }


  //inserts a row after the one shown at screen index si
  insertSingleRow(si: number) {
    
    var i = this.visibleRows[si];
    let shuttleId: number = this.rowShuttleMapping[i];
    let systemId: number = this.rowSystemMapping[i];
    var col = [];

    for (var j = 0; j < this.warps; j++) {
      col.push(new Cell(null));
    }

    this.wefts += 1;

    this.pattern.splice(i,0,col);


    this.rowShuttleMapping.splice(i,0,shuttleId);
    this.rowSystemMapping.splice(i,0,systemId);
    
    //this.mask.splice(i,0,col);

    this.loom.treadling.splice(i, 0, -1);

    this.updateVisible();


  }

  //i is the pattern index row
  // cloneRow(si: number) {
    
  //   var col = [];
  //   let i = this.visibleRows[si];
  //   let shuttleId: number = this.rowShuttleMapping[i];
  //   let systemId: number = this.rowSystemMapping[i];

  //   //copy the selected row
  //   for(var ndx = 0; ndx < this.warps; ndx++){

  //     const is_set: boolean = (this.pattern[i][ndx].isSet()) ? true : null;
  //     col[ndx] = new Cell(is_set);
  //     col[ndx].setHeddle(this.pattern[i][ndx].isUp());
  //   }


  //   this.wefts += 1;

  //   this.rowShuttleMapping.splice(i, 0, shuttleId);
  //   this.rowSystemMapping.splice(i, 0, systemId);
  //   this.pattern.splice(i, 0, col);
  //   //this.mask.splice(i, 0, col);
  //   this.loom.treadling.splice(i, 0, this.loom.treadling[i]);
  //   this.updateVisible();


  // }

  //assumes i is the true index, si is the screen index
  deleteSingleRow(si: number) {
    let i = this.visibleRows[si];
    this.wefts -= 1;
    this.rowShuttleMapping.splice(i, 1);
    this.rowSystemMapping.splice(i, 1);
    this.pattern.splice(i, 1);
    //this.mask.splice(i, 1);
    this.loom.treadling.splice(i,1);
    this.updateVisible();


  }

    //assumes i is the true index
  deleteRows(amount: number) {
    let i = this.wefts -1;
    this.wefts -= amount;
    this.rowShuttleMapping.splice(i, amount);
    this.rowSystemMapping.splice(i, amount);
    this.pattern.splice(i, amount);
    //this.mask.splice(i, 1);
    this.loom.treadling.splice(i,amount);
    this.updateVisible();
  }

  // updateConnections(index: number, offset: number) {
  //   var i = 0;

  //   for (i = 0; i < this.connections.length; i++) {
  //     var c = this.connections[i];
  //     if (c.start.y > index) {
  //       c.start.y += offset;
  //     }
  //     if (c.end.y > index) {
  //       c.end.y += offset;
  //     }
  //   }
  // }



  // splicePatternCol(i: number, n:number, val:any){
  //   for(var i = 0; i < this.wefts; i++){
  //     this.pattern.splice(i,n,val);
  //   }
  // }


  insertCol(i: number, shuttleId: number, systemId:number) {
    
    for (var ndx = 0; ndx < this.wefts; ndx++) {
      this.pattern[ndx].splice(i,0, new Cell(null));
    }

    this.warps += 1;
    this.colShuttleMapping.splice(i,0,shuttleId);
    this.colSystemMapping.splice(i,0,systemId);
    this.loom.threading.splice(i, 0, -1);
  }


//assumes i is the screen index
  cloneCol(i: number, shuttleId: number, systemId: number) {
    
    var col = [];

    //copy the selected column
    for(var ndx = 0; ndx < this.wefts; ndx++){
      const is_set: boolean = (this.pattern[i][ndx].isSet()) ? true : null;
      var cell  = new Cell(is_set);
      cell.setHeddle(this.pattern[ndx][i].isUp());
      col.push(cell);
    }


    for(var ndx = 0; ndx < this.wefts; ndx++){
      this.pattern[ndx].splice(i,0, col[ndx]);
    }
    
     this.warps += 1;
     this.colShuttleMapping.splice(i, 0, shuttleId);
     this.colSystemMapping.splice(i, 0, systemId);
     this.loom.threading.splice(i, 0, this.loom.threading[i]);

  }


  deleteCol(i: number) {
    var col = i;

    //copy the selected column
    for(var ndx = 0; ndx < this.wefts; ndx++){
          this.pattern[ndx].splice(i, 1);
    }
    this.warps -= 1;
    this.colShuttleMapping.splice(i, 1);
    this.colSystemMapping.splice(i, 1);
    this.loom.threading.splice(i,1);
  }

//always deletes from end
  // deleteCol(i: number) {

  //   this.warps -= 1;

  //   //remove one from the end of each row
  //   for (var j = 0; j < this.wefts; j++) {
  //     this.pattern[j].splice(i, 1);
  //     // this.masks[j].splice(i, 1);
  //   }


  //   this.colShuttleMapping.splice(i, 1);
  //   this.loom.threading.splice(i, 1);
  // }


// addMaterial(material) {
//     material.setID(this.materials.length);
//     if (!material.thickness) {
//       material.setThickness(this.loom.epi);
//     }
//     this.materials.push(material);
// }


  addShuttle(shuttle) {
    shuttle.setID(this.shuttles.length);
    shuttle.setVisible(true);
    if (!shuttle.thickness) {
      shuttle.setThickness(this.loom.epi);
    }
    this.shuttles.push(shuttle);

    // if (shuttle.image) {
    //   this.insertImage(shuttle);
    // }

  }

  addWeftSystem(system) {
    system.setID(this.weft_systems.length);
    system.setVisible(true);
    this.weft_systems.push(system);
  }

  addWarpSystem(system) {
    system.setID(this.warp_systems.length);
    system.setVisible(true);
    this.warp_systems.push(system);
  }

  //image adds to mask
  // insertImage(shuttle) {
  //   var max = this.rowShuttleMapping.length;
  //   var data = shuttle.image;
  //   for (var i=data.length; i > 0; i--) {
  //     var idx = Math.min(max, i);
  //     this.rowShuttleMapping.splice(idx,0,shuttle.id);
  //     this.mask.splice(idx,0,data[i - 1]);
  //   }
  // }


  getWeftSystemCode(index) {
    var row = this.visibleRows[index];
    var id = this.rowSystemMapping[row];
    var system = this.weft_systems[id];

    return String.fromCharCode(97 + system.id);
  }

  getWarpSystemCode(index) {

     var col = this.colSystemMapping[index];
     var system = this.warp_systems[col];

    return  String.fromCharCode(97 + system.id);
  }


  getColor(index) {
    var row = this.visibleRows[index];
    var id = this.rowShuttleMapping[row];
    var shuttle = this.shuttles[id];

    return shuttle.color;
  }

  getColorCol(index) {


    var col = this.colShuttleMapping[index];
    var shuttle = this.shuttles[col];

    return shuttle.color;
  }

/***
   * updates the draft based on changes that happened within the threading.
   * @param update{i: threading frame, j: threading warp, val: true or false for setting}
   * more than one update object may be sent in the case where a thread is switching from one frame to another
   * @returns (nothing) in the future - this can return the specific points to update on the draft
   */  
  updateDraftFromThreading(updates){

    for(var u in updates){

      if(updates[u].i !== undefined){

        var idxs = this.loom.getAffectedDrawdownPoints({warp: updates[u].j, frame: updates[u].i});
        var conflicts = [];

        for(var i = 0; i < idxs.wefts.length; i++){
          for (var j = 0; j < idxs.warps.length; j++){
             this.pattern[idxs.wefts[i]][idxs.warps[j]].setHeddle(updates[u].val);
          }
        }

      }
    }
      //return idxs;
  }


/***
   * updates the draft based on changes that happened within the treadling.
   * @param update{i: weft pic frame, j: treadle, val: true or false for setting}
   * more than one update object may be sent in the case where a thread is switching from one treadle to another
   * @returns (nothing) in the future - this can return the specific points to update on the draft
   */  
  updateDraftFromTreadling(updates){

    for(var u in updates){
      
      if(updates[u].i !== undefined){

        var idxs = this.loom.getAffectedDrawdownPoints({weft: updates[u].i, treadle: updates[u].j});
        
        for(var i = 0; i < idxs.wefts.length; i++){
          for (var j = 0; j < idxs.warps.length; j++){
             this.pattern[idxs.wefts[i]][idxs.warps[j]].setHeddle(updates[u].val);
          }
        }
      }
    }

    //return idxs;
      
  }

/***
   * updates the draft based on changes that happened within the tie up.
   * @param i: the tieup frame, j: the tieup treadle, value: true or false
   * @returns (nothing) in the future - this can return the specific points to update on the draft
   */  
  updateDraftFromTieup(updates){

      for(var u in updates){
      
        if(updates[u].i !== undefined){

          var idxs = this.loom.getAffectedDrawdownPoints({frame: updates[u].i, treadle: updates[u].j});
       
          for(var wi = 0; wi < idxs.wefts.length; wi++){
            for (var wj = 0; wj < idxs.warps.length; wj++){
             this.pattern[idxs.wefts[wi]][idxs.warps[wj]].setHeddle(updates[u].val);
            }
          }
        }
      }

      return idxs;
  }

  
/***
   * recalculates all of drawdown from tieup, treadling, and threading.
   * @param i: the tieups array, j: the treadling array, the threading array
   * @returns (nothing) in the future - this can return the specific points to update on the draft
   */  
  recalculateDraft(tieup, treadling, threading) {
    for (var i = 0; i < treadling.length;i++) {
      var active_treadle = treadling[i];
      if (active_treadle != -1) {
        for (var j = 0; j < tieup.length; j++) {
          if (tieup[j][active_treadle]) {
            for (var k = 0; k < threading.length;k++) {
              if (threading[k] == j) {
                this.pattern[i][k].setHeddle(true);
              }
            }
          }
        }
      }
    }
  }



  getDirection(neighbors:number, is_up:boolean) : string{

    var is_up_dirs =     ["ew","ew", "ns", "sw", "ew", "ew", "se", "ew", "ns", "nw", "ns", "ew", "ne", "ew", "ew", "ew"];
    var not_is_up_dirs = ["x", "x", "x",  "sw", "x",  "ew", "se", "ew", "x",  "nw", "ns", "sw", "ne", "ew", "sw", "ew"];
    
    if(is_up) return is_up_dirs[neighbors];
    else return not_is_up_dirs[neighbors];

  }


  updatePoles(i: number, j: number){


  }

/***
   * determines the directionality of the yarn at this particular point in the cell
   * it considers each draft cell having four poles (NESW) and determines which of those are active
   * @param i: the draft row, j: the draft column
   * @returns a bit string value created by adding a 1 on the string n,e,s,w where the direction is true
   */ 

  pingNeighbors(i:number, j:number): number{

    let cell:Cell = new Cell(null);
    let shuttle_id: number = this.rowShuttleMapping[i];


    if(this.hasNorthNeighbor(i,j,shuttle_id)) cell.setNorth(); 
    if(this.hasEastNeighbor(i,j)) cell.setEast();             
    if(this.hasSouthNeighbor(i,j,shuttle_id)) cell.setSouth(); 
    if(this.hasWestNeighbor(i,j)) cell.setWest();            

    return cell.getPoles();
  }

  //searches to the west (on this row only) for an interlacement
  hasWestNeighbor(i:number, j:number): boolean{

      for(var ndx = j-1; ndx >= 0; ndx--){
        if(this.pattern[i][ndx].isUp()) return true;
      }
      return false;
  }


  /***
  If this doesn't have east set, then there is nothing to the west
  */
  setWestNeighbors(i:number, j:number){

      for(var ndx = j-1; ndx >= 0; ndx--){
        this.pattern[i][ndx].setEast();
        if(this.pattern[i][ndx].isUp()) return;
      }

      return;
  }

  unsetWestNeighbors(i:number, j:number){

      //there is something else for the western cells to reference
      if(this.hasEastNeighbor(i,j)) return; 

      //unset until you find the next set cell
      for(var ndx = j-1; ndx >= 0; ndx--){
        this.pattern[i][ndx].unsetEast(); 
        if(this.pattern[i][ndx].isUp()) return;
      }

      return;
  }


  //searches to the east (on this row only) for an interlacement
  hasEastNeighbor(i:number, j:number): boolean{
      
      for(var ndx = j+1; ndx < this.warps; ndx++){
        if(this.pattern[i][ndx].isUp()) return true;
      }
      return false;
  }


  //walks to the east until it hits another set cell, adds "west" to each 
  setEastNeighbors(i:number, j:number){

      for(var ndx = j+1; ndx < this.warps; ndx++){
        this.pattern[i][ndx].setWest();
        if(this.pattern[i][ndx].isUp()) return;
      }

      return;
  }

  unsetEastNeighbors(i:number, j:number){

      //there is something else for the western cells to reference
      if(this.hasWestNeighbor(i,j)) return; 

      //unset until you find the next set cell
       for(var ndx = j+1; ndx < this.warps; ndx++){
        this.pattern[i][ndx].unsetWest(); 
        if(this.pattern[i][ndx].isUp()) return;
      }

      return;
  }

  //searches rows to the north for any interlacement on the same shuttle
  hasNorthNeighbor(i:number, j:number, shuttle_id: number): boolean{
      for(var ndx = i-1; ndx >= 0; ndx--){
        if(this.rowShuttleMapping[ndx] === shuttle_id){
          if(this.pattern[ndx][j].isUp()) return true;
          if(this.hasWestNeighbor(ndx,j)) return true;
          if(this.hasEastNeighbor(ndx,j)) return true;
        }
      }
      return false;
  }

  //searches rows to the north for any interlacement on the same shuttle
  setNorthNeighbors(i:number, j:number, shuttle_id: number): boolean{
      var c: Cell;

      for(var ndx = i-1; ndx >= 0; ndx--){
        if(this.rowShuttleMapping[ndx] === shuttle_id){
          
             

          for(var col = 0; col < this.warps; col++){
            
          }

          if(this.pattern[ndx][j].isUp()) return true;
          if(this.hasWestNeighbor(ndx,j)) return true;
          if(this.hasEastNeighbor(ndx,j)) return true;
        }
      }
      return false;
  }

  //searches rows to the south for any interlacement on the same shuttle
  hasSouthNeighbor(i:number, j:number, shuttle_id:number): boolean{
      for(var ndx = i+1; ndx < this.wefts; ndx++){
        if(this.rowShuttleMapping[ndx] === shuttle_id){
          if(this.pattern[ndx][j].isUp()) return true;
          if(this.hasWestNeighbor(ndx,j)) return true;
          if(this.hasEastNeighbor(ndx,j)) return true;
        }
      }
      return false;
  }


  //this recomputes the state of the frames, treadles and threading from the draft
  recomputeLoom(){

    let mock = [];

    this.loom.clearAllData(this.warps, this.wefts);

    //pretendd that we are computing the values as though they were added one by one
    for (var i = 0; i < this.pattern.length; i++) {
        mock.push([]);
      for(var j = 0; j < this.pattern[0].length; j++){
        mock[i].push(new Cell(null));
      }
    }

    //compute full rows and for speed
    for (var i = 0; i < this.pattern.length; i++) {
      for(var j = 0; j < this.pattern[0].length; j++){
            
          if(this.pattern[i][j].isUp()){
              mock[i][j].setHeddle(this.pattern[i][j].isUp());
              this.loom.updateFromDrawdown(i,j, mock);
              var u_threading = this.loom.updateUnused(this.loom.threading, this.loom.min_frames, this.loom.num_frames, "threading");
              var u_treadling = this.loom.updateUnused(this.loom.treadling, this.loom.min_treadles, this.loom.num_treadles, "treadling");
          }
      }
    }
  }


  //checks system assignments and updates visibility of systems that are being used
  updateSystemVisibility(type:string){

    var mapping;
    var systems;

    if(type == "weft"){
      mapping = this.rowSystemMapping;
      systems = this.weft_systems;
    } else {
      mapping = this.colSystemMapping;
      systems = this.warp_systems;
    }


    for(var i =0; i < systems.length; i++){
      systems[i].setVisible(mapping.includes(systems[i].id));
    }

    if(type == "weft") this.updateVisible();

  }





setNorthSouth(row:number, i:number){

  if(i > 0 && i < this.warps){
    this.pattern[row][i].setNorthSouth();
  }
}

setEastWest(row:number, i:number){
  if(i > 0 && i < this.warps){
    this.pattern[row][i].setEastWest();
  }
}

setSouth(row:number, i:number){
  if(i > 0 && i < this.warps){
    this.pattern[row][i].setSouth();
  }
}

setNorth(row:number, i:number){
  if(i > 0 && i < this.warps){
    this.pattern[row][i].setNorth();
  }
}

setEast(row:number, i:number){
  if(i > 0 && i < this.warps){
    this.pattern[row][i].setEast();
  }
}

setWest(row:number, i:number){
  if(i > 0 && i < this.warps){
    this.pattern[row][i].setWest();
  }
}

getNextPath(paths, i){
  if(i+1 < paths.length){
    return paths[i+1];
  }

  return {
    row: -1,
    overs: []
  }

}

computeYarnPaths(){

    //unset_all
    for(let i = 0; i < this.pattern.length; i++){
      for(let j = 0; j < this.pattern[i].length; j++){
        this.pattern[i][j].unsetPoles();
      }
    }


    for (var l = 0; l < this.shuttles.length; l++) {

      // Draw each shuttle on by one.
      var shuttle = this.shuttles[l];

      //acc is an array of row_ids that are assigned to this shuttle
      const acc = this.rowShuttleMapping.reduce((acc, v, idx) => v === shuttle.id ? acc.concat([idx]) : acc, []);

      //screen rows are reversed to go from bottom to top
      //[row index] -> (indexes where there is interlacement)
      let path = [];
      for (var i = 0; i < acc.length ; i++) {
       
        const row_values = this.pattern[acc[i]];
        const overs = row_values.reduce((overs, v, idx) => v.isUp() ? overs.concat([idx]) : overs, []);

        //only push the rows with at least one interlacement     
        if(overs.length > 0 && overs.length < row_values.length){
          path.push({row: acc[i], overs:overs});
        }
      
      }

      var started = false;
      var last = {
        row: 0,
        ndx: 0
      };

      path = path.reverse();


      for(let k = 0; k < path.length; k++){

        let row:number = parseInt(path[k].row); 
        let overs:Array<number> = path[k].overs; 

        let next_path = this.getNextPath(path, k);

        let min_ndx:number = overs.shift();
        let max_ndx:number = overs.pop();
        
        let next_min_ndx:number;
        let next_max_ndx:number;
        
        if(next_path.row !== -1 ){
         
          next_max_ndx = next_path.overs[next_path.overs.length-1];
          next_min_ndx = next_path.overs[0];

        }else{
          next_min_ndx = min_ndx;
          next_max_ndx = max_ndx;
        }  



        let moving_left:boolean = (k%2 === 0 && shuttle.insert) || (k%2 !== 0 && !shuttle.insert);

        if(moving_left){
          if(started) max_ndx = Math.max(max_ndx, last.ndx);
          min_ndx = Math.min(min_ndx, next_min_ndx);
        } else {
          max_ndx = Math.max(max_ndx, next_max_ndx);
          if(started) min_ndx = Math.min(min_ndx, last.ndx);

        }
       
        //draw upwards if required
        if(started){

          
         // console.log("row/last.row", row, last.row);
          // for(let j = last.row-1; j > row; j--){
          //  if(moving_left) this.setNorthSouth(j, last.ndx+1);
          //  else this.setNorthSouth(j, last.ndx-1);
          // }
        }

        //set by lookiing at the ends ends
        if(moving_left){

          if(started){
             this.setSouth(row,max_ndx+1); //set where it came from
          } 
          
          this.setWest(row, max_ndx+1);

          this.setNorth(row, min_ndx-1);
          this.setEast(row, min_ndx-1);

          last.ndx = min_ndx;

        }else{

          if(started){
            this.setSouth(row, min_ndx-1);
          }

          this.setEast(row, min_ndx-1);
          
          this.setNorth(row, max_ndx+1);
          this.setWest(row, max_ndx+1);
          
          last.ndx = max_ndx;

        } 

        //set in between
        for(i = min_ndx; i <= max_ndx; i++){
           this.setEastWest(row, i); 
        }

        started = true;
        last.row = row;
       
      } 
    }
        

  }


  /**
   * Fills in selected area of canvas. Updates the pattern within selection.
   * @extends WeaveDirective
   * @param {Selection} selection - defined user selected area to fill.
   * @param {Array<Array<boolean>>} - the pattern used to fill the area.
   * @param {string} - the type of logic used to fill selected area.
   * @returns {void}
   */
  public fillArea(
    selection: Selection, 
    pattern: Array<Array<Cell>>, 
    type: string
  ) {

    // console.log("fill area called");
    // console.log(selection, pattern, type);

    var updates = [];
    
    var screen_i = Math.min(selection.start.si, selection.end.si)
    const draft_i = Math.min(selection.start.i, selection.end.i);
    const draft_j = Math.min(selection.start.j, selection.end.j);
  
    const rows = pattern.length;
    const cols = pattern[0].length;

    var w,h;

    w = Math.ceil(selection.width);
    h = Math.ceil(selection.height);


    if(selection.target.id === "warp-systems"){
      h = pattern.length;
      screen_i = 0;
    } 
    if(selection.target.id === "weft-systems"){
      w = pattern[0].length;
    } 

    if(selection.target.id === "warp-materials"){
       h = pattern.length;
       screen_i = 0;
    }
    if(selection.target.id === "weft-materials"){
      w = pattern[0].length;
    } 

    //cycle through each visible row/column of the selection
    for (var i = 0; i < h; i++ ) {
      for (var j = 0; j < w; j++ ) {

        var row = i + screen_i;
        var col = j + draft_j;


        var temp = pattern[i % rows][j % cols];
       
        var prev:boolean = false; 
        switch(selection.target.id){

          case 'drawdown':
              var draft_row = this.visibleRows[row];
              prev = this.pattern[draft_row][col].isUp();

          break;
          case 'threading':
              var frame = this.loom.frame_mapping[row];
              prev = this.loom.isInFrame(col, frame);
          
          break;
          case 'treadling':
              var draft_row = this.visibleRows[row];
              prev = (this.loom.isInTreadle(draft_row, col)); 
          break;
          case 'tieups':
              var frame = this.loom.frame_mapping[row];
              prev = this.loom.hasTieup(frame,col); 
          
          break;
          default:
          break;
        }

        if (prev !== null){

          var val = false;
          switch (type) {
            case 'invert':
             val = !temp;
              break;
            case 'mask':
             val = temp && prev;
              break;
            case 'mirrorX':
              val = pattern[(h - i - 1) % rows][j % cols].isUp();
              break;
            case 'mirrorY':
              val = pattern[i % rows][(w - j - 1) % cols].isUp();
              break;
            case 'shiftUp':
              val = pattern[(i+1) % rows][j].isUp();
              break;
            case 'shiftLeft':
              val = pattern[i][(j+1) % cols].isUp();
              break;
            default:
              val = temp.isUp();
              break;
          }


          var updates = [];

          switch(selection.target.id){
           
           case 'drawdown':
           var draft_row = this.visibleRows[row];

            if(this.hasCell(draft_row,col)){

                var p = new Point(); 
                p.si = row;
                p.i = this.visibleRows[row];
                p.j = col;
              
                this.setHeddle(p.i,p.j,val);
               // this.updateLoomFromDraft(p); //this is an area where we could be facing slowdown 
              }

            break;
            
            case 'threading':
            var frame = this.loom.frame_mapping[row];

              if(this.loom.inThreadingRange(frame,col)){ 
                updates = this.loom.updateThreading(frame, col, val);
                this.updateDraftFromThreading(updates); 
              }
            break;

            case 'treadling':
              
             var draft_row = this.visibleRows[row];
             if(this.loom.inTreadlingRange(draft_row,col)){ 
                updates = this.loom.updateTreadling(draft_row, col, val);
                this.updateDraftFromTreadling(updates);
              }
            break;
            case 'tieups':
              var frame = this.loom.frame_mapping[row];

              if(this.loom.inTieupRange(frame, col)){
                updates = this.loom.updateTieup(frame, col, val);
                this.updateDraftFromTieup(updates);
              }
            break;
            case 'weft-systems':
              var draft_row = this.visibleRows[row];
              val = pattern[i % rows][j % cols].isUp();
              if(val && col < this.weft_systems.length) this.rowSystemMapping[draft_row] = col;
            
            break;
            case 'warp-systems':
              val = pattern[i % rows][j % cols].isUp();
              if(val && row < this.warp_systems.length){
                  this.colSystemMapping[col] = row;
              }
            break;
            case 'weft-materials':
              var draft_row = this.visibleRows[row];
              val = pattern[i % rows][j % cols].isUp();
              if(val && col < this.shuttles.length) this.rowShuttleMapping[draft_row] = col;
            
            break;
            case 'warp-materials':
              val = pattern[i % rows][j % cols].isUp();
              if(val && row < this.shuttles.length){
                  this.colShuttleMapping[col] = row;
              }
            break;
            default:
            break;
          }
        }


      }
    }

    var u_threading = this.loom.updateUnused(this.loom.threading, this.loom.min_frames, this.loom.num_frames, "threading");
    var u_treadling = this.loom.updateUnused(this.loom.treadling, this.loom.min_treadles, this.loom.num_treadles, "treadling");


  }


   /**
   * Fills in the entire draft
   * @param {Array<Array<Cell>>} - the pattern used to fill the area.
   * @param {string} - the type of logic used to fill selected area.
   * @returns {void}
   */
    public fill(
      pattern: Array<Array<Cell>>, 
      type: string
    ) {
  
      
      const rows = pattern.length;
      const cols = pattern[0].length;
  
      var w,h;
  
      w = this.warps;
      h = this.wefts;
  
  
      //cycle through each visible row/column of the draft
      for (var i = 0; i < h; i++ ) {
        for (var j = 0; j < w; j++ ) {
  
          var row = i;
          var col = j;
  
          let temp:Cell = pattern[i % rows][j % cols];
          var draft_row = this.visibleRows[row];
          
          let prev_set: boolean = this.pattern[draft_row][col].isSet();
          let prev_heddle: boolean = this.pattern[draft_row][col].isUp();
  
          let new_set = false;
          let new_heddle = true;
           
          switch (type) {
              case 'invert':
               new_set = prev_set; 
               new_heddle = !prev_heddle;
                break;
              case 'mask':
               new_set = prev_set; 
               new_heddle = temp.isUp() && prev_heddle;
                break;
              case 'mirrorX':
                new_set = pattern[(h - i - 1) % rows][j % cols].isSet();
                new_heddle = pattern[(h - i - 1) % rows][j % cols].isUp();
                break;
              case 'mirrorY':
                new_set = pattern[i % rows][(w - j - 1) % cols].isSet();
                new_heddle = pattern[i % rows][(w - j - 1) % cols].isUp();
                break;
              case 'shiftUp':
                new_set = pattern[(i+1) % rows][j].isSet();
                new_heddle = pattern[(i+1) % rows][j].isUp();
                break;
              case 'shiftLeft':
                new_set = pattern[i][(j+1) % cols].isSet();
                new_heddle = pattern[i][(j+1) % cols].isUp();
                break;
              default:
                new_set = temp.isSet();
                new_heddle = temp.isUp();
                break;
            }
  
  
            if(this.hasCell(draft_row,col)){

                if(new_set){
                  this.setHeddle(draft_row,j,new_heddle);
                }else{
                  this.pattern[draft_row][j].unsetHeddle();
                }
          }
        }
      }
  
    }

  /***
   This function takes a point added to the draft and updates and redraws the loom states
   It takes current position of a point on the currently visible draft
   ***/
   private updateLoomFromDraft(currentPos):boolean{


    var updates = this.loom.updateFromDrawdown(currentPos.i,currentPos.j, this.pattern);
    var u_threading = this.loom.updateUnused(this.loom.threading, this.loom.min_frames, this.loom.num_frames, "threading");
    var u_treadling = this.loom.updateUnused(this.loom.treadling, this.loom.min_treadles, this.loom.num_treadles, "treadling");

    return true;
      
   }

}
