import { Shuttle } from './shuttle';
import { System } from './system';
import { Loom } from './loom';
import { Cell } from './cell';
import { Pattern } from './pattern';
import { Selection } from '../../weaver/model/selection';
import { Point, Interlacement } from './datatypes';

import * as _ from 'lodash';


/**
 * Definition and implementation of draft object.
 * @class stores the draft 
 * @param a user defined for this draft used for saving
 * @param a unique id for this draft
 */
export class Draft{
  name: string = "adacad_draft";
  id: number = -1;

  pattern: Array<Array<Cell>> = [[new Cell(false)]]; // the single design pattern
  shuttles: Array<Shuttle> = [new Shuttle()];    //the shuttles used in this draft 
  notes: string = "";

  //tracks stores row/col index, shuttle index
  rowShuttleMapping: Array<number> = [0];
  colShuttleMapping: Array<number> = [0];  
  rowShuttlePattern: Array<number> = [0];
  colShuttlePattern: Array<number> = [0];
  
  //tracks stores row/col index with the system index
  rowSystemMapping: Array<number> = [0];
  colSystemMapping: Array<number> = [0];
  rowSystemPattern: Array<number> = [0]; //stores a pattern used for rows
  colSystemPattern: Array<number> = [0]; //stores a pattern of ids of cols

  masks: Array<String> = []; //associates a mask id with a name
  
  weft_systems: Array<System> = [new System()]; //weft-systems
  warp_systems: Array<System> = [new System()]; //warp-systems
  
  wefts: number = 1;
  warps: number = 1;

  /**
   * initailizes the most minimal form of a draft, a warp and weft number and pattern. 
   * If no pattern is supplied, it will create a pattern with unset cells
   * @param param0 accepted params are 
   * weft, 
   * warps,
   * pattern
   */
  constructor({...params}) {
    this.id = Date.now();
    //set warps and weft
    if(params.wefts === undefined){
      if(params.pattern === undefined){
        this.wefts = 1;
      }else{
        this.wefts = params.pattern.length;
      }
    }else{
      this.wefts = params.wefts;
    }

    if(params.warps === undefined){
      if(params.pattern === undefined){
        this.warps = 1;
      }else{
        this.warps = params.pattern[0].length;
      }
    }else{
      this.warps = params.warps;
    }

    //parse the input pattern
    this.pattern = this.parsePattern(params.pattern);
   
    this.rowShuttleMapping = this.initMapping(this.wefts);
    this.rowSystemMapping = this.initMapping(this.wefts);
    this.colShuttleMapping = this.initMapping(this.warps);
    this.colSystemMapping = this.initMapping(this.warps);
  }


  parsePattern(params: any):Array<Array<Cell>>{


    const pattern:Array<Array<Cell>> = [];
    for(var i = 0; i < this.wefts; i++) {
        pattern.push([]);
        for (var j = 0; j < this.warps; j++){
          if (params === undefined) {
            pattern[i].push(new Cell(false));
          }else{
            pattern[i][j]= new Cell(null);
            pattern[i][j].reloadCell(params[i][j]); //this takes a cell param and updates from there
          }
        }
    }
    return pattern;
  }

  initMapping(length: number) :Array<number> {
    const a: Array<number> = [];
    for(let i = 0; i < length; i++){
      a.push(0);
    }
    return a;
  }


  



/**
 * a method to import the parameters from one draft into another while maintaining the address 
 * and id of the draft
 * used when we need to maintain the id of a parent draft, but load new values
 * @param param0 
 */
  reload(d: Draft) {


    this.name = d.name;
    this.warps = d.warps;
    this.wefts = d.wefts;
    this.pattern = this.parsePattern(d.pattern);
    this.notes = d.notes;
    this.overloadShuttles(d.shuttles);
    this.overloadRowShuttleMapping(d.rowShuttleMapping);
    this.overloadColShuttleMapping(d.colShuttleMapping);
    this.overloadRowSystemMapping(d.rowSystemMapping);
    this.overloadColSystemMapping(d.colSystemMapping);
  
    this.overloadWeftSystems(d.weft_systems);
    this.overloadWarpSystems(d.warp_systems);
  }

  /**
   * this creates an empty pattern of a given size
   * @param warps 
   * @param wefts 
   */
  makeEmptyPattern(warps: number, wefts: number) : Array<Array<Cell>>{
    const p = [];
    for(var ii = 0; ii < wefts; ii++) {
        p.push([]);
        for (var j = 0; j < warps; j++){
          p[ii].push(new Cell(false));
        }
    }
    return p;
  }

  overloadId(id: number){
    this.id = id; 
  }

  overloadNotes(notes: string){
    this.notes = notes;
  }

  overloadName(name: string){
    this.name = name;
  }

