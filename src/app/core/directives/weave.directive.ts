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


  //this is called when the HTML "weaveRef" Element is loaded
  ngOnInit() {  

    console.log("element", this.el.nativeElement.children);
    //this.segments$ = this.store.pipe(select(selectAll));
    // define the elements and context of the weave draft, threading, treadling, and tieups.
    this.canvasEl = this.el.nativeElement.children[6];
    //this.divEl = this.el.nativeElement.children[3];

    //this is the selection
    this.svgEl = this.el.nativeElement.children[17];
    
    this.threadingCanvas = this.el.nativeElement.children[4];
    this.tieupsCanvas = this.el.nativeElement.children[5];
    this.treadlingCanvas = this.el.nativeElement.children[7];
    this.weftSystemsCanvas = this.el.nativeElement.children[0];
    this.weftMaterialsCanvas = this.el.nativeElement.children[1];
    this.warpSystemsCanvas = this.el.nativeElement.children[2];
    this.warpMaterialsCanvas = this.el.nativeElement.children[3];
    
    this.cx = this.canvasEl.getContext('2d');
    this.cxThreading = this.threadingCanvas.getContext('2d');
    this.cxTreadling = this.treadlingCanvas.getContext('2d');
    this.cxTieups = this.tieupsCanvas.getContext('2d');
    this.cxWarpSystems = this.warpSystemsCanvas.getContext('2d');
    this.cxWeftSystems = this.weftSystemsCanvas.getContext('2d');
    this.cxWarpMaterials = this.warpMaterialsCanvas.getContext('2d');
    this.cxWeftMaterials = this.weftMaterialsCanvas.getContext('2d');
    // set the width and height

    d3.select(this.svgEl).style('display', 'none');

    
  }

  //this is called anytime a new draft object is loaded. 
  onNewDraftLoaded() {  

    console.log(this.weave);
    console.log("on new draft", this.weave.warps);

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


   // this.addHistoryState();

    // make the selection SVG invisible using d3
    d3.select(this.svgEl).style('display', 'none');

    // this.store.pipe(select(getCurrentDraft), takeUntil(this.unsubscribe$)).subscribe(undoredo => {
    //   this.prevSegment = this.currSegment;
    //   this.currSegment = undoredo;
    // });


  }

  clearSelection(){
        this.selection.unsetParameters();
        d3.select(this.svgEl).style('display', 'none');
  }

  ngOnDestroy() {
     this.removeSubscription();
  }


  setPosAndDraw(target, currentPos:Point){

      if (target && target.id =='treadling') {
        currentPos.i = this.weave.visibleRows[currentPos.i];
        this.drawOnTreadling(currentPos);
      } else if (target && target.id === 'tieups') {
        currentPos.i = this.weave.loom.frame_mapping[currentPos.i];
        this.drawOnTieups(currentPos);
      } else if (target && target.id === ('threading')) {
        currentPos.i = this.weave.loom.frame_mapping[currentPos.i];
        this.drawOnThreading(currentPos);
      } else if(target && target.id === ('weft-systems')){
        currentPos.i = this.weave.visibleRows[currentPos.i];
        this.drawOnWeftSelectors(currentPos);
      }else if(target && target.id === ('warp-systems')){
        this.drawOnWarpSelectors(currentPos);
      }else if(target && target.id === ('weft-materials')){
        currentPos.i = this.weave.visibleRows[currentPos.i];
        this.drawOnWeftMaterials(currentPos);
      }else if(target && target.id === ('warp-materials')){
        console.log("warp materials");
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

    //get dimis based on zoom.
    let dims ={
      w: this.warpSystemsCanvas.width / this.weave.warps,
      h: this.weftSystemsCanvas.height / this.weave.visibleRows.length
    }

    if (event.target.localName === 'canvas') {
      this.removeSubscription();    
      this.subscription = 
        fromEvent(event.target, 'mousemove').subscribe(e => this.onMove(e));   

      // set up the Point to be used.
      var screen_row = Math.floor(event.offsetY / dims.h);

      const currentPos: Point = {
        si: screen_row,
        i: screen_row, //row
        j: Math.floor((event.offsetX) / dims.w), //col
      };

      if(event.target && event.target.id==="drawdown"){

        currentPos.si -=1;
        currentPos.i -=1;
        currentPos.j -=1;

        //reject out of bounds values
        if(currentPos.i < 0 || currentPos.i >= this.weave.visibleRows.length) return;
        if(currentPos.j < 0 || currentPos.j >= this.weave.warps) return;
      }


      // Save temp pattern
      this.tempPattern = cloneDeep(this.weave.pattern);

      switch (this.brush) {
        case 'invert':
        case 'point':
        case 'erase':
          this.setPosAndDraw(event.target, currentPos);
          this.unsetSelection();

          break;
        case 'maskpoint':
        case 'maskerase':
        case'maskinvert':
          this.drawOnMask(currentPos);
          break;
        case 'select':
        case 'copy':

          if(event.shiftKey){

            this.selection.end = currentPos;
            this.selection.setParameters();
            this.rescale();

          }else{

            this.clearSelection();

            this.selection.start = currentPos;
            this.selection.end = currentPos;
            this.selection.width = 0;
            this.selection.height = 0;


            if (event.target && event.target.id==="treadling") {
              this.selection.setTarget(this.treadlingCanvas);
              this.selection.start.j = 0;
              this.selection.width = this.weave.loom.num_treadles;

            } else if (event.target && event.target.id ==="tieups") {
              this.selection.setTarget(this.tieupsCanvas);
            } else if (event.target && event.target.id === "threading") {
              this.selection.setTarget(this.threadingCanvas);
              this.selection.start.i = 0;
              this.selection.start.si = 0;
              this.selection.height = this.weave.loom.num_frames;


            } else if(event.target && event.target.id === "weft-systems"){
              this.selection.width = 1;
              this.selection.setTarget(this.weftSystemsCanvas);
            }else if(event.target && event.target.id === "warp-systems"){
              this.selection.setTarget(this.warpSystemsCanvas);
              this.selection.height = 1;
            } else if(event.target && event.target.id === "weft-materials"){
              this.selection.width = 1;
              this.selection.setTarget(this.weftMaterialsCanvas);
            }else if(event.target && event.target.id === "warp-materials"){
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
    
    let dims ={
      w: this.warpSystemsCanvas.width / this.weave.warps,
      h: this.weftSystemsCanvas.height /this.weave.visibleRows.length
    };    

    console.log("on move", dims);

    var offset = this.render.getCellDims(this.brush);
  
    // set up the point based on touched square.
    var screen_row = Math.floor((event.offsetY + offset.y) / dims.h);

    const currentPos: Point = {
      si: screen_row,
      i:  screen_row,
      j:  Math.floor((event.offsetX + offset.x) / dims.w)
    };


    if(event.target && event.target.id==="drawdown"){
      currentPos.si -=1;
      currentPos.i -=1;
      currentPos.j -=1;

      //reject out of bounds values
      if(currentPos.i < 0 || currentPos.i > this.weave.visibleRows.length) return;
      if(currentPos.j < 0 || currentPos.j > this.weave.warps) return;
    }


    // determine action based on brush type. invert inactive on move.
    switch (this.brush) {
      case 'point':
      case 'erase':
       //this.unsetSelection();

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
      case 'copy':
        this.selection.end = currentPos;

        if (event.target && event.target.id === ('treadling')) {
          this.selection.end.j = this.weave.loom.num_treadles;
        }else if(event.target && event.target.id === ('threading-container')){
          this.selection.end.i = this.weave.loom.num_frames;
          this.selection.end.si = this.weave.loom.num_frames;
        }

        this.selection.setParameters();
        this.rescale();

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
    if (!(event.type === 'mouseleave' && (this.brush === 'select' || this.brush ==='copy'))) {
      this.removeSubscription();
      if(this.brush != "copy" && this.selection.start !== undefined) this.copyArea();

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
         
         // cx.fillStyle = "#ffffff";  
         // cx.font = "14px Arial";
         // cx.fillText(this.weave.getWeftSystemCode(i), dims.w/3, (dims.h*i)+3*dims.h/4);

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
  
         // cx.fillStyle = "#ffffff";  
         // cx.font = "14px Arial";
         // cx.fillText(this.weave.getWarpSystemCode(j),(dims.w*j)+dims.w/3, dims.w-(margin*3));


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
  private drawBlank(cx,canvas) {

    cx.fillStyle = "#3d3d3d";
    cx.fillRect(0,0,canvas.width,canvas.height);
   
  }

  /**
   * Draws the grid lines onto the canvas.
   * @extends WeaveDirective
   * @returns {void}
   */
  private drawGrid(cx,canvas) {
    var i,j;

    var dims = this.render.getCellDims("base");


    if(canvas.id=== "threading"){
      cx.fillStyle = "white";
      cx.fillRect(0,0,canvas.width,canvas.height);
      cx.fillStyle = "#cccccc";
      cx.fillRect(0, 0, canvas.width, (this.weave.loom.num_frames - this.weave.loom.min_frames)*dims.h);
    }
    else if (canvas.id=== "treadling"){
      cx.fillStyle = "white";
      cx.fillRect(0,0,canvas.width,canvas.height);
      cx.fillStyle = "#cccccc";
      var start = this.weave.loom.min_treadles * dims.w;
      cx.fillRect(start, 0, canvas.width - start, canvas.height);

    }
    else if (canvas.id=== "tieups"){
      cx.fillStyle = "white";
      cx.fillRect(0,0,canvas.width,canvas.height);
      cx.fillStyle = "#cccccc";
      var start = this.weave.loom.min_treadles * dims.w;
      cx.fillRect(start, 0, canvas.width - start, canvas.height);
      cx.fillRect(0, 0, canvas.width, (this.weave.loom.num_frames - this.weave.loom.min_frames)*dims.h);

    }


    cx.fillStyle="black";
    cx.lineWidth = .5;
    cx.lineCap = 'round';
    cx.strokeStyle = '#000';

    //only draw the lines if the zoom is big enough to render them well
    if(this.render.zoom > 25){

     //cx.lineWidth = this.render.zoom/100;

     //cx.setLineDash([dims.w/20,dims.w/4]);

      // draw vertical lines
      for (i = 0; i <= canvas.width; i += dims.w) {
        //if(canvas.id === "treadling" && i === (this.weave.loom.min_treadles)*dims.w) cx.setLineDash([0]);
        //else if(canvas.id === "tieups" && i === (this.weave.loom.min_treadles)*dims.w) cx.setLineDash([0]);
        
        //else  cx.setLineDash([dims.w/20,dims.w/4]);
        
          if(canvas.id == 'drawdown'){
            if(i > dims.w && i < canvas.width - dims.w){
            cx.beginPath();
            cx.moveTo(i, dims.h);
            cx.lineTo(i, canvas.height-dims.h);
            cx.stroke();
            }
          }else{
            cx.beginPath();
            cx.moveTo(i, 0);
            cx.lineTo(i, canvas.height);
            cx.stroke();
          }
        

      }

      // draw horizontal lines
      for (i = 0; i <= canvas.height; i += dims.h) {
        //if(canvas.id === "threading" && i === (this.weave.loom.num_frames - this.weave.loom.min_frames)*dims.h) cx.setLineDash([0]);
        //else if(canvas.id === "tieups" && i === (this.weave.loom.num_frames - this.weave.loom.min_frames)*dims.h) cx.setLineDash([0]);
        //else  cx.setLineDash([dims.w/20,dims.w/4]);

        if(canvas.id == "drawdown"){
          if(i > dims.h && i < canvas.height - dims.h){
          cx.beginPath();
          cx.moveTo(dims.w, i);
          cx.lineTo(canvas.width-dims.w, i);
          cx.stroke();
          }
        }else{
          cx.beginPath();
          cx.moveTo(0, i);
          cx.lineTo(canvas.width, i);
          cx.stroke();
        }
      }


      // reset the line dash.
      //cx.setLineDash([0]);
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

    this.redraw({weft_systems: true});


    this.addHistoryState();

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

    this.redraw({weft_materials: true, drawdown:true});
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
    this.redraw({warp_systems: true});
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
    this.drawWarpSelectorCell(this.cxWarpMaterials,col);
    this.addHistoryState();
    this.redraw({warp_materials:true, drawdown:true}); //full redraw or just this column?
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
    this.redraw({mask: true});
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

      if(this.render.isYarnBasedView()) this.weave.computeYarnPaths();


      // if(this.render.getCurrentView() == 'pattern'){
      //   this.drawCell(this.cx,currentPos.si, currentPos.j, "drawdown");
      // }else{
      //   this.drawYarn(currentPos.si, currentPos.j, val);
      // }

        
      if(this.render.showingFrames()) this.updateLoomFromDraft(currentPos);
      
      this.addHistoryState();        
    }
    
    this.redraw({drawdown:true, loom:true});

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
    this.redraw({drawdown:true, loom:true});
    
    
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
      this.redraw({drawdown:true, loom:true});

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
      this.redraw({drawdown:true, loom:true});

    }
   }

   /***
   This function takes a point added to the draft and updates and redraws the loom states
   It takes current position of a point on the currently visible draft
   ***/
   private updateLoomFromDraft(currentPos):boolean{

    if(!this.render.showingFrames()) return false;

    this.weave.updateLoomFromDraft(currentPos);
    // var updates = this.weave.loom.updateFromDrawdown(currentPos.i,currentPos.j, this.weave.pattern);
    // var u_threading = this.weave.loom.updateUnused(this.weave.loom.threading, this.weave.loom.min_frames, this.weave.loom.num_frames, "threading");
    // var u_treadling = this.weave.loom.updateUnused(this.weave.loom.treadling, this.weave.loom.min_treadles, this.weave.loom.num_treadles, "treadling");

    // return true;
      
   }

  /**
   * Fills in selected area of canvas. Updates the pattern within selection.
   * @extends WeaveDirective
   * @param {Selection} selection - defined user selected area to fill.
   * @param {Array<Array<boolean>>} - the pattern used to fill the area.
   * @param {string} - the type of logic used to fill selected area.
   * @returns {void}
   */
  // private fillArea(
  //   selection: Selection, 
  //   pattern: Array<Array<boolean>>, 
  //   type: string
  // ) {

  //   console.log("fill area called");
  //   console.log(selection, pattern, type);

  //   var dims = this.render.getCellDims("base");
  //   var updates = [];
    
  //   var screen_i = Math.min(selection.start.si, selection.end.si)
  //   const draft_i = Math.min(selection.start.i, selection.end.i);
  //   const draft_j = Math.min(selection.start.j, selection.end.j);
  
  //   const rows = pattern.length;
  //   const cols = pattern[0].length;

  //   var w,h;

  //   w = Math.ceil(selection.width);
  //   h = Math.ceil(selection.height);


  //   if(selection.target.id === "warp-systems"){
  //     h = pattern.length;
  //     screen_i = 0;
  //   } 
  //   if(selection.target.id === "weft-systems"){
  //     w = pattern[0].length;
  //   } 

  //   if(selection.target.id === "warp-materials"){
  //      h = pattern.length;
  //      screen_i = 0;
  //   }
  //   if(selection.target.id === "weft-materials"){
  //     w = pattern[0].length;
  //   } 

  //   //cycle through each visible row/column of the selection
  //   for (var i = 0; i < h; i++ ) {
  //     for (var j = 0; j < w; j++ ) {

  //       var row = i + screen_i;
  //       var col = j + draft_j;


  //       var temp = pattern[i % rows][j % cols];
       
  //       var prev = false; 
  //       switch(selection.target.id){

  //         case 'drawdown':
  //             var draft_row = this.weave.visibleRows[row];
  //             prev = this.weave.pattern[draft_row][col].isUp();

  //         break;
  //         case 'threading':
  //             var frame = this.weave.loom.frame_mapping[row];
  //             prev = this.weave.loom.isInFrame(col, frame);
          
  //         break;
  //         case 'treadling':
  //             var draft_row = this.weave.visibleRows[row];
  //             prev = (this.weave.loom.isInTreadle(draft_row, col)); 
  //         break;
  //         case 'tieups':
  //             var frame = this.weave.loom.frame_mapping[row];
  //             prev = this.weave.loom.hasTieup(frame,col); 
          
  //         break;
  //         default:
  //         break;
  //       }

  //       if (prev !== null){

  //         var val = false;
  //         switch (type) {
  //           case 'invert':
  //            val = !temp;
  //             break;
  //           case 'mask':
  //            val = temp && prev;
  //             break;
  //           case 'mirrorX':
  //             val = pattern[(h - i - 1) % rows][j % cols];
  //             break;
  //           case 'mirrorY':
  //             val = pattern[i % rows][(w - j - 1) % cols];
  //             break;
  //           default:
  //             val = temp;
  //             break;
  //         }


  //         var updates = [];

  //         switch(selection.target.id){
           
  //          case 'drawdown':
  //          var draft_row = this.weave.visibleRows[row];

  //           if(this.weave.hasCell(draft_row,col)){

  //               var p = new Point(); 
  //               p.si = row;
  //               p.i = this.weave.visibleRows[row];
  //               p.j = col;
              
  //               this.weave.setHeddle(p.i,p.j,val);
  //               this.updateLoomFromDraft(p);
  //             }

  //           break;
            
  //           case 'threading':
  //           var frame = this.weave.loom.frame_mapping[row];

  //             if(this.weave.loom.inThreadingRange(frame,col)){ 
  //               updates = this.weave.loom.updateThreading(frame, col, val);
  //               this.weave.updateDraftFromThreading(updates); 
  //             }
  //           break;

  //           case 'treadling':
              
  //            var draft_row = this.weave.visibleRows[row];
  //            if(this.weave.loom.inTreadlingRange(draft_row,col)){ 
  //               updates = this.weave.loom.updateTreadling(draft_row, col, val);
  //               this.weave.updateDraftFromTreadling(updates);
  //             }
  //           break;
  //           case 'tieups':
  //             var frame = this.weave.loom.frame_mapping[row];

  //             if(this.weave.loom.inTieupRange(frame, col)){
  //               updates = this.weave.loom.updateTieup(frame, col, val);
  //               this.weave.updateDraftFromTieup(updates);
  //             }
  //           break;
  //           case 'weft-systems':
  //             var draft_row = this.weave.visibleRows[row];
  //             val = pattern[i % rows][j % cols];
  //             if(val && col < this.weave.weft_systems.length) this.weave.rowSystemMapping[draft_row] = col;
            
  //           break;
  //           case 'warp-systems':
  //             val = pattern[i % rows][j % cols];
  //             if(val && row < this.weave.warp_systems.length){
  //                 this.weave.colSystemMapping[col] = row;
  //             }
  //           break;
  //           case 'weft-materials':
  //             var draft_row = this.weave.visibleRows[row];
  //             val = pattern[i % rows][j % cols];
  //             if(val && col < this.weave.shuttles.length) this.weave.rowShuttleMapping[draft_row] = col;
            
  //           break;
  //           case 'warp-materials':
  //             val = pattern[i % rows][j % cols];
  //             if(val && row < this.weave.shuttles.length){
  //                 this.weave.colShuttleMapping[col] = row;
  //             }
  //           break;
  //           default:
  //           break;
  //         }
  //       }


  //     }
  //   }

  //   var u_threading = this.weave.loom.updateUnused(this.weave.loom.threading, this.weave.loom.min_frames, this.weave.loom.num_frames, "threading");
  //   var u_treadling = this.weave.loom.updateUnused(this.weave.loom.treadling, this.weave.loom.min_treadles, this.weave.loom.num_treadles, "treadling");
  //   this.addHistoryState();
  //   this.redraw();
  //   this.redrawLoom();

  // }



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


//   //This function draws whatever the current value is at screen coordinates cell i, J
// private drawYarn(i, j, value){

//   if(this.weave.yarn_paths.length == 0) return;
      
//       let p = this.weave.yarn_paths[i][j+1];
//       let s = this.weave.shuttles[p.getShuttle()];
//       p.setHeddle(value);

//       //check no poles

//       //no matter what, draw this cell up or down
//       if(p.isUp() && this.render.isFront() || !p.isUp() && !this.render.isFront()){
//           this.drawWeftUnder(i, j, s);
//         }
//         else{
//           this.drawWeftOver(i, j, s);
//       }

//   }


//This function draws whatever the current value is at screen coordinates cell i, J
  private drawCell(cx, i, j, type){


    var base_dims = this.render.getCellDims("base");
    var base_fill = this.render.getCellDims("base_fill");
    var has_mask = false;
    var is_up = false;
    var color = "#FFFFFF";
    var beyond = false;

    var top = 0; 
    var left = 0;



    switch(type){
      case 'drawdown':
      case 'mask':
        var row = this.weave.visibleRows[i];
        
        is_up = this.weave.isUp(row,j);
        if(!this.render.isFront()) is_up = !is_up;
        has_mask = this.weave.isMask(row,j);

        if(is_up) color = "#333333";
        else if(has_mask) color = "#CCCCCC";

        top = base_dims.h;
        left = base_dims.w;

      break;
      case 'threading':
        if(!this.render.isFront()) return;
        var frame = this.weave.loom.threading[j];
        is_up = (frame == i);
        beyond = frame > this.weave.loom.min_frames; 
        has_mask = false;
        
        if(is_up)  color = "#333333";
        i = this.weave.loom.frame_mapping[frame];

      break;
      case 'tieup':
        if(!this.render.isFront()) return;
        is_up = (this.weave.loom.tieup[i][j]);
        beyond = i > this.weave.loom.min_frames; 
        has_mask = false;
        if(is_up) color = "#333333";
        i = this.weave.loom.frame_mapping[i];

      break;
      case 'treadling':
        if(!this.render.isFront()) return;
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
     cx.fillRect(left+j*base_dims.w + base_fill.x, top+i*base_dims.h + base_fill.y, base_fill.w, base_fill.h);


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




  public drawWeftLeftUp(top, left, shuttle){
      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > this.weave.warps) return;

      left = (left+1)*dims.w;
      top =  (top + 1) * dims.h;

      top += dims.h/2;


      cx.lineWidth = shuttle.getThickness()/100 * .9*dims.h;
      cx.strokeStyle = (view === "yarn" && shuttle.type === 0) ? shuttle.getColor()+"10" : shuttle.getColor();
      cx.shadowColor = 'white';
      cx.shadowOffsetX = 0;
      cx.shadowOffsetY = .5;

      cx.beginPath();
      cx.moveTo(left,top);
      cx.arcTo(left+dims.w/2, top, left+dims.w/2, top - dims.h/2, dims.w/2);
      cx.stroke();
  }

  public drawWeftRightUp(top, left, shuttle){
      //console.log("draw right up", top, left);
      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > this.weave.warps) return;

      left = (left+1)*dims.w;
      top =  (top + 1) * dims.h;

      top += dims.h/2;


      cx.lineWidth = shuttle.getThickness()/100 * .9*dims.h;
      cx.strokeStyle = (view === "yarn" && shuttle.type === 0) ? shuttle.getColor()+"10" : shuttle.getColor();
      cx.shadowColor = 'white';
      cx.shadowOffsetX = 0;
      cx.shadowOffsetY = .5;

      cx.beginPath();
      cx.moveTo(left+dims.w,top);
      cx.arcTo(left+dims.w/2, top, left+dims.w/2, top-dims.h/2, dims.w/2);
      cx.stroke();
  }

  public drawWeftBottomLeft(top, left, shuttle){
      //console.log("draw bottom left", top, left);
      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > this.weave.warps) return;

      left = (left+1)*dims.w;
      top =  (top + 1) * dims.h;

      top += dims.h/2;


      cx.lineWidth = shuttle.getThickness()/100 * .9*dims.h;
      cx.strokeStyle = (view === "yarn" && shuttle.type === 0) ? shuttle.getColor()+"10" : shuttle.getColor();
      cx.shadowColor = 'white';
      cx.shadowOffsetX = .5;
      cx.shadowOffsetY = 0;

      cx.beginPath();
      cx.moveTo(left+dims.w/2,top+dims.h/2);
      cx.arcTo(left+dims.w/2, top, left, top, dims.w/2);
      cx.stroke();
  }

  public drawWeftBottomRight(top, left, shuttle){
      //console.log("draw bottom right", top, left);
      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > this.weave.warps) return;

      left = (left+1)*dims.w;
      top =  (top + 1) * dims.h;

      top += dims.h/2;


      cx.lineWidth = shuttle.getThickness()/100 * .9*dims.h;
      cx.strokeStyle = (view === "yarn" && shuttle.type === 0) ? shuttle.getColor()+"10" : shuttle.getColor();
      cx.shadowColor = 'white';
      cx.shadowOffsetX = .5;
      cx.shadowOffsetY = 0;

      cx.beginPath();
      cx.moveTo(left+dims.w/2,top+dims.h/2);
      cx.arcTo(left+dims.w/2, top, left+dims.w, top, dims.w/2);
              cx.stroke();
  }


  public drawWeftUp(top, left, shuttle){
       // console.log("draw under", top, left);
      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > this.weave.warps) return;

      left = (left+1)*dims.w;
      top =  (top + 1) * dims.h;

      left += dims.w/2

      var width = shuttle.getThickness()/100 * .9*dims.w;

      cx.lineWidth = width;
      cx.strokeStyle = (view === "yarn" && shuttle.type === 0) ? shuttle.getColor()+"10" : shuttle.getColor();
      cx.shadowColor = 'white';
      cx.shadowOffsetX = .5;
      cx.shadowOffsetY = 0;

      cx.beginPath();
      cx.moveTo(left, top);
      cx.lineTo(left, top+dims.h);
      cx.stroke();

  }

  public drawWeftStart(top, left, shuttle){
 //console.log("draw over", top, left);
      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > this.weave.warps) return;

      left = (left+1)*dims.w;
      top =  (top + 1) * dims.h;


      top += dims.h/2;


      cx.lineWidth = shuttle.getThickness()/100 * .9*dims.h;
      cx.strokeStyle = (view === "yarn" && shuttle.type === 0) ? shuttle.getColor()+"10" : shuttle.getColor();
      cx.fillStyle = (view === "yarn" && shuttle.type === 0) ? shuttle.getColor()+"10" : shuttle.getColor();


      cx.beginPath();
      var circle = new Path2D();
      circle.arc(left+dims.w/2, top, dims.h/2, 0, 2 * Math.PI);
      cx.fill(circle);


}

public drawWeftEnd(top, left, shuttle){
 //console.log("draw over", top, left);
      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > this.weave.warps) return;

      left = (left+1)*dims.w;
      top =  (top + 1) * dims.h;


      top += dims.h/2;


      cx.lineWidth = 1;
      cx.strokeStyle = (view === "yarn" && shuttle.type === 0) ? shuttle.getColor()+"10" : shuttle.getColor();
      cx.fillStyle = (view === "yarn" && shuttle.type === 0) ? shuttle.getColor()+"10" : shuttle.getColor();

      cx.beginPath();
      var circle = new Path2D();
      circle.arc(left+dims.w/2, top, dims.h/2, 0, 2 * Math.PI);
      cx.stroke(circle);


}

 //break down all cells into the various kinds of drawings
  public drawWeftOver(top, left, shuttle){
      //console.log("draw over", top, left);
      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > this.weave.warps) return;

      left = (left+1)*dims.w;
      top =  (top + 1) * dims.h;

      top += dims.h/2;


      cx.lineWidth = shuttle.getThickness()/100 * .9*dims.h;
      cx.strokeStyle = (view === "yarn" && shuttle.type === 0) ? shuttle.getColor()+"10" : shuttle.getColor();
      cx.shadowColor = 'white';
      cx.shadowOffsetX = 0;
      cx.shadowOffsetY = .5;

      cx.beginPath();
      cx.moveTo(left, top);
      cx.lineTo(left+dims.w, top);
      cx.stroke();

  }

   //break down all cells into the various kinds of drawings
  public drawWeftUnder(top, left, shuttle){
      //console.log("draw under", top, left);
      var dims = this.render.getCellDims("base");
      var warp_shuttle = this.weave.shuttles[this.weave.colShuttleMapping[left]];
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > this.weave.warps) return;

      left = (left+1)*dims.w;
      top =  (top + 1) * dims.h;

      top += dims.h/2

      var warp_width = warp_shuttle.getThickness()/100 * .9*dims.w;
      var stroke_width = shuttle.getThickness()/100 * .9*dims.h;
      var margin = (.9*dims.w - warp_width)/2;

      cx.lineWidth = stroke_width;
      cx.strokeStyle = (view === "yarn" && shuttle.type === 0) ? shuttle.getColor()+"10" : shuttle.getColor();
      cx.shadowColor = 'white';
      cx.shadowOffsetX = 0;
      cx.shadowOffsetY = .5;

      cx.fillStyle = "#393939";
      cx.fillRect(left, top-dims.h/2, dims.w, dims.h);

      cx.beginPath();
      cx.moveTo(left, top);
      cx.lineTo(left+margin, top);
      cx.stroke();
  
      cx.beginPath();
      cx.moveTo(left+margin+warp_width, top);
      cx.lineTo(left+dims.w, top);
      cx.stroke();
     
      cx.lineWidth = warp_width;
      cx.strokeStyle = (view === "yarn" && warp_shuttle.type === 0) ? warp_shuttle.getColor()+"10" : warp_shuttle.getColor();

      cx.beginPath();
      cx.moveTo(left+dims/2, top-dims.h/2);
      cx.lineTo(left+dims/2, top+dims.h/2);
      cx.stroke();

  }

  //this does not draw on canvas but just rescales the canvas
  public rescale(){
  
    //var dims = this.render.getCellDims("base");

    let dims ={
      w: this.warpSystemsCanvas.width / this.weave.warps,
      h: this.weftSystemsCanvas.height / this.weave.visibleRows.length
    }

    console.log(dims);

    let offset = this.render.getCellDims("select");


    // var scaleX = window.innerWidth / this.canvasEl.width;
    // var scaleY = window.innerHeight / this.canvasEl.height;

   // var scaleToFit = Math.min(scaleX, scaleY);
    var scaleToFit = this.render.getZoom() /50;
  //  var scaleToCover = Math.max(scaleX, scaleY);


    if(!this.render.view_frames){

        this.threadingCanvas.height = 0;
        this.threadingCanvas.width = 0;

        this.treadlingCanvas.height = 0;
        this.treadlingCanvas.width = 0;

        this.tieupsCanvas.height = 0;
        this.tieupsCanvas.width = 0;

    }

    
    if(this.selection.hasSelection()){

        var x = dims.w / 4;
        var y = dims.h;
        var anchor = 'start';

        //styling for the text
        if (this.selection.start.j < this.selection.end.j) {
            x = this.selection.width*dims.w ;
            anchor = 'end';
         }

         if (this.selection.start.i < this.selection.end.i) {
           y = this.selection.height*dims.h;
         }


        var fs = this.render.zoom * .18;
        var fw = this.render.zoom * 9;
        this.svgEl.style.transformOrigin = '0 0';

        d3.select(this.svgEl)
          .style('display', 'initial')
          .style('width', (this.selection.width) * dims.w)
          .style('height', (this.selection.height) * dims.h)

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


    //render threadiing
    let top = 0;
    let left= 0;

    this.threadingCanvas.style.transformOrigin = '0 0';
    this.threadingCanvas.style.transform = 'scale(' + scaleToFit + ')';

 
    if(this.selection.hasSelection() && this.selection.getTargetId()=== 'threading'){
      
       top += this.selection.getTop()*dims.h;
       left += this.selection.getLeft()*dims.w;
       this.svgEl.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px)';
    } 

    //render drawdown
    top = this.threadingCanvas.height+dims.h;
    left= dims.w*-1;

    this.canvasEl.style.transformOrigin = '0 0'; //scale from top left
    this.canvasEl.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px)';

    if(this.render.isFront()) this.canvasEl.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px)';
    else  this.canvasEl.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px) scale(-1, 1) translateX(-'+this.canvasEl.width+'px)';


    if(this.selection.hasSelection() && this.selection.getTargetId()=== 'drawdown'){
      
       top += (this.selection.getTop()+1)*dims.h;
       left += ((this.selection.getLeft()+1)*dims.w);
       

       this.svgEl.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px)';

    } 

    //render treadling
    top = (this.threadingCanvas.height+dims.h*2);
    left= this.canvasEl.width+dims.w;

    this.treadlingCanvas.style.transformOrigin = '0 0';
    this.treadlingCanvas.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px)';
    if(this.selection.hasSelection() && this.selection.getTargetId()=== 'treadling'){
        
        top += (this.selection.getTop())*dims.h;
        left += this.selection.getLeft()*dims.w;
        this.svgEl.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px)';
      } 

    //render tieups
    top = 0;
    left= this.canvasEl.width+dims.w;

    this.tieupsCanvas.style.transformOrigin = '0 0';
    this.tieupsCanvas.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px, '+top+'px)';

    if(this.selection.hasSelection() && this.selection.getTargetId()=== 'tieups'){
        
        top +=  this.selection.getTop()*dims.h;
        left += this.selection.getLeft()*dims.w;
        this.svgEl.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px)';
    } 

    //render weft systems
    top = (this.threadingCanvas.height+dims.h*2);
    left= this.canvasEl.width+this.treadlingCanvas.width+dims.w*2;

    this.weftSystemsCanvas.style.transformOrigin = '0 0';
    this.weftSystemsCanvas.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px)';
    
    if(this.selection.hasSelection() && this.selection.getTargetId()=== 'weft-systems'){
        
        top +=  this.selection.getTop()*dims.h;
        left += this.selection.getLeft()*dims.w;
        this.svgEl.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px)';
    } 

    //render weft materials
    top = (this.threadingCanvas.height+dims.h*2);
    left= (this.canvasEl.width+this.treadlingCanvas.width+dims.w*3);

    this.weftMaterialsCanvas.style.transformOrigin = '0 0';
    this.weftMaterialsCanvas.style.transform =  'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px)';

    if(this.selection.hasSelection() && this.selection.getTargetId()=== 'weft-materials'){
        
        top +=  this.selection.getTop()*dims.h;
        left += this.selection.getLeft()*dims.w;
        this.svgEl.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px)';
    }


  //render warp materials
    top = (-dims.h*3);
    left= 0;

    this.warpMaterialsCanvas.style.transformOrigin = '0 0';
    this.warpMaterialsCanvas.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px)';
 
    if(this.selection.hasSelection() && this.selection.getTargetId()=== 'warp-materials'){
          
          top +=  this.selection.getTop()*dims.h;
          left += this.selection.getLeft()*dims.w;


          this.svgEl.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px)';
    }


    //render warp systems
    top = (-dims.h*2);
    left= 0;


    this.warpSystemsCanvas.style.transformOrigin = '0 0';
    this.warpSystemsCanvas.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px)';
    
    if(this.selection.hasSelection() && this.selection.getTargetId()=== 'warp-systems'){
          top +=  this.selection.getTop()*dims.h;
          left += this.selection.getLeft()*dims.w;
          this.svgEl.style.transform = 'scale(' + scaleToFit + ') translate('+left+'px,'+top+'px)';
    }
  }


  public drawWarpsOver(){


    for (var i = 0; i < this.weave.visibleRows.length ; i++) {
       
        const row_index = this.weave.visibleRows[i];
        const row_values = this.weave.pattern[row_index];
        

        let overs = [];
        if(this.render.isFront()){
          overs = row_values.reduce((overs, v, idx) => v.isUp() ? overs.concat([idx]) : overs, []);
        }else{
          overs = row_values.reduce((overs, v, idx) => !v.isUp() ? overs.concat([idx]) : overs, []);
        }

        for(var o in overs){
            const shuttle_id = this.weave.colShuttleMapping[overs[o]];
            const system_id = this.weave.colSystemMapping[overs[o]];
            if(this.weave.warp_systems[system_id].isVisible()) this.drawWeftUp(i, overs[o], this.weave.shuttles[shuttle_id]);
        }

    }


  }

  


  public redrawYarnView(){

    let started:boolean = false;

    for(let i = 0; i < this.weave.visibleRows.length; i++){

      let index_row = this.weave.visibleRows[i];

      let row_values = this.weave.pattern[index_row];

      let shuttle_id = this.weave.rowShuttleMapping[index_row];

      let s = this.weave.shuttles[shuttle_id];

      //iterate through the rows
      for(let j = 0; j < row_values.length; j++){
        
        let p = row_values[j];

        if(p.isEastWest()){
          this.drawWeftOver(i,j,s);
        }else if(p.isSouthWest()){
          this.drawWeftBottomLeft(i,j,s);
        }else if(p.isNorthSouth()){
          this.drawWeftUp(i, j, s);
        }else if(p.isSouthEast()){
          this.drawWeftBottomRight(i,j,s);
        }else if(p.isNorthWest()){
          this.drawWeftLeftUp(i,j,s);
        }else if(p.isNorthEast()){
          this.drawWeftRightUp(i, j, s);
        }else if(p.isWest() || p.isEast()){
          if(started) this.drawWeftEnd(i, j, s);
          else{
            this.drawWeftStart(i, j, s);
            started = true;
          } 
        }else{
          
        }

      }
    }

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
    var front = this.render.isFront();

    this.cxThreading.clearRect(0,0, this.cxThreading.canvas.width, this.cxThreading.canvas.height);
    this.cxTreadling.clearRect(0,0, this.cxTreadling.canvas.width, this.cxTreadling.canvas.height);
    this.cxTieups.clearRect(0,0, this.cxTieups.canvas.width, this.cxTieups.canvas.height);


    this.cxThreading.canvas.width = base_dims.w * this.weave.loom.threading.length;
    this.cxThreading.canvas.height = base_dims.h * this.weave.loom.num_frames;
    if(front) this.drawGrid(this.cxThreading,this.threadingCanvas);
    else this.drawBlank(this.cxThreading,this.threadingCanvas);

    this.cxTreadling.canvas.width = base_dims.w * this.weave.loom.num_treadles;
    this.cxTreadling.canvas.height = base_dims.h * this.weave.visibleRows.length;
    if(front) this.drawGrid(this.cxTreadling,this.treadlingCanvas);
    else this.drawBlank(this.cxTreadling,this.treadlingCanvas);

    this.cxTieups.canvas.width = base_dims.w * this.weave.loom.tieup[0].length;
    this.cxTieups.canvas.height = base_dims.h * this.weave.loom.tieup.length;
    if(front) this.drawGrid(this.cxTieups,this.tieupsCanvas);
    else this.drawBlank(this.cxTieups,this.tieupsCanvas);
    


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
  }


  public unsetSelection(){
    d3.select(this.svgEl).style('display', 'none');

  }

