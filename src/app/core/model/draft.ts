import { Shuttle } from './shuttle';
import { Loom } from './loom';
// import { Threading } from './threading';
// import { Treadling } from './treadling';
// import { TieUps }  from "./tieups";
import { Pattern } from './pattern';

import * as _ from 'lodash';
import { active } from 'd3';

/**
 * Definition of draft interface.
 * @interface
 */
export interface DraftInterface {
  pattern: Array<Array<boolean>>; // the single design pattern
  mask: Array<Array<boolean>>; //regions to remember for filling
  patterns: Array<Pattern>; //the collection of smaller subpatterns from the pattern bar
  shuttles: Array<Shuttle>;
  warp_systems: Array<Shuttle>;
  rowShuttleMapping: Array<number>;
  colShuttleMapping: Array<number>;
  visibleRows: Array<number>;
  connections: Array<any>;
  labels: Array<any>;
  wefts: number;
  warps: number;
  loom: Loom;
  // threading: Threading;
  // treadling: Treadling;
  // tieups: TieUps;
}

/**
 * Definition and implementation of draft object.
 * @class
 */
export class Draft implements DraftInterface {
  pattern: Array<Array<boolean>>;
  mask: Array<Array<boolean>>; //regions to remember for filling
  patterns: Array<Pattern>;
  shuttles: Array<Shuttle>;
  warp_systems: Array<Shuttle>;
  rowShuttleMapping: Array<number>;
  colShuttleMapping: Array<number>;
  visibleRows: Array<number>;
  connections: Array<any>;
  labels: Array<any>;
  wefts: number;
  warps: number;
  loom: Loom;
  // threading: Threading;
  // treadling: Treadling;
  // tieups: TieUps;

  constructor({...params}) {
    console.log("Draft Constructor", params);

    this.wefts = (params.wefts === undefined) ?  30 : params.wefts;
    console.log("params.wefts:", params.wefts);
    this.warps = (params.warps === undefined) ? 20 : params.warps;
    this.visibleRows = (params.visibleRows === undefined) ? [] : params.visibleRows;
    this.pattern = (params.pattern === undefined) ? [] : params.pattern;
    this.mask = (params.mask === undefined) ? [] : params.mask;
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
      let s = new Shuttle({id: 0, name: 'Warp System 1', visible: true, color: '#3d3d3d'});
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




    if (params.pattern === undefined) {
      this.pattern = [];
      for(var ii = 0; ii < this.wefts; ii++) {
        this.pattern.push([]);
        for (var j = 0; j < this.warps; j++)
          this.pattern[ii].push(false);
      }
    }
    else{
      this.pattern = params.pattern;
    } 


    if (params.mask === undefined) {
      this.mask = [];
      for(var ii = 0; ii < this.wefts; ii++) {
        this.mask.push([]);
        for (var j = 0; j < this.warps; j++)
          this.mask[ii].push(false);
      }
    }
    else{
      this.mask = params.mask;
    } 

    if(params.loom === undefined) {
      this.loom = new Loom('frame', this.wefts, this.warps, 10, 8, 10);
    } else {

      this.loom = new Loom(params.loom.type, params.wefts, params.warps, params.loom.epi, params.loom.num_frames, params.loom.num_treadles);
      if(params.loom.threading != undefined) this.loom.threading = params.loom.threading;
      if(params.loom.tieup != undefined) this.loom.tieup = params.loom.tieup;
      if(params.loom.treadling != undefined) this.loom.treadling = params.loom.treadling;
    }
    console.log(this);

  }

  hasCell(i:number, j:number) : boolean{
    if(i < 0 || i > this.wefts) return false;
    if(j < 0 || j > this.warps) return false;
    return true;
  }

  isUp(i:number, j:number) : boolean{
    var row = this.visibleRows[i];
    if ( row > -1 && row < this.pattern.length && j > -1 && j < this.pattern[0].length) {
      return this.pattern[row][j];
    } else {
      return false;
    }
  }

  isMask(i:number, j:number) : boolean{
    var row = this.visibleRows[i];
    if ( row > -1 && row < this.mask.length && j > -1 && j < this.mask[0].length) {
      return this.mask[row][j];
    } else {
      return false;
    }
  }

