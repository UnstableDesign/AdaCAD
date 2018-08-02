import { Component, OnInit, HostListener, ViewChild } from '@angular/core';

import { PatternService } from '../core/provider/pattern.service';
import { WeaveDirective } from '../core/directives/weave.directive';
import { Draft } from '../core/model/draft';
import { Layer } from '../core/model/layer';
import { Pattern } from '../core/model/pattern';
import {MatDialog, MatDialogConfig} from "@angular/material";
import { ConnectionModal } from './modal/connection/connection.modal';

/**
 * Controller of the Weaver component.
 * @class
 */
@Component({
  selector: 'app-weaver',
  templateUrl: './weaver.component.html',
  styleUrls: ['./weaver.component.scss']
})
export class WeaverComponent implements OnInit {
  @ViewChild(WeaveDirective) weaveDraft;

  brush = 'point';
  selected = 0;
  draft: Draft;
  patterns;
  view = 'pattern';

  constructor(private ps: PatternService, private dialog: MatDialog) {}

  ngOnInit() {
    this.draft = new Draft (30, 40, 12);
    this.draft.layers[0].setColor('#3d3d3d');

    this.ps.getPatterns().subscribe((res: Array<Pattern>) => {this.patterns = res;});
  }

  openDialog() {

    const dialogRef = this.dialog.open(ConnectionModal, {data: {layers: this.draft.layers}});

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.draft.connections.push(result);
      }
    });
  }

  @HostListener('window:keydown.Control.e', ['$event'])
  keyEventErase(e) {
    this.brush = 'erase';
  }

  @HostListener('window:keydown.Control.d', ['$event'])
  keyEventPoint(e) {
    this.brush = 'point';
  }

  @HostListener('window:keydown.Control.s', ['$event'])
  keyEventSelect(e) {
    this.brush = 'select';
  }

  @HostListener('window:keydown.Control.x', ['$event'])
  keyEventInvert(e) {
    this.brush = 'invert';
  }

  print(e) {
    console.log(e);
  }

  insertRow(i, layer) {
    this.draft.insertRow(i, layer);
    this.weaveDraft.updateSize();
  }

  cloneRow(i, c, layer) {
    this.draft.cloneRow(i, c, layer);
    this.weaveDraft.updateSize();
  }

  deleteRow(i) {
    this.draft.deleteRow(i);
    this.weaveDraft.updateSize();
  }

  updatePatterns(e: any) {
    this.patterns = e.patterns;
  }

  createLayer(e: any) {
    this.draft.addLayer(e.layer);
  }

  createPattern(e: any) {
    e.pattern.id = this.patterns.length;
    this.patterns.push(e.pattern);
  }

  onViewChange(e: any) {
    this.view = e.view;

    switch (e.view) {
      case 'visual':
        this.weaveDraft.simulate();
        break;
      case 'yarn':
        this.weaveDraft.functional();
        break;
      default:
        this.weaveDraft.updateSize();
        break;
    }
  }

  onBrushChange(e:any) {
    this.brush = e.name;
  }

  onFill(e) {
    var p = this.patterns[e.id].pattern;
    console.log(p);
    this.weaveDraft.fillArea(this.weaveDraft.selection, p, 'original');
  }

  onClear() {
    this.weaveDraft.fillArea(this.weaveDraft.selection, [[null]], 'original')
  }

  onMask(e) {
    console.log(e);
    var p = this.patterns[e.id].pattern;
    this.weaveDraft.fillArea(this.weaveDraft.selection, p, 'mask');
  }

  onPaste(e) {
    var p = this.weaveDraft.copy;
    var type = e.type;
    this.weaveDraft.fillArea(this.weaveDraft.selection, p, type);
  }

  onCopy() {
    this.weaveDraft.copyArea();
  }

  rowLayerChange(layer, index) {

    const len = this.draft.layers.length;

    var newLayer = (layer + 1) % len;
    this.draft.rowLayerMapping[index] = newLayer;

    this.weaveDraft.redrawRow(index * 20, index);
  }

  redraw() {
    this.weaveDraft.redraw();
  }

}
