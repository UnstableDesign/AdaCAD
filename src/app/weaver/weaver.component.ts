import { Component, OnInit, HostListener, ViewChild } from '@angular/core';

import { PatternService } from '../core/provider/pattern.service';
import { WeaveDirective } from '../core/directives/weave.directive';
import { Draft } from '../core/model/draft';
import { Layer } from '../core/model/layer';
import { Pattern } from '../core/model/pattern';

class Point {
  x: number;
  y: number;
}

class Selection {
  start: Point;
  end: Point;
  width: number;
  height: number;
}

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
  selection: Selection = new Selection();
  patterns;

  constructor(private ps: PatternService) {
  }

  @HostListener('window:keydown.Control.e', ['$event'])
  keyEventErase(e) {
    this.brush = 'erase';
  }

  @HostListener('window:keydown.Control.d', ['$event'])
  keyEventPoint(e) {
    console.log(e);
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

  ngOnInit() {
    var layer2 = new Layer();
    var layer3 = new Layer();

    this.draft = new Draft (20, 40);
    this.draft.addLayer(layer2);
    this.draft.addLayer(layer3);


    this.draft.layers[0].setColor('#000000');
    this.draft.layers[1].setColor('#ed5a0e');
    this.draft.layers[2].setColor('#c2185b');

    this.selection.width = 80;
    this.selection.height = 80;
    this.selection.start = new Point;
    this.selection.start.x = 40;
    this.selection.start.y = 40;

    this.ps.getPatterns().subscribe((res: Array<Pattern>) => {this.patterns = res;});
  }

  print(e) {
    console.log(e);
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

    switch (e.view) {
      case 'visual':
        this.weaveDraft.simulate();
        break;
      case 'yarn':
      default:
        this.weaveDraft.redraw();
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
