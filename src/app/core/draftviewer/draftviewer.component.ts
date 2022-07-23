import { Component, EventEmitter, Input, OnInit, HostListener, Output, ViewChild } from '@angular/core';
import { Subscription, Subject, fromEvent } from 'rxjs';
import { Render } from '../model/render';
import { Cell } from '../model/cell';
import { DesignMode, Draft, Drawdown, Interlacement, Loom, LoomSettings } from '../model/datatypes';
import {cloneDeep, forEach, now} from 'lodash';
import { FileService } from '../provider/file.service';
import { SelectionComponent } from './selection/selection.component';
import { DesignmodesService } from '../provider/designmodes.service';
import { MaterialsService } from '../provider/materials.service';
import { SystemsService } from '../provider/systems.service';
import { FabricssimService } from '../provider/fabricssim.service';
import { Shuttle } from '../model/shuttle';
import { StateService } from '../provider/state.service';
import { WorkspaceService } from '../provider/workspace.service';
import { hasCell, insertDrawdownRow, deleteDrawdownRow, insertDrawdownCol, deleteDrawdownCol, isSet, isUp, setHeddle, warps, wefts, pasteIntoDrawdown, initDraftWithParams, createBlankDrawdown, insertMappingRow, insertMappingCol, deleteMappingCol, deleteMappingRow } from '../model/drafts';
import { getLoomUtilByType, isFrame, isInThreadingRange, isInTreadlingRange, isInUserThreadingRange, isInUserTieupRange, isInUserTreadlingRange, numFrames, numTreadles } from '../model/looms';
import { computeYarnPaths, isEastWest, isNorthEast, isNorthWest, isSouthEast, isSouthWest } from '../model/yarnsimulation';
import { TreeService } from '../../mixer/provider/tree.service';
import { setDeprecationWarningFn } from '@tensorflow/tfjs-core/dist/tensor';
import { LoomModal } from '../modal/loom/loom.modal';
import utilInstance from '../model/util';

@Component({
  selector: 'app-draftviewer',
  templateUrl: './draftviewer.component.html',
  styleUrls: ['./draftviewer.component.scss']
})
export class DraftviewerComponent implements OnInit {

  @ViewChild('bitmapImage') bitmap;
  @ViewChild('selection', {read: SelectionComponent, static: true}) selection: SelectionComponent;


  @Input('id') id;

  /**
   * a descriptor of the parent who generated this window
   * @property {string} will be "weaver" or "mixer"
   */
   @Input('source') source: string;

  @Input('render') render: Render;

 
 /**
    * The Timeline object containing state histories for undo and redo
    * @property {Timeline}
   */
  //  @Input('timeline') timeline: any;
 
   @Input() viewonly: boolean;

 
 
   @Output() onNewSelection = new EventEmitter();
 
 
  hold_copy_for_paste: boolean = false;

  //store this here as you need it to draw the view
  colShuttleMapping: Array<number>;
  rowShuttleMapping: Array<number>;


 /**
    * The HTML canvas element within the weave draft.
    * @property {HTMLCanvasElement}
   */ 
   canvasEl: HTMLCanvasElement;
 
 /**
    * the window holding the draft.
    * @property {HTMLCanvasElement}
   */ 
   draftContainer: HTMLElement;
 
 
   /**
    * flag defining if there needs to be a recomputation of the draft on Mouse Up
    */
   flag_recompute: boolean;
 
 
   /**
    * flag defining if there needs to be a recomputation of the draft on Mouse Up
    */
   flag_history: boolean;
 
 
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


   copy: Drawdown;
 
 
   /**
    * Subscribes to move event after a touch event is started.
    * @property {Subscription}
    */
   moveSubscription: Subscription;
 
 
   /**
    * The HTML div element used to show the weft-systems text.
    * @property {HTMLElement}
    */
   divWesy: HTMLElement;
 
   /**
    * The HTML div element used to show the warp-systems text.
    * @property {HTMLElement}
    */
   divWasy: HTMLElement;
 
 
   /**
    * The HTML div element used to show and hide the frames.
    * @property {HTMLElement}
    */
   divViewFrames: HTMLElement;
 
 
  /**
    * The HTML SVG element used to show the row
    * @property {HTMLElement}
    */
   svgSelectRow: HTMLElement;
 
 
  /**
    * The HTML SVG element used to show the row
    * @property {HTMLElement}
    */
   svgSelectCol: HTMLElement;
 
 
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
 
   private tempPattern: Array<Array<Cell>>;
   private unsubscribe$ = new Subject();

 
   private lastPos: Interlacement;
 
   isFrame: boolean;

 
   /// ANGULAR FUNCTIONS
   /**
    * Creates the element reference.
    * @constructor
    */

  constructor(
    private fs: FileService,
    private dm: DesignmodesService,
    private ms: MaterialsService,
    private ss: SystemsService,
    public ws: WorkspaceService,
    public timeline: StateService,
    private tree:TreeService
    ) { 

    this.flag_recompute = false;
    this.flag_history = false;

  }

  ngOnInit() {

    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    this.isFrame = isFrame(loom_settings);
    this.viewonly = !this.tree.isSeedDraft(this.id);

    this.colShuttleMapping = draft.colShuttleMapping;
    this.rowShuttleMapping = draft.rowShuttleMapping;

  }

  ngAfterViewInit(){

    // define the elements and context of the weave draft, threading, treadling, and tieups.
    this.canvasEl = <HTMLCanvasElement> document.getElementById('drawdown');
    this.draftContainer = <HTMLElement> document.getElementById('draft-container');


  
    // this.svgSelectRow = el.nativeElement.children[12];
    // this.svgSelectCol = el.nativeElement.children[13];
    this.divWesy =  document.getElementById('weft-systems-text');
    this.divWasy =  document.getElementById('warp-systems-text');
    this.divViewFrames = document.getElementById('view_frames');

    this.threadingCanvas = <HTMLCanvasElement> document.getElementById('threading');
    this.tieupsCanvas = <HTMLCanvasElement> document.getElementById('tieups');
    this.treadlingCanvas = <HTMLCanvasElement> document.getElementById('treadling');
    this.weftSystemsCanvas = <HTMLCanvasElement> document.getElementById('weft-systems');
    this.weftMaterialsCanvas = <HTMLCanvasElement> document.getElementById('weft-materials');
    this.warpSystemsCanvas = <HTMLCanvasElement> document.getElementById('warp-systems');
    this.warpMaterialsCanvas =<HTMLCanvasElement> document.getElementById('warp-materials');
    
    this.cx = this.canvasEl.getContext('2d');
    this.cxThreading = this.threadingCanvas.getContext('2d');
    this.cxTreadling = this.treadlingCanvas.getContext('2d');
    this.cxTieups = this.tieupsCanvas.getContext('2d');
    this.cxWarpSystems = this.warpSystemsCanvas.getContext('2d');
    this.cxWeftSystems = this.weftSystemsCanvas.getContext('2d');
    this.cxWarpMaterials = this.warpMaterialsCanvas.getContext('2d');
    this.cxWeftMaterials = this.weftMaterialsCanvas.getContext('2d');
    // set the width and height

    this.rescale(this.render.getZoom());

  }

  //this is called anytime a new draft object is loaded. 
  onNewDraftLoaded(draft: Draft, loom:Loom, loom_settings:LoomSettings) {  


    const frames = Math.max(numFrames(loom), loom_settings.frames);
    const treadles = Math.max(numTreadles(loom), loom_settings.treadles);

    const warp_num:number = warps(draft.drawdown);
    const weft_num:number = wefts(draft.drawdown);

    var dims = this.render.getCellDims("base");
    this.canvasEl.width = warp_num * dims.w;
    this.canvasEl.height = weft_num * dims.h;
    this.threadingCanvas.width = warp_num * dims.w;
    this.threadingCanvas.height = frames * dims.h;
    this.treadlingCanvas.height = weft_num * dims.h;
    this.treadlingCanvas.width = treadles * dims.w;
    this.tieupsCanvas.width = treadles*dims.w;
    this.tieupsCanvas.height = frames * dims.h;


    this.weftSystemsCanvas.width =  dims.w;
    this.weftSystemsCanvas.height = weft_num * dims.h;
    this.weftMaterialsCanvas.width =  dims.w;
    this.weftMaterialsCanvas.height = weft_num * dims.h;

    this.warpSystemsCanvas.width =  warp_num * dims.w;
    this.warpSystemsCanvas.height = dims.h;
    this.warpMaterialsCanvas.width =  warp_num * dims.w;
    this.warpMaterialsCanvas.height = dims.h;


  }

  clearSelection(){
        this.selection.unsetParameters();
        // d3.select(this.svgSelectCol).style('display', 'none');
        // d3.select(this.svgSelectRow).style('display', 'none');
  }

  ngOnDestroy() {
     this.removeSubscription();
  }


