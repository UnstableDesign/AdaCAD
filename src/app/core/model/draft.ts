import { Shuttle } from './shuttle';
import { System } from './system';
import { Loom } from './loom';
import { Cell } from './cell';
import { Pattern } from './pattern';

import * as _ from 'lodash';
import { active } from 'd3';

/**
 * Definition of draft interface.
 * @interface
 */
export interface DraftInterface {

  pattern: Array<Array<Cell>>; // the single design pattern
  shuttles: Array<Shuttle>;    //the shuttles used in this draft 

  //tracks stores row/col index, shuttle index
  rowShuttleMapping: Array<number>;
  colShuttleMapping: Array<number>;  
  

  rowSystemMapping: Array<number>;
  colSystemMapping: Array<number>;
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


}

/**
 * Definition and implementation of draft object.
 * @class
 */
export class Draft implements DraftInterface {
  pattern: Array<Array<Cell>>; // the single design pattern
  shuttles: Array<Shuttle>;    //the shuttles used in this draft 

  //tracks stores row/col index, shuttle index
  rowShuttleMapping: Array<number>;
  colShuttleMapping: Array<number>;  
  

  rowSystemMapping: Array<number>;
  colSystemMapping: Array<number>;
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

    console.log(params);

    this.wefts = (params.wefts === undefined) ?  30 : params.wefts;
    this.warps = (params.warps === undefined) ? 20 : params.warps;
    this.epi = (params.epi === undefined) ? 10 : params.epi;
    this.units = (params.units === undefined) ? "in" : params.units;
    this.visibleRows = (params.visibleRows === undefined) ? [] : params.visibleRows;
    this.pattern = (params.pattern === undefined) ? [] : params.pattern;
    this.connections = (params.connections === undefined)? [] : params.connections;
    this.labels = (params.labels === undefined)? [] : params.labels;
    this.masks = (params.masks === undefined)? [] : params.masks;



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

      let s0 = new Shuttle({id: 0, name: 'Black', type: 0,  thickness:100, color: '#333333', visible: true, insert:false, notes: ""});
      let s1 = new Shuttle({id: 1, name: 'Grey', type: 0, thickness:100, color: '#999999', visible:true, insert:false, notes: ""});
      this.shuttles = [s0, s1];

    }else{

      var shuttles = params.shuttles
      var sd = [];
      for (var i in shuttles) {
        var s = new Shuttle(shuttles[i]);
        sd.push(s);
      }
      this.shuttles = sd;
    }


    if(params.warp_systems === undefined){
      let s0 = new System({id: 0, name: 'Warp System 1', visible: true, notes: ""});
      let s1 = new System({id: 1, name: 'Warp System 2', visible: false, notes: ""});
      let s2 = new System({id: 2, name: 'Warp System 3', visible: false, notes: ""});
      let s3 = new System({id: 3, name: 'Warp System 4', visible: false, notes: ""});
      this.warp_systems = [s0, s1, s2, s3];
    }else{
      var systems = params.warp_systems
          var sd = [];
          for (var i in systems) {
            var sys = new System(systems[i]);
            sd.push(sys);
          }
        this.warp_systems = sd;
    }

    if(params.weft_systems === undefined){
      let s0 = new System({id: 0, name: 'Weft System 1', visible: true, notes: ""});
      let s1 = new System({id: 1, name: 'Weft System 2', visible: false, notes: ""});
      let s2 = new System({id: 2, name: 'Weft System 3', visible: false, notes: ""});
      let s3 = new System({id: 3, name: 'Weft System 4', visible: false, notes: ""});
      this.weft_systems = [s0, s1, s2, s3];
    }else{
      var systems = params.weft_systems
      var sd = [];
      for (var i in systems) {
        var sys = new System(systems[i]);
        sd.push(sys);
      }
      this.weft_systems = sd;
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
    }



    var fill_pattern = this.makeRandomPattern(this.loom.num_frames, this.loom.num_treadles);

    this.pattern = [];
    for(var ii = 0; ii < this.wefts; ii++) {
        this.pattern.push([]);

        for (var j = 0; j < this.warps; j++){
          if (params.pattern === undefined) {
            this.pattern[ii].push(new Cell());
            this.pattern[ii][j].setHeddle(fill_pattern[ii%fill_pattern.length][j%fill_pattern[0].length]);

          }else{

            this.pattern[ii][j]= new Cell();
            
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

    this.recomputeWidth();

  }

  //this just makes a random pattern of a given size;
  makeRandomPattern(w: number, h: number){
      var random = Array<Array<boolean>>();
      for(var i = 0; i < h; i++) {
         random.push([]);
        for(var j = 0; j < w; j++) {
          random[i].push(Math.random()*10%2 < 1);
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



  rowToSystem(row: number) {
    return this.rowSystemMapping[row];
  }
  rowToShuttle(row: number) {
    return this.rowShuttleMapping[row];
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


  //assumes i is the screen index
  insertRow(i: number, shuttleId: number, systemId:number) {
    
    var col = [];

    for (var j = 0; j < this.warps; j++) {
      col.push(new Cell());
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
      col[ndx] = new Cell();
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
      this.pattern[ndx].splice(i,0, new Cell());
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
      var cell  = new Cell();
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

    let cell:Cell = new Cell();
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
        mock[i].push(new Cell());
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







}
