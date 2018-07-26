import {
  Component, Input, ElementRef, AfterViewInit, ViewChild
} from '@angular/core';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/pairwise';
import {Observable} from 'rxjs/Observable';

import * as d3 from "d3";
import * as mat from "matrixmath";
import * as math from "mathjs";

@Component({
  selector: 'app-draft',
  templateUrl: './draft.component.html',
  styleUrls: ['./draft.component.scss']
})
export class DraftComponent implements AfterViewInit {
  @ViewChild('myCanvas') canvasRef: ElementRef;

  // setting a width and height for the canvas
  @Input() public width = 800;
  @Input() public height = 800;

  @Input() brush = 'point';
  @Input() weave;

  warps = 4;
  wefts = 4;

  private cx: CanvasRenderingContext2D;
  constructor() { }

  ngAfterViewInit() {
    // get the context

    var i = math.matrix(
        [[1,0,0,1],
         [1,1,0,0],
         [0,1,1,0],
         [0,0,1,1]]);
    var r = math.matrix(
        [[1,0,0,0],
         [0,1,0,0],
         [0,0,1,0],
         [0,1,0,0],
         [1,0,0,0],
         [0,0,0,1],
         [0,0,1,0],
         [0,1,0,0],
         [1,0,0,0],
         [0,0,0,1]]);
    var h = math.matrix(
        [[1,0,0,0,2,0,0,0,1],
         [0,0,0,1,0,1,0,0,0],
         [0,0,1,0,0,0,1,0,0],
         [0,1,0,0,0,0,0,1,0]])
    var w = math.multiply(math.multiply(r,i),h);
    var sub = w.subset(math.index(0,[0,1,2,3,4,5,6,7,8]));
    var subc = math.transpose(w).subset(math.index(0,[0,1,2,3,4,5,6,7,8,9]));

    var j;

    w.map(function(x,i,m) {
      m.set(i, x && 1);
      return;
    });

    // console.log(math.matrix([0,1,1]).toString() === math.matrix([0,1,1]).toString());

    
    // we'll implement this method to start capturing mouse events
    // this.captureEvents(canvasEl);
  }

  print(e) {
    console.log(e);
  }

  // public onClickEvent(e) {
  //   // get the context
  //   const canvasEl: HTMLCanvasElement = this.canvasRef.nativeElement;
  //   const currentPos = {
  //     x: Math.floor(e.offsetX / 20) * 20,
  //     y: Math.floor(e.offsetY / 20) * 20
  //   }

  //   this.drawOnCanvas(currentPos, {x:null, y:null});
  // }

  // private captureEvents(canvasEl: HTMLCanvasElement) {
  //   Observable
  //     // this will capture all mousedown events from teh canvas element
  //     .fromEvent(canvasEl, 'mousedown')
  //     .switchMap((e) => {
  //       return Observable
  //         // after a mouse down, we'll record all mouse moves
  //         .fromEvent(canvasEl, 'mousemove')
  //         // we'll stop (and unsubscribe) once the user releases the mouse
  //         // this will trigger a 'mouseup' event    
  //         .takeUntil(Observable.fromEvent(canvasEl, 'mouseup'))
  //         // we'll also stop (and unsubscribe) once the mouse leaves the canvas (mouseleave event)
  //         .takeUntil(Observable.fromEvent(canvasEl, 'mouseleave'))
  //         // pairwise lets us get the previous value to draw a line from
  //         // the previous point to the current point    
  //         .pairwise()
  //     })
  //     .subscribe((res: [MouseEvent, MouseEvent]) => {
  //       const rect = canvasEl.getBoundingClientRect();
  //       // previous and current position with the offset
  //       const prevPos = {
  //         x: res[0].offsetX,
  //         y: res[0].offsetY
  //       };

  //       const currentPos = {
  //         x: Math.floor(res[1].offsetX / 20) * 20,
  //         y: Math.floor(res[1].offsetY / 20) * 20
  //       };
      
  //       // this method we'll implement soon to do the actual drawing
  //       this.drawOnCanvas(currentPos, prevPos);
  //     });
  // }

  // private drawOnCanvas(
  //   currentPos: { x: number, y: number },
  //   prevPos: { x: number, y: number }
  // ) {
  //   // incase the context is not set
  //   if (!this.cx) { return; }

  //   // start our drawing path
  //   this.cx.fillStyle = '#000000';

  //   // we're drawing lines so we need a previous position
  //   if (currentPos) {
  //     // draws a line from the start pos until the current position
  //     this.cx.fillRect(currentPos.x, currentPos.y, 20, 20);
  //   }
  // }

  // clicked(event: any) {
  //   d3.select(event.target)
  //     .append('circle')
  //     .attr('cx', event.offsetX)
  //     .attr('cy', event.offsetY)
  //     .attr('r', 20)
  //     .attr('fill', 'red');
  // }

}