  /**
   *  takes an event from mouse event and determines how to handle it 
   * @param target the dom target of the mouse click
   * @param shift whether or not the shift key is being held
   * @param currentPos the position of the click within the target
   */
  setPosAndDraw(target:HTMLElement, shift: boolean, currentPos:Interlacement){
      const draft = this.tree.getDraft(this.id);
      const loom = this.tree.getLoom(this.id);
      const loom_settings = this.tree.getLoomSettings(this.id);
      

      if (target && target.id =='treadling') {
        if(this.viewonly) return;
        currentPos.i = this.render.visibleRows[currentPos.i];
        this.drawOnTreadling(loom, loom_settings, currentPos);
      } else if (target && target.id === 'tieups') {
        if(this.viewonly || loom_settings.type === "direct") return;
        this.drawOnTieups(loom, loom_settings, currentPos);
      } else if (target && target.id === ('threading')) {
        if(this.viewonly) return;
        //currentPos.i = this.loom.frame_mapping[currentPos.i];
        this.drawOnThreading(loom, loom_settings, currentPos);
      } else if(target && target.id === ('weft-systems')){
        if(this.viewonly) return;
        currentPos.i = this.render.visibleRows[currentPos.i];
        this.drawOnWeftSelectors(draft, currentPos);
      }else if(target && target.id === ('warp-systems')){
        if(this.viewonly) return;
        this.drawOnWarpSelectors(draft, currentPos);
      }else if(target && target.id === ('weft-materials')){
        if(this.viewonly) return;
        currentPos.i = this.render.visibleRows[currentPos.i];
        this.drawOnWeftMaterials(draft, currentPos);
      }else if(target && target.id === ('warp-materials')){
        if(this.viewonly) return;
        this.drawOnWarpMaterials(draft, currentPos);
      } else{
        if(this.viewonly) return;
        currentPos.i = this.render.visibleRows[currentPos.i];
        this.drawOnDrawdown(draft, loom_settings, currentPos, shift);
      }

      this.flag_history = true;
    }



  /**
   * Touch start event. Subscribes to the move event.
   * @extends WeaveDirective
   * @param {Event} event - The mousedown event.
   * @returns {void}
   */
  @HostListener('mousedown', ['$event'])
  private onStart(event) {

    const loom = this.tree.getLoom(this.id);
    const draft = this.tree.getDraft(this.id);

    const frames = numFrames(loom);
    const treadles = numTreadles(loom);


    //get dimis based on zoom.
    let dims ={
      w: this.warpSystemsCanvas.width / warps(draft.drawdown),
      h: this.weftSystemsCanvas.height / this.render.visibleRows.length
    }


    if (event.target.localName === 'canvas') {
    
      this.removeSubscription();    
      
      this.moveSubscription = 
        fromEvent(event.target, 'mousemove').subscribe(e => this.onMove(e));   

      // set up the Point to be used.
      var screen_row = Math.floor(event.offsetY / dims.h);

      const currentPos: Interlacement = {
        si: screen_row,
        i: screen_row, //row
        j: Math.floor((event.offsetX) / dims.w), //col
      };


      if(!event.target) return;

      //reject out of bounds requests
      switch(event.target.id){
        case 'drawdown':
          currentPos.si -=1;
          currentPos.i -=1;
          currentPos.j -=1;
          if(currentPos.i < 0 || currentPos.i >= this.render.visibleRows.length) return;
          if(currentPos.j < 0 || currentPos.j >= warps(draft.drawdown)) return;    
          break;

        case 'threading':
          // if(currentPos.i < 0 || currentPos.i >= frames) return;
          // if(currentPos.j < 0 || currentPos.j >= warps(draft.drawdown)) return;    
          break; 

        case 'treadling':
          // if(currentPos.i < 0 || currentPos.i >= this.render.visibleRows.length) return;
          // if(currentPos.j < 0 || currentPos.j >= treadles) return;    
          break;

        case 'tieups':
          // if(currentPos.i < 0 || currentPos.i >= frames) return;
          // if(currentPos.j < 0 || currentPos.j >= treadles) return;    
        break;

        case 'warp-materials':
        case 'warp-systems':
          if(currentPos.j < 0 || currentPos.j >= warps(draft.drawdown)) return;    
          break;

        case 'weft-materials':
        case 'weft-systems':
          if(currentPos.i < 0 || currentPos.i >= this.render.visibleRows.length) return;
          break;
      }





      // Save temp pattern
      this.tempPattern = cloneDeep(draft.drawdown);
      const selected: DesignMode = this.dm.getSelectedDesignMode('design_modes');
      

      switch (selected.value) {

        case 'draw':

          switch(this.dm.getSelectedDesignMode('draw_modes').value){

            case 'toggle':
              this.setPosAndDraw(event.target, event.shiftKey, currentPos);
            break;
    
            case 'up':
            case 'down':
            case 'unset':
            case 'material':
              this.setPosAndDraw(event.target, event.shiftKey, currentPos);
              this.flag_recompute = true;
    
              break;
          }


        
        break;
        case 'select':
        case 'copy':

            if(event.shiftKey){
              this.selection.onSelectDrag(currentPos);
              this.selection.onSelectStop();
            }   
            else this.selection.onSelectStart(event.target, currentPos);

          break;
          default:
          break;
      }

      this.lastPos = {
        si: currentPos.si,
        i: currentPos.i, //row
        j: currentPos.j //col
      };

    }
  }

  private isSame(p1: Interlacement, p2:Interlacement){
    if(p1 === undefined || p2 === undefined ) return false
    return (p1.i == p2.i && p1.j === p2.j);

  }



  /**
   * Event called when mouse down and moved within the canvas.
   * @extends WeaveDirective
   * @param {Event} event - The mousemove event.
   * @returns {void}
   */
  private onMove(event) {

    const draft = this.tree.getDraft(this.id);

    let dims ={
      w: this.warpSystemsCanvas.width / warps(draft.drawdown),
      h: this.weftSystemsCanvas.height /this.render.visibleRows.length
    };    

    var offset = this.render.getCellDims(this.dm.getSelectedDesignMode('design_modes').value);
  
    // set up the point based on touched square.
    var screen_row = Math.floor((event.offsetY + offset.y) / dims.h);

    const currentPos: Interlacement = {
      si: screen_row,
      i:  screen_row,
      j:  Math.floor((event.offsetX + offset.x) / dims.w)
    };

   


    if(event.target && event.target.id==="drawdown"){
      currentPos.si -=1;
      currentPos.i -=1;
      currentPos.j -=1;
    }

   

    //don't call unless you've moved to a new spot
    if(this.isSame(currentPos, this.lastPos)) return;

    // determine action based on brush type. invert inactive on move.
    switch (this.dm.getSelectedDesignMode('design_modes').value) {
      case 'draw':
        switch(this.dm.getSelectedDesignMode('draw_modes').value){
          case 'up':
          case 'down':
          case 'unset':
          case 'material':
          //this.unsetSelection();

          if(currentPos.i < 0 || currentPos.i >= this.render.visibleRows.length) return;
          if(currentPos.j < 0 || currentPos.j >= warps(draft.drawdown)) return;


          this.setPosAndDraw(event.target, event.shiftKey, currentPos);
          this.flag_recompute = true;


        
        break;
        }

      break;
      


      case 'select':
      case 'copy':

        this.selection.onSelectDrag(currentPos);

        break;
      case 'invert':
      default:
        break;
    }

    this.lastPos = {
        si: currentPos.si,
        i: currentPos.i, //row
        j: currentPos.j //col
      };
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
    const draft = this.tree.getDraft(this.id);


     this.lastPos = {
      si: -1,
      i: -1,
      j: -1
     }

     if(this.flag_history && event.type == 'mouseup'){
        this.timeline.addHistoryState(draft);
        this.flag_history = false;
      } 


     if(this.flag_recompute && event.type == 'mouseup'){
      if(this.render.isYarnBasedView()) computeYarnPaths(draft, this.ms.getShuttles());
      this.flag_recompute = false;
     }



    // remove subscription unless it is leave event with select.
    if (!(event.type === 'mouseleave' && (this.dm.isSelected('select','design_modes') || this.dm.isSelected('copy','design_actions')))){
      this.removeSubscription();
      this.selection.onSelectStop();
    }

  }

  /**
   * This is emitted from the selection
   */
  onSelectionEnd(){
    if(!this.hold_copy_for_paste) this.copyArea();
  }

  /**
   * Remove the subscription from the move event.
   * @extends WeaveDirective
   * @returns {void}
   */
 private removeSubscription() {    
    if (this.moveSubscription) {
      this.moveSubscription.unsubscribe();
    }
  }

