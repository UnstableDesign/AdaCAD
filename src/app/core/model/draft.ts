import { Shuttle } from './shuttle';
import { Threading } from './threading';
import { Treadling } from './treadling';
import { TieUps }  from "./tieups";

import * as _ from 'lodash';

/**
 * Definition of draft interface.
 * @interface
 */
export interface DraftInterface {
  pattern: Array<Array<boolean>>;
  shuttles: Array<Shuttle>;
  rowShuttleMapping: Array<number>;
  visibleRows: Array<number>;
  connections: Array<any>;
  labels: Array<any>;
  wefts: number;
  warps: number;
  epi: number;
  threading: Threading;
  treadling: Treadling;
  tieups: TieUps;
}

/**
 * Definition and implementation of draft object.
 * @class
 */
export class Draft implements DraftInterface {
  pattern: Array<Array<boolean>>;
  shuttles: Array<Shuttle>;
  rowShuttleMapping: Array<number>;
  visibleRows: Array<number>;
  connections: Array<any>;
  labels: Array<any>;
  wefts: number;
  warps: number;
  epi: number;
  threading: Threading;
  treadling: Treadling;
  tieups: TieUps;

  constructor({type, ...params}) {
    console.log(type, params);
    var pattern = null;
    //var shuttles = params.draft.shuttles
    //temp replacement of above commmented out line with below 2 lines found in deployed code
    let l = new Shuttle();
    var shuttles = [l]//params.draft.shuttles
    var sd = [];
    for (var sh in shuttles) {
      var s = new Shuttle(shuttles[i]);
      sd.push(s);
    }
    switch (type) {
      case "update":
        this.shuttles = sd;
        this.rowShuttleMapping = params.draft.rowShuttleMapping;
        this.wefts = params.draft.wefts;
        this.warps = params.draft.warps;
        this.visibleRows = params.draft.visibleRows;
        this.epi = params.draft.epi;
        pattern = params.draft.pattern;
        this.connections = params.draft.connections;
        this.labels = params.draft.labels;
        break;
      case "new":
        let l = new Shuttle({id: 0, name: 'Shuttle 1', visible: true, color: '#3d3d3d'});
        l.setThickness(params.epi);
        this.wefts = params.wefts;
        this.warps = params.warps;
        this.epi = params.epi;
        this.shuttles = [l];
        this.rowShuttleMapping = [];
        this.visibleRows = [];
        this.connections = [];
        this.labels = [];
        pattern = params.pattern;
        for(var i = 0; i < this.wefts; i++) {
          this.rowShuttleMapping.push(0);
          this.visibleRows.push(i);
        }
        break;
    }

    if (!pattern) {
      this.pattern = [];

      for(var i = 0; i < this.wefts; i++) {
        this.pattern.push([]);
        for (var j = 0; j < this.warps; j++)
          this.pattern[i].push(false);
      }
    }
    else this.pattern = pattern;

    // console.log(this.pattern);
    this.threading = new Threading(this.wefts, this.warps);
    this.treadling = new Treadling(this.wefts, this.pattern);
    this.tieups = new TieUps(this.threading.threading, this.threading.usedFrames.length, this.treadling.treadling, this.pattern, this.treadling.treadle_count);
  }

  loadAdaFile(draft) {
    this.shuttles = draft.shuttles;
    this.rowShuttleMapping = draft.rowShuttleMapping;
    this.wefts = draft.wefts;
    this.warps = draft.warps;
    this.visibleRows = draft.visibleRows;
    this.epi = draft.epi;
    var pattern = draft.pattern;
    this.connections = draft.connections;
    this.labels = draft.labels;
    return pattern;
  }

  isUp(i:number, j:number) : boolean{
    var row = this.visibleRows[i];
    if ( row > -1 && row < this.pattern.length && j > -1 && j < this.pattern[0].length) {
      return this.pattern[row][j];
    } else {
      return false;
    }
  }

  setHeddle(i:number, j:number, bool:boolean) {
    var row = this.visibleRows[i];
    this.pattern[row][j] = bool;
    this.threading.updateFlippedPattern(row, j, bool);
    this.threading.updateThreading();
    this.treadling.updatePattern(this.pattern);
    this.treadling.updateTreadling();
    this.tieups.updatePattern(this.pattern);
    this.tieups.updateThreading(this.threading.threading);
    this.tieups.updateTreadling(this.treadling.treadling);
    this.tieups.updateTreadleCount(this.treadling.treadle_count);
    //assuming frames will be used without gaps of unused frames (i.e. all unused_frames would be later frames)
    this.tieups.updateUsedFrames(this.threading.usedFrames.length);
    this.tieups.updateTieUps();
  }

  rowToShuttle(row: number) {
    return this.rowShuttleMapping[row];
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

  updateSelection(selection: any, pattern: any, type: string) {
    console.log(selection, pattern, type);
    const sj = Math.min(selection.start.j, selection.end.j);
    const si = Math.min(selection.start.i, selection.end.i);

    const rows = pattern.length;
    const cols = pattern[0].length;

    var w,h;

    w = selection.width / 20;
    h = selection.height / 20;

    for (var i = 0; i < h; i++ ) {
      for (var j = 0; j < w; j++ ) {
        var row = this.visibleRows[i + si];
        var temp = pattern[i % rows][j % cols];
        var prev = this.pattern[row][j + sj];

        switch (type) {
          case 'invert':
            this.pattern[row][j + sj] = !temp;
            break;
          case 'mask':
            this.pattern[row][j + sj] = temp && prev;
            break;
          case 'mirrorX':
            temp = pattern[(h - i - 1) % rows][j % cols];
            this.pattern[row][j + sj] = temp;
            break;
          case 'mirrorY':
            temp = pattern[i % rows][(w - j - 1) % cols];
            this.pattern[row][j + sj] = temp;
            break;
          default:
            this.pattern[row][j + sj] = temp;
            break;
        }
      }
    }
  }

  insertRow(i: number, shuttleId: number) {
    var col = [];

    for (var j = 0; j < this.warps; j++) {
      col.push(false);
    }

    this.wefts += 1;

    this.rowShuttleMapping.splice(i,0,shuttleId);
    this.pattern.splice(i,0,col);
    this.updateVisible();

  }

  cloneRow(i: number, c: number, shuttleId: number) {
    var row = this.visibleRows[c];
    const col = _.clone(this.pattern[c]);

    console.log(i, c, shuttleId);

    this.wefts += 1;

    this.rowShuttleMapping.splice(i, 0, shuttleId);
    this.pattern.splice(i, 0, col);

    this.updateVisible();
  }

  deleteRow(i: number) {
    var row = this.visibleRows[i];
    this.wefts -= 1;
    this.rowShuttleMapping.splice(i, 1);
    this.pattern.splice(i, 1);

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

  addShuttle(shuttle) {
    shuttle.setID(this.shuttles.length);
    shuttle.setVisible(true);
    if (!shuttle.thickness) {
      shuttle.setThickness(this.epi);
    }
    this.shuttles.push(shuttle);

    if (shuttle.image) {
      this.insertImage(shuttle);
    }

  }

  insertImage(shuttle) {
    var max = this.rowShuttleMapping.length;
    var data = shuttle.image;
    for (var i=data.length; i > 0; i--) {
      var idx = Math.min(max, i);
      this.rowShuttleMapping.splice(idx,0,shuttle.id);
      this.pattern.splice(idx,0,data[i - 1]);
    }
  }

  getColor(index) {
    var row = this.visibleRows[index];
    var id = this.rowShuttleMapping[row];
    var shuttle = this.shuttles[id];

    return shuttle.color;
  }

}
