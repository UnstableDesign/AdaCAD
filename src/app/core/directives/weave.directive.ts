import { Directive, ElementRef, ViewChild, HostListener, Input, Renderer2 } from '@angular/core';

import { Observable, Subscription, fromEvent, from } from 'rxjs';
import * as d3 from "d3";
import {cloneDeep, now} from 'lodash';

import { Draft } from '../model/draft';
import { Render } from '../model/render';
import { Loom } from '../model/loom';
import { Shuttle } from '../model/shuttle';
import { Pattern } from '../model/pattern';
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
   * The Render object containing the variables about zoom and cell sizes.
   * It is defined and inputed from the HTML declaration of the WeaveDirective.
   * @property {Render}
  */
  @Input('render') render: any;
  /**
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
   * The 2D context of the threading canvas
   * @property {any}
   */
  cxThreading: any;

  /**
   * The 2D context of the treadling canvas
   * @property {any}
   */
  cxTreadling: any;

  /**
   * The 2D context of the treadling canvas
   * @property {any}
   */
  cxTieups: any;

  /**
   * The 2D context of the weft_systems canvas
   * @property {any}
   */
  cxWeftSystems: any;

  /**
   * The 2D context of the warp_systems canvas
   * @property {any}
   */
  cxWarpSystems: any;




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


  /**
   * The HTML div element used to position the drawdown.
   * @property {HTMLElement}
   */
  //divEl: HTMLElement;


  /**
   * The HTML canvas element within the weave draft for threading.
   * @property {HTMLCanvasElement}
   * 
   */
  threadingCanvas: HTMLCanvasElement;

    /**
   * The HTML canvas element within the weave draft for treadling.
   * @property {HTMLCanvasElement}
   * 
   */
  treadlingCanvas: HTMLCanvasElement;

  /**
   * The HTML canvas element within the weave draft for tieups.
   * @property {HTMLCanvasElement}
   * 
   */
  tieupsCanvas: HTMLCanvasElement;



  weftSystemsCanvas: HTMLCanvasElement;
  warpSystemsCanvas: HTMLCanvasElement;

  private segments$: Observable<DraftSegment[]>;
  private prevSegment = null;
  private currSegment = null;

  private tempPattern: Array<Array<boolean>>;
  private segment: DraftSegment;
  private unsubscribe$ = new Subject();


  private shuttleLocation: number;

  /// ANGULAR FUNCTIONS
  /**
   * Creates the element reference.
   * @constructor
   */
  constructor(private el: ElementRef, private store: Store<any>) {

    this.shuttleLocation = 166;
  }

  /**
   *
   */
  ngOnInit() {  



    console.log("element", this.el.nativeElement.children);
    this.segments$ = this.store.pipe(select(selectAll));
    // define the elements and context of the weave draft, threading, treadling, and tieups.
    this.canvasEl = this.el.nativeElement.children[3].firstElementChild;
    //this.divEl = this.el.nativeElement.children[3];

    //this is the selection
    this.svgEl = this.el.nativeElement.children[0].lastElementChild;
    
    this.threadingCanvas = this.el.nativeElement.children[1].firstElementChild;
    this.tieupsCanvas = this.el.nativeElement.children[2].firstElementChild;
    this.treadlingCanvas = this.el.nativeElement.children[4].firstElementChild;
    this.weftSystemsCanvas = this.el.nativeElement.children[0].children[1].firstElementChild;
    this.warpSystemsCanvas = this.el.nativeElement.children[0].children[3].firstElementChild;
    
    this.cx = this.canvasEl.getContext('2d');
    this.cxThreading = this.threadingCanvas.getContext('2d');
    this.cxTreadling = this.treadlingCanvas.getContext('2d');
    this.cxTieups = this.tieupsCanvas.getContext('2d');
    this.cxWarpSystems = this.warpSystemsCanvas.getContext('2d');
    this.cxWeftSystems = this.weftSystemsCanvas.getContext('2d');

    // set the width and height
    var dims = this.render.getCellDims("base");



    this.canvasEl.width = this.weave.warps * dims.w;
    this.canvasEl.height = this.weave.wefts * dims.h;
    this.threadingCanvas.width = this.weave.warps * dims.w;
    this.threadingCanvas.height = this.weave.loom.min_frames * dims.h;
    this.treadlingCanvas.height = this.weave.wefts * dims.h;
    this.treadlingCanvas.width = this.weave.loom.min_treadles * dims.w;
    this.tieupsCanvas.width = this.weave.loom.min_treadles*dims.w;
    this.tieupsCanvas.height = this.weave.loom.min_frames * dims.h;


    this.weftSystemsCanvas.width =  dims.w;
    this.weftSystemsCanvas.height = this.weave.wefts * dims.h;

    this.warpSystemsCanvas.width =  this.weave.warps * dims.w;
    this.warpSystemsCanvas.height = dims.h;



    // Set up the initial grid.
    this.redraw();
    this.redrawLoom();

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

    var dims = this.render.getCellDims("base");
    var offset = this.render.getCellDims(this.brush)


    // We only care when the event happens in the canvas.
    if (event.target.localName === 'canvas') {
      // avoid mem leaks 
      this.removeSubscription();    
      // set up subscription for move event
      this.subscription = 
        fromEvent(event.target, 'mousemove').subscribe(e => this.onMove(e));   
    
      // set up the Point to be used.
      const currentPos: Point = {
        x: Math.floor((event.offsetX + offset.x) / dims.w) * dims.w,
        y: Math.floor((event.offsetY + offset.y) / dims.h) * dims.h,
        i: Math.floor((event.offsetY + offset.y) / dims.h), //row
        j: Math.floor((event.offsetX + offset.x) / dims.w), //col
      };
      // Save temp pattern
      this.tempPattern = cloneDeep(this.weave.pattern);

      // determine action based on brush type.

      switch (this.brush) {
        case 'invert':
        case 'point':
        case 'erase':
          if (event.target && event.target.closest('.treadling-container')) {
            this.drawOnTreadling(currentPos);
          } else if (event.target && event.target.closest('.tieups-container')) {
            this.drawOnTieups(currentPos);
          } else if (event.target && event.target.closest('.threading-container')) {
            this.drawOnThreading(currentPos);
          } else if(event.target && event.target.closest('.shuttles')){
            this.drawOnShuttles(currentPos);
          }else if(event.target && event.target.closest('.warp-systems')){
            this.drawOnWarpSelectors(currentPos);
          } else{
            this.drawOnDrawdown(currentPos, null);
          }
          break;
        case 'select':

          this.selection.start = currentPos;
          this.selection.end = currentPos;
          this.selection.width = 0;
          this.selection.height = 0;
          d3.select(this.svgEl).style('display', 'none');

          if (event.target && event.target.closest('.treadling-container')) {
            this.selection.setTarget(this.treadlingCanvas);
          } else if (event.target && event.target.closest('.tieups-container')) {
            this.selection.setTarget(this.tieupsCanvas);
          } else if (event.target && event.target.closest('.threading-container')) {
            this.selection.setTarget(this.threadingCanvas);
          } else if(event.target && event.target.closest('.shuttles')){
            this.selection.width = 1;
            this.selection.setTarget(this.weftSystemsCanvas);
          }else if(event.target && event.target.closest('.warp-systems')){
            this.selection.setTarget(this.warpSystemsCanvas);
            this.selection.height = 1;
          } else{
            this.selection.setTarget(this.canvasEl);
          }
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
    var dims = this.render.getCellDims("base");
    var offset = this.render.getCellDims(this.brush);
  
    // set up the point based on touched square.
    const currentPos: Point = {
      x: Math.floor((event.offsetX + offset.x) / dims.w) * dims.w,
      y: Math.floor((event.offsetY + offset.y) / dims.h) * dims.h,
      i: Math.floor((event.offsetY + offset.y) / dims.h),
      j: Math.floor((event.offsetX + offset.x) / dims.w),
    };


    // determine action based on brush type. invert inactive on move.
    switch (this.brush) {
      case 'point':
      case 'erase':
        if (event.target && event.target.closest('.treadling-container')) {
          this.drawOnTreadling(currentPos);
        } else if (event.target && event.target.closest('.tieups-container')) {
          this.drawOnTieups(currentPos);
        } else if (event.target && event.target.closest('.threading-container')) {
          this.drawOnThreading(currentPos);
        }else if(event.target && event.target.closest('.shuttles')){
            this.drawOnShuttles(currentPos);
        }else if(event.target && event.target.closest('.warp-systems')){
            this.drawOnWarpSelectors(currentPos);
        } else{
            this.drawOnDrawdown(currentPos, null);
        }
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

      if (event.type === 'mouseup' && this.brush != 'select' && this.segment !== undefined) {
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
        //this.onAdd(this.segment);
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



    var dims = this.render.getCellDims("copy");
    const si = Math.min(this.selection.start.i, this.selection.end.i);
    const sj = Math.min(this.selection.start.j, this.selection.end.j);
    var w = this.selection.width / dims.w;
    var h = this.selection.height / dims.h;


    var copy = [];
    
    if(this.selection.target.id === 'weft-systems'){
      for(var i = 0; i < h; i++){
        copy.push([]);
        for(var j = 0; j < this.weave.shuttles.length; j++){
          copy[i].push(false);
        }
      }
    }else if(this.selection.target.id === 'warp-systems'){
      for(var i = 0; i < this.weave.warp_systems.length; i++){
        copy.push([]);
        for(var j = 0; j < w; j++){
          copy[i].push(false);
        }
      }
    }else{
       for (var i = 0; i < h; i++){
        copy.push([]);
        for (var j = 0; j < w; j++){
          copy[i].push(false);
        }
       }
    }



    for (var i = 0; i < copy.length; i++) {
      for(var j = 0; j < copy[0].length; j++) {
        var row = si + i;
        var col = sj + j;
        switch(this.selection.target.id){
          case 'drawdown':
              copy[i][j]=this.weave.isUp(row, col);
          break;
          case 'threading':
              copy[i][j]=this.weave.loom.isInFrame(row,col);
          break;
          case 'treadling':
              copy[i][j] = this.weave.loom.isInTreadle(row,col);
          case 'tieups':
              copy[i][j] = this.weave.loom.hasTieup(row, col);;
          break;  
          case 'warp-systems':
              copy[i][j]= (this.weave.colShuttleMapping[col] == i);
          break;
          case 'weft-systems':
              var adj_row = this.weave.visibleRows[row];
              copy[i][j]= (this.weave.rowShuttleMapping[adj_row] == j);
          break;
          default:
          break;
        }

      }
    }

    this.copy = copy;

  }




  private drawWeftSelectorCell(cx, i){
        var dims = this.render.getCellDims("base");
        var margin = this.render.zoom/50;

        cx.fillStyle = this.weave.getColor(i);
        if(i == this.weave.wefts-1) cx.fillRect(margin, (dims.h*i)+margin, dims.w, dims.h-(margin*2));
        else cx.fillRect( margin, (dims.h*i)+margin, dims.w, dims.h-(margin));
  
  }


  private drawWeftSystems(cx,canvas){


      var dims = this.render.getCellDims("base");
      var margin = this.render.zoom/50;
      var top = dims.h;

      this.weftSystemsCanvas.width =  dims.w;
      this.weftSystemsCanvas.height = this.weave.wefts * dims.h;



      cx.fillStyle = "white";
      cx.fillRect(0,0,canvas.width,canvas.height);


      for(var i = 0 ; i < this.weave.wefts; i++){
          this.drawWeftSelectorCell(cx, i);        
      }


      // var fontsize = 12;
      // var interval = this.render.getTextInterval(0);
      // cx.fillStyle = "white";
      // cx.font =fontsize+"px Arial";

      // cx.fillText(0, dims.w, margin+top);

      // for(var i:number = interval; i < this.weave.wefts; i+= interval){
      //   cx.fillText(i, dims.w, dims.h*i+margin+top);
      // }

      // cx.fillText(this.weave.wefts, dims.w, dims.h*this.weave.wefts+top);


  }

  private drawWarpSelectorCell(cx, j){


        var dims = this.render.getCellDims("base");
        var margin = this.render.zoom/50;
        cx.fillStyle = this.weave.getColorCol(j);

        if(j == this.weave.warps-1) cx.fillRect((dims.w*j)+margin, 0, dims.w-(margin*2), (dims.h) - margin);
        else cx.fillRect( (dims.w*j)+margin, 0, dims.w-margin, (dims.h) - margin);
  
  }

  private drawWarpSystems(cx,canvas){
    var dims = this.render.getCellDims("base");
    var margin = this.render.zoom/50;

    this.warpSystemsCanvas.width =  this.weave.warps * dims.w;
    this.warpSystemsCanvas.height = dims.h;

    cx.fillStyle = "white";
    cx.fillRect(0,0,canvas.width,canvas.height);
  

    for(var j = 0; j < this.weave.warps; j++){
      this.drawWarpSelectorCell(cx, j);
    }

      // var fontsize = 12;
      // var interval = this.render.getTextInterval(0);
      // cx.fillStyle = "white";
      // cx.font =fontsize+"px Arial";

      // cx.fillText(0, left-margin, dims.h);

      // for(var i = interval; i < this.weave.warps; i+= interval){
      //   cx.fillText(i, left+dims.w*i-margin, dims.h);
      // }

      // cx.fillText(this.weave.warps, left+dims.w*this.weave.warps, dims.h);
      

  }

  /**
   * Draws the grid lines onto the canvas.
   * @extends WeaveDirective
   * @returns {void}
   */
  private drawGrid(cx,canvas) {

    var dims = this.render.getCellDims("base");


    var i,j;
    cx.fillStyle = "white";
    cx.fillRect(0,0,canvas.width,canvas.height);
    cx.lineWidth = 2;
    cx.lineCap = 'round';
    cx.strokeStyle = '#000';

    //only draw the lines if the zoom is big enough to render them well
    if(this.render.zoom > 25){

      cx.lineWidth = this.render.zoom/50;

      cx.setLineDash([dims.w/20,dims.w/4]);

      cx.beginPath();

      // draw vertical lines
      for (i = 0; i <= canvas.width; i += dims.w) {
        cx.moveTo(i, 0);
        cx.lineTo(i, canvas.height);
      }

      // draw horizontal lines
      for (i = 0; i <= canvas.height; i += dims.h) {
        cx.moveTo(0, i);
        cx.lineTo(canvas.width, i);
      }

      cx.stroke();

      // reset the line dash.
      cx.setLineDash([0]);
    }
  }


  /**
   * Change shuttle of row to next in list.
   * @extends WeaveComponent
   * @param {Point} the point of the interaction
   * @returns {void}
   */
  private drawOnShuttles( currentPos: Point ) {
    var dims = this.render.getCellDims("base");

    var updates;

    if (!this.cx || !currentPos) { return; }

    var row = (currentPos.i); //need to offset this due to canvas padding

    if(row < 0){ return; }

    const len = this.weave.shuttles.length;
    var shuttle = this.weave.rowShuttleMapping[row];


    var newShuttle = (shuttle + 1) % len;
    while (!this.weave.shuttles[newShuttle].visible) {
      var newShuttle = (newShuttle + 1) % len;
    }

    this.weave.rowShuttleMapping[row] = newShuttle;
    this.drawWeftSelectorCell(this.cxWeftSystems,(row));
    this.redrawRow(row*dims.h, row, this.cx);
  }

  /**
   * Change column to next row in the list
   * @extends WeaveComponent
   * @param {Point} the point of the interaction
   * @returns {void}
   */
  private drawOnWarpSelectors( currentPos: Point ) {
    var dims = this.render.getCellDims("base");

    if (!this.cxWarpSystems || !currentPos) { return; }

    var col = currentPos.j; //need to offset this due to canvas padding

    if(col < 0){ return; }


    const len = this.weave.warp_systems.length;
    var shuttle_id = this.weave.colShuttleMapping[col];

    var newShuttle_id = (shuttle_id + 1) % len;


    this.weave.colShuttleMapping[col] = newShuttle_id;
    this.drawWarpSelectorCell(this.cxWarpSystems,(col));

  }



  /**
   * Draws or erases a single rectangle on the canvas. Updates the weave draft.
   * @extends WeaveDirective
   * @param {Point} currentPos - the current position of the mouse within draft.
   * @returns {void}
   */
  private drawOnDrawdown( currentPos: Point, val:boolean ) {

    // console.log("draw on drawdown", currentPos);
    // incase the context is not set
    //var color = this.weave.getColor(currentPos.i);
    var updates;




    if (!this.cx || !currentPos) { return; }

    // Set the heddles based on the brush.
    switch (this.brush) {
      case 'point':
        val = true;
        break;
      case 'erase':
        val = false;
        break;
      case 'invert':
         val = !this.weave.isUp(currentPos.i,currentPos.j);
        break;        
      default:
        break;
    }

    this.weave.setHeddle(currentPos.i,currentPos.j,val);
    this.drawCell(this.cx,currentPos.i, currentPos.j, "drawdown", null);


    //to save cpu, only compute this while frames are visible
    if(this.render.view_frames){
      updates = this.weave.loom.updateFromDrawdown(currentPos.i,currentPos.j, this.weave.pattern);
      this.drawLoomStates(updates);
    }
  }

  /**
   * Draws or erases a single rectangle on the canvas. Updates the tieups.
   * @extends WeaveDirective
   * @param {Point} currentPos - the current position of the mouse within draft.
   * @returns {void}
   */
  private drawOnTieups( currentPos: Point ) {
    var updates;
    var val = false;
    
    if (!this.cxTieups || !currentPos) { return; }

    if (this.weave.loom.inTieupRange(currentPos.i, currentPos.j)) {
      switch (this.brush) {
        case 'point':
            val = true;
          break;
        case 'erase':
          val = false;
          break;
        case 'invert':
          val = !this.weave.loom.tieup[currentPos.i][currentPos.j];
          break;
        default:
          break;
      }
    }
    
    this.weave.loom.updateTieup(currentPos.i, currentPos.j, val);
    this.weave.updateDraftFromTieup(currentPos.i, currentPos.j, val);
    this.drawCell(this.cxTieups, currentPos.i, currentPos.j, "tieup", val);
    this.redraw();
  }

  /**
   * Draws or erases a single rectangle on the canvas. Updates the threading.
   * @extends WeaveDirective
   * @param {Point} currentPos - the current position of the mouse within draft.
   * @returns {void}
   */
  private drawOnThreading( currentPos: Point ) {
    if (!this.cxThreading || !currentPos) { return; }

    if (this.weave.loom.inThreadingRange(currentPos.i, currentPos.j)){
      


      var val = false;

      switch (this.brush) {
        case 'point':
          val = true;
          break;
        case 'erase':
          val = false;
          break;
        case 'invert':
          val = !(this.weave.loom.threading[currentPos.j] == currentPos.i);
          break;
        default:
          break;
      }
    }
    

    var updates = this.weave.loom.updateThreading(currentPos.i, currentPos.j, val);


    for(var u in updates){
      if(updates[u].reset !== undefined){
        this.redrawLoom();
      } else{
        this.drawCell(this.cxThreading,updates[u].i, updates[u].j, "threading", updates[u].val);
      }
    }

    this.weave.updateDraftFromThreading(updates);
    this.redraw();
  }


  /**
   * Draws or erases a single rectangle on the canvas. Updates the treadling.
   * @extends WeaveDirective
   * @param {Point} currentPos - the current position of the mouse within draft.
   * @returns {void}
   */
  private drawOnTreadling( currentPos: Point ) {


    if (!this.cxTreadling || !currentPos) { return; }
    
    var val = false;

    if(this.weave.loom.inTreadlingRange(currentPos.i, currentPos.j)){
      switch (this.brush) {
        case 'point':
          val = true;
          break;
        case 'erase':
          val = false;
          break;
        case 'invert':
          val = !(this.weave.loom.treadling[currentPos.i] == currentPos.j);
          break;
        default:
          break;
      }
    }

    var updates = this.weave.loom.updateTreadling(currentPos.i, currentPos.j, val);
    for(var u in updates){
      if(updates[u].reset !== undefined){
        this.redrawLoom();
      } else{
        this.drawCell(this.cxTreadling,updates[u].i, updates[u].j, "treadling", updates[u].val);
      }
    }

    this.weave.updateDraftFromTreadling(updates);
    this.redraw();
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

    var dims = this.render.getCellDims("base");
    var updates = [];
    const si = Math.min(selection.start.y, selection.end.y) / dims.h;
    const sj = Math.min(selection.start.x, selection.end.x) / dims.w;

  
    const rows = pattern.length;
    const cols = pattern[0].length;

    var w,h;

    w = Math.ceil(selection.width / dims.w);
    h = Math.ceil(selection.height / dims.h);

    if(selection.target.id === "warp-systems") h = pattern.length;
    if(selection.target.id === "weft-systems") w = pattern[0].length;


    for (var i = 0; i < h; i++ ) {
      for (var j = 0; j < w; j++ ) {
        var row = this.weave.visibleRows[i + si];
        var col = j + sj;
        var temp = pattern[i % rows][j % cols];
       
        var prev = false; 
        switch(selection.target.id){
          case 'drawdown':
              prev = this.weave.pattern[row][col];
          break;
          case 'threading':
              prev = this.weave.loom.isInFrame(col, row);
          break;
          case 'treadling':
              prev = (this.weave.loom.isInTreadle(col,row)); 
          case 'tieups':
              prev = this.weave.loom.hasTieup(row,col); 
          break;
          default:
          break;
        }

        if (prev !== null){

          var val;
          switch (type) {
            case 'invert':
             val = !temp;
              break;
            case 'mask':
             val = temp && prev;
              break;
            case 'mirrorX':
              val = pattern[(h - i - 1) % rows][j % cols];
              break;
            case 'mirrorY':
              val = pattern[i % rows][(w - j - 1) % cols];
              break;
            default:
              val = temp;
              break;
          }


          var updates = [];

          switch(selection.target.id){
           
           case 'drawdown':
                var p = new Point(); 
                p.x = (col+sj)*dims.w;
                p.y = (row+si)*dims.h;
                p.i = row;
                p.j = col;
                this.drawOnDrawdown(p, val);

            break;
            case 'threading':
              if(val && this.weave.loom.inThreadingRange(row,col)){
                  
                  updates = this.weave.loom.updateThreading(row, col, val);

                  for(var u in updates){
                    if(updates[u].reset !== undefined){
                      this.redrawLoom();
                    } else{
                      this.drawCell(this.cxThreading,updates[u].i, updates[u].j, "threading", updates[u].val);
                    }
                  }
                  this.weave.updateDraftFromThreading(updates); 
              }
            break;

            case 'treadling':
             if(val && this.weave.loom.inTreadlingRange){ 
                updates = this.weave.loom.updateTreadling(row, col, val);
                for(var u in updates){
                  if(updates[u].reset !== undefined){
                    this.redrawLoom();
                  } else{
                    this.drawCell(this.cxTreadling,updates[u].i, updates[u].j, "treadling", updates[u].val);
                  }
                }
                this.weave.updateDraftFromTreadling(updates);
              }
            break;
            case 'tieups':
              if(this.weave.loom.inTieupRange(row, col)){
                this.weave.loom.updateTieup(row, col, val);
                this.drawCell(this.cxTieups, row, col, "tieup", val);            
                this.weave.updateDraftFromTieup(row, col, val);
              }
            break;
            case 'weft-systems':
              val = pattern[i % rows][j % cols];
              if(val && col < this.weave.shuttles.length) this.weave.rowShuttleMapping[row] = col;
            break;
            case 'warp-systems':
              val = pattern[i % rows][j % cols];
              if(val && row < this.weave.warp_systems.length){
                  this.weave.colShuttleMapping[col] = row;
              }
            break;
            default:
            break;
          }
        }


      }
    }

    this.redraw();

  }

  private undoRedoSegment() {

    // console.log(this.prevSegment);
    
    // var start = this.prevSegment.start;
    // var end = this.prevSegment.end;
    // var segment = this.prevSegment.pattern;
    // var dims = this.render.getCellDims("base");

    // var oldBrush = this.brush;

    // this.brush = 'invert';
    // console.log(oldBrush);

    // for (var i = start[0]; i <= end[0]; i++) {
    //   for (var j = start[1]; j <= end[1]; j++ ) {
    //     if (segment[i-start[0]][j-start[1]]) {
    //       this.drawOnDrawdown({
    //         x: j * dims.w,
    //         y: i * dims.h,
    //         i: i,
    //         j: j
    //       });
    //     }
    //   }
    // }

    // this.brush = oldBrush;
  }

  private drawCell(cx, i, j, type, val){

    var base_dims = this.render.getCellDims("base");
    var base_fill = this.render.getCellDims("base_fill");
    var color = "#333333";

    if(type =="drawdown"){
       color = this.weave.getColor(i);
       if (this.weave.isUp(i, j)) cx.fillStyle = color;
       else cx.fillStyle = "#FFFFFF";
    
    }else if(type=="threading"){
       if(val) cx.fillStyle = this.weave.getColorCol(j);
       else cx.fillStyle = "#FFFFFF"; 

    }else if(type=="treadling"){
      if(val) cx.fillStyle = this.weave.getColor(i);
      else cx.fillStyle = "#FFFFFF"; 
    }else if(type =="tieup"){
      if(val) cx.fillStyle = "#333333";
      else cx.fillStyle = "#FFFFFF"; 
    }

    cx.fillRect(j*base_dims.w + base_fill.x, i*base_dims.h + base_fill.y, base_fill.w, base_fill.h);


  }

  /**
   * Redraws one row to avoid drawing the entire canvas.
   * @extends WeaveDirective
   * @returns {void}
   */
  private redrawRow(y, i, cx) {
 
    // draw row

    for (var j = 0; j < this.weave.warps; j++) {
      this.drawCell(this.cx, i, j, "drawdown", null);
    }
  }

  //   /**
  //  * Redraws one row to avoid drawing the entire canvas.
  //  * @extends WeaveDirective
  //  * @returns {void}
  //  */
  private redrawCol(x, i,cx) {
    // var color = '#000000'

    // // Gets color of col.
    // color = this.weave.getColorCol(i);
    // cx.fillStyle = color;
  }


  
   /* Creates the selection overlay
   * @extends WeaveDirective
   * @returns {void}
   */
  private selectArea() {
    var left, top, x, y, anchor;

    var base_dims = this.render.getCellDims("base");

    x = base_dims.w / 4;
    y = base_dims.h;

    anchor = 'start';

    if (this.selection.start.x < this.selection.end.x) {
        x = this.selection.width -  base_dims.w/2;
        anchor = 'end';
     }

     if (this.selection.start.y < this.selection.end.y) {
       y = this.selection.height -  base_dims.h/2;
     }


    // define the left and top offsets
    left = Math.min(this.selection.start.x, this.selection.end.x);
    top = Math.min(this.selection.start.y, this.selection.end.y);

    
    var cx = this.selection.getTarget();
    var div = cx.parentElement;

    var rows = Math.ceil(this.selection.height / base_dims.h);
    var cols = Math.ceil(this.selection.width / base_dims.w);

    var fs = this.render.zoom * .18;
    var fw = this.render.zoom * 9;

    if(cx.id === "warp-systems"){

      d3.select(this.svgEl)
        .attr("width",this.selection.width)
        .attr("height",base_dims.h)
        .style('display', 'initial')
        .style('left', left + div.offsetLeft)
        .style('top', div.offsetTop);


      d3.select(this.svgEl)
        .select('text')
        .attr('fill', '#424242')
        .attr('font-weight', 900)
        .attr('font-size', fs)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', anchor)
        .text(cols);

    }else if(cx.id === "weft-systems"){
       d3.select(this.svgEl)
        .attr("width", base_dims.w)
        .attr("height",this.selection.height)
        .style('display', 'initial')
        .style('left', div.offsetLeft)
        .style('top', top+ div.offsetTop);

      // updates the text within the selection
      d3.select(this.svgEl)
        .select('text')
        .attr('fill', '#424242')
        .attr('font-weight', 900)
        .attr('font-size', fs)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', anchor)
        .text(rows);

    }else{
      // updates the size of the selection
      d3.select(this.svgEl)
        .attr("width", this.selection.width)
        .attr("height",this.selection.height)
        .style('display', 'initial')
        .style('left', left + div.offsetLeft)
        .style('top', top + div.offsetTop);

      // updates the text within the selection
      d3.select(this.svgEl)
        .select('text')
        .attr('fill', '#424242')
        .attr('font-weight', 900)
        .attr('font-size', fs)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', anchor)
        .text(cols +' x '+ rows);

    }


      

  }

  /// PUBLIC FUNCTIONS
  /**
   * Visualizes the path of the yarns within the weave.
   * @extends WeaveDirective
   * @returns {void}
   */
  public functional() {

    var base_dims = this.render.getCellDims("base");

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
        var y = ((i - 1) * base_dims.h) + base_dims.h/2;
        var r = this.weave.visibleRows[i - 1];
        first = true;
        for (var x = 0; x < this.weave.pattern[r].length; x++) {

          if (this.weave.isUp(i - 1,x)) {

            if (first && this.weave.rowShuttleMapping[r] === l) {
              this.cx.beginPath();
              this.cx.moveTo(x * base_dims.w + base_dims.w/4, y);
              this.cx.lineTo((x + 1)* base_dims.w - base_dims.w/4, y)
              first = false;
              if (s1 === null) {
                s1 = (x * base_dims.w) + base_dims.w/4;
                e1 = (x + 1) * base_dims.w - base_dims.w/4;
                py = y;
              } else {
                s2 = (x * base_dims.w) + base_dims.w/4;
                e2 = (x + 1) * base_dims.w - base_dims.w/4;
              }
            } else if (this.weave.rowShuttleMapping[r] === l) {
              this.cx.lineTo((x + 1) * base_dims.w - base_dims.w/4, y);

              if (py === y) {
                e1 = (x + 1) *  base_dims.w - base_dims.w/4;
              } else {
                e2 = (x + 1) * base_dims.w - base_dims.w/4;
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




 //draws any updates from a change in a part of the drawdown on the threading, tieup, and treadling
 //will update height if a new row/column is added but for zoom, call redrawLoomSize
  public drawLoomStates(updates) {

    var dims = this.render.getCellDims("base");
    var base_fill = this.render.getCellDims("base_fill");

    this.cxThreading.fillStyle = "#FF0000";
    this.cxTreadling.fillStyle = "#00FF00";
    this.cxTieups.fillStyle = "#0000FF";

    //check how many frames of the threading are in use
    for(var u in updates.threading){
       var max_frames = -1;
       if(updates.threading[u].i > max_frames) max_frames = updates.threading[u].i;
     }
    
    //if the new value in outside of the visible range, redraw the entire loom
    if((max_frames+1)*dims.h > (this.cxThreading.canvas.height)){ 
      this.redrawLoom();
      return;
    }

    for(var u in updates.threading){    
       if(updates.threading[u].val)  this.cxThreading.fillStyle = "#FF0000";
       else  this.cxThreading.fillStyle = "#ffffff";
       this.drawCell( this.cxThreading, updates.threading[u].i, updates.threading[u].j, "threading", updates.threading[u].val);
    }


    var max_treadles = -1;
    for(var u in updates.treadling){
       if(updates.treadling[u].j > max_treadles) max_treadles = updates.treadling[u].j;
    }

   
    if((max_treadles+1)*dims.w > this.cxTreadling.canvas.width){ 
      this.redrawLoom();
      return;
    }

    for(var u in updates.treadling){   
      this.drawCell( this.cxTreadling, updates.treadling[u].i, updates.treadling[u].j, "treadling", updates.treadling[u].val);
    }

    for(var u in updates.tieup){
      for(var j in updates.tieup[u]){
        this.drawCell( this.cxTieups, updates.tieup[u][j].i, updates.tieup[u][j].j, "tieup", updates.tieup[u][j].val);
      }
    }
  }


  //called on resize
  public redrawLoom() {

    var base_dims = this.render.getCellDims("base");

    this.cxThreading.canvas.width = base_dims.w * this.weave.loom.threading.length;
    this.cxThreading.canvas.height = base_dims.h * this.weave.loom.num_frames;
    this.drawGrid(this.cxThreading,this.threadingCanvas);

    this.cxTreadling.canvas.width = base_dims.w * this.weave.loom.num_treadles;
    this.cxTreadling.canvas.height = base_dims.h * this.weave.loom.treadling.length;
    this.drawGrid(this.cxTreadling,this.treadlingCanvas);

    this.cxTieups.canvas.width = base_dims.w * this.weave.loom.num_treadles;
    this.cxTieups.canvas.height = base_dims.h * this.weave.loom.num_frames;
    this.drawGrid(this.cxTieups,this.tieupsCanvas);

    // this.cxThreading.clearRect(0,0, this.cxThreading.canvas.width, this.cxThreading.canvas.height);
    // this.cxTreadling.clearRect(0,0, this.cxTreadling.canvas.width, this.cxTreadling.canvas.height);
    // this.cxTieups.clearRect(0,0, this.cxTieups.canvas.width, this.cxTieups.canvas.height);

    this.cxThreading.fillStyle = '#FF0000';
    this.cxTreadling.fillStyle = '#00FF00';
    this.cxTieups.fillStyle = '#0000FF';

    for (var j = 0; j < this.weave.loom.threading.length; j++) {
      this.drawCell(this.cxThreading, this.weave.loom.threading[j], j, "threading", true);
    }

    for (var i = 0; i < this.weave.loom.treadling.length; i++) {
       this.drawCell(this.cxTreadling, i, this.weave.loom.treadling[i], "treadling", true);
    }

    for (var i = 0; i < this.weave.loom.tieup.length; i++) {
      for(var j = 0; j < this.weave.loom.tieup[i].length; j++){
        if(this.weave.loom.tieup[i][j]){
          this.drawCell(this.cxTieups, i, j, "tieup", true);
        }
      }
    }

  }

//callled when frames become visible or drawdown without frame info is loaded
  public recomputeLoom(){
    var mock = [];
    var updates = [];
    console.log("recompute");

    //pretendd that we are computing the values as though they were added one by one
    for (var i = 0; i < this.weave.pattern.length; i++) {
        mock.push([]);
      for(var j = 0; j < this.weave.pattern[0].length; j++){
        mock[i].push(false);
      }
    }


    for (var i = 0; i < this.weave.pattern.length; i++) {
      for(var j = 0; j < this.weave.pattern[0].length; j++){
          if(this.weave.pattern[i][j]){
            mock[i][j] = this.weave.pattern[i][j];
            updates = this.weave.loom.updateFromDrawdown(i,j, mock);
            this.drawLoomStates(updates);
          }
      }
    }
  }


  

  /**
   * Redraws the entire canvas based on weave pattern.
   * @extends WeaveDirective
   * @returns {void}
   */
  public redraw() {
    var i,j;

    var base_dims = this.render.getCellDims("base");

    this.cx.canvas.width = base_dims.w * this.weave.pattern[0].length;
    this.cx.canvas.height = base_dims.h * this.weave.pattern.length;
    this.drawGrid(this.cx,this.canvasEl);
    this.drawWeftSystems(this.cxWeftSystems, this.weftSystemsCanvas);
    this.drawWarpSystems(this.cxWarpSystems, this.warpSystemsCanvas);

    var color = '#000000';
    this.cx.fillStyle = color;
    
      for (i = 0; i < this.weave.visibleRows.length; i++) {
        var row = this.weave.visibleRows[i];
        this.redrawRow(i * base_dims.h, i, this.cx);
      }

      for (j = 0; j < this.weave.pattern[0].length; j++) {
        var col = this.weave.colShuttleMapping[j];
        this.redrawCol(j, j*base_dims.h, this.cx);
      }
    
  }

  /**
   * Simulates the visual look of the weave pattern.
   * @extends WeaveDirective
   * @returns {void}
   */
  public simulate() {
    var base_dims = this.render.getCellDims("base");


    console.log("simulate");

    var color = '#000000';
    var offset;
    var height = this.weave.visibleRows.length *base_dims.h;

    this.cx.clearRect(0,0, this.canvasEl.width, this.canvasEl.height);

    this.cx.beginPath();
    this.cx.strokeStyle = "#FFFFFF"; // Green path
    this.cx.moveTo(0, 0);
    this.cx.lineTo(0, height);
    this.cx.stroke(); 


    //start by drawing warp rectangles
    for (var x = 0; x < this.weave.colShuttleMapping.length; x++) {
      var id = this.weave.colShuttleMapping[x];
      var c = this.weave.warp_systems[id].getColor();
      this.cx.fillStyle = c;
      this.cx.fillRect(x*base_dims.w, 0, base_dims.w, height);
      this.cx.strokeStyle = "#FFFFFF";
      
      this.cx.beginPath();
      this.cx.strokeStyle = "#FFFFFF"; 
      this.cx.moveTo((x+1)*base_dims.w, 0);
      this.cx.lineTo((x+1)*base_dims.w, height);
      this.cx.stroke(); // Draw it

    }

    for (var i = 0; i < this.weave.visibleRows.length; i++){
      var y = (i * base_dims.h);
      var r = this.weave.visibleRows[i];
      var weft_shuttle_id = this.weave.rowShuttleMapping[r];
      var weft_color = this.weave.shuttles[weft_shuttle_id].getColor();

      for (var x = 0; x < this.weave.pattern[r].length; x++) {


        if (!this.weave.isUp(i,x)) {
          this.cx.fillStyle = weft_color;
          this.cx.fillRect(x*base_dims.w, y, base_dims.w, base_dims.h);
          this.cx.beginPath();
          this.cx.strokeStyle = "#FFFFFF"; // Green path
          this.cx.moveTo(x*base_dims.w, y);
          this.cx.lineTo((x+1)*base_dims.w, y);
          this.cx.stroke(); // Draw it

          this.cx.beginPath();
          this.cx.strokeStyle = "#FFFFFF"; // Green path
          this.cx.moveTo(x*base_dims.w, y+base_dims.h);
          this.cx.lineTo((x+1)*base_dims.w, y+base_dims.h);
          this.cx.stroke(); // Draw it
        }
      }

    }


    this.cx.strokeStyle = "#000";
  }

  /**
   * Resizes and then redraws the canvas on a change to the wefts or warps. 
   * @extends WeaveDirective
   * @returns {void}
   */
  // public updateSize() {
  //   var base_dims = this.render.getCellDims("base");

  //   // set the updated width and height
  //   this.canvasEl.width = this.weave.warps * base_dims.h;
  //   this.canvasEl.height = this.weave.visibleRows.length * base_dims.w;
  // }



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

    for( i = 0; i < b.height; i++) {
      for( j=0; j < b.width; j++) {
        let up = draft[i][j];
        if(up) {
          context.fillRect(j,i,1,1)
        }
      }
    }

    let link = obj.downloadLink.nativeElement;

    link.href = CanvasToBMP.toDataURL(b);
    link.download = fileName + ".bmp";
  }

  /**
   * Saves the draft as a .ada file
   * @extends WeaveDirective
   * @param {string} fileName - name to save file as
   * @returns {void}
   */
  public saveADA(fileName, obj) {


    console.log("save ADA", this.weave);

    var theJSON = JSON.stringify(this.weave);
    console.log(theJSON);
    var uri = "data:application/json;charset=UTF-8," + encodeURIComponent(theJSON);
    console.log(uri);
    let link = obj.downloadLink.nativeElement;
    link.href = uri;
    link.download = fileName + ".ada";
  }

  // // History
  // private onAdd(segment: DraftSegment) {
  //   this.store.dispatch(new AddAction(segment));
  // }

}