  /**
   * Creates the copied pattern. Hack for warp and weft shuttles is that it creates a 2d arrray representing the 
   * threading or treadling with "true" in the frame/threadle associated with that col/row. 
   * @extends WeaveDirective
   * @returns {void}
   */
  private copyArea() {

    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);

   const screen_i = this.selection.getStartingRowScreenIndex();    
   const draft_j = this.selection.getStartingColIndex();
  
    var w = this.selection.getWidth();
    var h = this.selection.getHeight();

    this.copy = initDraftWithParams({wefts: h, warps: w, drawdown: [[new Cell(false)]]}).drawdown;
    const temp_copy: Array<Array<boolean>> = [];

    if(this.selection.getTargetId() === 'weft-systems'){
      for(var i = 0; i < h; i++){
        temp_copy.push([]);
        for(var j = 0; j < this.ss.weft_systems.length; j++){
          temp_copy[i].push(false);
        }
      }
    }else if(this.selection.getTargetId()=== 'warp-systems'){
      for(var i = 0; i < this.ss.warp_systems.length; i++){
        temp_copy.push([]);
        for(var j = 0; j < w; j++){
          temp_copy[i].push(false);
        }
      }
    }else if(this.selection.getTargetId()=== 'weft-materials'){
      for(var i = 0; i < h; i++){
        temp_copy.push([]);
        for(var j = 0; j < this.ms.getShuttles().length; j++){
          temp_copy[i].push(false);
        }
      }
    }else if(this.selection.getTargetId() === 'warp-materials'){
      for(var i = 0; i < this.ms.getShuttles().length; i++){
        temp_copy.push([]);
        for(var j = 0; j < w; j++){
          temp_copy[i].push(false);
        }
      }
    }else{
       for (var i = 0; i < h; i++){
        temp_copy.push([]);
        for (var j = 0; j < w; j++){
          temp_copy[i].push(false);
        }
       }
    }


    //iterate through the selection
    for (var i = 0; i < temp_copy.length; i++) {
      for(var j = 0; j < temp_copy[0].length; j++) {

        var screen_row = screen_i + i;
        var draft_row = this.render.visibleRows[screen_row];
        var col = draft_j + j;

        switch(this.selection.getTargetId()){
          case 'drawdown':
            temp_copy[i][j]= isUp(draft.drawdown, draft_row, col);
          break;
          case 'threading':
            //  var frame = this.loom.frame_mapping[screen_row];
            //  temp_copy[i][j]= this.loom.isInFrame(col,frame);
             temp_copy[i][j]= (loom.threading[col] === screen_row);

          break;
          case 'treadling':
            temp_copy[i][j] = (loom.treadling[screen_row].find(el => el === col) !== undefined);;
          break;
          case 'tieups':
              //var frame = this.loom.frame_mapping[screen_row];
              //temp_copy[i][j] = this.loom.hasTieup({i: frame, j: col, si: screen_row});
              temp_copy[i][j] = loom.tieup[screen_row][col];


          break;  
          case 'warp-systems':
            temp_copy[i][j]= (draft.colSystemMapping[col] == i);
          break;
          case 'weft-systems':
            temp_copy[i][j]= (draft.rowSystemMapping[draft_row] == j);
          break;
          case 'warp-materials':
            temp_copy[i][j]= (draft.colShuttleMapping[col] == i);
          break;
          case 'weft-materials':
            temp_copy[i][j]= (draft.rowShuttleMapping[draft_row] == j);
          break;
          default:
          break;
        }

      }
    }

    if(temp_copy.length == 0) return;

