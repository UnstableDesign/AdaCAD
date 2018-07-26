import { Directive, ElementRef, Renderer, HostListener, Input } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/from';
import { Subscription } from 'rxjs/Subscription';
import { Draft } from '../model/draft';
import * as d3 from "d3";

class Point {
  x: number;
  y: number;
  i: number;
  j: number;
}

class Selection {
  start: Point;
  end: Point;
  width: number;
  height: number;

  setParameters() {
    this.width = Math.abs(this.start.x - this.end.x);
    this.height = Math.abs(this.start.y - this.end.y);
  }
}

class Copy {
  width: number;
  height: number;
  pattern: Array<Array<boolean>>;
}

@Directive({
  selector: '[weave]'
})
export class WeaveDirective {
  @Input('brush') brush: any;
  @Input('draft') weave: any;

  subscription: Subscription;
  lSub: Subscription;
  cx;
  width = 500;
  height = 500;
  selection: Selection = new Selection();
  copy: any;
  canvasEl: HTMLCanvasElement;
  svgEl: HTMLElement;

  constructor(private el: ElementRef) {
    // start
    this.selection.width = 80;
    this.selection.height = 80;
    this.selection.start = new Point;
    this.selection.start.x = 40;
    this.selection.start.y = 40;
  }

  ngOnInit() {
    this.canvasEl = this.el.nativeElement.firstElementChild;
    this.svgEl = this.el.nativeElement.lastElementChild;

    d3.select(this.svgEl).attr("width", 0).attr("height",0).style('display', 'none');
    // this.svgEl.attr.width = 0;
    // this.svgEl.attr.height = 0;
    var i;
    this.cx = this.canvasEl.getContext('2d');

    // set the width and height
    this.canvasEl.width = this.weave.warps * 20;
    this.canvasEl.height = this.weave.wefts * 20;

    // set some default properties about the line
    this.cx.globalAlpha = 1;
    this.cx.lineWidth = 2;
    // this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#000';

    this.cx.setLineDash([1,5]);

    for (i = 0; i <= this.canvasEl.width; i += 20) {
      this.cx.moveTo(i, 0);
      this.cx.lineTo(i, this.canvasEl.height);
    }

    for (i = 0; i <= this.canvasEl.height; i += 20) {
      this.cx.moveTo(0, i);
      this.cx.lineTo(this.canvasEl.width, i);
    }

    this.cx.stroke();

    // this.cx.lineWidth = 5;
    // this.cx.beginPath();
    // this.cx.moveTo(140,10);
    // this.cx.lineTo(180,10);
    // this.cx.arcTo(190,20,180,30,10);
    // this.cx.lineTo(180,30);

    // this.cx.stroke();

  }

  
  @HostListener('mousedown', ['$event'])
    onStart(event) {
      if (event.target.localName === 'canvas') {                      // if there is a target
        this.removeSubscription();    // avoid mem leaks 
        this.subscription = 
          Observable.fromEvent(event.target, 'mousemove').subscribe(e => this.onMove(e));   
      

        const currentPos = {
          x: Math.floor(event.offsetX / 20) * 20,
          y: Math.floor(event.offsetY / 20) * 20,
          i: Math.floor(event.offsetY / 20),
          j: Math.floor(event.offsetX / 20),
        };

        switch (this.brush) {
          case 'invert':
          case 'point':
          case 'erase':
            this.drawOnCanvas(currentPos);
            break;
          case 'select':
            this.selection.start = currentPos;
            this.selection.end = currentPos;
            this.selection.width = 0;
            this.selection.height = 0;
            d3.select(this.svgEl).attr("width", 0).attr("height",0).style('display', 'none');
          default:
            break;
        }
      }
  }

  // @HostListener('mousemove', ['$event'])
  // @HostListener('touchmove', ['$event'])    // don't declare this, as it is added dynamically
    onMove(event) {
      // do stuff with event
      const currentPos = {
        x: Math.floor(event.offsetX / 20) * 20,
        y: Math.floor(event.offsetY / 20) * 20,
        i: Math.floor(event.offsetY / 20),
        j: Math.floor(event.offsetX / 20),
      };
      switch (this.brush) {
        case 'point':
        case 'erase':
          this.drawOnCanvas(currentPos);
          break;
        case 'select':
          this.selection.end = currentPos;
          this.selection.setParameters();
          this.selectArea();
        case 'invert':
        default:
          break;
      }

      // console.log(this.canvasEl.offsetLeft);
    }

  @HostListener('mouseleave', ['$event'])
  @HostListener('mouseup', ['$event'])
    onEnd(event) {
      // do stuff
      if (!(event.type === 'mouseleave' && this.brush === 'select')) {
        this.removeSubscription();
      }
    }

   ngOnDestroy() {
     this.removeSubscription();
   }

   removeSubscription() {    
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
    }

    onSelectionEvent(e) {
      console.log(e);
      // case 'clear':
      //     this.fillArea(this.selection, [[false]]);
      //     break;
    }