  setMask(i:number, j:number, bool:boolean) {
    var row = this.visibleRows[i];
    this.mask[row][j] = bool;
  }  
  setHeddle(i:number, j:number, bool:boolean) {
    var row = this.visibleRows[i];
    this.pattern[row][j] = bool;
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


//update this to take dims into account;
  // updateDrawdownSelection(selection: any, pattern: any, type: string) {
   
  //   const sj = Math.min(selection.start.j, selection.end.j);
  //   const si = Math.min(selection.start.i, selection.end.i);


  //   const rows = pattern.length;
  //   const cols = pattern[0].length;

  //   var w,h;

  //   w = selection.width / 20;
  //   h = selection.height / 20;

  //   for (var i = 0; i < h; i++ ) {
  //     for (var j = 0; j < w; j++ ) {
  //       var row = this.visibleRows[i + si];
  //       var temp = pattern[i % rows][j % cols];
  //       var prev = this.pattern[row][j + sj];

  //       switch (type) {
  //         case 'invert':
  //           this.pattern[row][j + sj] = !temp;
  //           break;
  //         case 'mask':
  //           this.pattern[row][j + sj] = temp && prev;
  //           break;
  //         case 'mirrorX':
  //           temp = pattern[(h - i - 1) % rows][j % cols];
  //           this.pattern[row][j + sj] = temp;
  //           break;
  //         case 'mirrorY':
  //           temp = pattern[i % rows][(w - j - 1) % cols];
  //           this.pattern[row][j + sj] = temp;
  //           break;
  //         default:
  //           this.pattern[row][j + sj] = temp;
  //           break;
  //       }
  //     }
  //   }
  // }

  insertRow(i: number, shuttleId: number) {
    var col = [];

    for (var j = 0; j < this.warps; j++) {
      col.push(false);
    }

    this.wefts += 1;

    this.rowShuttleMapping.splice(i,0,shuttleId);
    this.pattern.splice(i,0,col);
    this.mask.splice(i,0,col);

    this.loom.treadling.splice(i, 0, -1);


    this.updateVisible();

  }

  cloneRow(i: number, c: number, shuttleId: number) {
    var row = this.visibleRows[c];
    const col = _.clone(this.pattern[c]);

    this.wefts += 1;

    this.rowShuttleMapping.splice(i, 0, shuttleId);
    this.pattern.splice(i, 0, col);
    this.mask.splice(i, 0, col);
    this.loom.treadling.splice(i, 0, this.loom.treadling[i-1]);

    this.updateVisible();
  }

  deleteRow(i: number) {
    var row = this.visibleRows[i];
    this.wefts -= 1;
    this.rowShuttleMapping.splice(i, 1);
    this.pattern.splice(i, 1);
    this.mask.splice(i, 1);
    this.loom.treadling.splice(i,1);

    this.updateVisible();
  }

  updateConnections(index: number, offset: number) {
    var i = 0;

    for (i = 0; i < this.connections.length; i++) {
      var c = this.connections[i];
      if (c.start.y > index) {
        c.start.y += offset;
      }
      if (c.end.y > index) {
        c.end.y += offset;
      }
    }
  }


  //alwasy adds to end
  insertCol() {
    var row = [];

    //push one false to the end of each row
    for (var j = 0; j < this.wefts; j++) {
      this.pattern[j].push(false);
      this.mask[j].push(false);
    }

    this.warps += 1;
    this.colShuttleMapping.push(0);
    this.loom.threading.push(-1);
    //this.updateVisible();

  }


//always deletes from end
  deleteCol(i: number) {

    this.warps -= 1;

    //remove one from the end of each row
    for (var j = 0; j < this.wefts; j++) {
      this.pattern[j].splice(i, 1);
      this.mask[j].splice(i, 1);
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

    if (shuttle.image) {
      this.insertImage(shuttle);
    }

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
  insertImage(shuttle) {
    var max = this.rowShuttleMapping.length;
    var data = shuttle.image;
    for (var i=data.length; i > 0; i--) {
      var idx = Math.min(max, i);
      this.rowShuttleMapping.splice(idx,0,shuttle.id);
      this.mask.splice(idx,0,data[i - 1]);
    }
  }

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
             this.pattern[idxs.wefts[i]][idxs.warps[j]] = updates[u].val;
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
             this.pattern[idxs.wefts[i]][idxs.warps[j]] = updates[u].val;
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
  updateDraftFromTieup(i, j, value){


      //this doesn't appear to be working
      var idxs = this.loom.getAffectedDrawdownPoints({frame: i, treadle: j});
      for(var wi = 0; wi < idxs.wefts.length; wi++){
          for (var wj = 0; wj < idxs.warps.length; wj++){
           this.pattern[idxs.wefts[wi]][idxs.warps[wj]] = value;
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
    console.log("this.pattern:",this.pattern);
    console.log("treadling.length:", treadling.length);
    for (var i = 0; i < treadling.length;i++) {
      var active_treadle = treadling[i];
      if (active_treadle != -1) {
        console.log("treadle activated");
        for (var j = 0; j < tieup.length; j++) {
          if (tieup[j][active_treadle]) {
            for (var k = 0; k < threading.length;k++) {
              console.log("k", k);
              console.log("i", i)
              if (threading[k] == j) {
                this.pattern[k][i] =true; //i swapped the order of k and i but i'm not sure this is how it is supposed to be...
              }
            }
          }
        }
      }
    }
  }
}