    const temp_dd: Drawdown = createBlankDrawdown(temp_copy.length, temp_copy[0].length);
     temp_copy.forEach((row,i) => {
      row.forEach((cell, j) => {
        temp_dd[i][j].setHeddle(cell);
      })
    })
    this.copy = initDraftWithParams({warps: w, wefts: h, drawdown: temp_dd}).drawdown;
    this.onNewSelection.emit(this.copy);



  }



  private drawWeftMaterialCell(draft:Draft, cx:any, i:number){
           

    var dims = this.render.getCellDims("base");
    var margin = this.render.zoom;

    const ndx: number = draft.rowShuttleMapping[i];
    cx.fillStyle = this.ms.getColor(ndx);

    if(i == wefts(draft.drawdown)-1) cx.fillRect(margin, (dims.h*i)+margin, dims.w, dims.h-(margin*2));
    else cx.fillRect(margin, (dims.h*i)+margin, dims.w, dims.h-(margin));

  }


  private drawWeftMaterials(draft:Draft, cx:any, canvas:any){

      var dims = this.render.getCellDims("base");
      var margin = this.render.zoom;
      var top = dims.h;

      cx.clearRect(0,0, cx.canvas.width, cx.canvas.height);


      canvas.width =  dims.w;
      canvas.height = this.render.visibleRows.length * dims.h;

      cx.fillStyle = "white";
      cx.fillRect(0,0,canvas.width,this.render.visibleRows.length*dims.h);

      for(var i = 0 ; i < this.render.visibleRows.length; i++){
          this.drawWeftMaterialCell(draft, cx, i);        
      }


  }

  private drawWarpMaterialCell(draft:Draft, cx:any, j:number){


        var dims = this.render.getCellDims("base");
        var margin = this.render.zoom;
       const ndx: number = draft.colShuttleMapping[j];
        cx.fillStyle = this.ms.getColor(ndx);

        if(j == warps(draft.drawdown)-1) cx.fillRect((dims.w*j)+margin, 0, dims.w-(margin*2), (dims.h) - margin);
        else cx.fillRect( (dims.w*j)+margin, 0, dims.w-margin, (dims.h) - margin);
  
  }


  private drawWarpMaterials(draft:Draft, cx:any,canvas:any){

    var dims = this.render.getCellDims("base");
    var margin = this.render.zoom;

    this.warpMaterialsCanvas.width =  warps(draft.drawdown) * dims.w;
    this.warpMaterialsCanvas.height = dims.h;

    cx.fillStyle = "white";
    cx.fillRect(0,0,canvas.width,canvas.height);
  

    for(var j = 0; j < warps(draft.drawdown); j++){
      this.drawWarpMaterialCell(draft, cx, j);
    } 

  }




  private drawWeftSelectorCell(draft:Draft, cx:any, i:number){

        var dims = this.render.getCellDims("base");
        var margin = this.render.zoom;

        cx.fillStyle = "#303030";
        if(i == wefts(draft.drawdown)-1) cx.fillRect(margin, (dims.h*i)+margin, dims.w, dims.h-(margin*2));
        else cx.fillRect(margin, (dims.h*i)+margin, dims.w, dims.h-(margin));
         
         cx.fillStyle = "#ffffff";  
         cx.font = "10px Arial";

         const sys = draft.rowSystemMapping[i];
         cx.fillText(this.ss.getWeftSystemCode(sys), dims.w/3, (dims.h*i)+3*dims.h/4);

  }


  private drawWeftSystems(draft:Draft, cx:any, canvas:HTMLCanvasElement){

      var dims = this.render.getCellDims("base");
      var top = dims.h;

      cx.clearRect(0,0, cx.canvas.width, cx.canvas.height);


      canvas.width =  dims.w;
      canvas.height = this.render.visibleRows.length * dims.h;

      cx.fillStyle = "white";
      cx.fillRect(0,0,canvas.width,this.render.visibleRows.length*dims.h);

      for(var i = 0 ; i < this.render.visibleRows.length; i++){
          this.drawWeftSelectorCell(draft,cx, i);        
      }


  }

  private drawWarpSelectorCell(draft:Draft, cx:any, j:number){

        var dims = this.render.getCellDims("base");
        var margin = this.render.zoom;
        cx.fillStyle = "#303030";

        if(j == warps(draft.drawdown)-1) cx.fillRect((dims.w*j)+margin, 0, dims.w-(margin*2), (dims.h) - margin);
        else cx.fillRect( (dims.w*j)+margin, 0, dims.w-margin, (dims.h) - margin);
  
         cx.fillStyle = "#ffffff";  
         cx.font = "10px Arial";

         const sys = draft.colSystemMapping[j];
         cx.fillText(this.ss.getWarpSystemCode(sys),(dims.w*j)+dims.w/3, dims.w-(margin*3));


  }


  private drawWarpSystems(draft:Draft, cx:any,canvas:HTMLCanvasElement){

    var dims = this.render.getCellDims("base");

    this.warpSystemsCanvas.width =  warps(draft.drawdown) * dims.w;
    this.warpSystemsCanvas.height = dims.h;

    cx.fillStyle = "white";
    cx.fillRect(0,0,canvas.width,canvas.height);
  

    for(var j = 0; j < warps(draft.drawdown); j++){
      this.drawWarpSelectorCell(draft, cx, j);
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
  private drawGrid(loom: Loom, loom_settings: LoomSettings, cx:any,canvas:HTMLCanvasElement) {
    var i,j;

    var dims = this.render.getCellDims("base");

    if(canvas.id=== "threading"){
      cx.fillStyle = "white";
      cx.fillRect(0,0,canvas.width,canvas.height);
      // cx.fillStyle = "#cccccc";
      // cx.fillRect(0, 0, canvas.width, (frames - loom_settings.frames)*dims.h);
    }
    else if (canvas.id=== "treadling"){
      cx.fillStyle = "white";
      cx.fillRect(0,0,canvas.width,canvas.height);
      // cx.fillStyle = "#cccccc";
      // var start = loom_settings.frames * dims.w;
      // cx.fillRect(start, 0, canvas.width - start, canvas.height);

    }
    else if (canvas.id=== "tieups"){
      cx.fillStyle = "white";
      cx.fillRect(0,0,canvas.width,canvas.height);
      // cx.fillStyle = "#cccccc";
      // var start = loom_settings.treadles * dims.w;
      // cx.fillRect(start, 0, canvas.width - start, canvas.height);
      // cx.fillRect(0, 0, canvas.width, (frames -loom_settings.frames)*dims.h);

    }


    cx.fillStyle="black";
    cx.lineWidth = .5;
    cx.lineCap = 'round';
    cx.strokeStyle = '#000';

    //only draw the lines if the zoom is big enough to render them well

      // draw vertical lines
      for (i = 0; i <= canvas.width; i += dims.w) {
        
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




  /**
   * Change shuttle of row to next in list. If there isn't a next in list, create a new System
   * @extends WeaveComponent
   * @param {Point} the point of the interaction
   * @returns {void}
   */
  private drawOnWeftSelectors(draft:Draft, currentPos: Interlacement ) {

    if (!this.cx || !currentPos) { return; }

    var draft_row = currentPos.i; //need to offset this due to canvas padding
   
    var screen_row = currentPos.si;

    if(screen_row < 0){ return; }

    var newSystem = this.ss.getNextWeftSystem(draft_row, draft);

    draft.rowSystemMapping[draft_row] = newSystem;

    this.tree.setDraftOnly(this.id, draft);
    this.drawWeftSelectorCell(draft, this.cxWeftSystems,draft_row);




  }


    /**
   * Change shuttle of row to next in list.
   * @extends WeaveComponent
   * @param {Point} the point of the interaction
   * @returns {void}
   */
  private drawOnWeftMaterials(draft: Draft, currentPos: Interlacement ) {

    var dims = this.render.getCellDims("base");
    var updates;

    if (!this.cx || !currentPos) { return; }

    var draft_row = currentPos.i; //need to offset this due to canvas padding
    var screen_row = currentPos.si;

    if(screen_row < 0){ return; }

    if(this.dm.isSelected('material', 'draw_modes')){
      const material_id:string = this.dm.getSelectedDesignMode('draw_modes').children[0].value;
      draft.rowShuttleMapping[draft_row] = parseInt(material_id);
    }else{
      const len = this.ms.getShuttles().length;
      var shuttle_id = draft.rowShuttleMapping[draft_row];
      var newShuttle = (shuttle_id + 1) % len;
      draft.rowShuttleMapping[draft_row] = newShuttle;
    }

    this.tree.setDraftOnly(this.id, draft);
    this.rowShuttleMapping = draft.rowShuttleMapping;
    this.drawWeftMaterialCell(draft, this.cxWeftMaterials,draft_row);

  }

  /**
   * Change column to next row in the list
   * @extends WeaveComponent
   * @param {Point} the point of the interaction
   * @returns {void}
   */
  private drawOnWarpSelectors(draft: Draft, currentPos: Interlacement ) {

    var dims = this.render.getCellDims("base");

    if (!this.cxWarpSystems || !currentPos) { return; }

    var col = currentPos.j; //need to offset this due to canvas padding

    if(col < 0){ return; }

    var newSystem = this.ss.getNextWarpSystem(col,draft);

    draft.colSystemMapping[col] = newSystem;
    this.tree.setDraftOnly(this.id, draft);

    this.drawWarpSelectorCell(draft, this.cxWarpSystems,(col));
  }


  /**
   * Change column to next row in the list
   * @extends WeaveComponent
   * @param {Point} the point of the interaction
   * @returns {void}
   */
  private drawOnWarpMaterials(draft: Draft, currentPos: Interlacement ) {

    if (!this.cxWarpSystems || !currentPos) { return; }

    var col = currentPos.j; //need to offset this due to canvas padding

    if(col < 0){ return; }
    const material_mode: DesignMode = this.dm.getDesignMode('material', 'draw_modes');

    if(material_mode.selected){
        const material_id:string = material_mode.children[0].value;
        draft.colShuttleMapping[col] = parseInt(material_id);
    }else{
      const newShuttle = this.ms.getNextShuttle( draft.colShuttleMapping[col]);
     draft.colShuttleMapping[col] = newShuttle.id;
    }

    this.tree.setDraftOnly(this.id, draft);
    this.drawWarpMaterialCell(draft, this.cxWarpMaterials,col);
    this.colShuttleMapping = draft.colShuttleMapping;
  }



  /**
   * Called when a single point "draw" event is called on the
   * @param {Point} currentPos - the current position of the mouse within draft.
   * @param shift - boolean for if the shift key was being held when this operation was called
   * @returns {void}
   */

  private drawOnDrawdown(draft:Draft, loom_settings: LoomSettings,  currentPos: Interlacement, shift: boolean) {


    var updates;
    var val  = false;


    if (!this.cx || !currentPos) { return; }


    
    if(hasCell(draft.drawdown, currentPos.i, currentPos.j)){

      // Set the heddles based on the brush.
      switch (this.dm.getSelectedDesignMode('draw_modes').value) {
        case 'up':
          val = true;
          draft.drawdown = setHeddle(draft.drawdown, currentPos.i,currentPos.j,val);
          break;
        case 'down':
          val = false;
          draft.drawdown = setHeddle(draft.drawdown, currentPos.i,currentPos.j,val);
          break;
        case 'toggle':
          if(shift){
            val = null;
          } 
          else val = !isUp(draft.drawdown, currentPos.i,currentPos.j);
          draft.drawdown = setHeddle(draft.drawdown, currentPos.i,currentPos.j,val);

          break;

        case 'unset':
          draft.drawdown = setHeddle(draft.drawdown, currentPos.i,currentPos.j,null);

 
        break;
        case 'material':
          this.drawOnWeftMaterials(draft, currentPos);
          this.drawOnWarpMaterials(draft, currentPos)
        break;        
        default:
          break;
      }


      // if(this.render.getCurrentView() == 'pattern'){
      //   this.drawCell(this.cx,currentPos.si, currentPos.j, "drawdown");
      // }else{
      //   this.drawYarn(currentPos.si, currentPos.j, val);
      // }


      this.tree.setDraftAndRecomputeLoom(this.id, draft, this.tree.getLoomSettings(this.id))
      .then(loom => {
        this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true});

        
      })
      .catch(console.error);
    
    }
    
  }

  /**
   * Draws or erases a single rectangle on the canvas. Updates the tieups.
   * @extends WeaveDirective
   * @param {Point} currentPos - the current position of the mouse within draft.
   * @returns {void}
   */
  private drawOnTieups(loom: Loom, loom_settings:LoomSettings, currentPos: Interlacement ) {
    var updates;
    var val = false;
    const frames = numFrames(loom);
    const treadles = numFrames(loom);

    if (!this.cxTieups || !currentPos) { return; }


    if (isInUserTieupRange(loom, loom_settings,  currentPos)){
      switch (this.dm.getSelectedDesignMode('draw_modes').value) {
        case 'up':
            val = true;
          break;
        case 'down':
          val = false;
          break;
        case 'toggle':
          val = !loom.tieup[currentPos.i][currentPos.j];
          break;
        default:
          break;
      }

    const utils = getLoomUtilByType(loom_settings.type);
    loom = utils.updateTieup(loom, {i:currentPos.i,j: currentPos.j, val:val});
    this.tree.setLoomAndRecomputeDrawdown(this.id, loom,loom_settings)
    .then(draft => {
      this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true});
    })
     
    }
  }

  /**
   * Draws or erases a single rectangle on the canvas. Updates the threading.
   * @extends WeaveDirective
   * @param {Point} currentPos - the current position of the mouse within draft.
   * @returns {void}
   */
  private drawOnThreading(loom:Loom, loom_settings: LoomSettings, currentPos: Interlacement ) {
    

    if (!this.cxThreading || !currentPos) { return; }
    
    

    if (isInUserThreadingRange(loom, loom_settings, currentPos)){
      var val = false;

      //modify based on the current view 
       // currentPos.i = this.translateThreadingRowForView(loom, loom_settings,currentPos.i)


      switch (this.dm.getSelectedDesignMode('draw_modes').value) {
        case 'up':
          val = true;
          break;
        case 'down':
          val = false;
          break;
        case 'toggle':
          val = !(loom.threading[currentPos.j] == currentPos.i);
          break;
        default:
          break;
      }

      const utils = getLoomUtilByType(loom_settings.type);
      loom = utils.updateThreading(loom, {i:currentPos.i, j:currentPos.j, val:val});
      this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
      .then(draft => {
        this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true});
      });
    }
  }


  /**
   * Draws or erases a single rectangle on the canvas. Updates the treadling.
   * @extends WeaveDirective
   * @param {Point} currentPos - the current position of the mouse within draft.
   * @returns {void}
   */
  private drawOnTreadling(loom: Loom, loom_settings: LoomSettings, currentPos: Interlacement ) {

    if (!this.cxTreadling || !currentPos) { return; }
    
    var val = false;

    if(isInUserTreadlingRange(loom, loom_settings, currentPos)){
      switch (this.dm.getSelectedDesignMode('draw_modes').value) {
        case 'up':
          val = true;
          break;
        case 'down':
          val = false;
          break;
        case 'toggle':
          val = !(loom.treadling[currentPos.i].find(el => el === currentPos.j) !== undefined);
          break;
        default:
          break;
      }
    


      //this updates the value in the treadling
      const utils = getLoomUtilByType(loom_settings.type);
      loom = utils.updateTreadling(loom, {i:currentPos.i, j:currentPos.j, val:val});
      this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
      .then(draft => {
        this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true});
      })
    }
   }






