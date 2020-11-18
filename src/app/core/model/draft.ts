import { Shuttle } from './shuttle';
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
  //mask: Array<Array<boolean>>; //regions to remember for filling

  rowShuttleMapping: Array<number>;
  colShuttleMapping: Array<number>;  

  patterns: Array<Pattern>; //the collection of smaller subpatterns from the pattern bar 
  masks: Array<number>
  
  shuttles: Array<Shuttle>;
  warp_systems: Array<Shuttle>;
  
  visibleRows: Array<number>;
  connections: Array<any>;
  labels: Array<any>;
  wefts: number;
  warps: number;
  loom: Loom;

}

/**
 * Definition and implementation of draft object.
 * @class
 */
export class Draft implements DraftInterface {
  pattern: Array<Array<Cell>>;
  patterns: Array<Pattern>;
  shuttles: Array<Shuttle>;
  masks: Array<number>; 
  warp_systems: Array<Shuttle>;
  rowShuttleMapping: Array<number>;
  colShuttleMapping: Array<number>;
  visibleRows: Array<number>;
  connections: Array<any>;
  labels: Array<any>;
  wefts: number;
  warps: number;
  loom: Loom;


  constructor({...params}) {
    console.log("Draft Constructor", params);

    this.wefts = (params.wefts === undefined) ?  30 : params.wefts;
    this.warps = (params.warps === undefined) ? 20 : params.warps;
    this.visibleRows = (params.visibleRows === undefined) ? [] : params.visibleRows;
    this.pattern = (params.pattern === undefined) ? [] : params.pattern;
    this.masks = (params.masks === undefined) ? [] : params.masks;
    this.connections = (params.connections === undefined)? [] : params.connections;
    this.labels = (params.labels === undefined)? [] : params.labels;


    if(params.shuttles === undefined){
      let s = new Shuttle({id: 0, name: 'Weft System 1', visible: true, color: '#3d3d3d'});
      this.shuttles = [s];
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
      let s = new Shuttle({id: 0, name: 'Warp System 1', visible: true, color: '#666666'});
      this.warp_systems = [s];
    }else{
      var systems = params.warp_systems
          var sd = [];
          for (var i in systems) {
            var s = new Shuttle(systems[i]);
            sd.push(s);
          }

        this.warp_systems = sd;
    }


    if(params.rowShuttleMapping === undefined){
      this.rowShuttleMapping = [];
      for(var ii = 0; ii < this.wefts; ii++) {
          this.rowShuttleMapping.push(0);
          this.visibleRows.push(ii);
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




    this.pattern = [];
    for(var ii = 0; ii < this.wefts; ii++) {
        this.pattern.push([]);

        for (var j = 0; j < this.warps; j++){
          
          if (params.pattern === undefined) {
            this.pattern[ii].push(new Cell());
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


    if (params.masks === undefined) {
      // this.mask = [];
      // for(var ii = 0; ii < this.wefts; ii++) {
      //   this.mask.push([]);
      //   for (var j = 0; j < this.warps; j++)
      //     this.mask[ii].push(false);
      // }
    }else{
      this.masks = params.masks;
    } 

    if(params.loom === undefined) {
      this.loom = new Loom('frame', this.wefts, this.warps, 10, 8, 10);
    } else {

      this.loom = new Loom(params.loom.type, this.wefts, this.warps, params.loom.epi, params.loom.num_frames, params.loom.num_treadles);
      if(params.loom.threading != undefined) this.loom.threading = params.loom.threading;
      if(params.loom.tieup != undefined) this.loom.tieup = params.loom.tieup;
      if(params.loom.treadling != undefined) this.loom.treadling = params.loom.treadling;
    }
    console.log(this);

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


  rowToShuttle(row: number) {
    return this.rowShuttleMapping[row];
  }


  colToShuttle(col: number) {
    return this.colShuttleMapping[col];
  }

  updateVisible() {
    var i = 0;
    var shuttles = [];
    var visible = [];
    for (i = 0; i < this.shuttles.length; i++) {
      shuttles.push(this.shuttles[i].visible);
    }

    for (i = 0; i< this.rowShuttleMapping.length; i++) {
      var show = shuttles[this.rowShuttleMapping[i]];

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
  insertRow(i: number, shuttleId: number) {
    
    var col = [];

    for (var j = 0; j < this.warps; j++) {
      col.push(new Cell());
    }

    this.wefts += 1;

    this.rowShuttleMapping.splice(i,0,shuttleId);
    this.pattern.splice(i,0,col);
    //this.mask.splice(i,0,col);

    this.loom.treadling.splice(i, 0, -1);


    this.updateVisible();

  }

  //assumes i is the screen index
  cloneRow(i: number, c: number, shuttleId: number) {
    var row = this.visibleRows[c];
    var col = [];

    //copy the selected row
    for(var ndx = 0; ndx < this.warps; ndx++){
      col[ndx] = new Cell();
      col[ndx].setHeddle(this.pattern[c][ndx]);
    }

    this.wefts += 1;

    this.rowShuttleMapping.splice(i, 0, shuttleId);
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


  //alwasy adds to end
  insertCol() {
    var row = [];

    //push one false to the end of each row
    for (var j = 0; j < this.wefts; j++) {
      this.pattern[j].push(new Cell());
      //this.mask[j].push(false);
    }

    this.warps += 1;
    this.colShuttleMapping.push(0);
    this.loom.threading.push(-1);

  }


//always deletes from end
  deleteCol(i: number) {

    this.warps -= 1;

    //remove one from the end of each row
    for (var j = 0; j < this.wefts; j++) {
      this.pattern[j].splice(i, 1);
      // this.masks[j].splice(i, 1);
    }


    this.colShuttleMapping.splice(i, 1);
    this.loom.threading.splice(i, 1);
  }

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

  addWarpSystem(shuttle) {
    shuttle.setID(this.shuttles.length);
    shuttle.setVisible(true);
    if (!shuttle.thickness) {
      shuttle.setThickness(this.loom.epi);
    }
    this.warp_systems.push(shuttle);
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

  getColor(index) {
    var row = this.visibleRows[index];
    var id = this.rowShuttleMapping[row];
    var shuttle = this.shuttles[id];

    return shuttle.color;
  }

  getColorCol(index) {

    var col = this.colShuttleMapping[index];
    var shuttle = this.warp_systems[col];

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







}