    private drawOnCanvas(
      currentPos: { x: number, y: number, i: number, j: number }
    ) {
      // incase the context is not set
      var color = this.weave.getColor(currentPos.i);

      if (!this.cx) { return; }

      // start our drawing path
      if (color) {
        this.cx.fillStyle = color;
      } else {
        this.cx.fillStyle = '#000000';
      }

      // we're drawing lines so we need a previous position
      if (currentPos && this.brush === 'point') {
        this.weave.setHeddle(currentPos.i,currentPos.j,true);
        
      } else if (currentPos && this.brush === 'erase') {
        this.weave.setHeddle(currentPos.i,currentPos.j,false);
        
      } else if (currentPos && this.brush === 'invert') {
        const val = !this.weave.isUp(currentPos.i,currentPos.j);
        this.weave.setHeddle(currentPos.i,currentPos.j,val);
      }

      if (this.weave.isUp(currentPos.i, currentPos.j)) {
        // draws a line from the start pos until the current position
        this.cx.setLineDash([0]);
        this.cx.strokeRect(currentPos.x + 2, currentPos.y + 2, 16, 16);
        this.cx.fillRect(currentPos.x + 2, currentPos.y + 2, 16, 16);
      } else {
        // draws a line from the start pos until the current position
        this.cx.clearRect(currentPos.x + 1, currentPos.y + 1, 18, 18);

      }
    }

    private fillArea(selection, pattern, type) {
      const si = Math.min(selection.start.y, selection.end.y);
      const sj = Math.min(selection.start.x, selection.end.x);
      var color = "#000000"

      this.weave.updateSelection(selection, pattern, type);

      for (var i = si; i < si + selection.height; i+= 20) {
        color = this.weave.getColor(i / 20);
        this.cx.fillStyle = color;
        for (var j = sj; j < sj + selection.width; j += 20) {
          if (this.weave.isUp(i / 20, j / 20)) {
            this.cx.setLineDash([0]);
            this.cx.strokeRect(j + 2, i + 2, 16, 16);
            this.cx.fillRect(j + 2, i + 2, 16, 16);
          } else {
            this.cx.clearRect(j + 1, i + 1, 18, 18);
          }
        }
      }

    }

    private selectArea() {
      var left, top;

      left = Math.min(this.selection.start.x, this.selection.end.x);
      top = Math.min(this.selection.start.y, this.selection.end.y);
      d3.select(this.svgEl)
        .attr("width", this.selection.width)
        .attr("height",this.selection.height)
        .style('display', 'initial')
        .style('left', left + this.canvasEl.offsetLeft)
        .style('top', top + this.canvasEl.offsetTop);

      d3.select(this.svgEl)
        .select('text')
        .attr('fill', '#424242')
        .attr('font-weight', 900)
        .attr('font-size', 18)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .text(this.selection.height / 20 +' x '+ this.selection.width / 20);

    }

    public copyArea() {
      const si = Math.min(this.selection.start.i, this.selection.end.i);
      const sj = Math.min(this.selection.start.j, this.selection.end.j);
      var w = this.selection.width / 20;
      var h = this.selection.height / 20;

      var copy = [];

      for (var i = 0; i < h; i++) {
        copy.push([]);
        for(var j = 0; j < w; j++) {
          copy[i].push(this.weave.isUp(si + i, sj + j));
        }
      }

      this.copy = copy;

    }

    printPattern(pattern) {
    for (var i = 0; i < pattern.length; i++) {
      var s = "";
      for (var j = 0; j < pattern[0].length; j++) {
        if (pattern[i][j]) {
          s += 'x';
        } else {
          s += 'o'
        }
      }
      console.log(s);
    }
  }

  redrawRow(y, i) {
    var color = '#000000'
    color = this.weave.getColor(i);
    this.cx.fillStyle = color;
    for (var j = 0; j < this.weave.warps * 20; j += 20) {
      if (this.weave.isUp(i, j / 20)) {
        this.cx.setLineDash([0]);
        this.cx.strokeRect(j + 2, y + 2, 16, 16);
        this.cx.fillRect(j + 2, y + 2, 16, 16);
      } else {
        this.cx.clearRect(j + 1, y + 1, 18, 18);
      }
    }
  }

  redraw() {
    var i,j;
    this.cx.clearRect(0,0, this.canvasEl.width, this.canvasEl.height);
    this.cx.setLineDash([1,5]);

    for (i = 0; i <= this.canvasEl.width; i += 20) {
      this.cx.moveTo(i, 0);
      this.cx.lineTo(i, this.canvasEl.height);
    }

    for (i = 0; i <= this.canvasEl.height; i += 20) {
      this.cx.moveTo(0, i);
      this.cx.lineTo(this.canvasEl.width, i);
    }

    this.cx.stroke();

    var color = '#000000';

    for (var y = 0; y < this.weave.wefts * 20; y += 20) {
      color = this.weave.getColor( y / 20);
      this.cx.fillStyle = color;
      for (var x = 0; x < this.weave.warps * 20; x += 20) {
        if (this.weave.isUp(y / 20 , x / 20)) {
          this.cx.setLineDash([0]);
          this.cx.strokeRect(x + 2, y + 2, 16, 16);
          this.cx.fillRect(x + 2, y + 2, 16, 16);
        } else {
          this.cx.clearRect(x + 1, y + 1, 18, 18);
        }
      }
    }
  }

  simulate() {
    var color = '#000000';
    var offset;
    this.cx.clearRect(0,0, this.canvasEl.width, this.canvasEl.height);

    for (var y = 0; y < this.weave.wefts * 20; y += 20) {
      color = this.weave.getColor( y / 20);
      for (var x = 0; x < this.weave.warps * 20; x += 20) {
        if (!this.weave.isUp(y / 20 , x / 20)) {
          this.cx.fillStyle = color;
          this.cx.fillRect(x, y, 20, 20);
        } else {
          this.cx.fillStyle = '#000000';
          this.cx.fillRect(x + 1, y, 18, 21 );
        }
      }
    }
  }

}