//This function draws whatever the current value is at screen coordinates cell i, J
  private drawCell(draft: Draft, loom: Loom, loom_settings: LoomSettings, cx:any, i:number, j:number, type:string){

    var base_dims = this.render.getCellDims("base");
    var base_fill = this.render.getCellDims("base_fill");
    var is_up = false;
    var is_set = false;
    var color = "#FFFFFF";
    var beyond = false;

    var top = 0; 
    var left = 0;



    switch(type){
      case 'drawdown':
        var row = this.render.visibleRows[i];
        
        is_up = isUp(draft.drawdown, row,j);
        is_set = isSet(draft.drawdown, row,j);

        if(!this.render.isFront()) is_up = !is_up;

        if(!is_set){
          color = "#cccccc";
        }
        else {
          if(is_up) color = "#333333";
        }

        top = base_dims.h;
        left = base_dims.w;

      break;
      case 'threading':
        var frame = loom.threading[j];
        is_up = (frame == i);
        beyond = frame > loom_settings.frames; 
        //i = this.translateThreadingRowForView(loom, loom_settings, i);
        
        if(is_up)  color = "#333333";
        //i = this.loom.frame_mapping[frame];

      break;
      case 'tieup':
        is_up = (loom.tieup[i][j]);
        beyond = i > loom_settings.frames; 
        if(is_up) color = "#333333";
        //i = this.loom.frame_mapping[i];

      break;
      case 'treadling':
        //i and j is going to come from the UI which is only showing visible rows
        var row = this.render.visibleRows[i];
        is_up = (loom.treadling[row].find(el => el == j)) !== undefined;
        if(is_up)  color = "#333333";

      break;

    }

     //cx.fillStyle = color;
     cx.fillStyle = color;
     cx.fillRect(left+j*base_dims.w + base_fill.x, top+i*base_dims.h + base_fill.y, base_fill.w, base_fill.h);

    // if(type =='threading'){
    //   cx.font = "10px Arial";
    //   cx.fillStyle = "white";
    //   let thread_val = loom.threading[j]+1;
    //   //if(this.ws.selected_origin_option == 1 || this.ws.selected_origin_option == 2) thread_val = numFrames(loom) - loom.threading[j];
    //   //cx.fillText(thread_val, 2+ left+j*base_dims.w + base_fill.x, top+i*base_dims.h + base_fill.y + base_fill.h);
      
    // }

  }

  /**This view renders cells based on the relationships with their neighbords */
  drawCrossingCell(draft:Draft, cx: any, i:number, i_next:number, j:number, type:string){
    var base_dims = this.render.getCellDims("base");
    var base_fill = this.render.getCellDims("base_fill");
    var top = 0; 
    var left = 0;

    var right_edge: boolean;
    var right_bot_to_top: boolean;
    var bottom_edge: boolean;
    var bottom_bot_to_top: boolean;


    right_edge = (isUp(draft.drawdown, i, j) !== isUp(draft.drawdown, i, j+1)) ? true : false;

    if(right_edge){
      right_bot_to_top = (isUp(draft.drawdown, i, j) && !isUp(draft.drawdown, i, j+1)) ? true : false;
    }


    bottom_edge = (isUp(draft.drawdown, i, j) !== isUp(draft.drawdown, i_next, j)) ? true : false;
    if(bottom_edge){
      bottom_bot_to_top = (isUp(draft.drawdown, i, j) && !isUp(draft.drawdown, i_next, j)) ? true : false;
    }

    j++;
    i++;
    
    if(right_edge){
      cx.strokeStyle = (right_bot_to_top) ? "#FF0000" : "#00FF00";
      cx.beginPath();
      cx.moveTo(left+j*base_dims.w + base_fill.w , top+i*base_dims.h);
      cx.lineTo(left+j*base_dims.w + base_fill.w , top+i*base_dims.h + base_fill.h);
      cx.stroke();
    }

    if(bottom_edge){
      cx.strokeStyle = (bottom_bot_to_top) ? "#0000FF" : "#FFA500";
      cx.beginPath();
      cx.moveTo(left+j*base_dims.w , top+i*base_dims.h + base_fill.h);
      cx.lineTo(left+j*base_dims.w+ base_fill.w, top+i*base_dims.h + base_fill.h);
      cx.stroke();
    }
  }

  /**
   * Redraws one row to avoid drawing the entire canvas.
   * @extends WeaveDirective
   * @returns {void}
   */
  private redrawRow(draft: Draft, loom: Loom, loom_settings: LoomSettings, y:number, i:number, cx:any) {
 
    for (var j = 0; j < warps(draft.drawdown); j++) {
      //get the system at this warp
      const sys_id = draft.colSystemMapping[j];
      const sys = this.ss.getWarpSystem(sys_id)
    
      if(sys !== undefined && sys.isVisible()){
        this.drawCell(draft, loom, loom_settings, this.cx, i, j, "drawdown");
      }else{

      } 
    }
  }


  /**
   * 
   * @param top  the index of this weft row
   * @param shuttle the shuttle assigned to this row
   */
  public drawWeft(draft: Draft, top:number, shuttle:Shuttle){
    var dims = this.render.getCellDims("base");
    var cx = this.cx;
    var view = this.render.getCurrentView();


    const left = 0;
    top =  (top + 1) * dims.h;

    top += dims.h/2;


    cx.lineWidth = shuttle.getThickness()/100 * .9*dims.h;
    cx.strokeStyle = (view === "yarn" && shuttle.type === 0) ? shuttle.getColor()+"10" : shuttle.getColor();
    cx.shadowColor = 'white';
    cx.shadowOffsetX = .5;
    cx.shadowOffsetY = 0;

    cx.beginPath();
    cx.moveTo(left+dims.w/2,top+dims.h/2);
    cx.lineTo(left+warps(draft.drawdown) * dims.w,top+dims.h/2);
    cx.stroke();
  }


  public drawWeftLeftUp(draft: Draft, top:number, left:number, shuttle:Shuttle){
      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > warps(draft.drawdown)) return;

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


  public drawWeftRightUp(draft:Draft, top:number, left:number, shuttle:Shuttle){

      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > warps(draft.drawdown)) return;

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



  public drawWeftBottomLeft(draft: Draft, top:number, left:number, shuttle:Shuttle){
      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > warps(draft.drawdown)) return;

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

  public drawWeftBottomRight(draft:Draft, top, left, shuttle){
      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > warps(draft.drawdown)) return;

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


  public drawWeftUp(draft: Draft, top:number, left:number, shuttle:Shuttle){
      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > warps(draft.drawdown)) return;

      left = (left+1)*dims.w;
      top =  (top + 1) * dims.h;

      left += dims.w/2

      var width = shuttle.getThickness()/100 * .9*dims.w;
      cx.strokeStyle = (view === "yarn" && shuttle.type === 0) ? shuttle.getColor()+"10" : shuttle.getColor()
      cx.lineWidth = width;
      cx.shadowColor = 'white';
      cx.shadowOffsetX = .5;
      cx.shadowOffsetY = 0;

      cx.beginPath();
      cx.moveTo(left, top);
      cx.lineTo(left, top+dims.h);
      cx.stroke();

  }

  public drawWeftStart(draft: Draft, top:number, left:number, shuttle:Shuttle){
      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > warps(draft.drawdown)) return;

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