  overloadShuttles(shuttles: Array<Shuttle>){
    this.shuttles = [];
    shuttles.forEach(shuttle => {
      this.shuttles.push(new Shuttle(shuttle))
    });
  }

  overloadWarpSystems(systems: Array<System>){
    this.warp_systems = [];

    systems.forEach(system => {
      this.warp_systems.push(new System(system));
    });
  }

  overloadWeftSystems(systems: Array<System>){

      systems.forEach(system => {
        this.weft_systems.push(new System(system));
      });
    
    
  }

  overloadRowShuttleMapping(mapping: Array<number>){
    this.rowShuttleMapping = [];
    this.rowShuttleMapping = mapping;
  }

  overloadColShuttleMapping(mapping: Array<number>){
    this.colShuttleMapping = [];
    this.colShuttleMapping = mapping;
  }

  overloadRowSystemMapping(mapping: Array<number>){
    this.rowSystemMapping = [];
    this.rowSystemMapping = mapping;
  }

  overloadColSystemMapping(mapping: Array<number>){
    this.colSystemMapping = [];
    this.colSystemMapping = mapping;
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


  //assumes i is the draft row
  hasCell(i:number, j:number) : boolean{
    //var row = this.visibleRows[i];
    if(i < 0 || i >= this.wefts) return false;
    if(j < 0 || j >= this.warps) return false;
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



  rowToSystem(visibleRows: Array<number>, screen_row: number) {
    let index = visibleRows[screen_row];
    return this.rowSystemMapping[index];
  }

  rowToShuttle(visibleRows: Array<number>, screen_row: number) {
    let index = visibleRows[screen_row];
    return this.rowShuttleMapping[index];
  }

  colToSystem(col: number){
     return this.colSystemMapping[col];
  }

  colToShuttle(col: number) {
    return this.colShuttleMapping[col];
  }

  
  addLabel(row: number, label: any) {

  }

  createConnection(shuttle: Shuttle, line: any) {

  }

  deleteConnection(lineId: number) {

  }



  /**
   * removes any boundary rows that are unset
   * @return returns true if it deleted all the rows
   */
  trimUnsetRows() : boolean{

    const rowmap: Array<number> = [];
    const to_delete: Array<number> = [];

    //make a list of rows that contains the number of set cells
    this.pattern.forEach(row => {
      const active_cells: Array<Cell> = row.filter(cell => (cell.isSet()));
      rowmap.push(active_cells.length);
    });

    console.log("row map", rowmap);

    let delete_top: number = 0;
    let top_hasvalue: boolean = false;
    
    //scan from top and bottom to see how many rows we shoudl delete
    for(let ndx = 0; ndx < rowmap.length; ndx++){
        if(rowmap[ndx] == 0 && !top_hasvalue){
          delete_top++;
        }else{
          top_hasvalue = true;
        }
    }
    console.log("delete top", delete_top);

    if(delete_top == rowmap.length) return true; //this is empty now
   
    let delete_bottom: number = 0;
    let bottom_hasvalue:boolean = false;
    for(let ndx = rowmap.length -1; ndx >= 0; ndx--){
      if(rowmap[ndx] == 0 && !bottom_hasvalue){
        delete_bottom++;
      }else{
        bottom_hasvalue = true;
      }
    }

    return false;
  }
  /**
   * removes any boundary cols that are unset
   * @return returns true if it deleted all the cols
   */
  trimUnsetCols(){
    return false;
  }

//   deleteNRowsFromFront(n: number) {
//       this.wefts -= n;
//       this.rowShuttleMapping.splice(0, n);
//       this.rowSystemMapping.splice(0, n);
//       this.pattern.splice(0, n);
//       //this.mask.splice(i, n);

      
//       this.loom.treadling.splice(0,n);
//       this.updateVisible();
//   }

//   deleteNRowsFromBack(n: number) {
//     this.wefts -= n;
//     this.rowShuttleMapping.splice(-n, n);
//     this.rowSystemMapping.splice(-n, n);
//     this.pattern.splice(-n, n);
//     //this.mask.splice(i, n);
//     this.loom.treadling.splice(-n,n);
//     this.updateVisible();
// }
  

    //insert a number of rows after the one shown at screen index si
  // insertRows(amount: number) {
    
  //   var row = [];
  //   for(var i = 0; i < amount; i++){
  //     this.rowShuttleMapping.push(0);
  //     this.rowSystemMapping.push(0);
  //     this.loom.treadling.push(-1);
  //     //this.mask.splice(i,0,col);

  //     row = [];
  //     for (var j = 0; j < this.warps; j++) {
  //         row.push(new Cell(null));
  //     }

  //     this.pattern.push(row);

  //   }
  
  //   this.wefts += amount;
  //   this.updateVisible();


  // }

  insertRow(i: number, shuttleId: number, systemId:number) {
    

    var col = [];

    for (var j = 0; j < this.warps; j++) {
      col.push(new Cell(false));
    }

    this.wefts += 1;

    this.rowShuttleMapping.splice(i,0,shuttleId);
    this.rowSystemMapping.splice(i,0,systemId);
    
    this.pattern.splice(i,0,col);
    //this.mask.splice(i,0,col);

  }

  //assumes i is the screen index
  cloneRow(i: number, c: number, shuttleId: number, systemId:number) {
    
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

  }

  //assumes i is the screen index
  deleteRow(i: number) {
    this.wefts -= 1;
    this.rowShuttleMapping.splice(i, 1);
    this.rowSystemMapping.splice(i, 1);
    this.pattern.splice(i, 1);
    //this.mask.splice(i, 1);
  }


  //inserts a row after the one shown at screen index si
  // insertSingleRow(si: number) {
    
  //   var i = this.visibleRows[si];
  //   let shuttleId: number = this.rowShuttleMapping[i];
  //   let systemId: number = this.rowSystemMapping[i];
  //   var col = [];

  //   for (var j = 0; j < this.warps; j++) {
  //     col.push(new Cell(null));
  //   }

  //   this.wefts += 1;

  //   this.pattern.splice(i,0,col);


  //   this.rowShuttleMapping.splice(i,0,shuttleId);
  //   this.rowSystemMapping.splice(i,0,systemId);
    
  //   //this.mask.splice(i,0,col);


  // }

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

  // //assumes i is the true index, si is the screen index
  // deleteSingleRow(si: number) {
  //   let i = this.visibleRows[si];
  //   this.wefts -= 1;
  //   this.rowShuttleMapping.splice(i, 1);
  //   this.rowSystemMapping.splice(i, 1);
  //   this.pattern.splice(i, 1);
  //   //this.mask.splice(i, 1);
  //   this.loom.treadling.splice(i,1);
  //   this.updateVisible();


  // }

  //   //assumes i is the true index
  // deleteRows(amount: number) {
  //   let i = this.wefts -1;
  //   this.wefts -= amount;
  //   this.rowShuttleMapping.splice(i, amount);
  //   this.rowSystemMapping.splice(i, amount);
  //   this.pattern.splice(i, amount);
  //   //this.mask.splice(i, 1);
  //   this.loom.treadling.splice(i,amount);
  //   this.updateVisible();
  // }

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
  }


//assumes i is the screen index
  cloneCol(i: number, shuttleId: number, systemId: number) {

    var col = [];

    //copy the selected column
    for(var ndx = 0; ndx < this.wefts; ndx++){

      const is_set: boolean = (this.pattern[ndx][i].isSet()) ? true : null;
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


  addShuttle(shuttle, epi) {
    shuttle.setID(this.shuttles.length);
    shuttle.setVisible(true);
    if (!shuttle.thickness) {
      shuttle.setThickness(epi);
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


  getWeftSystemCode(index, visibleRows) {
    var row = visibleRows[index];
    var id = this.rowSystemMapping[row];
    var system = this.weft_systems[id];

    return String.fromCharCode(97 + system.id);
  }

  getWarpSystemCode(index) {

     var col = this.colSystemMapping[index];
     var system = this.warp_systems[col];

    return  String.fromCharCode(97 + system.id);
  }


  getColor(index, visibleRows) {
    var row = visibleRows[index];
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
  updateDraftFromThreading(updates, loom){

    for(var u in updates){

      if(updates[u].i !== undefined){

        var idxs = loom.getAffectedDrawdownPoints({warp: updates[u].j, frame: updates[u].i});
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
  updateDraftFromTreadling(updates, loom){

    for(var u in updates){
      
      if(updates[u].i !== undefined){

        var idxs = loom.getAffectedDrawdownPoints({weft: updates[u].i, treadle: updates[u].j});
        
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
  updateDraftFromTieup(updates, loom){

      for(var u in updates){
      
        if(updates[u].i !== undefined){

          var idxs = loom.getAffectedDrawdownPoints({frame: updates[u].i, treadle: updates[u].j});
       
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
    pattern: Pattern, 
    type: string,
    visibleRows: Array<number>,
    loom: Loom
  ) {

    console.log("fill area called");
    console.log(selection, pattern, type);

    var updates = [];
    
    var screen_i = Math.min(selection.start.si, selection.end.si)
    const draft_j = Math.min(selection.start.j, selection.end.j);
  
    const rows = pattern.height;
    const cols = pattern.width;

    var w,h;

    w = Math.ceil(selection.width);
    h = Math.ceil(selection.height);


    if(selection.target.id === "warp-systems"){
      h = pattern.height;
      screen_i = 0;
    } 
    if(selection.target.id === "weft-systems"){
      w = pattern.width;
    } 

    if(selection.target.id === "warp-materials"){
       h = pattern.height;
       screen_i = 0;
    }
    if(selection.target.id === "weft-materials"){
      w = pattern.width;
    } 

    //cycle through each visible row/column of the selection
    for (var i = 0; i < h; i++ ) {
      for (var j = 0; j < w; j++ ) {

        var row = i + screen_i;
        var col = j + draft_j;


        let temp:Cell = pattern.pattern[i % rows][j % cols];
       
        var prev:boolean = false; 
        switch(selection.target.id){

          case 'drawdown':
              var draft_row = visibleRows[row];
              prev = this.pattern[draft_row][col].isUp();

          break;
          case 'threading':

              var frame = loom.frame_mapping[row];
              prev = loom.isInFrame(col, frame);
          
          break;
          case 'treadling':
              var draft_row = visibleRows[row];
              prev = (loom.isInTreadle(draft_row, col)); 
          break;
          case 'tieups':
              var frame = loom.frame_mapping[row];
              prev = loom.hasTieup({i:frame,j:col, si:-1}); 
          
          break;
          default:
          break;
        }

        if (prev !== null){

          var val = false;
          switch (type) {
            case 'invert':
             val = !temp.isUp();
              break;
            case 'mask':
             val = temp && prev;
              break;
            case 'mirrorX':
              val = pattern.pattern[(h - i - 1) % rows][j % cols].isUp();
              break;
            case 'mirrorY':
              val = pattern.pattern[i % rows][(w - j - 1) % cols].isUp();
              break;
            case 'shiftUp':
              val = pattern.pattern[(i+1) % rows][j].isUp();
              break;
            case 'shiftLeft':
              val = pattern.pattern[i][(j+1) % cols].isUp();
              break;
            default:
              val = temp.isUp();
              break;
          }


          var updates = [];

          switch(selection.target.id){
           
           case 'drawdown':
           var draft_row = visibleRows[row];

            if(this.hasCell(draft_row,col)){

                let p:Interlacement = {i: visibleRows[row], j: col, si: row};     
                this.setHeddle(p.i,p.j,val);
              }

            break;
            
            case 'threading':
            var frame = loom.frame_mapping[row];


              if(loom.inThreadingRange({i:frame,j:col,si:-1})){ 
                updates = loom.updateThreading({i:frame, j:col, val:val});
                this.updateDraftFromThreading(updates, loom); 
              }
            break;

            case 'treadling':
              
             var draft_row = visibleRows[row];
             if(loom.inTreadlingRange({i:draft_row,j:col, si: -1})){ 
                updates = loom.updateTreadling({i: draft_row, j:col, val:val});
                this.updateDraftFromTreadling(updates, loom);
              }
            break;
            case 'tieups':
              var frame = loom.frame_mapping[row];

              if(loom.inTieupRange({i:frame, j:col, si: -1})){
                updates = loom.updateTieup({i:frame, j:col, val:val});
                this.updateDraftFromTieup(updates, loom);
              }
            break; 
            case 'weft-systems':
              var draft_row = visibleRows[row];
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
              var draft_row = visibleRows[row];
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

    var u_threading = loom.updateUnused(loom.threading, loom.min_frames, loom.num_frames, "threading");
    var u_treadling = loom.updateUnused(loom.treadling, loom.min_treadles, loom.num_treadles, "treadling");



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
  
      console.log("filling with", pattern);
      
      const rows = pattern.length;
      const cols = pattern[0].length;
      const store: Array<Array<Cell>> = [];
  
      var w,h;
  
      w = this.warps;
      h = this.wefts;
  
  
      //cycle through each visible row/column of the draft
      for (var i = 0; i < h; i++ ) {
        store.push([]);
        for (var j = 0; j < w; j++ ) {
          store[i].push(new Cell(null));
          var row = i;
          var col = j;
  
          let temp:Cell = pattern[i % rows][j % cols];
          var draft_row = row;
          
          let prev_set: boolean = this.pattern[draft_row][col].isSet();
          let prev_heddle: boolean = this.pattern[draft_row][col].isUp();
  
          let new_set = false;
          let new_heddle = true;
           
          switch (type) {
              case 'clear':
               new_set = true; 
               new_heddle = true;
                break;
              case 'invert':
               new_set = prev_set; 
               new_heddle = !prev_heddle;
                break;
              case 'reset':
                new_set = prev_set; 
                new_heddle = true;
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

            if(new_set){
              store[i][j].setHeddle(new_heddle);
            }
        }
      }

      store.forEach((row, i) =>{
        row.forEach((cell,j) =>{
          if(this.hasCell(i,j)){
            if(cell.isSet) this.pattern[i][j].setHeddle(cell.getHeddle());
          }
        });
      });     
    
  
  }

}
