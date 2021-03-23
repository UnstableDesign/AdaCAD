import { Directive, ElementRef, ViewChild, HostListener, Input, Renderer2 } from '@angular/core';

import { Observable, Subscription, fromEvent, from } from 'rxjs';
import * as d3 from "d3";
import {cloneDeep, now} from 'lodash';

import { Draft } from '../model/draft';
import { Render } from '../model/render';
import { Loom } from '../model/loom';
import { Cell } from '../model/cell';
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

  @Input('timeline') timeline:any;



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


  cxWarpMaterials: any;
  cxWeftMaterials: any;


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



  weftMaterialsCanvas: HTMLCanvasElement;
  warpMaterialsCanvas: HTMLCanvasElement;

  // private segments$: Observable<DraftSegment[]>;
  private prevSegment = null;
  private currSegment = null;

  private tempPattern: Array<Array<boolean>>;
  private segment: DraftSegment;
  private unsubscribe$ = new Subject();

  private lastPos: Point;
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
    //this.segments$ = this.store.pipe(select(selectAll));
    // define the elements and context of the weave draft, threading, treadling, and tieups.
    this.canvasEl = this.el.nativeElement.children[12].firstElementChild;
    //this.divEl = this.el.nativeElement.children[3];

    //this is the selection
    this.svgEl = this.el.nativeElement.children[9];
    
    this.threadingCanvas = this.el.nativeElement.children[10].firstElementChild;
    this.tieupsCanvas = this.el.nativeElement.children[11].firstElementChild;
    this.treadlingCanvas = this.el.nativeElement.children[13].firstElementChild;
   
    this.weftSystemsCanvas = this.el.nativeElement.children[1].firstElementChild;
    this.weftMaterialsCanvas = this.el.nativeElement.children[2].firstElementChild;
    this.warpSystemsCanvas = this.el.nativeElement.children[4].firstElementChild;
    this.warpMaterialsCanvas = this.el.nativeElement.children[5].firstElementChild;
    
    this.cx = this.canvasEl.getContext('2d');
    this.cxThreading = this.threadingCanvas.getContext('2d');
    this.cxTreadling = this.treadlingCanvas.getContext('2d');
    this.cxTieups = this.tieupsCanvas.getContext('2d');
    this.cxWarpSystems = this.warpSystemsCanvas.getContext('2d');
    this.cxWeftSystems = this.weftSystemsCanvas.getContext('2d');
    this.cxWarpMaterials = this.warpMaterialsCanvas.getContext('2d');
    this.cxWeftMaterials = this.weftMaterialsCanvas.getContext('2d');
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
    this.weftMaterialsCanvas.width =  dims.w;
    this.weftMaterialsCanvas.height = this.weave.wefts * dims.h;

    this.warpSystemsCanvas.width =  this.weave.warps * dims.w;
    this.warpSystemsCanvas.height = dims.h;
    this.warpMaterialsCanvas.width =  this.weave.warps * dims.w;
    this.warpMaterialsCanvas.height = dims.h;


    this.addHistoryState();

    // Set up the initial grid.
    this.redraw();
    this.redrawLoom();

    // make the selection SVG invisible using d3
    d3.select(this.svgEl).style('display', 'none');

    // this.store.pipe(select(getCurrentDraft), takeUntil(this.unsubscribe$)).subscribe(undoredo => {
    //   this.prevSegment = this.currSegment;
    //   this.currSegment = undoredo;
    // });
  }

  /**
   * 
   */
   ngOnDestroy() {
     this.removeSubscription();
   }

  setPosAndDraw(target, currentPos:Point){

      if (target && target.closest('.treadling-container')) {
        currentPos.i = this.weave.visibleRows[currentPos.i];
        this.drawOnTreadling(currentPos);
      } else if (target && target.closest('.tieups-container')) {
        currentPos.i = this.weave.loom.frame_mapping[currentPos.i];
        this.drawOnTieups(currentPos);
      } else if (target && target.closest('.threading-container')) {
        currentPos.i = this.weave.loom.frame_mapping[currentPos.i];
        this.drawOnThreading(currentPos);
      } else if(target && target.closest('.weft-systems')){
        currentPos.i = this.weave.visibleRows[currentPos.i];
        this.drawOnWeftSelectors(currentPos);
      }else if(target && target.closest('.warp-systems')){
        this.drawOnWarpSelectors(currentPos);
      }else if(target && target.closest('.weft-materials')){
        currentPos.i = this.weave.visibleRows[currentPos.i];
        this.drawOnWeftMaterials(currentPos);
      }else if(target && target.closest('.warp-materials')){
        this.drawOnWarpMaterials(currentPos);
      } else{
        currentPos.i = this.weave.visibleRows[currentPos.i];
        this.drawOnDrawdown(currentPos);
      }
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
      var screen_row = Math.floor((event.offsetY + offset.y) / dims.h);
      
      const currentPos: Point = {
        si: screen_row,
        i: screen_row, //row
        j: Math.floor((event.offsetX + offset.x) / dims.w), //col
      };

      // Save temp pattern
      this.tempPattern = cloneDeep(this.weave.pattern);

      switch (this.brush) {
        case 'invert':
        case 'point':
        case 'erase':
          this.setPosAndDraw(event.target, currentPos);

          break;
        case 'maskpoint':
        case 'maskerase':
        case'maskinvert':
          this.drawOnMask(currentPos);
          break;
        case 'select':

          if(event.shiftKey){

            this.selection.end = currentPos;
            this.selection.setParameters();
            this.selectArea();

          }else{


            this.selection.start = currentPos;
            this.selection.end = currentPos;
            this.selection.width = 0;
            this.selection.height = 0;

            d3.select(this.svgEl).style('display', 'none');

            if (event.target && event.target.closest('.treadling-container')) {
              this.selection.setTarget(this.treadlingCanvas);
              this.selection.start.j = 0;
              this.selection.width = this.weave.loom.num_treadles;

            } else if (event.target && event.target.closest('.tieups-container')) {
              this.selection.setTarget(this.tieupsCanvas);
            } else if (event.target && event.target.closest('.threading-container')) {
              this.selection.setTarget(this.threadingCanvas);

              this.selection.start.i = 0;
              this.selection.start.si = 0;
              this.selection.height = this.weave.loom.num_frames;


            } else if(event.target && event.target.closest('.weft-systems')){
              this.selection.width = 1;
              this.selection.setTarget(this.weftSystemsCanvas);
            }else if(event.target && event.target.closest('.warp-systems')){
              this.selection.setTarget(this.warpSystemsCanvas);
              this.selection.height = 1;
            } else if(event.target && event.target.closest('.weft-materials')){
              this.selection.width = 1;
              this.selection.setTarget(this.weftMaterialsCanvas);
            }else if(event.target && event.target.closest('.warp-materials')){
              this.selection.setTarget(this.warpMaterialsCanvas);
              this.selection.height = 1;
            } else{
              this.selection.setTarget(this.canvasEl);
            }
          }
          break;
          default:
          break;
      }



      this.lastPos = {
        si: currentPos.si,
        i: currentPos.i, //row
        j: currentPos.j //col
      };
      // this.segment = {
      //   start: [currentPos.si, currentPos.i, currentPos.j],
      //   end: [currentPos.si, currentPos.i, currentPos.j],
      //   pattern: null,
      //   id: generateId(),
      // }
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
    var screen_row = Math.floor((event.offsetY + offset.y) / dims.h);

    const currentPos: Point = {
      si: screen_row,
      i:  screen_row,
      j:  Math.floor((event.offsetX + offset.x) / dims.w)
    };


    // determine action based on brush type. invert inactive on move.
    switch (this.brush) {
      case 'point':
      case 'erase':

        if(!(this.lastPos.i === currentPos.i && this.lastPos.j === currentPos.j)){
            this.setPosAndDraw(event.target, currentPos);
          }
        break;

      case 'maskpoint':
      case 'maskerase':
      case'maskinvert':
        this.drawOnMask(currentPos);
        break;
      case 'select':
        this.selection.end = currentPos;


        if (event.target && event.target.closest('.treadling-container')) {
          this.selection.end.j = this.weave.loom.num_treadles;
        }else if(event.target && event.target.closest('.threading-container')){
          this.selection.end.i = this.weave.loom.num_frames;
          this.selection.end.si = this.weave.loom.num_frames;
        }


        this.selection.setParameters();
        this.selectArea();


        break;
      case 'invert':
      default:
        break;
    }

    // var i = currentPos.i, j = currentPos.j, si = currentPos.si;
    // if (this.segment.start[0] > si) this.segment.start[0] = si;    
    // if (this.segment.start[1] > i) this.segment.start[1] = i;
    // if (this.segment.start[2] > j) this.segment.start[2] = j;
    // if (this.segment.end[0] < si) this.segment.end[0] = si;
    // if (this.segment.end[1] < i) this.segment.end[1] = i;
    // if (this.segment.end[2] < j) this.segment.end[2] = j;
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
     this.lastPos = {
      si: -1,
      i: -1,
      j: -1
     }

    // remove subscription unless it is leave event with select.
    if (!(event.type === 'mouseleave' && this.brush === 'select')) {
      this.removeSubscription();

      // if (event.type === 'mouseup' && this.brush != 'select' && this.segment !== undefined) {
      //   let segmentPattern = [];

      //   for (var i = this.segment.start[1]; i < this.segment.end[1] + 1; i++) {
      //     segmentPattern.push([])
      //     var index = i - this.segment.start[1];
      //     for (var j = this.segment.start[2]; j < this.segment.end[2] + 1; j++) {
      //       var past, present;
      //       past = this.tempPattern[i][j];
      //       present = this.weave.pattern[i][j];
      //       segmentPattern[index].push(past ? !present : present)
      //     }
      //   }
      //   this.segment.pattern = segmentPattern;
      //   //this.onAdd(this.segment);
      // }
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
   * Creates the copied pattern. Hack for warp and weft shuttles is that it creates a 2d arrray representing the 
   * threading or treadling with "true" in the frame/threadle associated with that col/row. 
   * @extends WeaveDirective
   * @returns {void}
   */
  private copyArea() {



    var dims = this.render.getCellDims("copy");

    const screen_i = Math.min(this.selection.start.si, this.selection.end.si);    
    const draft_i = Math.min(this.selection.start.i, this.selection.end.i);
    const draft_j = Math.min(this.selection.start.j, this.selection.end.j);
    

    var w = this.selection.width;
    var h = this.selection.height;


    var copy = [];
     
    if(this.selection.target.id === 'weft-systems'){
      for(var i = 0; i < h; i++){
        copy.push([]);
        for(var j = 0; j < this.weave.weft_systems.length; j++){
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
    }else if(this.selection.target.id === 'weft-materials'){
      for(var i = 0; i < h; i++){
        copy.push([]);
        for(var j = 0; j < this.weave.shuttles.length; j++){
          copy[i].push(false);
        }
      }
    }else if(this.selection.target.id === 'warp-materials'){
      for(var i = 0; i < this.weave.shuttles.length; i++){
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


    //iterate through the selection
    for (var i = 0; i < copy.length; i++) {
      for(var j = 0; j < copy[0].length; j++) {

        var screen_row = screen_i + i;
        var draft_row = this.weave.visibleRows[screen_row];
        var col = draft_j + j;

        switch(this.selection.target.id){
          case 'drawdown':
              copy[i][j]= this.weave.isUp(draft_row, col);
          break;
          case 'threading':
              var frame = this.weave.loom.frame_mapping[screen_row];
              copy[i][j]= this.weave.loom.isInFrame(col,frame);

          break;
          case 'treadling':
              copy[i][j] = this.weave.loom.isInTreadle(screen_row,col);
          break;
          case 'tieups':
              var frame = this.weave.loom.frame_mapping[screen_row];
              copy[i][j] = this.weave.loom.hasTieup(frame, col);;
          break;  
          case 'warp-systems':
              copy[i][j]= (this.weave.colSystemMapping[col] == i);
          break;
          case 'weft-systems':
              copy[i][j]= (this.weave.rowSystemMapping[draft_row] == j);
          break;
          case 'warp-materials':
              copy[i][j]= (this.weave.colShuttleMapping[col] == i);
          break;
          case 'weft-materials':
              copy[i][j]= (this.weave.rowShuttleMapping[draft_row] == j);
          break;
          default:
          break;
        }

      }
    }

    this.copy = copy;


  }





  private drawWeftMaterialCell(cx, i){
        var dims = this.render.getCellDims("base");
        var margin = this.render.zoom/50;

        cx.fillStyle = this.weave.getColor(i);

        if(i == this.weave.wefts-1) cx.fillRect(margin, (dims.h*i)+margin, dims.w, dims.h-(margin*2));
        else cx.fillRect(margin, (dims.h*i)+margin, dims.w, dims.h-(margin));
  
  }


  private drawWeftMaterials(cx, canvas){

      var dims = this.render.getCellDims("base");
      var margin = this.render.zoom/50;
      var top = dims.h;

      cx.clearRect(0,0, cx.canvas.width, cx.canvas.height);


      canvas.width =  dims.w;
      canvas.height = this.weave.visibleRows.length * dims.h;

      cx.fillStyle = "white";
      cx.fillRect(0,0,canvas.width,this.weave.visibleRows.length*dims.h);

      for(var i = 0 ; i < this.weave.visibleRows.length; i++){
          this.drawWeftMaterialCell(cx, i);        
      }


  }

  private drawWarpMaterialCell(cx, j){


        var dims = this.render.getCellDims("base");
        var margin = this.render.zoom/50;
        cx.fillStyle = this.weave.getColorCol(j);

        if(j == this.weave.warps-1) cx.fillRect((dims.w*j)+margin, 0, dims.w-(margin*2), (dims.h) - margin);
        else cx.fillRect( (dims.w*j)+margin, 0, dims.w-margin, (dims.h) - margin);
  
  }


  private drawWarpMaterials(cx,canvas){

    var dims = this.render.getCellDims("base");
    var margin = this.render.zoom/50;

    this.warpMaterialsCanvas.width =  this.weave.warps * dims.w;
    this.warpMaterialsCanvas.height = dims.h;

    cx.fillStyle = "white";
    cx.fillRect(0,0,canvas.width,canvas.height);
  

    for(var j = 0; j < this.weave.warps; j++){
      this.drawWarpMaterialCell(cx, j);
    } 

  }




  private drawWeftSelectorCell(cx, i){

        var dims = this.render.getCellDims("base");
        var margin = this.render.zoom/50;

        cx.fillStyle = "#303030";
        if(i == this.weave.wefts-1) cx.fillRect(margin, (dims.h*i)+margin, dims.w, dims.h-(margin*2));
        else cx.fillRect(margin, (dims.h*i)+margin, dims.w, dims.h-(margin));
         
         cx.fillStyle = "#ffffff";  
         cx.font = "14px Arial";
         cx.fillText(this.weave.getWeftSystemCode(i), dims.w/3, (dims.h*i)+3*dims.h/4);

  }


  private drawWeftSystems(cx, canvas){

    

      var dims = this.render.getCellDims("base");
      var margin = this.render.zoom/50;
      var top = dims.h;

      cx.clearRect(0,0, cx.canvas.width, cx.canvas.height);


      canvas.width =  dims.w;
      canvas.height = this.weave.visibleRows.length * dims.h;

      cx.fillStyle = "white";
      cx.fillRect(0,0,canvas.width,this.weave.visibleRows.length*dims.h);

      for(var i = 0 ; i < this.weave.visibleRows.length; i++){
          this.drawWeftSelectorCell(cx, i);        
      }


  }

  private drawWarpSelectorCell(cx, j){


        var dims = this.render.getCellDims("base");
        var margin = this.render.zoom/50;
        cx.fillStyle = "#303030";

        if(j == this.weave.warps-1) cx.fillRect((dims.w*j)+margin, 0, dims.w-(margin*2), (dims.h) - margin);
        else cx.fillRect( (dims.w*j)+margin, 0, dims.w-margin, (dims.h) - margin);
  
         cx.fillStyle = "#ffffff";  
         cx.font = "14px Arial";
         cx.fillText(this.weave.getWarpSystemCode(j),(dims.w*j)+dims.w/3, dims.w-(margin*3));


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

  }

  /**
   * Draws the grid lines onto the canvas.
   * @extends WeaveDirective
   * @returns {void}
   */
  private drawGrid(cx,canvas) {
    var i,j;

    var dims = this.render.getCellDims("base");
    cx.fillStyle = "white";
    cx.fillRect(0,0,canvas.width,canvas.height);

    cx.fillStyle = "#cccccc";
    if(canvas.id=== "threading"){
      cx.fillRect(0, 0, canvas.width, (this.weave.loom.num_frames - this.weave.loom.min_frames)*dims.h);
    }
    else if (canvas.id=== "treadling"){
      var start = this.weave.loom.min_treadles * dims.w;
      cx.fillRect(start, 0, canvas.width - start, canvas.height);

    }
    else if (canvas.id=== "tieups"){
      var start = this.weave.loom.min_treadles * dims.w;
      cx.fillRect(start, 0, canvas.width - start, canvas.height);
      cx.fillRect(0, 0, canvas.width, (this.weave.loom.num_frames - this.weave.loom.min_frames)*dims.h);

    }


    cx.fillStyle="black";
    cx.lineWidth = 2;
    cx.lineCap = 'round';
    cx.strokeStyle = '#000';

    //only draw the lines if the zoom is big enough to render them well
    if(this.render.zoom > 25){

     cx.lineWidth = this.render.zoom/50;

     cx.setLineDash([dims.w/20,dims.w/4]);

      // draw vertical lines
      for (i = 0; i <= canvas.width; i += dims.w) {
        if(canvas.id === "treadling" && i === (this.weave.loom.min_treadles)*dims.w) cx.setLineDash([0]);
        else if(canvas.id === "tieups" && i === (this.weave.loom.min_treadles)*dims.w) cx.setLineDash([0]);
        else  cx.setLineDash([dims.w/20,dims.w/4]);
        cx.beginPath();
        cx.moveTo(i, 0);
        cx.lineTo(i, canvas.height);
        cx.stroke();

      }

      // draw horizontal lines
      for (i = 0; i <= canvas.height; i += dims.h) {
        if(canvas.id === "threading" && i === (this.weave.loom.num_frames - this.weave.loom.min_frames)*dims.h) cx.setLineDash([0]);
        else if(canvas.id === "tieups" && i === (this.weave.loom.num_frames - this.weave.loom.min_frames)*dims.h) cx.setLineDash([0]);
        else  cx.setLineDash([dims.w/20,dims.w/4]);

        cx.beginPath();
        cx.moveTo(0, i);
        cx.lineTo(canvas.width, i);
        cx.stroke();
      }


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
  private drawOnWeftSelectors( currentPos: Point ) {
    var dims = this.render.getCellDims("base");

    var updates;

    if (!this.cx || !currentPos) { return; }

    var draft_row = currentPos.i; //need to offset this due to canvas padding
    var screen_row = currentPos.si;

    if(screen_row < 0){ return; }

    const len = this.weave.weft_systems.length;
    var system_id = this.weave.rowSystemMapping[draft_row];


    var newSystem = (system_id + 1) % len;

    this.weave.rowSystemMapping[draft_row] = newSystem;

    this.weave.updateSystemVisibility('weft');

    this.addHistoryState();

    this.redraw();
  }


    /**
   * Change shuttle of row to next in list.
   * @extends WeaveComponent
   * @param {Point} the point of the interaction
   * @returns {void}
   */
  private drawOnWeftMaterials( currentPos: Point ) {

    var dims = this.render.getCellDims("base");
    var updates;

    if (!this.cx || !currentPos) { return; }

    var draft_row = currentPos.i; //need to offset this due to canvas padding
    var screen_row = currentPos.si;

    if(screen_row < 0){ return; }

    const len = this.weave.shuttles.length;
    var shuttle_id = this.weave.rowShuttleMapping[draft_row];


    var newShuttle = (shuttle_id + 1) % len;

    this.weave.rowShuttleMapping[draft_row] = newShuttle;

    this.addHistoryState();

    this.redraw();
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
    var system_id = this.weave.colSystemMapping[col];
    var newSys_id = (system_id + 1) % len;
    this.weave.colSystemMapping[col] = newSys_id;

    this.weave.updateSystemVisibility('warp');
    this.drawWarpSelectorCell(this.cxWarpSystems,(col));
    this.addHistoryState();
    this.redraw();
  }


  /**
   * Change column to next row in the list
   * @extends WeaveComponent
   * @param {Point} the point of the interaction
   * @returns {void}
   */
  private drawOnWarpMaterials( currentPos: Point ) {

    var dims = this.render.getCellDims("base");

    if (!this.cxWarpSystems || !currentPos) { return; }

    var col = currentPos.j; //need to offset this due to canvas padding

    if(col < 0){ return; }


    const len = this.weave.shuttles.length;
    var shuttle_id = this.weave.colShuttleMapping[col];

    var newShuttle_id = (shuttle_id + 1) % len;


    this.weave.colShuttleMapping[col] = newShuttle_id;
    this.drawWarpSelectorCell(this.cxWarpMaterials,(col));
    this.addHistoryState();
    this.redraw();
  }

 /**
   * Draws, inverts, or erases a single rectangle on the mask. 
   * @extends WeaveDirective
   * @param {Point} currentPos - the current position of the mouse within draft.
   * @returns {void}
   */
  private drawOnMask( currentPos: Point ) {
    var updates;
    var val;

    if (!this.cx || !currentPos) { return; }

    // Set the heddles based on the brush.
    switch (this.brush) {
      case 'maskpoint':
        val = true;
        break;
      case 'maskerase':
        val = false;
        break;
      case 'maskinvert':
         val = !this.weave.isMask(currentPos.i,currentPos.j);
        break;        
      default:
        break;
    }

    this.weave.setMask(currentPos.i,currentPos.j,val);
    this.drawCell(this.cx,currentPos.si, currentPos.j, "mask");
    this.redraw();
  }





  /**
   * Called when a single point "draw" event is called on the
   * @extends WeaveDirective
   * @param {Point} currentPos - the current position of the mouse within draft.
   * @returns {void}
   */

  private drawOnDrawdown( currentPos: Point) {

    var updates;
    var val  = false;



    if (!this.cx || !currentPos) { return; }


    if(this.weave.hasCell(currentPos.i, currentPos.j)){

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
      this.updateLoomFromDraft(currentPos);

    //   if(this.render.getCurrentView() == 'pattern'){
    //      this.drawCell(this.cx,currentPos.si, currentPos.j, "drawdown");
    //    }else{
    //      this.redraw();
    //    }
    }

    //do this here to make sure of efficient usage
    var u_threading = this.weave.loom.updateUnused(this.weave.loom.threading, this.weave.loom.min_frames, this.weave.loom.num_frames, "threading");
    var u_treadling = this.weave.loom.updateUnused(this.weave.loom.treadling, this.weave.loom.min_treadles, this.weave.loom.num_treadles, "treadling");
    
    this.addHistoryState();
    this.redraw();
    this.redrawLoom();

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
    
    updates = this.weave.loom.updateTieup(currentPos.i, currentPos.j, val);
    this.weave.updateDraftFromTieup(updates);
    //this.drawCell(this.cxTieups, currentPos.i, currentPos.j, "tieup");
    this.addHistoryState();
    this.redraw();
    this.redrawLoom();
    
    }
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

  
      var updates = this.weave.loom.updateThreading(currentPos.i, currentPos.j, val);
      this.weave.updateDraftFromThreading(updates);
      
      if(this.weave.loom.min_frames < this.weave.loom.num_frames){
        this.weave.loom.updateUnused(this.weave.loom.threading, this.weave.loom.min_frames, this.weave.loom.num_frames, "threading")
      }  

      this.addHistoryState();
      this.redrawLoom();
      this.redraw();

      //temporarily disabled, as it causes errors, for now, just redraw the whole state
      // for(var u in updates){
      //   this.drawCell(this.cxThreading,updates[u].i, updates[u].j, "threading");
      // }
          
     // if(unused) this.redrawLoom();

    }
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
          val = !(this.weave.loom.treadling[currentPos.i] === currentPos.j);
          break;
        default:
          break;
      }


      //this updates the value in the treadling
      var updates = this.weave.loom.updateTreadling(currentPos.i, currentPos.j, val);
      this.weave.updateDraftFromTreadling(updates);

      // for(var u in updates){
      //   this.drawCell(this.cxTreadling,updates[u].i, updates[u].j, "treadling");
      // }
      if( this.weave.loom.min_treadles <  this.weave.loom.num_treadles){
        this.weave.loom.updateUnused(this.weave.loom.treadling, this.weave.loom.min_treadles, this.weave.loom.num_treadles, "treadling")
      }
      //if(unused) this.redrawLoom();
      this.addHistoryState();
      this.redrawLoom();
      this.redraw();

    }
   }

   /***
   This function takes a point added to the draft and updates and redraws the loom states
   It takes current position of a point on the currently visible draft
   ***/
   private updateLoomFromDraft(currentPos){

    if(this.render.view_frames){

      var updates = this.weave.loom.updateFromDrawdown(currentPos.i,currentPos.j, this.weave.pattern);
      
      var u_threading = this.weave.loom.updateUnused(this.weave.loom.threading, this.weave.loom.min_frames, this.weave.loom.num_frames, "threading");
      var u_treadling = this.weave.loom.updateUnused(this.weave.loom.treadling, this.weave.loom.min_treadles, this.weave.loom.num_treadles, "treadling");
     
      this.redrawLoom();
      
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

    console.log("fill area called");
    console.log(selection, pattern, type);

    var dims = this.render.getCellDims("base");
    var updates = [];
    
    var screen_i = Math.min(selection.start.si, selection.end.si)
    const draft_i = Math.min(selection.start.i, selection.end.i);
    const draft_j = Math.min(selection.start.j, selection.end.j);

  
    const rows = pattern.length;
    const cols = pattern[0].length;

    var w,h;

    w = Math.ceil(selection.width);
    h = Math.ceil(selection.height);


    if(selection.target.id === "warp-systems"){
      h = pattern.length;
      screen_i = 0;
    } 
    if(selection.target.id === "weft-systems"){
      w = pattern[0].length;
    } 

    if(selection.target.id === "warp-materials"){
       h = pattern.length;
       screen_i = 0;
    }
    if(selection.target.id === "weft-materials"){
      w = pattern[0].length;
    } 

    //cycle through each visible row/column of the selection
    for (var i = 0; i < h; i++ ) {
      for (var j = 0; j < w; j++ ) {

        var row = i + screen_i;
        var col = j + draft_j;


        var temp = pattern[i % rows][j % cols];
       
        var prev = false; 
        switch(selection.target.id){

          case 'drawdown':

              var draft_row = this.weave.visibleRows[row];
              prev = this.weave.pattern[draft_row][col].isUp();

          break;
          case 'threading':
              var frame = this.weave.loom.frame_mapping[row];
              prev = this.weave.loom.isInFrame(col, frame);
          
          break;
          case 'treadling':
              var draft_row = this.weave.visibleRows[row];
              prev = (this.weave.loom.isInTreadle(draft_row, col)); 
          break;
          case 'tieups':
              var frame = this.weave.loom.frame_mapping[row];
              prev = this.weave.loom.hasTieup(frame,col); 
          
          break;
          default:
          break;
        }

        if (prev !== null){

          var val = false;
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
           var draft_row = this.weave.visibleRows[row];

            if(this.weave.hasCell(draft_row,col)){

                var p = new Point(); 
                p.si = row;
                p.i = this.weave.visibleRows[row];
                p.j = col;
              
                this.weave.setHeddle(p.i,p.j,val);
                this.updateLoomFromDraft(p);
              }

            break;
            
            case 'threading':
            var frame = this.weave.loom.frame_mapping[row];

              if(this.weave.loom.inThreadingRange(frame,col)){ 
                updates = this.weave.loom.updateThreading(frame, col, val);
                this.weave.updateDraftFromThreading(updates); 
              }
            break;

            case 'treadling':
              
             var draft_row = this.weave.visibleRows[row];
             if(this.weave.loom.inTreadlingRange(draft_row,col)){ 
                updates = this.weave.loom.updateTreadling(draft_row, col, val);
                this.weave.updateDraftFromTreadling(updates);
              }
            break;
            case 'tieups':
              var frame = this.weave.loom.frame_mapping[row];

              if(this.weave.loom.inTieupRange(frame, col)){
                updates = this.weave.loom.updateTieup(frame, col, val);
                this.weave.updateDraftFromTieup(updates);
              }
            break;
            case 'weft-systems':
              var draft_row = this.weave.visibleRows[row];
              val = pattern[i % rows][j % cols];
              if(val && col < this.weave.weft_systems.length) this.weave.rowSystemMapping[draft_row] = col;
            
            break;
            case 'warp-systems':
              val = pattern[i % rows][j % cols];
              if(val && row < this.weave.warp_systems.length){
                  this.weave.colSystemMapping[col] = row;
              }
            break;
            case 'weft-materials':
              var draft_row = this.weave.visibleRows[row];
              val = pattern[i % rows][j % cols];
              if(val && col < this.weave.shuttles.length) this.weave.rowShuttleMapping[draft_row] = col;
            
            break;
            case 'warp-materials':
              val = pattern[i % rows][j % cols];
              if(val && row < this.weave.shuttles.length){
                  this.weave.colShuttleMapping[col] = row;
              }
            break;
            default:
            break;
          }
        }


      }
    }

    var u_threading = this.weave.loom.updateUnused(this.weave.loom.threading, this.weave.loom.min_frames, this.weave.loom.num_frames, "threading");
    var u_treadling = this.weave.loom.updateUnused(this.weave.loom.treadling, this.weave.loom.min_treadles, this.weave.loom.num_treadles, "treadling");
    this.addHistoryState();
    this.redraw();
    this.redrawLoom();

  }



  /**
   * Fills the visible regions of the mask with the stitch
   * @extends WeaveDirective
   * @param {Array<Array<boolean>>} - the pattern used to fill the area.
   * @returns {void}
   */


  private maskArea(pattern: Array<Array<boolean>>) {
   

    // var dims = this.render.getCellDims("base");
    // var updates = [];

    // const rows = pattern.length;
    // const cols = pattern[0].length;


    // //iterate through cell
    // for (var i = 0; i < this.weave.pattern.length; i++ ) {
    //   for (var j = 0; j < this.weave.pattern[0].length; j++ ) {
        
    //     var row = this.weave.visibleRows[i];
    //     var col = j;
    //     var temp = pattern[i % rows][j % cols];
    //     var prev = this.weave.mask[row][col];
    //     var val = temp && prev;

    //     var p = new Point(); 
    //     p.i = row;
    //     p.j = col;
        
    //     this.weave.setHeddle(p.i,p.j,val);
    //     this.drawCell(this.cx,p.i, p.j, "drawdown");
    //   }
    // }

   // this.redraw();

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


//This function draws whatever the current value is at screen coordinates cell i, J
  private drawCell(cx, i, j, type){

    var base_dims = this.render.getCellDims("base");
    var base_fill = this.render.getCellDims("base_fill");
    var has_mask = false;
    var is_up = false;
    var color = "#FFFFFF";
    var beyond = false;


    switch(type){
      case 'drawdown':
      case 'mask':
        var row = this.weave.visibleRows[i];
        
        is_up = this.weave.isUp(row,j);
        has_mask = this.weave.isMask(row,j);

        if(is_up) color = "#333333";
        else if(has_mask) color = "#CCCCCC";
      break;
      case 'threading':
        var frame = this.weave.loom.threading[j];
        is_up = (frame == i);
        beyond = frame > this.weave.loom.min_frames; 
        has_mask = false;
        
        if(is_up)  color = "#333333";
        i = this.weave.loom.frame_mapping[frame];

      break;
      case 'tieup':
        is_up = (this.weave.loom.tieup[i][j]);
        beyond = i > this.weave.loom.min_frames; 
        has_mask = false;
        if(is_up) color = "#333333";
        i = this.weave.loom.frame_mapping[i];


      break;
      case 'treadling':
        //i and j is going to come from the UI which is only showing visible rows
        var row = this.weave.visibleRows[i];
        beyond = this.weave.loom.treadling[row] > this.weave.loom.min_treadles; 
        is_up = (this.weave.loom.treadling[row] == j);
        has_mask = false;
        if(is_up)  color = "#333333";

      break;

    }

     //cx.fillStyle = color;
     cx.fillStyle = color;
     cx.fillRect(j*base_dims.w + base_fill.x, i*base_dims.h + base_fill.y, base_fill.w, base_fill.h);


  }

  /**
   * Redraws one row to avoid drawing the entire canvas.
   * @extends WeaveDirective
   * @returns {void}
   */
  private redrawRow(y, i, cx) {
 
    for (var j = 0; j < this.weave.warps; j++) {
      this.drawCell(this.cx, i, j, "drawdown");
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
    
     var base_dims = this.render.getCellDims("base");
     this.redrawSelection(base_dims);

      

  }

  

  /// PUBLIC FUNCTIONS
  /**
   * Visualizes the path of the yarns within the weave.
   * @extends WeaveDirective
   * @returns {void}
   */
  public redrawYarnView(schematic) {

    var base_dims = this.render.getCellDims("base");
    this.cx.setLineDash([0]);

    for (var l = 0; l < this.weave.shuttles.length; l++) {
      // Each shuttle.
     
      this.cx.lineCap = 'square';
      var first = true;
      var left = !this.weave.shuttles[l].insert;
      var py = null;
      var s,e;
      var s1 = null;
      var s2 = null;
      var e1 = null;
      var e2 = null;



      for (var i = this.weave.visibleRows.length; i > 0 ; i--) {
        //this is the row_id
        var r = this.weave.visibleRows[i - 1];

        var shuttle_id = this.weave.rowShuttleMapping[r];
        var shuttle = this.weave.shuttles[shuttle_id];

        if(shuttle.type > 0 || !schematic){
          this.cx.strokeStyle = shuttle.getColor();
        }else{
          this.cx.strokeStyle = shuttle.getColor()+"10";
        }



        this.cx.lineWidth = 7*base_dims.h/8 * shuttle.getThickness()/100;
        var y = ((i - 1) * base_dims.h) + base_dims.h/2;
        first = true;
        for (var x = 0; x < this.weave.pattern[r].length; x++) {

          if (this.weave.isUp(i - 1,x)) {

            //make sure this is the same material we are looking at
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
    this.cx.lineCap = 'butt';

  }


 //draws any updates from a change in a part of the drawdown on the threading, tieup, and treadling
 //will update height if a new row/column is added but for zoom, call redrawLoomSize
  public drawLoomStates(updates) {

    var dims = this.render.getCellDims("base");

    //if the new value in outside of the visible range, redraw the entire loom
    if((this.weave.loom.num_frames)*dims.h > (this.cxThreading.canvas.height)){ 
      this.redrawLoom();
      return;
    }

    for(var u in updates.threading){    
       this.drawCell( this.cxThreading, updates.threading[u].i, updates.threading[u].j, "threading");
    }

   
    if((this.weave.loom.num_treadles)*dims.w > this.cxTreadling.canvas.width){ 
      this.redrawLoom();
      return;
    }

    for(var u in updates.treadling){   
      this.drawCell( this.cxTreadling, updates.treadling[u].i, updates.treadling[u].j, "treadling");
    }

    for(var u in updates.tieup){
      for(var j in updates.tieup[u]){
        this.drawCell( this.cxTieups, updates.tieup[u][j].i, updates.tieup[u][j].j, "tieup");
      }
    }
  }



  public redrawLoom() {

    var base_dims = this.render.getCellDims("base");

    this.cxThreading.clearRect(0,0, this.cxThreading.canvas.width, this.cxThreading.canvas.height);
    this.cxTreadling.clearRect(0,0, this.cxTreadling.canvas.width, this.cxTreadling.canvas.height);
    this.cxTieups.clearRect(0,0, this.cxTieups.canvas.width, this.cxTieups.canvas.height);


    this.cxThreading.canvas.width = base_dims.w * this.weave.loom.threading.length;
    this.cxThreading.canvas.height = base_dims.h * this.weave.loom.num_frames;
    this.drawGrid(this.cxThreading,this.threadingCanvas);

    this.cxTreadling.canvas.width = base_dims.w * this.weave.loom.num_treadles;
    this.cxTreadling.canvas.height = base_dims.h * this.weave.visibleRows.length;
    this.drawGrid(this.cxTreadling,this.treadlingCanvas);

    this.cxTieups.canvas.width = base_dims.w * this.weave.loom.tieup[0].length;
    this.cxTieups.canvas.height = base_dims.h * this.weave.loom.tieup.length;
    this.drawGrid(this.cxTieups,this.tieupsCanvas);

    


    for (var j = 0; j < this.weave.loom.threading.length; j++) {
      this.drawCell(this.cxThreading, this.weave.loom.threading[j], j, "threading");
    }

    //only cycle through the visible rows
    for (var i = 0; i < this.weave.visibleRows.length; i++) {
       this.drawCell(this.cxTreadling, i, this.weave.loom.treadling[this.weave.visibleRows[i]], "treadling");
    }

    for (var i = 0; i < this.weave.loom.tieup.length; i++) {
      for(var j = 0; j < this.weave.loom.tieup[i].length; j++){
        if(this.weave.loom.tieup[i][j]){
          this.drawCell(this.cxTieups, i, j, "tieup");
        }
      }
    }

  }

//callled when frames become visible or drawdown without frame info is loaded
  public recomputeLoom(){

    this.weave.recomputeLoom();

    this.addHistoryState();
    this.redraw();
    this.redrawLoom();
  }

 public redrawSelection(dims){
 
 if(this.selection.start !== undefined){
      
      var left, top, x, y, anchor;



      x = dims.w / 4;
      y = dims.h;

      anchor = 'start';

      if (this.selection.start.j < this.selection.end.j) {
          x = this.selection.width*dims.w -  dims.w/2;
          anchor = 'end';
       }

       if (this.selection.start.i < this.selection.end.i) {
         y = this.selection.height*dims.h -  dims.h/2;
       }


      // define the left and top offsets
      left = Math.min(this.selection.start.j, this.selection.end.j);
      top = Math.min(this.selection.start.i, this.selection.end.i);


      var cx = this.selection.getTarget();
      var div = cx.parentElement;

    //  var rows = Math.ceil(this.selection.height / dims.h);
    //  var cols = Math.ceil(this.selection.width / dims.w);

      var fs = this.render.zoom * .18;
      var fw = this.render.zoom * 9;

      if(cx.id === "warp-systems"){

        d3.select(this.svgEl)
          .attr("width",this.selection.width*dims.h)
          .attr("height",dims.h)
          .style('display', 'initial')
          .style('left', left*dims.w + div.offsetLeft)
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
          .text(this.selection.width);

      }else if(cx.id === "weft-systems"){
         d3.select(this.svgEl)
          .attr("width", dims.w)
          .attr("height",this.selection.height*dims.w)
          .style('display', 'initial')
          .style('left', div.offsetLeft)
          .style('top', top*dims.h+ div.offsetTop);

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
          .text(this.selection.height);

      }else{
        // updates the size of the selection
        d3.select(this.svgEl)
          .attr("width", this.selection.width*dims.w)
          .attr("height",this.selection.height*dims.h)
          .style('display', 'initial')
          .style('left', left*dims.w + div.offsetLeft)
          .style('top', top*dims.h + div.offsetTop);

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
          .text(this.selection.width +' x '+ this.selection.height);

      }

    }
 }


public unsetSelection(){
  d3.select(this.svgEl).style('display', 'none');

}


public redraw(){


    var base_dims = this.render.getCellDims("base");
    this.cx.clearRect(0,0, this.canvasEl.width, this.canvasEl.height);   
    this.cx.canvas.width = base_dims.w * this.weave.pattern[0].length;
    this.cx.canvas.height = base_dims.h * this.weave.visibleRows.length;
    this.cx.fillStyle = "white";
    this.cx.fillRect(0,0,this.canvasEl.width,this.canvasEl.height);

    this.drawWeftMaterials(this.cxWeftMaterials, this.weftMaterialsCanvas);
    this.drawWarpMaterials(this.cxWarpMaterials, this.warpMaterialsCanvas);

    this.drawWeftSystems(this.cxWeftSystems, this.weftSystemsCanvas);
    this.drawWarpSystems(this.cxWarpSystems, this.warpSystemsCanvas);

    switch(this.render.getCurrentView()){
      case 'pattern':
      this.redrawDrawdown();
      break;

      case 'yarn':
      this.redrawVisualView(true);
      break;

      case 'visual':
      this.redrawVisualView(false);
      break;
    }
}
  

  /**
   * Redraws the entire canvas based on weave pattern.
   * @extends WeaveDirective
   * @returns {void}
   */
  public redrawDrawdown() {
    var base_dims = this.render.getCellDims("base");

    var i,j;

    this.drawGrid(this.cx,this.canvasEl);
    
    if(this.brush === 'select')
      this.redrawSelection(base_dims); // make sure to do this after the others are updated



    var color = '#000000';
    this.cx.fillStyle = color;
      for (i = 0; i < this.weave.visibleRows.length; i++) {
        this.redrawRow(i * base_dims.h, i, this.cx);
      }

      // for (j = 0; j < this.weave.pattern[0].length; j++) {
      //   var col = this.weave.colShuttleMapping[j];
      //   this.redrawCol(j, j*base_dims.h, this.cx);
      // }
    
  }

  /**
   * Simulates the visual look of the weave pattern.
   * @extends WeaveDirective
   * @returns {void}
   */
  public redrawVisualView(schematic) {
    var base_dims = this.render.getCellDims("base");


    //draw all the warps
    for (var x = 0; x < this.weave.colShuttleMapping.length; x++) {
     
      var id = this.weave.colShuttleMapping[x];
      var system = this.weave.warp_systems[this.weave.colSystemMapping[x]];
      var shuttle = this.weave.shuttles[id];

        if(system.visible){
          var c = shuttle.getColor();
          var t = shuttle.getThickness();

          var width = 7*base_dims.w/8 * t/100;
          var w_margin = (base_dims.w - width)/2;

          if(shuttle.type > 0 || !schematic){
            this.cx.fillStyle = c;
          }else{
            this.cx.fillStyle = c+"10";

          }

          this.cx.strokeStyle = "#FFFFFF";
          this.cx.lineWidth = 1 * t/100;

          this.cx.fillRect(x*base_dims.w+w_margin, 0, width, base_dims.h*this.weave.visibleRows.length);
          this.cx.beginPath();
          this.cx.moveTo(x*base_dims.w+w_margin-1, 0);
          this.cx.lineTo(x*base_dims.w+w_margin-1, base_dims.h*this.weave.visibleRows.length);
          this.cx.stroke();

          this.cx.beginPath();
          this.cx.moveTo((x+1)*base_dims.w-w_margin, 0);
          this.cx.lineTo((x+1)*base_dims.w-w_margin, base_dims.h*this.weave.visibleRows.length);
          this.cx.stroke();
        }
    }

   //start by drawing the yarn view
    this.redrawYarnView(schematic);
    this.cx.strokeStyle = "#FFFFFF";
    this.cx.lineWidth = .1;

    if(!schematic){

      //draw warp rectangles over the top
      for (var x = 0; x < this.weave.colShuttleMapping.length; x++) {
        var id = this.weave.colShuttleMapping[x];
        var system = this.weave.warp_systems[this.weave.colSystemMapping[x]];

        if(system.visible){
          var c = this.weave.shuttles[id].getColor();
          var t = this.weave.shuttles[id].getThickness();
          var width = 7*base_dims.w/8 * t/100;
          var w_margin = (base_dims.w - width)/2;
          this.cx.fillStyle = c;
        
          for(var i = 0; i < this.weave.visibleRows.length; i++){

             var draft_id = this.weave.visibleRows[i];
             var shuttle_id = this.weave.rowShuttleMapping[draft_id];

             var s_thickness = this.weave.shuttles[shuttle_id].getThickness();
             var height = base_dims.h * s_thickness/100;
             var h_margin = (base_dims.h - height)/2;
              this.cx.strokeStyle = "#FFFFFF";
              this.cx.lineWidth = 1 * t/100;

             if(this.weave.isUp(draft_id, x)){
                // this.cx.moveTo(x*base_dims.w+w_margin, i*base_dims.h);
                // this.cx.lineTo(x*base_dims.w+w_margin, (i+1)*base_dims.h);
                // this.cx.stroke();
                
                // this.cx.moveTo((x+1)*base_dims.w-w_margin, i*base_dims.h);
                // this.cx.lineTo((x+1)*base_dims.w-w_margin, (i+1)*base_dims.h);
                // this.cx.stroke();

                this.cx.fillRect(x*base_dims.w+w_margin, i*base_dims.h, width, base_dims.h);


             }else{

                 // this.cx.fillRect(x*base_dims.w+w_margin, i*base_dims.h, width, h_margin);
                 // this.cx.fillRect(x*base_dims.w+w_margin, (i+1)*base_dims.h-h_margin, width, h_margin);
             }
          }
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
        let up = draft[i][j].isUp();
        if(up) {
          context.fillRect(j,i,1,1)
        }
      }
    }

    let link = obj.downloadLink.nativeElement;

    console.log("link", link);

    link.href = CanvasToBMP.toDataURL(b);
    link.download = fileName + ".bmp";
  }



//UPDATE THIS TO INCLUDE THE MATERIALS INFORMATION - 3/19
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

  /**
   * Saves the draft as a .wif file
   * @extends WeaveDirective
   * @param {string} fileName - name to save file as
   * @returns {void}
   */
  public saveWIF(fileName, obj) {
    //will need to import the obj for draft2wif.ts and then use it and pass this.weave for fileContents
    var fileContents = "[WIF]\nVersion=1.1\nDate=November 6, 2020\nDevelopers=Unstable Design Lab at the University of Colorado Boulder\nSource Program=AdaCAD\nSource Version=3.0\n[CONTENTS]";
    var fileType = "text/plain";

    fileContents += "\nCOLOR PALETTE=yes\nWEAVING=yes\nWARP=yes\nWEFT=yes\nTIEUP=yes\nCOLOR TABLE=yes\nTHREADING=yes\nWARP COLORS=yes\nTREADLING=yes\nWEFT COLORS=yes\n";
    
    fileContents += "[COLOR PALETTE]\n";
    fileContents += "Entries=" + (this.weave.shuttles.length+this.weave.warp_systems.length).toString() +"\n";
    fileContents += "Form=RGB\nRange=0,255\n";

    fileContents += "[WEAVING]\nShafts=";
    fileContents += this.weave.loom.min_frames.toString();
    fileContents += "\nTreadles=";
    fileContents += this.weave.loom.min_treadles.toString();
    fileContents += "\nRising Shed=yes\n";
    fileContents += "[WARP]\nThreads=";
    fileContents += this.weave.warps.toString();
    
    var warpColors = [];
    for (var i = 0; i < this.weave.colShuttleMapping.length; i++) {
      if (!warpColors.includes(this.weave.colShuttleMapping[i])) {
        warpColors.push(this.weave.colShuttleMapping[i]);
      }
    }
    fileContents += "\nColors=" + warpColors.length.toString();

    fileContents += "\n[WEFT]\nThreads=";
    fileContents += this.weave.wefts.toString();
    var weftColors = [];
    for (var i = 0; i < this.weave.colShuttleMapping.length; i++) {
      if (!weftColors.includes(this.weave.colShuttleMapping[i])) {
        weftColors.push(this.weave.colShuttleMapping[i]);
      }
    }
    fileContents += "\nColors=" + weftColors.length.toString();

    fileContents += "\n[TIEUP]\n";

    var treadles = [];
    for (var i =0; i < this.weave.loom.tieup.length;i++) {
      for (var j = 0; j < this.weave.loom.tieup[i].length;j++) {
        if (this.weave.loom.tieup[i][j] && !treadles.includes(j)) {
          treadles.push(j);
        }
      }
    }
    for (var i =0; i < treadles.length; i++) {
      fileContents += (treadles[i]+1).toString() + "=";
      var lineMarked = false;
      for (var j = 0; j < this.weave.loom.tieup.length; j++){
        if (this.weave.loom.tieup[j][treadles[i]]) { 
          if (lineMarked) {
            fileContents += ",";
          }
          fileContents += (j+1).toString();
          lineMarked=true;
        }
      }
      fileContents += "\n";
    }

    fileContents+= "[COLOR TABLE]\n";
    //Reference: https://css-tricks.com/converting-color-spaces-in-javascript/ for conversion for hex to RGB
    var counter = 1;
    for (var i = 0; i < this.weave.shuttles.length; i++) {
      fileContents+= (counter).toString();
      counter = counter + 1;
      fileContents+= "=";
      var hex = this.weave.shuttles[i].color;
      if (hex.length == 7) {
        var r = "0x" + hex[1] + hex[2];
        var g = "0x" + hex[3] + hex[4];
        var b = "0x" + hex[5] + hex[6];

        fileContents += (+r).toString() + "," + (+g).toString() + "," + (+b).toString() + "\n";
      }
    }
    for (var i = 0; i < this.weave.warp_systems.length; i++) {
      fileContents+= (counter).toString();
      counter = counter + 1;
      fileContents+= "=";
      var hex = this.weave.warp_systems[i].color;
      if (hex.length == 7) {
        var r = "0x" + hex[1] + hex[2];
        var g = "0x" + hex[3] + hex[4];
        var b = "0x" + hex[5] + hex[6];

        fileContents += (+r).toString() + "," + (+g).toString() + "," + (+b).toString() + "\n";
      }
    }

    fileContents += "[THREADING]\n";
    for (var i=0; i <this.weave.loom.threading.length; i++) {
      var frame = this.weave.loom.threading[i];
      if (frame != -1) {
        fileContents += (this.weave.loom.threading.length-i).toString() + "=" + (frame+1).toString() + "\n";
      }
    }

    fileContents += "[WARP COLORS]\n";
    for (var i = 0; i < this.weave.colShuttleMapping.length; i++) {
      fileContents += (i+1).toString() + "=" + (this.weave.colShuttleMapping[i]+this.weave.shuttles.length+1).toString() + "\n";
    }

    fileContents += "[TREADLING]\n";
    for (var i = 0; i < this.weave.loom.treadling.length; i++) {
      if (this.weave.loom.treadling[i] != null && this.weave.loom.treadling[i] != -1){
        fileContents += (i+1).toString() + "=" + (this.weave.loom.treadling[i]+1).toString() + "\n";
      }
    }

    fileContents += "[WEFT COLORS]\n";
    for (var i = 0; i < this.weave.rowShuttleMapping.length; i++) { // will likely have to change the way I import too
      fileContents += (i+1).toString() + "=" + (this.weave.rowShuttleMapping[i]+1).toString() + "\n";
    }

    let link = obj.downloadLink.nativeElement;
    link.href= "data:" + fileType +";base64," + btoa(fileContents);

    console.log("link:", link);
    link.download = fileName +".wif";
  }

  public getActiveTimelineId(): number{
      for(var i = 0; i < this.timeline.length; i++){
        if(this.timeline[i].is_active) return i;
      }
      return -1;
  }


  public restoreNextHistoryState(){
    
      var active_id = this.getActiveTimelineId();

      if(active_id-1 >= 0){
        this.timeline[active_id].is_active = false;
        this.timeline[active_id-1].is_active = true;
        this.weave = cloneDeep(this.timeline[active_id-1].draft);
        this.redrawLoom();
        this.redraw();
      }

  }

  public restorePreviousHistoryState(){
    
      var active_id = this.getActiveTimelineId();

      if(active_id+1 < this.timeline.length){
        this.timeline[active_id].is_active = false;
        this.timeline[active_id+1].is_active = true;
        this.weave = cloneDeep(this.timeline[active_id+1].draft);
        this.redrawLoom();
        this.redraw();
      }

  }


  public addHistoryState(){

    var active_id = this.getActiveTimelineId();

    var state = {
      draft: cloneDeep(this.weave),
      is_active: false
    }

    if(this.timeline.length > 0){

      if(active_id == 0){
        this.timeline[0].is_active = false;
        state.is_active = true;
      }else{

        //erase all states until you get to the active row
        this.timeline.splice(0, active_id);
        if(this.timeline.length > 0) this.timeline[0].is_active = false;
        state.is_active = true;
      }
    }

    //add the enw element
    var len = this.timeline.unshift(state);
    if(len > 10) this.timeline.pop();
  }

}