public drawWeftEnd(draft: Draft, top:number, left:number, shuttle:Shuttle){
      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > warps(draft.drawdown)) return;

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
  public drawWeftOver(draft: Draft, top:number, left:number, shuttle:Shuttle){
      var dims = this.render.getCellDims("base");
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > warps(draft.drawdown)) return;

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
  public drawWeftUnder(draft: Draft, top:number, left:number, shuttle:Shuttle){
      var dims = this.render.getCellDims("base");
      var warp_shuttle = this.ms.getShuttle(draft.colShuttleMapping[left]);
      var cx = this.cx;
      var view = this.render.getCurrentView();

      if(left < -1 || left > warps(draft.drawdown)) return;

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
      cx.moveTo(left+dims.w/2, top-dims.h/2);
      cx.lineTo(left+dims.w/2, top+dims.h/2);
      cx.stroke();

  }

  /**
   * called on scroll
   * @param scroll_top 
   * @param scroll_left 
   */
  public reposition(scroll_top: number, scroll_left: number){

  }

  //flips the view from front to back
  public flip(){
    const container: HTMLElement = document.getElementById('draft-scale-container');
    container.style.transformOrigin = '50% 50%';
    if(this.render.view_front) container.style.transform = "matrix(1, 0, 0, 1, 0, 0) scale(" + this.render.getZoom() + ')';
    else container.style.transform = "matrix(-1, 0, 0, 1, 0, 0) scale(" + this.render.getZoom() + ')';

  }

  /**
   * this rescales the canvas and updates the view from scroll events
   * receives offset of the scroll from the CDKScrollable created when the scroll was initiated
   */
  //this does not draw on canvas but just rescales the canvas
  public rescale(zoom: number){

  //   //var dims = this.render.getCellDims("base");
    const container: HTMLElement = document.getElementById('draft-scale-container');
    container.style.transformOrigin = 'top center';
    container.style.transform = 'scale(' + zoom + ')';

   
   }


  public drawWarpsOver(draft: Draft){


    for (var i = 0; i < this.render.visibleRows.length ; i++) {
       
        const row_index = this.render.visibleRows[i];
        const row_values = draft.drawdown[row_index];
        

        let overs = [];
        if(this.render.isFront()){
          overs = row_values.reduce((overs, v, idx) => v.isUp() ? overs.concat([idx]) : overs, []);
        }else{
          overs = row_values.reduce((overs, v, idx) => !v.isUp() ? overs.concat([idx]) : overs, []);
        }

        for(var o in overs){
            const shuttle_id = draft.colShuttleMapping[overs[o]];
            const system_id = draft.colSystemMapping[overs[o]];
            if(this.ss.warp_systems[system_id].isVisible()) this.drawWeftUp(draft, i, overs[o], this.ms.getShuttle(shuttle_id));
        }

    }


  }

  

  



  //public redrawYarnView(){

    //draw from bottom to top 


  //   //first, just draw all the wefts 
  //  const shuttles: Array<number> =  this.render.visibleRows.map(el => this.weave.rowShuttleMapping[el]);

  //  shuttles.forEach((shuttle, i) => {
  //     this.drawWeft(i, this.ms.getShuttle(shuttle));
  //  });

  //   const crossings: Array<Array<Crossing>> = this.weave.getRelationalDraft();
  //   const visible_crossings = crossings.filter((el, i) => this.render.visibleRows.find(el => el == i) !== -1);

  //   visible_crossings.forEach((row, i) =>{

  //     let cur_j = 0;
  //     let cur_state: boolean = false;

  //     row.forEach(crossing => {

  //       if(cur_j < crossing.j){
  //         cur_state = crossing.type.t;
  //       }

  //     });


  //   });  



    // let started:boolean = false;

    // for(let i = 0; i < this.render.visibleRows.length; i++){

    //   let index_row = this.render.visibleRows[i];

    //   let row_values = this.weave.drawdown[index_row];

    //   let shuttle_id = this.weave.rowShuttleMapping[index_row];

    //   let s = this.ms.getShuttle(shuttle_id);

    //   //iterate through the rows
    //   for(let j = 0; j < row_values.length; j++){
        
    //     let p = row_values[j];

    //   //   if(p.isEastWest())  this.drawWeftOver(i,j,s);
    //   //   if(p.isSouthWest()) this.drawWeftBottomLeft(i,j,s);
    //   //  // if(p.isNorthSouth())this.drawWeftUp(i, j, s);
    //   //   if(p.isSouthEast()) this.drawWeftBottomRight(i,j,s);
    //   //   if(p.isNorthWest()) this.drawWeftLeftUp(i,j,s);
    //   //   if(p.isNorthEast()) this.drawWeftRightUp(i, j, s);

    //   }
    // }

  //}


  public redrawYarnView(draft: Draft){

    const yarnsim = computeYarnPaths(draft, this.ms.getShuttles());
    

    for(let i = 0; i < this.render.visibleRows.length; i++){

      let index_row = this.render.visibleRows[i];

      let row_values = yarnsim[index_row];

      let shuttle_id = draft.rowShuttleMapping[index_row];

      let s = this.ms.getShuttle(shuttle_id);

      //iterate through the rows
      for(let j = 0; j < row_values.length; j++){
        
        let p = row_values[j];

        if(isEastWest(p))  this.drawWeftOver(draft, i,j,s);
        if(isSouthWest(p)) this.drawWeftBottomLeft(draft, i,j,s);
       // if(p.isNorthSouth())this.drawWeftUp(i, j, s);
        if(isSouthEast(p)) this.drawWeftBottomRight(draft, i,j,s);
        if(isNorthWest(p)) this.drawWeftLeftUp(draft, i,j,s);
        if(isNorthEast(p)) this.drawWeftRightUp(draft, i, j, s);

      }
    }

  }


  /**
   * redraws the loom provided into the video
   * @returns 
   */
  public redrawLoom(draft:Draft, loom:Loom, loom_settings:LoomSettings) {


    if(loom === null || loom === undefined){
      return;
    }

    const frames = Math.max(numFrames(loom), loom_settings.frames);
    const treadles = Math.max(numTreadles(loom), loom_settings.treadles);

    var base_dims = this.render.getCellDims("base");
    var front = this.render.isFront();

    this.cxThreading.clearRect(0,0, this.cxThreading.canvas.width, this.cxThreading.canvas.height);
    this.cxTreadling.clearRect(0,0, this.cxTreadling.canvas.width, this.cxTreadling.canvas.height);
    this.cxTieups.clearRect(0,0, this.cxTieups.canvas.width, this.cxTieups.canvas.height);

    this.cxThreading.canvas.width = base_dims.w * loom.threading.length;
    this.cxThreading.canvas.height = base_dims.h * frames;
    this.drawGrid(loom, loom_settings, this.cxThreading,this.threadingCanvas);
   // else this.drawBlank(this.cxThreading,this.threadingCanvas);


    this.cxTreadling.canvas.width = base_dims.w * treadles;
    this.cxTreadling.canvas.height = base_dims.h * this.render.visibleRows.length;
    this.drawGrid(loom, loom_settings, this.cxTreadling,this.treadlingCanvas);
    //else this.drawBlank(this.cxTreadling,this.treadlingCanvas);

    this.cxTieups.canvas.width = base_dims.w * treadles;
    this.cxTieups.canvas.height = base_dims.h *frames;
    this.drawGrid(loom, loom_settings, this.cxTieups,this.tieupsCanvas);
    //else this.drawBlank(this.cxTieups,this.tieupsCanvas);
    

    for (var j = 0; j < loom.threading.length; j++) {
      this.drawCell(draft, loom, loom_settings, this.cxThreading, loom.threading[j], j, "threading");
    }

    //only cycle through the visible rows
    for (var i = 0; i < this.render.visibleRows.length; i++) {
      if(this.render.visibleRows[i] < loom.treadling.length){
        loom.treadling[this.render.visibleRows[i]].forEach(cell => {
          this.drawCell(draft, loom, loom_settings, this.cxTreadling, i, cell, "treadling");
        })
      }
      
    }

    for (var i = 0; i < loom.tieup.length; i++) {
      for(var j = 0; j < loom.tieup[i].length; j++){
        if(loom.tieup[i][j]){
          this.drawCell(draft, loom, loom_settings, this.cxTieups, i, j, "tieup");
        }
      }
    }

  }

/**
 * callled when frames become visible or drawdown without frame info is loaded
 */
  public recomputeLoom(draft: Draft, loom_settings:LoomSettings){
    this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings);
  }


  public unsetSelection(){
    this.selection.unsetParameters();
  }

public drawDrawdown(draft: Draft, loom:Loom, loom_settings: LoomSettings){

   switch(this.render.getCurrentView()){
      case 'pattern':
      this.redrawDraft(draft, loom, loom_settings);
      break;

      case 'yarn':
      this.redrawVisualView(draft);
      break;

      case 'visual':
      this.redrawVisualView(draft);
      break;

      case 'crossing':
      this.redrawCrossings(draft);
      break;
    }
}