public drawDrawdown(){
   switch(this.render.getCurrentView()){
      case 'pattern':
      this.redrawDraft();
      break;

      case 'yarn':
      this.redrawVisualView();
      break;

      case 'visual':
      this.redrawVisualView();
      break;
    }
}

//takes inputs about what, exactly to redraw
public redraw(flags:any){

    console.log("redraw: "+flags);

    var base_dims = this.render.getCellDims("base");

    if(flags.drawdown !== undefined){
        this.cx.clearRect(0,0, this.canvasEl.width, this.canvasEl.height);   
        this.cx.canvas.width = base_dims.w * (this.weave.pattern[0].length+2);
        this.cx.canvas.height = base_dims.h * (this.weave.visibleRows.length+2);
       
        this.cx.fillStyle = "#3d3d3d";
        this.cx.fillRect(0,0,this.canvasEl.width,this.canvasEl.height);
        this.drawDrawdown();
    }

    if(flags.weft_systems !== undefined){
      this.drawWeftSystems(this.cxWeftSystems, this.weftSystemsCanvas);
    }

    if(flags.weft_materials !== undefined){
      this.drawWeftMaterials(this.cxWeftMaterials, this.weftMaterialsCanvas);
    }

    if(flags.warp_systems !== undefined){
      this.drawWarpSystems(this.cxWarpSystems, this.warpSystemsCanvas);
    }

    if(flags.warp_materials !== undefined){
      this.drawWarpMaterials(this.cxWarpMaterials, this.warpMaterialsCanvas);
    }

    if(flags.loom !== undefined && this.render.showingFrames()){
       this.redrawLoom();
    }


    this.rescale();
  }
  

  /**
   * Redraws the entire canvas based on weave pattern.
   * @extends WeaveDirective
   * @returns {void}
   */
  public redrawDraft() {
    
    var base_dims = this.render.getCellDims("base");
    this.cx.fillStyle = "white";
    this.cx.fillRect(base_dims.w,base_dims.h,this.canvasEl.width - base_dims.w*2,this.canvasEl.height-base_dims.h*2);

    var i,j;

    this.drawGrid(this.cx,this.canvasEl);
    

    var color = '#000000';
    this.cx.fillStyle = color;
    for (i = 0; i < this.weave.visibleRows.length; i++) {
      this.redrawRow(i * base_dims.h, i, this.cx);
    }


     for (var x = 0; x < this.weave.colShuttleMapping.length; x++) {
     
      var id = this.weave.colShuttleMapping[x];
      var system = this.weave.warp_systems[this.weave.colSystemMapping[x]];
      var shuttle = this.weave.shuttles[id];

        if(!system.visible){
          var c = "#3d3d3d";
          var t = 100;

          var width = base_dims.w;
          var w_margin = base_dims.w;
          this.cx.fillStyle = c;
          this.cx.fillRect(x*base_dims.w+w_margin, 0, width, base_dims.h*this.weave.visibleRows.length);

        }
    }   
  }






  public drawWarps(cx){
    //draw all the warps

    var base_dims = this.render.getCellDims("base");
    var schematic = (this.render.getCurrentView() === "yarn");
    for (var x = 0; x < this.weave.colShuttleMapping.length; x++) {
     
      var id = this.weave.colShuttleMapping[x];
      var system = this.weave.warp_systems[this.weave.colSystemMapping[x]];
      var shuttle = this.weave.shuttles[id];

      if(system.visible){
          var c = shuttle.getColor();
          var t = shuttle.getThickness();
          var center = base_dims.w/2;


          cx.lineWidth = t/100 * .9*base_dims.w;
          cx.strokeStyle = (shuttle.type > 0 || !schematic) ? c : c+"10";
          cx.shadowColor = 'white';
          cx.shadowOffsetX = 0.5;
          cx.shadowOffsetY = 0;

          cx.beginPath();
          cx.moveTo((x+1)*base_dims.w + center, 0);
          cx.lineTo((x+1)*base_dims.w + center, base_dims.h*(this.weave.visibleRows.length+2));
          cx.stroke();

      }
    }
  }





  /**
   * Simulates the visual look of the weave pattern.
   * @extends WeaveDirective
   * @returns {void}
   */
  public redrawVisualView() {

    var base_dims = this.render.getCellDims("base");
    var back = this.render.view_back;

    this.cx.fillStyle = "#3d3d3d";
    this.cx.fillRect(0,0,this.canvasEl.width,this.canvasEl.height);

    this.drawWarps(this.cx);
    
    this.redrawYarnView();

    if(this.render.getCurrentView() === 'visual'){
      this.drawWarpsOver();
    }

    this.cx.strokeStyle = "#000";
    this.cx.fillStyle = "#000";
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
  public savePrintableDraft(fileName, obj) {


    let dims = this.render.getCellDims("base");

    let b = obj.bitmap.nativeElement;
    let context = b.getContext('2d');

    b.width = (this.weave.warps + this.weave.loom.num_treadles + 6) * dims.w;
    b.height = (this.weave.wefts + this.weave.loom.num_frames + 6) * dims.h;
    
    context.fillStyle = "white";
    context.fillRect(0,0,b.width,b.height);
    
    //systems
    context.drawImage(this.warpSystemsCanvas, 0, 0);
    context.drawImage(this.warpMaterialsCanvas, 0, dims.h);

    context.drawImage(this.threadingCanvas, 0, dims.h*3);
    context.drawImage(this.tieupsCanvas, (this.weave.warps +1)* dims.w, 3*dims.h);
    context.drawImage(this.canvasEl, -dims.w, (this.weave.loom.num_frames+3)*dims.h);
   
    context.drawImage(this.treadlingCanvas, (this.weave.warps +1)* dims.w, (this.weave.loom.num_frames + 4)*dims.h);

    context.drawImage(this.weftMaterialsCanvas,(this.weave.warps+ this.weave.loom.num_treadles +1)* dims.w, (this.weave.loom.num_frames + 4)*dims.h);
    context.drawImage(this.weftSystemsCanvas,(this.weave.warps+ this.weave.loom.num_treadles +2)* dims.w, (this.weave.loom.num_frames + 4)*dims.h);


    let link = obj.downloadLink.nativeElement;
    link.href = b.toDataURL("image/jpg");
    link.download = fileName + ".jpg";
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
   * ld updated 3/27 to account for new file structure
   */
  public saveWIF(fileName, obj) {
    //will need to import the obj for draft2wif.ts and then use it and pass this.weave for fileContents
    var fileContents = "[WIF]\nVersion=1.1\nDate=November 6, 2020\nDevelopers=Unstable Design Lab at the University of Colorado Boulder\nSource Program=AdaCAD\nSource Version=3.0\n[CONTENTS]";
    var fileType = "text/plain";

    fileContents += "\nCOLOR PALETTE=yes\nWEAVING=yes\nWARP=yes\nWEFT=yes\nTIEUP=yes\nCOLOR TABLE=yes\nTHREADING=yes\nWARP COLORS=yes\nTREADLING=yes\nWEFT COLORS=yes\n";
    
    fileContents += "[COLOR PALETTE]\n";
    fileContents += "Entries=" + (this.weave.shuttles.length).toString() +"\n";
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
    // ALL COlOR STORED in SHUTTLES NOW 
    // for (var i = 0; i < this.weave.warp_systems.length; i++) {
    //   fileContents+= (counter).toString();
    //   counter = counter + 1;
    //   fileContents+= "=";
    //   var hex = this.weave.warp_systems[i].color;
    //   if (hex.length == 7) {
    //     var r = "0x" + hex[1] + hex[2];
    //     var g = "0x" + hex[3] + hex[4];
    //     var b = "0x" + hex[5] + hex[6];

    //     fileContents += (+r).toString() + "," + (+g).toString() + "," + (+b).toString() + "\n";
    //   }
    // }

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
      }

  }

  public restorePreviousHistoryState(){
    
      var active_id = this.getActiveTimelineId();

      if(active_id+1 < this.timeline.length){
        this.timeline[active_id].is_active = false;
        this.timeline[active_id+1].is_active = true;
        this.weave = cloneDeep(this.timeline[active_id+1].draft);
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
