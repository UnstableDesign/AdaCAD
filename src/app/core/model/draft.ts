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
  visibleRows: Array<number>;
  connections: Array<any>;
  labels: Array<any>;
  wefts: number;
  warps: number;
  epi: number;

  constructor(wefts, warps, epi) {
    let l = new Layer();
    l.setID(0);
    l.setVisible(true);
    l.setThickness(epi);
    this.wefts = wefts;
    this.warps = warps;
    this.epi = epi;
    this.layers = [l];
    this.rowLayerMapping = [];
    this.visibleRows = [];

    for(var i = 0; i < wefts; i++) {
        this.rowLayerMapping.push(0);
        this.visibleRows.push(i);
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
  }

  rowToLayer(row: number) {
    return this.rowLayerMapping[row];
  }

  updateVisible() {
    var i = 0;
    var layers = [];
    var visible = [];
    for (i = 0; i < this.layers.length; i++) {
      layers.push(this.layers[i].visible);
    }

    for (i = 0; i< this.rowLayerMapping.length; i++) {
      var show = layers[this.rowLayerMapping[i]];

      if (show) {
        visible.push(i);
      }
    }

    this.visibleRows = visible;
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

  insertRow(i: number, layerId: number) {
    var col = [];

    for (var j = 0; j < this.warps; j++) {
      col.push(false);
    }

    this.wefts += 1;

    this.rowLayerMapping.splice(i,0,layerId);
    this.pattern.splice(i,0,col);
    this.updateVisible();

  }

  cloneRow(i: number, c: number, layerId: number) {
    var row = this.visibleRows[c];
    const col = _.clone(this.pattern[c]);

    console.log(i, c, layerId);

    this.wefts += 1;

    this.rowLayerMapping.splice(i, 0, layerId);
    this.pattern.splice(i, 0, col);

    this.updateVisible();
  }

  deleteRow(i: number) {
    var row = this.visibleRows[i];
    this.wefts -= 1;
    this.rowLayerMapping.splice(i, 1);
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

  addLayer(layer) {
    layer.setID(this.layers.length);
    layer.setVisible(true);
    if (!layer.thickness) {
      layer.setThickness(this.epi);
    }
    this.layers.push(layer);

    if (layer.image) {
      this.insertImage(layer);
    }

  }

  insertImage(layer) {
    var max = this.rowLayerMapping.length;
    var data = layer.image;
    for (var i=data.length; i > 0; i--) {
      var idx = Math.min(max, i);
      this.rowLayerMapping.splice(idx,0,layer.id);
      this.pattern.splice(idx,0,data[i - 1]);
    }
  }

  getColor(index) {
    var row = this.visibleRows[index];
    var id = this.rowLayerMapping[row];
    var layer = this.layers[id];

    return layer.color;
  }

}