//takes inputs about what, exactly to redraw
public redraw(draft:Draft, loom: Loom, loom_settings:LoomSettings,  flags:any){


    var base_dims = this.render.getCellDims("base");

    if(flags.drawdown !== undefined){
        this.cx.clearRect(0,0, this.canvasEl.width, this.canvasEl.height);   
        this.cx.canvas.width = base_dims.w * (draft.drawdown[0].length+2);
        this.cx.canvas.height = base_dims.h * (this.render.visibleRows.length+2);
        this.cx.strokeStyle = "#3d3d3d";

        if(this.source == "weaver") this.cx.fillStyle = "#3d3d3d";
        else this.cx.fillStyle = "#ffffff";
        this.cx.fillRect(0,0,this.canvasEl.width,this.canvasEl.height);
        this.cx.strokeRect(base_dims.w,base_dims.h,this.canvasEl.width-base_dims.w*2,this.canvasEl.height-base_dims.h*2);
        this.drawDrawdown(draft, loom, loom_settings);
    }

    if(flags.weft_systems !== undefined && this.source == "weaver"){
      this.drawWeftSystems(draft, this.cxWeftSystems, this.weftSystemsCanvas);
    }

    if(flags.weft_materials !== undefined && this.source == "weaver"){
      this.drawWeftMaterials(draft, this.cxWeftMaterials, this.weftMaterialsCanvas);
    }

    if(flags.warp_systems !== undefined && this.source == "weaver"){
      this.drawWarpSystems(draft, this.cxWarpSystems, this.warpSystemsCanvas);
    }

    if(flags.warp_materials !== undefined && this.source == "weaver"){
      this.drawWarpMaterials(draft, this.cxWarpMaterials, this.warpMaterialsCanvas);
    }

  
    if(flags.loom !== undefined){
       this.redrawLoom(draft, loom, loom_settings);
    }

  }
  

  /**
   * Redraws the entire canvas based on weave pattern.
   * @extends WeaveDirective
   * @returns {void}
   */
  public redrawDraft(draft: Draft, loom: Loom, loom_settings: LoomSettings) {
    
    var base_dims = this.render.getCellDims("base");
    this.cx.fillStyle = "grey";
    this.cx.fillRect(base_dims.w,base_dims.h,this.canvasEl.width - base_dims.w*2,this.canvasEl.height-base_dims.h*2);

    var i,j;

    

    var color = '#000000';
    this.cx.fillStyle = color;
    for (i = 0; i < this.render.visibleRows.length; i++) {
      this.redrawRow(draft, loom, loom_settings, i * base_dims.h, i, this.cx);
    }
 

    this.drawGrid(loom, loom_settings, this.cx,this.canvasEl);

  }






  public drawWarps(draft: Draft, cx:any){
    //draw all the warps

    var base_dims = this.render.getCellDims("base");
    var schematic = (this.render.getCurrentView() === "yarn");
    for (var x = 0; x < draft.colShuttleMapping.length; x++) {
     
      let system;
      var id = draft.colShuttleMapping[x];
      if(id === undefined) system = this.ss.getFirstWarpSystem();
      else system = this.ss.getWarpSystem(id);

      var shuttle = this.ms.getShuttle(id);

      if(system !== undefined && system.visible){
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
          cx.lineTo((x+1)*base_dims.w + center, base_dims.h*(this.render.visibleRows.length+2));
          cx.stroke();

      }
    }
  }


 /**
   * Highlights intersections between yarns, when they cross from front to back
   * @extends WeaveDirective
   * @returns {void}
   */
  public redrawCrossings(draft: Draft) {


    var base_dims = this.render.getCellDims("base");
    this.cx.fillStyle = "white";
    this.cx.fillRect(base_dims.w,base_dims.h,this.canvasEl.width - base_dims.w*2,this.canvasEl.height-base_dims.h*2);

    var i,j;

    var color = '#000000';
    this.cx.fillStyle = color;
    for (i = 0; i < this.render.visibleRows.length; i++) {
      for(j = 0; j < warps(draft.drawdown); j ++){
        this.drawCrossingCell(draft, this.cx, this.render.visibleRows[i], this.render.getNextVisibleRow(i), j, 'crossings');
      }
    }
  }


  /**
   * Simulates the visual look of the weave pattern.
   * @extends WeaveDirective
   * @returns {void}
   */
  public redrawVisualView(draft: Draft) {



    computeYarnPaths(draft, this.ms.getShuttles());

    this.cx.fillStyle = "#3d3d3d";
    this.cx.fillRect(0,0,this.canvasEl.width,this.canvasEl.height);

    this.drawWarps(draft, this.cx);
    
    this.redrawYarnView(draft);

    if(this.render.getCurrentView() === 'visual'){
      this.drawWarpsOver(draft);
    }

    this.cx.strokeStyle = "#000";
    this.cx.fillStyle = "#000";
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


  //  /**
  //  * Saves the draft as a bitmap file
  //  * @extends WeaveDirective
  //  * @param {string} fileName - name to save file as
  //  * @returns {void}
  //  */
  // public getPrintableCanvas(obj) : HTMLCanvasElement {

  //   const frames = numFrames(this.loom);
  //   const treadles = numTreadles(this.loom);

  //   let dims = this.render.getCellDims("base");

  //   let b = obj.bitmap.nativeElement;
  //   let context = b.getContext('2d');

  //   b.width = (warps(this.weave.drawdown) + treadles + 6) * dims.w;
  //   b.height = (wefts(this.weave.drawdown) + frames + 6) * dims.h;
    
  //   context.fillStyle = "white";
  //   context.fillRect(0,0,b.width,b.height);
    
  //   //use this to solve 0 width errors on drawIMage
  //   if(this.loom_settings.type !== 'jacquard'){

  //     context.drawImage(this.threadingCanvas, 0, dims.h*3);
  //     context.drawImage(this.tieupsCanvas, (warps(this.weave.drawdown) +1)* dims.w, 3*dims.h);
  //     context.drawImage(this.treadlingCanvas, (warps(this.weave.drawdown) +1)* dims.w, (frames + 4)*dims.h);

  //   }

  //   //systems
  //   context.drawImage(this.warpSystemsCanvas, 0, 0);
  //   context.drawImage(this.warpMaterialsCanvas, 0, dims.h);

  //   context.drawImage(this.canvasEl, -dims.w, (frames+3)*dims.h);
   
  //   context.drawImage(this.weftMaterialsCanvas,(warps(this.weave.drawdown)+ treadles +1)* dims.w, (frames + 4)*dims.h);
  //   context.drawImage(this.weftSystemsCanvas,(warps(this.weave.drawdown)+ treadles +2)* dims.w, (frames + 4)*dims.h);
  //   return b;
  // }

  /**
   * Saves the draft as a bitmap file
   * @extends WeaveDirective
   * @param {string} fileName - name to save file as
   * @returns {void}
   */
  // public getBMPCanvas(obj) : HTMLCanvasElement {
  //   let b = obj.bitmap.nativeElement;
  //   let context = b.getContext('2d');
  //   let draft = this.weave.drawdown;
  //   var i,j;

  //   b.width = warps(this.weave.drawdown);
  //   b.height = wefts(this.weave.drawdown);
  //   context.fillStyle = "white";
  //   context.fillRect(0,0,b.width,b.height);

  //   context.fillStyle = "black";

  //   for( i = 0; i < b.height; i++) {
  //     for( j=0; j < b.width; j++) {
  //       let up = draft[i][j].isUp();
  //       if(up) {
  //         context.fillRect(j,i,1,1)
  //       }
  //     }
  //   }
  //   return b;
  // }

   /**
   *
   *
   */
    // public onSave(e: any) {

    //   e.bitmap = this.bitmap;
  
    //   if (e.type === "bmp"){
    //     let link = e.downloadLink.nativeElement;
    //     link.href = this.fs.saver.bmp(this.getBMPCanvas(e));
    //     link.download = e.name + ".jpg"; //Canvas2Bitmap  seems to be broken now
    //   } 
    //   else if (e.type === "ada"){
    //     let link = e.downloadLink.nativeElement;
    //     link.href = this.fs.saver.ada('draft', [this.weave], [this.loom],  false, 5);
    //     link.download = e.name + ".ada";
    //   } 
    //   else if (e.type === "wif"){
    //     let link = e.downloadLink.nativeElement;
    //     link.href= this.fs.saver.wif(this.weave, this.loom);
    //     link.download = e.filename +".wif";
  
    //   } 
    //   else if (e.type === "jpg"){
    //     let link = e.downloadLink.nativeElement;
    //     link.href = this.fs.saver.jpg(this.getPrintableCanvas(e));
    //     link.download = e.name + ".jpg";
    //   } 
      
    // }

    public translateThreadingRowForView(loom: Loom, loom_settings: LoomSettings, i:number) : number{
      const opt = this.ws.selected_origin_option;
      const frames = Math.max(numFrames(loom), loom_settings.frames);

      if(opt == 0 || opt == 3){
        return (frames - 1 -i)
      }else{
        return i;
      }

    }


    public translateDrawdownRowForView(draft: Draft, i:number) : number{
      const opt = this.ws.selected_origin_option;

      if(opt == 1 || opt == 2){
        return (wefts(draft.drawdown) - 1 -i)
      }else{
        return i;
      }

    }

    public translateDrawdownColForView(draft: Draft, j:number){
      const opt = this.ws.selected_origin_option;

      if(opt > 2 ){
        return (j)
      }else{
        return (warps(draft.drawdown) ) - j;
      }
    }

    /**
   * inserts an empty row just below the clicked row
   * @param si the screen index of the row we'll insert
   * @param i the absolute (not screen) index of the row we'll insert
   */
  public insertRow(si:number) {

    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);

    si = this.translateDrawdownRowForView(draft, si);
    let index = this.render.visibleRows[si];


    draft.drawdown = insertDrawdownRow(draft.drawdown, index, null);
    draft.rowShuttleMapping = insertMappingRow(draft.rowShuttleMapping, index, 1);
    draft.rowSystemMapping = insertMappingRow(draft.rowSystemMapping, index, 0);

    this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
    .then(loom => {
      this.render.updateVisible(draft);
      this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
      this.timeline.addHistoryState(draft);
      this.rowShuttleMapping = draft.rowShuttleMapping;
    })

  }
    /**
   * clones the selected row and pastes into next visible row
   * @param si the screen index of the row we'll insert
   * @param i the absolute (not screen) index of the row we'll insert
   */
  public cloneRow(si: number) {
    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);

    si = this.translateDrawdownRowForView(draft, si);
    let index = this.render.visibleRows[si];

    draft.drawdown = insertDrawdownRow(draft.drawdown, index, draft.drawdown[index].slice());
    draft.rowShuttleMapping = insertMappingRow(draft.rowShuttleMapping, index,draft.rowShuttleMapping[index]);
    draft.rowSystemMapping = insertMappingRow(draft.rowSystemMapping, index,draft.rowSystemMapping[index]);


    this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
    .then(loom => {
      this.render.updateVisible(draft);
      this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
      this.timeline.addHistoryState(draft);
      this.rowShuttleMapping = draft.rowShuttleMapping;
    })

  }

  public deleteRow(si:number) {

    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);

    si = this.translateDrawdownRowForView(draft, si);
    let index = this.render.visibleRows[si];


    draft.drawdown = deleteDrawdownRow(draft.drawdown, index);
    draft.rowShuttleMapping = deleteMappingRow(draft.rowShuttleMapping, index)
    draft.rowSystemMapping = deleteMappingRow(draft.rowSystemMapping, index)

    this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
    .then(loom => {
      this.render.updateVisible(draft);
      this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
      this.timeline.addHistoryState(draft);
      this.rowShuttleMapping = draft.rowShuttleMapping;

    })
  }

    /**
   * In
   * @extends WeaveComponent
   * @returns {void}
   */
  public insertCol(j: number) {
    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);

    j = this.translateDrawdownColForView(draft, j);

    draft.drawdown = insertDrawdownCol(draft.drawdown, j, null);
    draft.colShuttleMapping = insertMappingCol(draft.colShuttleMapping, j, 0);
    draft.colSystemMapping = insertMappingCol(draft.colSystemMapping, j, 0);
    this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
    .then(loom => {
      computeYarnPaths(draft, this.ms.getShuttles());
      this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, warp_systems: true, warp_materials:true});
      this.timeline.addHistoryState(draft);
      this.colShuttleMapping = draft.colShuttleMapping;
    })

  }

  public cloneCol(j: number) {
    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);

    //flip the index based on the flipped view
    j = this.translateDrawdownColForView(draft, j);

    const col:Array<Cell> =draft.drawdown.reduce((acc, el) => {
      acc.push(el[j]);
      return acc;
    }, []); 
    
    draft.drawdown = insertDrawdownCol(draft.drawdown, j, col);
    draft.colShuttleMapping = insertMappingCol(draft.colShuttleMapping, j, draft.colShuttleMapping[j]);
    draft.colSystemMapping = insertMappingCol(draft.colSystemMapping, j, draft.colSystemMapping[j]);
    this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
    .then(loom => {
      computeYarnPaths(draft, this.ms.getShuttles());
      this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, warp_systems: true, warp_materials:true});
      this.timeline.addHistoryState(draft);
      this.colShuttleMapping = draft.colShuttleMapping;
    })

  }


  public deleteCol(j: number) {
    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    
    j = this.translateDrawdownColForView(draft, j);

    
      draft.drawdown = deleteDrawdownCol(draft.drawdown, j);
      draft.colShuttleMapping = deleteMappingCol(draft.colShuttleMapping, j);
      draft.colSystemMapping = deleteMappingCol(draft.colSystemMapping, j);
      this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
      .then(loom => {
        computeYarnPaths(draft, this.ms.getShuttles());
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, warp_systems: true, warp_materials:true});
        this.timeline.addHistoryState(draft);
        this.colShuttleMapping = draft.colShuttleMapping;
      })
  }

  isLastCol(j: number) : boolean {
    const draft = this.tree.getDraft(this.id);
    return (j+1 === warps(draft.drawdown));
  }

  isLastRow(i: number) : boolean {
    const draft = this.tree.getDraft(this.id);
    return (i+1 ===wefts(draft.drawdown))
  }



  /**
   * Tell the weave directive to fill selection with pattern.
   * @extends WeaveComponent
   * @param {Event} e - fill event from design component.
   * @returns {void}
   */
  //  public onFill(e) {
    
  //   let p:Pattern = this.ps.getPattern(e.id);
    
  //   this.weave.fillArea(this.selection, p, 'original', this.render.visibleRows, this.loom);

  //   this.loom.recomputeLoom(this.weave, this.loom.type);

  //   if(this.render.isYarnBasedView()) this.weave.computeYarnPaths(this.ms.getShuttles());
    
  //   this.copyArea();

  //   this.redraw({drawdown:true, loom:true});

  //   this.timeline.addHistoryState(this.weave);
    
  // }

  // /**
  //  * Tell weave reference to clear selection.
  //  * @extends WeaveComponent
  //  * @param {Event} Delte - clear event from design component.
  //  * @returns {void}
  //  */
  public onClear(b:boolean) {

    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    const loom = this.tree.getLoom(this.id);

    let width = this.selection.getWidth();
    let height = this.selection.getHeight();
    draft.drawdown = pasteIntoDrawdown(draft.drawdown,[[new Cell(b)]],this.selection.getStartingRowScreenIndex(),this.selection.getStartingColIndex(), width, height);
    
    switch(this.selection.getTargetId()){    
      case 'drawdown':
        this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
        .then(loom => {
          this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true, weft_materials: true, warp_materials:true, weft_systems:true, warp_systems:true});

        });
       break;

      case 'treading':
      case 'tieup':
      case 'treadling':
        this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
        .then(draft => {
          this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true, weft_materials: true, warp_materials:true, weft_systems:true, warp_systems:true});

        });

      break;
    }

  
    this.copyArea();

  }

  /**
   * Tells weave reference to paste copied pattern.
   * @extends WeaveComponent
   * @param {Event} e - paste event from design component.
   * @returns {void}
   */
   public onPaste(e) {

    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);

    this.hold_copy_for_paste = false;

    var p = this.copy;

    var type;

    if(e.type === undefined) type = "original";
    else type =  e.type;


    const adj_start_i = this.render.visibleRows[this.selection.getStartingRowScreenIndex()];
    const adj_end_i = this.render.visibleRows[this.selection.getEndingRowScreenIndex()];

    const height = adj_end_i - adj_start_i;
    draft.drawdown = pasteIntoDrawdown(
      draft.drawdown, 
      this.copy, 
      adj_start_i, 
      this.selection.getStartingColIndex(),
      this.selection.getWidth(),
      height);


    switch(this.selection.getTargetId()){    
      case 'drawdown':
        //if you do this when updates come from loom, it will erase those updates
        this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
        .then(loom => {
          this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true, weft_materials: true, warp_materials:true, weft_systems:true, warp_systems:true});

        });
       break;

      case 'treading':
      case 'tieup':
      case 'treadling':
        this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
        .then(draft => {
          this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true, weft_materials: true, warp_materials:true, weft_systems:true, warp_systems:true});

        });

      break;
    }

  
    this.copyArea();

 

  }

  onCopy(){
    this.copyArea();
    this.hold_copy_for_paste = true;
  }

 


 





}
