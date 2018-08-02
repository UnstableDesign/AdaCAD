import { Layer } from './layer';

import * as _ from 'lodash';

/**
 * Definition of draft interface.
 * @interface
 */
export interface DraftInterface {
  pattern: Array<Array<boolean>>;
  layers: Array<Layer>;
  rowLayerMapping: Array<number>;
  connections: Array<any>;
  labels: Array<any>;
  wefts: number;
  warps: number;

}

/**
 * Definition and implementation of draft object.
 * @class
 */
export class Draft implements DraftInterface {
  pattern: Array<Array<boolean>>;
  layers: Array<Layer>;
  rowLayerMapping: Array<number>;
  connections: Array<any>;
  labels: Array<any>;
  wefts: number;
  warps: number;
  wpi: number;

  constructor(wefts, warps, wpi) {
    let l = new Layer();
    l.setID(0);
    l.setVisible(true);
    l.setThickness(wpi);
    this.wefts = wefts;
    this.warps = warps;
    this.wpi = wpi;
    this.layers = [l];
    this.rowLayerMapping = [];

    for(var i = 0; i < wefts; i++) {
        this.rowLayerMapping.push(0);
    }

    this.connections = [];
    this.labels = [];
    this.pattern = [];

    for(var i = 0; i < wefts; i++) {
      this.pattern.push([]);
      for (var j = 0; j < warps; j++)
        this.pattern[i].push(false);
    }
  }

  isUp(i:number, j:number) : boolean{
    if ( i > -1 && i < this.pattern.length && j > -1 && j < this.pattern[0].length) {
      return this.pattern[i][j];
    } else {
      return false;
    }
  }

  setHeddle(i:number, j:number, bool:boolean) {
    this.pattern[i][j] = bool;
  }

  rowToLayer(row: number, layerId: number) {

  }

  addLabel(row: number, label: any) {

  }

  createConnection(layer: Layer, line: any) {

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
        var temp = pattern[i % rows][j % cols];
        var prev = this.pattern[i + si][j + sj];

        switch (type) {
          case 'invert':
            this.pattern[i + si][j + sj] = !temp;
            break;
          case 'mask':
            this.pattern[i + si][j + sj] = temp && prev;
            break;
          case 'mirrorX':
            temp = pattern[(h - i - 1) % rows][j % cols];
            this.pattern[i + si][j + sj] = temp;
            break;
          case 'mirrorY':
            temp = pattern[i % rows][(w - j - 1) % cols];
            this.pattern[i + si][j + sj] = temp;
            break;
          default:
            this.pattern[i + si][j + sj] = temp;
            break;
        }
      }
    }
  }

  insertRow(i: number, layerId: number) {
    var col = [];

    for (var j = 0; j < this.warps; j++) {
      col.push(false);
    }

    this.wefts += 1;

    this.rowLayerMapping.splice(i,0,layerId);
    this.pattern.splice(i,0,col);

  }

  cloneRow(i: number, c: number, layerId: number) {
    const col = _.clone(this.pattern[c]);

    this.wefts += 1;

    this.rowLayerMapping.splice(i, 0, layerId);
    this.pattern.splice(i, 0, col);
  }

  deleteRow(i: number) {
    this.wefts -= 1;
    this.rowLayerMapping.splice(i, 1);
    this.pattern.splice(i, 1);
  }

  insertCol(j: number) {

  }

  deleteCol(j: number) {
    
  }

  addLayer(layer) {
    layer.setID(this.layers.length);
    layer.setVisible(true);
    layer.setThickness(this.wpi);
    this.layers.push(layer);

  }

  getColor(index) {
    var id = this.rowLayerMapping[index];
    var layer = this.layers[id];

    return layer.color;
  }

}
