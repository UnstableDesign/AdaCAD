import { Directive, ElementRef, ViewChild, HostListener, Input, Renderer2 } from '@angular/core';

import { Observable, Subscription, fromEvent, from } from 'rxjs';
import * as d3 from "d3";
import {cloneDeep} from 'lodash';

import { Draft } from '../model/draft';
import { Shuttle } from '../model/shuttle';
import { Point } from '../model/point';
import { Selection } from '../model/selection';
import { CanvasToBMP } from '../model/canvas2image';
import { DraftSegment } from '../../ngrx/draft/segment';
import { AddAction } from '../../ngrx/draft/actions';
import {select, Store} from '@ngrx/store';
import {getCurrentDraft, selectAll} from '../../ngrx/draft/selectors';
import {Subject} from 'rxjs';
import {takeLast, takeUntil} from 'rxjs/operators';
import {AppState} from '../../ngrx/app.state';

const generateId = () => (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();

/**
 * WeaveDirective handles the events and manipulation of the weave draft.
 * @class
 */
@Directive({
  selector: '[weave]'
})
export class WeaveDirective {
  /// ATTRIBUTES
  /**
   * Contains the name of the brush being used to manipulate the weave draft.
   * It is defined and inputed from the HTML declaration of the WeaveDirective.
   * @property {string}
   */
  @Input('brush') brush: any;

  /**
   * The Draft object containing the pattern and shuttle information.
   * It is defined and inputed from the HTML declaration of the WeaveDirective.
   * @property {Draft}
   */
  @Input('draft') weave: any;

  /**
   * The HTML canvas element within the weave draft.
   * @property {HTMLCanvasElement}
   */
  canvasEl: HTMLCanvasElement;

  /**
   * The pattern that has been copied from the draft pattern.
   * @property {Array<Array<boolean>>}
   */
  copy: Array<Array<boolean>>;

  /**
   * The 2D context of the canvas
   * @property {any}
   */
  cx: any;

  /**
   * The current selection within the weave canvas.
   * @property {Selection}
   */
  selection: Selection = new Selection();

  /**
   * Subscribes to move event after a touch event is started.
   * @property {Subscription}
   */
  subscription: Subscription;

  /**
   * The HTML SVG element used to show the selection.
   * @property {HTMLElement}
   */
  svgEl: HTMLElement;


  private segments$: Observable<DraftSegment[]>;
  private prevSegment = null;
  private currSegment = null;

  private tempPattern: Array<Array<boolean>>;
  private segment: DraftSegment;
  private unsubscribe$ = new Subject();

  /// ANGULAR FUNCTIONS
  /**
   * Creates the element reference.
   * @constructor
   */
  constructor(private el: ElementRef, private store: Store<any>) {}

  /**
   *
   */
  ngOnInit() {
    this.segments$ = this.store.pipe(select(selectAll));
    // define the elements and context of the weave draft.
    this.canvasEl = this.el.nativeElement.firstElementChild;
    this.svgEl = this.el.nativeElement.lastElementChild;
    this.cx = this.canvasEl.getContext('2d');

    // set the width and height
    this.canvasEl.width = this.weave.warps * 20;
    this.canvasEl.height = this.weave.wefts * 20;

    // Set up the initial grid.
    this.redraw();

    // make the selection SVG invisible using d3
    d3.select(this.svgEl).style('display', 'none');

    this.store.pipe(select(getCurrentDraft), takeUntil(this.unsubscribe$)).subscribe(undoredo => {
      this.prevSegment = this.currSegment;
      this.currSegment = undoredo;
    });
  }

  /**
   * 
   */
   ngOnDestroy() {
     this.removeSubscription();
   }

   /// EVENTS
  /**
   * Touch start event. Subscribes to the move event.
   * @extends WeaveDirective
   * @param {Event} event - The mousedown event.
   * @returns {void}
   */
  @HostListener('mousedown', ['$event'])
  private onStart(event) {
    var offset = 0;

    // create offset if brush is select to allow easier selection.
    if (this.brush === 'select') {
      offset = 7;
    }

    // We only care when the event happens in the canvas.
    if (event.target.localName === 'canvas') {
      // avoid mem leaks 
      this.removeSubscription();    
      // set up subscription for move event
      this.subscription = 
        fromEvent(event.target, 'mousemove').subscribe(e => this.onMove(e));   
    
      // set up the Point to be used.
      const currentPos: Point = {
        x: Math.floor((event.offsetX + offset) / 20) * 20,
        y: Math.floor((event.offsetY + offset) / 20) * 20,
        i: Math.floor((event.offsetY + offset) / 20),
        j: Math.floor((event.offsetX + offset) / 20),
      };

      // Save temp pattern
      this.tempPattern = cloneDeep(this.weave.pattern);

      // determine action based on brush type.
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
          d3.select(this.svgEl).style('display', 'none');
          break;
        default:
          break;
      }
      this.segment = {
        start: [currentPos.i, currentPos.j],
        end: [currentPos.i, currentPos.j],
        pattern: null,
        id: generateId(),
      }
    }
  }

  /**
   * Event called when mouse down and moved within the canvas.
   * @extends WeaveDirective
   * @param {Event} event - The mousemove event.
   * @returns {void}
   */
  private onMove(event) {
    var offset = 0;

    // create offset if brush is select to allow easier selection.
    if (this.brush === 'select') {
      offset = 7;
    }

    // set up the point based on touched square.
    const currentPos: Point = {
      x: Math.floor((event.offsetX + offset) / 20) * 20,
      y: Math.floor((event.offsetY + offset) / 20) * 20,
      i: Math.floor((event.offsetY + offset) / 20),
      j: Math.floor((event.offsetX + offset) / 20),
    };

    // determine action based on brush type. invert inactive on move.
    switch (this.brush) {
      case 'point':
      case 'erase':
        this.drawOnCanvas(currentPos);
        break;
      case 'select':
        this.selection.end = currentPos;
        this.selection.setParameters();
        this.selectArea();
        break;
      case 'invert':
      default:
        break;
    }

    var i = currentPos.i, j = currentPos.j;
    if (this.segment.start[0] > i) this.segment.start[0] = i;
    if (this.segment.start[1] > j) this.segment.start[1] = j;
    if (this.segment.end[0] < i) this.segment.end[0] = i;
    if (this.segment.end[1] < j) this.segment.end[1] = j;
  }

  /**
   * Event removes subscription when touch has ended.
   * @extends WeaveDirective
   * @param {Event} event - The mouseleave or mouseup event.
   * @returns {void}
   */
  @HostListener('mouseleave', ['$event'])
  @HostListener('mouseup', ['$event'])
  private onEnd(event) {
    // remove subscription unless it is leave event with select.
    if (!(event.type === 'mouseleave' && this.brush === 'select')) {
      this.removeSubscription();

      if (event.type === 'mouseup' && this.brush != 'select') {
        let segmentPattern = [];

        for (var i = this.segment.start[0]; i < this.segment.end[0] + 1; i++) {
          segmentPattern.push([])
          var index = i - this.segment.start[0];
          for (var j = this.segment.start[1]; j < this.segment.end[1] + 1; j++) {
            var past, present;
            past = this.tempPattern[i][j];
            present = this.weave.pattern[i][j];
            segmentPattern[index].push(past ? !present : present)
          }
        }
        this.segment.pattern = segmentPattern;
        this.onAdd(this.segment);
      }
    }
  }

  /**
   * Remove the subscription from the move event.
   * @extends WeaveDirective
   * @returns {void}
   */
 private removeSubscription() {    
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /// PRIVATE FUNCTIONS
  /**
   * Creates the copied pattern.
   * @extends WeaveDirective
   * @returns {void}
   */
  private copyArea() {
    const si = Math.min(this.selection.start.i, this.selection.end.i);
    const sj = Math.min(this.selection.start.j, this.selection.end.j);
    var w = this.selection.width / 20;
    var h = this.selection.height / 20;

    var copy = [];

    // Create the pattern based on weave draft.
    for (var i = 0; i < h; i++) {
      copy.push([]);
      for(var j = 0; j < w; j++) {
        copy[i].push(this.weave.isUp(si + i, sj + j));
      }
    }

    this.copy = copy;

  }

  /**
   * Draws the grid lines onto the canvas.
   * @extends WeaveDirective
   * @returns {void}
   */
  private drawGrid() {
    var i,j;
    this.cx.fillStyle = "white";
    this.cx.fillRect(0,0,this.canvasEl.width,this.canvasEl.height);
    this.cx.lineWidth = 2;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#000';
    this.cx.setLineDash([1,5]);

    this.cx.beginPath();

    // draw vertical lines
    for (i = 0; i <= this.canvasEl.width; i += 20) {
      this.cx.moveTo(i, 0);
      this.cx.lineTo(i, this.canvasEl.height);
    }

    // draw horizontal lines
    for (i = 0; i <= this.canvasEl.height; i += 20) {
      this.cx.moveTo(0, i);
      this.cx.lineTo(this.canvasEl.width, i);
    }

    this.cx.stroke();

    // reset the line dash.
    this.cx.setLineDash([0]);
  }

  /**
   * Draws or erases a single rectangle on the canvas. Updates the weave draft.
   * @extends WeaveDirective
   * @param {Point} currentPos - the current position of the mouse within draft.
   * @returns {void}
   */
  private drawOnCanvas( currentPos: Point ) {
    // incase the context is not set
    var color = this.weave.getColor(currentPos.i);

    // start our drawing path
    if (color) {
      this.cx.fillStyle = color;
    } else {
      this.cx.fillStyle = '#000000';
    }

    if (!this.cx || !currentPos) { return; }

    // Set the heddles based on the brush.
    switch (this.brush) {
      case 'point':
        this.weave.setHeddle(currentPos.i,currentPos.j,true);
        break;
      case 'erase':
        this.weave.setHeddle(currentPos.i,currentPos.j,false);
        break;
      case 'invert':
        const val = !this.weave.isUp(currentPos.i,currentPos.j);
        this.weave.setHeddle(currentPos.i,currentPos.j,val);
        break;
      default:
        break;
    }

    // draws the rectangle if heddle is up, otherwise it is erased.
    if (this.weave.isUp(currentPos.i, currentPos.j)) {
      this.cx.strokeRect(currentPos.x + 2, currentPos.y + 2, 16, 16);
      this.cx.fillRect(currentPos.x + 2, currentPos.y + 2, 16, 16);
    } else {
      this.cx.clearRect(currentPos.x + 1, currentPos.y + 1, 18, 18);
    }
  }

  /**
   * Fills in selected area of canvas. Updates the pattern within selection.
   * @extends WeaveDirective
   * @param {Selection} selection - defined user selected area to fill.
   * @param {Array<Array<boolean>>} - the pattern used to fill the area.
   * @param {string} - the type of logic used to fill selected area.
   * @returns {void}
   */
  private fillArea(
    selection: Selection, 
    pattern: Array<Array<boolean>>, 
    type: string
  ) {
    const si = Math.min(selection.start.y, selection.end.y);
    const sj = Math.min(selection.start.x, selection.end.x);
    var color = "#000000"

    this.weave.updateSelection(selection, pattern, type);

    let segmentPattern = [];
    for (var i = this.segment.start[0]; i < this.segment.end[0] + 1; i++) {
      segmentPattern.push([])
      var index = i - this.segment.start[0];
      for (var j = this.segment.start[1]; j < this.segment.end[1] + 1; j++) {
        var past, present;
        past = this.tempPattern[i][j];
        present = this.weave.pattern[i][j];
        segmentPattern[index].push(past ? !present : present)
      }
    }
    this.segment.pattern = segmentPattern;
    this.onAdd(this.segment);

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

  private undoRedoSegment() {
    console.log(this.prevSegment);
    var start = this.prevSegment.start;
    var end = this.prevSegment.end;
    var segment = this.prevSegment.pattern;

    var oldBrush = this.brush;

    this.brush = 'invert';
    console.log(oldBrush);

    for (var i = start[0]; i <= end[0]; i++) {
      for (var j = start[1]; j <= end[1]; j++ ) {
        if (segment[i-start[0]][j-start[1]]) {
          this.drawOnCanvas({
            x: j * 20,
            y: i * 20,
            i: i,
            j: j
          });
        }
      }
    }

    this.brush = oldBrush;
  }

  /**
   * Redraws one row to avoid drawing the entire canvas.
   * @extends WeaveDirective
   * @returns {void}
   */
  private redrawRow(y, i) {
    var color = '#000000'

    // Gets color of row.
    color = this.weave.getColor(i);
    this.cx.fillStyle = color;

    // draw row
    for (var j = 0; j < this.weave.warps * 20; j += 20) {
      if (this.weave.isUp(i, j / 20)) {
        this.cx.strokeRect(j + 2, y + 2, 16, 16);
        this.cx.fillRect(j + 2, y + 2, 16, 16);
      } else {
        this.cx.clearRect(j + 1, y + 1, 18, 18);
      }
    }
  }

  /**
   * Creates the selection overlay
   * @extends WeaveDirective
   * @returns {void}
   */
  private selectArea() {
    var left, top, x, y, anchor;

    x = 5; 
    y = 20;
    anchor = 'start';

    if (this.selection.start.x < this.selection.end.x) {
        x = this.selection.width - 10;
        anchor = 'end';
     }

     if (this.selection.start.y < this.selection.end.y) {
       y = this.selection.height - 10;
     }

    // define the left and top offsets
    left = Math.min(this.selection.start.x, this.selection.end.x);
    top = Math.min(this.selection.start.y, this.selection.end.y);

    // updates the size of the selection
    d3.select(this.svgEl)
      .attr("width", this.selection.width)
      .attr("height",this.selection.height)
      .style('display', 'initial')
      .style('left', left + this.canvasEl.offsetLeft)
      .style('top', top + this.canvasEl.offsetTop);

    // updates the text within the selection
    d3.select(this.svgEl)
      .select('text')
      .attr('fill', '#424242')
      .attr('font-weight', 900)
      .attr('font-size', 18)
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .attr('x', x)
      .attr('y', y)
      .attr('text-anchor', anchor)
      .text(this.selection.height / 20 +' x '+ this.selection.width / 20);

  }

  /// PUBLIC FUNCTIONS
  /**
   * Visualizes the path of the yarns within the weave.
   * @extends WeaveDirective
   * @returns {void}
   */
  public functional() {
    this.updateSize();
    this.cx.clearRect(0,0, this.canvasEl.width, this.canvasEl.height);
    // this.drawGrid();
    this.cx.setLineDash([0]);

    for (var l = 0; l < this.weave.shuttles.length; l++) {
      // Each shuttle.
      this.cx.strokeStyle = this.weave.shuttles[l].getColor();
      this.cx.lineWidth = 5;
      var first = true;
      var left = !this.weave.shuttles[l].insert;
      var py = null;
      var s,e;
      var s1 = null;
      var s2 = null;
      var e1 = null;
      var e2 = null;

      for (var i = this.weave.visibleRows.length; i > 0 ; i--) {
        var y = ((i - 1) * 20) + 10;
        var r = this.weave.visibleRows[i - 1];
        first = true;
        for (var x = 0; x < this.weave.pattern[r].length; x++) {

          if (this.weave.isUp(i - 1,x)) {

            if (first && this.weave.rowShuttleMapping[r] === l) {
              this.cx.beginPath();
              this.cx.moveTo(x * 20 + 5, y);
              this.cx.lineTo((x + 1)* 20 - 5, y)
              first = false;
              if (s1 === null) {
                s1 = (x * 20) + 5;
                e1 = (x + 1) * 20 - 5;
                py = y;
              } else {
                s2 = (x * 20) + 5;
                e2 = (x + 1) * 20 - 5;
              }
            } else if (this.weave.rowShuttleMapping[r] === l) {
              this.cx.lineTo((x + 1) * 20 - 5, y);

              if (py === y) {
                e1 = (x + 1) * 20 - 5;
              } else {
                e2 = (x + 1) * 20 - 5;
              }

            }
          }
        }
        if (first === false) {
          this.cx.stroke();
        }

        if (s2 !== null && e2 !== null) {
          e = Math.max(e1,e2);
          s = Math.min(s1,s2);
          this.cx.beginPath();
          if (left) {
            this.cx.moveTo(s1, py);
            this.cx.lineTo(s, py);
            this.cx.lineTo(s, y);
            this.cx.lineTo(s2, y);
          } else if (!left) {
            this.cx.moveTo(e1, py);
            this.cx.lineTo(e, py);
            this.cx.lineTo(e, y);
            this.cx.lineTo(e2, y);
          }
          this.cx.stroke();
          s1 = s2;
          e1 = e2;
          s2 = null;
          e2 = null;
          py = y;
          left = !left;
        }

      }
    }

    this.cx.strokeStyle = "#000";
  }

  /**
   * Redraws teh entire canvas based on weave pattern.
   * @extends WeaveDirective
   * @returns {void}
   */
  public redraw() {
    var i,j;
    this.cx.clearRect(0,0, this.canvasEl.width, this.canvasEl.height);
    this.drawGrid();

    var color = '#000000';

    for (i = 0; i < this.weave.visibleRows.length; i++) {
      var row = this.weave.visibleRows[i];
      this.redrawRow(i * 20, i);
    }
  }

  /**
   * Simulates the visual look of the weave pattern.
   * @extends WeaveDirective
   * @returns {void}
   */
  public simulate() {
    var color = '#000000';
    var offset;
    var height = 0;

    for (var i = 0; i < this.weave.wefts; i++) {
      var shuttleId = this.weave.rowShuttleMapping[i];
      var t = this.weave.shuttles[shuttleId].getThickness();
      if (t !== undefined) {
        height += Math.ceil((this.weave.wpi / t) * 20);
      }
    }

    this.canvasEl.height = height;

    this.cx.clearRect(0,0, this.canvasEl.width, this.canvasEl.height);

    var i = 0;
    var y = 0;
    while (y < this.canvasEl.height) {
      color = this.weave.getColor(i);
      var l = this.weave.rowShuttleMapping[i];
      var h = Math.ceil((this.weave.wpi / this.weave.shuttles[l].getThickness()) * 20);
      for (var x = 0; x < this.weave.warps * 20; x += 20) {
        if (!this.weave.isUp(i , x / 20)) {
          this.cx.fillStyle = color;
          this.cx.fillRect(x, y, 20, h);
        } else {
          this.cx.fillStyle = '#000000';
          this.cx.fillRect(x, y, 20, h );
        }
      }

      i++;
      y += h;
    }
  }

  /**
   * Resizes and then redraws the canvas on a change to the wefts or warps. 
   * @extends WeaveDirective
   * @returns {void}
   */
  public updateSize() {
    // set the updated width and height
    this.canvasEl.width = this.weave.warps * 20;
    this.canvasEl.height = this.weave.visibleRows.length * 20;

    // redraw the 
    this.redraw();
  }

  public onUndoRedo() {
    console.log("undoredo-weave directive")
    this.undoRedoSegment();
  }

  /**
   * Prints the pattern to the console.
   * @extends WeaveDirective
   * @param {Array<Array<boolean>>} pattern - 2D pattern array.
   * @returns {void}
   */
  public printPattern(pattern) {
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

  /**
   * Saves the draft as a bitmap file
   * @extends WeaveDirective
   * @param {string} fileName - name to save file as
   * @returns {void}
   */
  public savePNG(fileName, obj) {
    let link = obj.downloadLink.nativeElement;

    link.href = this.canvasEl.toDataURL("image/png");
    link.download = fileName + ".png";
    console.log(link);
  }

  /**
   * Saves the draft as a bitmap file
   * @extends WeaveDirective
   * @param {string} fileName - name to save file as
   * @returns {void}
   */
  public saveBMP(fileName, obj) {
    let b = obj.bitmap.nativeElement;
    let context = b.getContext('2d');
    let draft = this.weave.pattern;
    var i,j;

    b.width = this.weave.warps;
    b.height = this.weave.wefts;
    context.fillStyle = "white";
    context.fillRect(0,0,b.width,b.height);

    context.fillStyle = "black";

    for(i = 0; i < b.height; i++) {
      for(j=0; j < b.width; j++) {
        let up = draft[i][j];
        if(up) {
          context.fillRect(j,i,1,1)
        }
      }
    }

    // let b = new Image(this.weave.warps, this.weave.wefts);

    // b.width = this.weave.warps;
    // b.height = this.weave.wefts;
    // b.src ="data:image/bmp;base64";
    // b.hidden = true;
    let link = obj.downloadLink.nativeElement;

    // link.href = b.toDataURL("image/tiff");
    // link.download = fileName + ".tif";
    // console.log(link.href);
    // console.log(this.weave);
    // c2i.saveAsBMP(b, b.width, b.height);
    link.href = CanvasToBMP.toDataURL(b);
    link.download = fileName + ".bmp";
  }

  // History


  private onAdd(segment: DraftSegment) {
    this.store.dispatch(new AddAction(segment));
  }

}
