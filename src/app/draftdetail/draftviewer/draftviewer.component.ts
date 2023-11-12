import { Component, EventEmitter, Input, OnInit, HostListener, Output, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Subscription, Subject, fromEvent } from 'rxjs';
import { DesignMode, Draft, Drawdown, Interlacement, Loom, LoomSettings, LoomUtil, Material, Operation, OpInput, Cell } from '../../core/model/datatypes';
import { FileService } from '../../core/provider/file.service';
import { DesignmodesService } from '../../core/provider/designmodes.service';
import { MaterialsService } from '../../core/provider/materials.service';
import { SystemsService } from '../../core/provider/systems.service';
import { StateService } from '../../core/provider/state.service';
import { WorkspaceService } from '../../core/provider/workspace.service';
import { hasCell, insertDrawdownRow, deleteDrawdownRow, insertDrawdownCol, deleteDrawdownCol, isSet, isUp, setHeddle, warps, wefts, pasteIntoDrawdown, initDraftWithParams, createBlankDrawdown, insertMappingRow, insertMappingCol, deleteMappingCol, deleteMappingRow, generateMappingFromPattern, copyDraft } from '../../core/model/drafts';
import { convertLiftPlanToTieup, convertTieupToLiftPlan, generateDirectTieup, getLoomUtilByType, isFrame, isInThreadingRange, isInTreadlingRange, isInUserThreadingRange, isInUserTieupRange, isInUserTreadlingRange, numFrames, numTreadles } from '../../core/model/looms';
import { TreeService } from '../../core/provider/tree.service';
import utilInstance from '../../core/model/util';
import { OperationService } from '../../core/provider/operation.service';
import { RenderService } from '../provider/render.service';
import { SelectionComponent } from './selection/selection.component';
import { NgForm } from '@angular/forms';
import { createCell, getCellValue, setCellValue } from '../../core/model/cell';
import {defaults} from '../../core/model/defaults'
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-draftviewer',
  templateUrl: './draftviewer.component.html',
  styleUrls: ['./draftviewer.component.scss']
})
export class DraftviewerComponent implements OnInit {

  @ViewChild('bitmapImage') bitmap;

  @ViewChild('selection', {read: SelectionComponent, static: true}) selection: SelectionComponent;
  @ViewChild(SidebarComponent, {static: true}) sidebar;


  @Input('id') id = -1;

  /**
   * a descriptor of the parent who generated this window
   * @property {string} will be "weaver" or "mixer"
   */
   @Input('source') source: string;

 
 /**
    * The Timeline object containing state histories for undo and redo
    * @property {Timeline}
   */
  //  @Input('timeline') timeline: any;
 
   @Input() viewonly: boolean;

 
 
   @Output() onNewSelection = new EventEmitter();
   @Output() onDrawdownUpdated = new EventEmitter();
   @Output() onViewerExpanded = new EventEmitter();
   @Output() onDesignModeChange = new EventEmitter();
   @Output() onMaterialChange = new EventEmitter();
   @Output() onLoomSettingsUpdated = new EventEmitter();


  hold_copy_for_paste: boolean = false;

  //store this here as you need it to draw the view
  colShuttleMapping: Array<number> = [];
  rowShuttleMapping: Array<number>= [];
  colSystemMapping: Array<number>= [];
  rowSystemMapping: Array<number>= [];

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

   is_dirty: boolean = false;

   mouse_pressed: boolean = false; 
 
 
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
 
 
 
 
  //  weftMaterialsCanvas: HTMLCanvasElement;
  //  warpMaterialsCanvas: HTMLCanvasElement;
 
   private tempPattern: Array<Array<Cell>>;
   private unsubscribe$ = new Subject();

 
   private lastPos: Interlacement;
 

   /** USED ONLY FOR FORM UPDATES */
   isFrame: boolean;
   treadles: number;
   frames: number;
   warps: number; 
   wefts: number;
   width: number;
   loom_settings: LoomSettings;
   epi: number;

   loomtypes:Array<DesignMode>  = [];
   selected_loom_type;

   density_units: Array<DesignMode> = [];
   selected_units: 'cm' | 'in';

  /** VIEW OPTIONS */

  expanded: boolean = false;

  cell_size: number = 10;

  system_codes: Array<string> = [];

 
   /// ANGULAR FUNCTIONS
   /**
    * Creates the element reference.
    * @constructor
    */

  constructor(
    private fs: FileService,
    public dm: DesignmodesService,
    private ms: MaterialsService,
    private ss: SystemsService,
    public ws: WorkspaceService,
    public timeline: StateService,
    private tree:TreeService,
    private ops: OperationService,
    public render: RenderService
  ) { 

    this.flag_recompute = false;
    this.flag_history = false;
    this.loomtypes = dm.getOptionSet('loom_types');
    this.density_units = dm.getOptionSet('density_units');
    this.cell_size = defaults.draft_detail_cell_size;
    this.system_codes = defaults.weft_system_codes;

  }

  ngOnInit() {


    // let draft: Draft = this.tree.getDraft(this.id);
    // const loom = this.tree.getLoom(this.id);
    // const loom_settings = this.tree.getLoomSettings(this.id);

    // this.isFrame = isFrame(loom_settings);
   //this.viewonly = !this.tree.isSeedDraft(this.id);
     this.viewonly = false;
    // this.colShuttleMapping = draft.colShuttleMapping;
    // this.rowShuttleMapping = draft.rowShuttleMapping;



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

    this.cx = this.canvasEl.getContext('2d');
    this.cxThreading = this.threadingCanvas.getContext('2d');
    this.cxTreadling = this.treadlingCanvas.getContext('2d');
    this.cxTieups = this.tieupsCanvas.getContext('2d');

    // set the width and height

    this.rescale(this.render.getZoom());

  }

  getFlippedWarpNum(j: number) : number{
    let draft = this.tree.getDraft(this.id);
    if(draft == null) return;
    let warpnum = warps(draft.drawdown);

    return warpnum - j;
  }

  getFlippedWeftNum(i: number) : number{
    let draft = this.tree.getDraft(this.id);
    if(draft == null) return;

    let weftnum = wefts(draft.drawdown);

    return weftnum - i;
  }

  expand(){
    this.expanded = !this.expanded;
    this.onViewerExpanded.emit();
  }

  //this is called anytime a new draft object is loaded. 
  onNewDraftLoaded(draft: Draft, loom:Loom, loom_settings:LoomSettings) {  

    this.is_dirty = false;
    
    this.loom_settings = loom_settings;
    this.selected_loom_type = loom_settings.type;

    this.frames = Math.max(numFrames(loom), loom_settings.frames);
    this.treadles = Math.max(numTreadles(loom), loom_settings.treadles);

    this.warps = warps(draft.drawdown);
    this.wefts = wefts(draft.drawdown);
    this.width = warps(draft.drawdown) / loom_settings.epi;
    if(loom_settings.units == 'cm') this.width *= 10;
    this.selected_units = loom_settings.units;

    const warp_num:number = warps(draft.drawdown);
    const weft_num:number = wefts(draft.drawdown);

    this.colShuttleMapping = draft.colShuttleMapping;
    this.colSystemMapping = draft.colSystemMapping;
    this.rowShuttleMapping = draft.rowShuttleMapping;
    this.rowSystemMapping = draft.rowSystemMapping;

    var dims = this.render.getCellDims("base");
    this.canvasEl.width = warp_num * dims.w;
    this.canvasEl.height = weft_num * dims.h;
    this.threadingCanvas.width = warp_num * dims.w;
    this.threadingCanvas.height = this.frames * dims.h;
    this.treadlingCanvas.height = weft_num * dims.h;
    this.treadlingCanvas.width = this.treadles * dims.w;
    this.tieupsCanvas.width = this.treadles*dims.w;
    this.tieupsCanvas.height = this.frames * dims.h;

    // this.cdRef.detectChanges();

     this.redraw(draft, loom, loom_settings, {
      drawdown: true, 
      loom:true, 
      warp_systems: true, 
      weft_systems: true, 
      warp_materials: true,
      weft_materials:true
    });

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
      
      const editing_style = this.dm.getSelectedDesignMode('drawdown_editing_style').value;


      if (target && target.id =='treadling') {
        if(this.viewonly) return;
        currentPos.i = this.render.visibleRows[currentPos.i];
        if(editing_style == "loom") this.drawOnTreadling(loom, loom_settings, currentPos);
      } else if (target && target.id === 'tieups') {
        if(this.viewonly || loom_settings.type === "direct") return;
        if(editing_style == "loom") this.drawOnTieups(loom, loom_settings, currentPos);
      } else if (target && target.id === ('threading')) {
        if(this.viewonly) return;
        //currentPos.i = this.loom.frame_mapping[currentPos.i];
        if(editing_style == "loom")  this.drawOnThreading(loom, loom_settings, currentPos);
    } else{
        if(this.viewonly) return;
        currentPos.i = this.render.visibleRows[currentPos.i];
        if(editing_style == "drawdown")  this.drawOnDrawdown(draft, loom_settings, currentPos, shift);
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

    this.mouse_pressed = true;

    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    const draft = this.tree.getDraft(this.id);

    const frames = loom_settings.frames;
    const treadles =loom_settings.treadles;
  

  // console.log("DIV COORDS", )


    //get dimis based on zoom.
    // let dims ={
    //   w:  el.offsetWidth / warps(draft.drawdown),
    //   h:  el.offsetHeight / this.render.visibleRows.length
    // }

    let dims = this.render.getCellDims("base");
    var screen_row = Math.floor(event.offsetY / dims.h);
    var screen_col = Math.floor(event.offsetX / dims.w);

    const currentPos: Interlacement = {
      si: screen_row,
      i: screen_row, //row
      j: screen_col, //col
    };



    if (event.target.localName === 'canvas') {
    
      this.removeSubscription();    
      
      this.moveSubscription = 
        fromEvent(event.target, 'mousemove').subscribe(e => this.onMove(e));   

      // set up the Point to be used.



      if(!event.target) return;

      //reject out of bounds requests
      switch(event.target.id){
        case 'drawdown':

          currentPos.i -= 1;
          currentPos.j -= 1;
          currentPos.si -=1;

          if(currentPos.i < 0 || currentPos.i >= this.render.visibleRows.length) return;
          if(currentPos.j < 0 || currentPos.j >= warps(draft.drawdown)) return;    
          break;

        case 'threading':

          //offset for padding
          currentPos.j -= 1;

          if(currentPos.i < 0 || currentPos.i >= frames) return;
          if(currentPos.j < 0 || currentPos.j >= warps(draft.drawdown)) return;    
          break; 

        case 'treadling':
          if(currentPos.i < 0 || currentPos.i >= this.render.visibleRows.length) return;
          if(currentPos.j < 0 || currentPos.j >= treadles) return;    
          break;

        case 'tieups':
          if(currentPos.i < 0 || currentPos.i >= frames) return;
          if(currentPos.j < 0 || currentPos.j >= treadles) return;    
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
      this.tempPattern = draft.drawdown.slice();
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


    let dims = this.render.getCellDims("base");
    // var screen_row = Math.floor(event.offsetY / dims.h);
    // var screen_col = Math.floor(event.offsetX / dims.w);

    // let dims ={
    //   w: this.canvasEl.width / warps(draft.drawdown),
    //   h:  this.canvasEl.height /this.render.visibleRows.length
    // };    

    

    var offset = this.render.getCellDims(this.dm.getSelectedDesignMode('design_modes').value);

    // set up the point based on touched square.
    //var screen_row = Math.floor((event.offsetY + offset.y) / dims.h);
     var screen_row = Math.floor(event.offsetY / dims.h);
     var screen_col = Math.floor(event.offsetX / dims.w);

    const currentPos: Interlacement = {
      si: screen_row,
      i:  screen_row,
      j:  screen_col
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
          case 'toggle':
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
    this.mouse_pressed = false;


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

    if(!this.selection.hasSelection()) return;

    //if(!this.hold_copy_for_paste) this.copyArea();
    
    this.onNewSelection.emit(
      { 
        id: this.id, 
        start: {i: this.selection.getStartingRowScreenIndex(), j: this.selection.getStartingColIndex()}, 
        end: {i: this.selection.getEndingRowScreenIndex(), j: this.selection.getEndingColIndex()}})
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

  private hasSelection() : boolean {
    return this.selection.hasSelection();
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

    this.copy = initDraftWithParams({wefts: h, warps: w, drawdown: [[createCell(false)]]}).drawdown;
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
        temp_dd[i][j] = setCellValue( temp_dd[i][j], cell);
      })
    })

    this.copy = initDraftWithParams({warps: warps(temp_dd), wefts: wefts(temp_dd), drawdown: temp_dd}).drawdown;
   // document.getElementById("has_selection").style.display = 'flex';

    this.onNewSelection.emit({copy: this.copy});



  }



  // private drawWeftMaterialCell(draft:Draft, cx:any, i:number){
           

  //   var dims = this.render.getCellDims("base");
  //   var margin = this.render.zoom*2;

  //   const ndx: number = draft.rowShuttleMapping[i];
  //   cx.fillStyle = this.ms.getColor(ndx);
  //   cx.strokeStyle = '#000000';
  //   cx.lineWidth = '1';

  //    cx.fillRect(margin, (dims.h*i)+margin, dims.w-margin, dims.h-(margin));
  //    cx.strokeRect(margin, (dims.h*i)+margin, dims.w-margin, dims.h-(margin));


  // }


  // private drawWeftMaterials(draft:Draft, cx:any, canvas:any){

  //     var dims = this.render.getCellDims("base");
  //     var margin = this.render.zoom;
  //     var top = dims.h;

  //     cx.clearRect(0,0, cx.canvas.width, cx.canvas.height);


  //     canvas.width =  dims.w;
  //     canvas.height = this.render.visibleRows.length * dims.h;

  //     cx.fillStyle = "white";
  //     cx.fillRect(0,0,canvas.width,this.render.visibleRows.length*dims.h);

  //     for(var i = 0 ; i < this.render.visibleRows.length; i++){
  //         this.drawWeftMaterialCell(draft, cx, i);        
  //     }


  // }

  private drawWarpMaterialCell(draft:Draft, cx:any, j:number){
      console.log("THIS CX ", cx)

        var dims = this.render.getCellDims("base");
        var margin = this.render.zoom*2;
       const ndx: number = draft.colShuttleMapping[j];
        cx.fillStyle = this.ms.getColor(ndx);
        cx.strokeStyle = "#000000";
        cx.lineWidth = '1';

      //  if(j == warps(draft.drawdown)-1) cx.fillRect((dims.w*j)+margin, 0, dims.w-(margin*2), (dims.h) - margin);
      //  else cx.fillRect( (dims.w*j)+margin, 0, dims.w-margin, (dims.h) - margin);
      cx.fillRect( (dims.w*j)+margin, 0, dims.w-margin, (dims.h) - margin);
      cx.strokeRect( (dims.w*j)+margin, 0, dims.w-margin, (dims.h) - margin);
  }


  // private drawWarpMaterials(draft:Draft, cx:any,canvas:any){

  //   var dims = this.render.getCellDims("base");
  //   var margin = this.render.zoom;

  //   this.warpMaterialsCanvas.width =  warps(draft.drawdown) * dims.w;
  //   this.warpMaterialsCanvas.height = dims.h;

  //   cx.fillStyle = "white";
  //   cx.fillRect(0,0,canvas.width,canvas.height);
  

  //   for(var j = 0; j < warps(draft.drawdown); j++){
  //     this.drawWarpMaterialCell(draft, cx, j);
  //   } 

  // }




  // private drawWeftSelectorCell(draft:Draft, cx:any, i:number){

  //       var dims = this.render.getCellDims("base");
  //       var margin = this.render.zoom;

  //       cx.fillStyle = "#ffffff";
  //       if(i == wefts(draft.drawdown)-1) cx.fillRect(margin, (dims.h*i)+margin, dims.w, dims.h-(margin*2));
  //       else cx.fillRect(margin, (dims.h*i)+margin, dims.w, dims.h-(margin));
         
  //        cx.fillStyle = "#000000";  
  //        cx.font = "10px Arial";

  //        const sys = draft.rowSystemMapping[i];
  //        cx.fillText(this.ss.getWeftSystemCode(sys), dims.w/3, (dims.h*i)+3*dims.h/4);

  // }


  // private drawWeftSystems(draft:Draft, cx:any, canvas:HTMLCanvasElement){

  //     var dims = this.render.getCellDims("base");
  //     var top = dims.h;

  //     cx.clearRect(0,0, cx.canvas.width, cx.canvas.height);


  //     canvas.width =  dims.w;
  //     canvas.height = this.render.visibleRows.length * dims.h;

  //     cx.fillStyle = "white";
  //     cx.fillRect(0,0,canvas.width,this.render.visibleRows.length*dims.h);

  //     for(var i = 0 ; i < this.render.visibleRows.length; i++){
  //         this.drawWeftSelectorCell(draft,cx, i);        
  //     }


  // }

  private drawWarpSelectorCell(draft:Draft, cx:any, j:number){

        var dims = this.render.getCellDims("base");
        var margin = this.render.zoom;
        cx.fillStyle = "#ffffff";

        if(j == warps(draft.drawdown)-1) cx.fillRect((dims.w*j)+margin, 0, dims.w-(margin*2), (dims.h) - margin);
        else cx.fillRect( (dims.w*j)+margin, 0, dims.w-margin, (dims.h) - margin);
  
         cx.fillStyle = "#000000";  
         cx.font = "10px Arial";

         const sys = draft.colSystemMapping[j];
         cx.fillText(this.ss.getWarpSystemCode(sys),(dims.w*j)+dims.w/3, dims.w-(margin*3));


  }


  private drawWarpSystems(draft:Draft, cx:any,canvas:HTMLCanvasElement){

    // var dims = this.render.getCellDims("base");

    // this.warpSystemsCanvas.width =  warps(draft.drawdown) * dims.w;
    // this.warpSystemsCanvas.height = dims.h;

    // cx.fillStyle = "white";
    // cx.fillRect(0,0,canvas.width,canvas.height);
  

    // for(var j = 0; j < warps(draft.drawdown); j++){
    //   this.drawWarpSelectorCell(draft, cx, j);
    // } 

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
    cx.fillStyle="black";
    cx.lineWidth = .5;
    cx.lineCap = 'round';
    cx.strokeStyle = '#000';


    if(canvas.id=== "drawdown"){
      cx.fillStyle = "white";
      cx.strokeRect(dims.w,dims.h,canvas.width-2*dims.w,canvas.height-2*dims.w);

    }else if(canvas.id=== "threading"){
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




 

  public incrementWeftSystem(i: number){
    this.is_dirty = true;

    const draft = this.tree.getDraft(this.id);
    let weft = this.render.visibleRows[i];
    var newSystem = this.ss.getNextWeftSystem(weft, draft);
    draft.rowSystemMapping[weft] = newSystem;
    this.rowSystemMapping = draft.rowSystemMapping.slice();
    this.tree.setDraftOnly(this.id, draft);


  }


  
  incrementWeftMaterial(si: number){
    this.is_dirty = true;

    const weft = this.render.visibleRows[si];
    const draft = this.tree.getDraft(this.id);
    if(this.dm.isSelected('material', 'draw_modes')){
      const material_id:string = this.dm.getSelectedDesignMode('draw_modes').children[0].value;
      draft.rowShuttleMapping[weft] = parseInt(material_id);
    }else{
      const len = this.ms.getShuttles().length;
      var shuttle_id = draft.rowShuttleMapping[weft];
      var newShuttle = (shuttle_id + 1) % len;
      draft.rowShuttleMapping[weft] = newShuttle;
    }

    this.tree.setDraftOnly(this.id, draft);
    this.rowShuttleMapping = draft.rowShuttleMapping;
    this.onMaterialChange.emit(draft);

  }



  public incrementWarpSystem(j: number){
    this.is_dirty = true;

    const draft = this.tree.getDraft(this.id);
    var newSystem = this.ss.getNextWarpSystem(j,draft);
    console.log(newSystem, j);
    draft.colSystemMapping[j] = newSystem;
    this.colSystemMapping = draft.colSystemMapping.slice();

    this.tree.setDraftOnly(this.id, draft);
    // this.cdRef.detectChanges();

  }

  incrementWarpMaterial(col: number){
    this.is_dirty = true;
    const warp = col;

    const draft = this.tree.getDraft(this.id);
    if(this.dm.isSelected('material', 'draw_modes')){
      const material_id:string = this.dm.getSelectedDesignMode('draw_modes').children[0].value;
      draft.colShuttleMapping[warp] = parseInt(material_id);
    }else{
      const len = this.ms.getShuttles().length;
      var shuttle_id = draft.colShuttleMapping[warp];
      var newShuttle = (shuttle_id + 1) % len;
      draft.colShuttleMapping[warp] = newShuttle;
    }

    this.tree.setDraftOnly(this.id, draft);
    this.colShuttleMapping = draft.colShuttleMapping;
    this.onMaterialChange.emit(draft);


   
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
      this.is_dirty = true;

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
          // this.drawOnWeftMaterials(draft, currentPos);
          // this.drawOnWarpMaterials(draft, currentPos)
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
        this.onDrawdownUpdated.emit(draft);
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

    console.log( currentPos, loom.tieup )

    if (isInUserTieupRange(loom, loom_settings,  currentPos)){
      this.is_dirty = true;



      switch (this.dm.getSelectedDesignMode('draw_modes').value) {
        case 'up':
            val = true;
          break;
        case 'down':
          val = false;
          break;
        case 'toggle':
          if(currentPos.i > loom.tieup.length || currentPos.j > loom.tieup[0].length) val = true;
          else val = !loom.tieup[currentPos.i][currentPos.j];
          break;
        default:
          break;
      }

    const utils = getLoomUtilByType(loom_settings.type);
    loom = utils.updateTieup(loom, {i:currentPos.i,j: currentPos.j, val:val});
    this.tree.setLoomAndRecomputeDrawdown(this.id, loom,loom_settings)
    .then(draft => {
      this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true});
      this.tree.setDraftOnly(this.id, draft);
      this.onDrawdownUpdated.emit(draft);
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
      this.is_dirty = true;

      console.log("CURRENT THREADING ", currentPos, loom)

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
        this.tree.setDraftOnly(this.id, draft);
        this.onDrawdownUpdated.emit(draft);
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
    this.is_dirty = true;

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
        this.tree.setDraftOnly(this.id, draft);
        this.onDrawdownUpdated.emit(draft);
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
    //   cx.fillText(thread_val, 2+ left+j*base_dims.w + base_fill.x, top+i*base_dims.h + base_fill.y + base_fill.h);
      
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
    
      if(sys !== undefined && sys.visible){
        this.drawCell(draft, loom, loom_settings, this.cx, i, j, "drawdown");
      }else{

      } 
    }
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




  /**
   * redraws the loom provided into the video
   * @returns 
   */
  public redrawLoom(draft:Draft, loom:Loom, loom_settings:LoomSettings) {

    this.isFrame = isFrame(loom_settings);

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

      case 'crossing':
      this.redrawCrossings(draft);
      break;
    }
}

//takes inputs about what, exactly to redraw
public redraw(draft:Draft, loom: Loom, loom_settings:LoomSettings,  flags:any){

    var base_dims = this.render.getCellDims("base");
    this.colSystemMapping = draft.colSystemMapping;
    this.rowSystemMapping = draft.rowSystemMapping;

    if(flags.drawdown !== undefined){
        this.cx.clearRect(0,0, this.canvasEl.width, this.canvasEl.height);   
        this.cx.canvas.width = base_dims.w * (warps(draft.drawdown)+2);
        this.cx.canvas.height = base_dims.h * (this.render.visibleRows.length+2);
        this.cx.strokeStyle = "#3d3d3d";
        this.cx.fillStyle = "#ffffff";
        this.cx.fillRect(0,0,this.canvasEl.width,this.canvasEl.height);
        this.cx.strokeRect(0,0,this.canvasEl.width,this.canvasEl.height);
        this.drawDrawdown(draft, loom, loom_settings);
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
    this.cx.fillStyle = "white";
    this.cx.fillRect(0,0,this.canvasEl.width,this.canvasEl.height);

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
          var c = shuttle.color;
          var t = shuttle.thickness;
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
    this.cx.fillRect(0,0,this.canvasEl.width,this.canvasEl.height);

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
    let loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);

    si = this.translateDrawdownRowForView(draft, si);
    let index = this.render.visibleRows[si];


    draft.drawdown = insertDrawdownRow(draft.drawdown, index, null);
    draft.rowShuttleMapping = insertMappingRow(draft.rowShuttleMapping, index, 1);
    draft.rowSystemMapping = insertMappingRow(draft.rowSystemMapping, index, 0);
    const utils = getLoomUtilByType(loom_settings.type);
    loom = utils.insertIntoTreadling(loom, index, []);

    if(this.dm.getSelectedDesignMode('drawdown_editing_style').value == 'drawdown'){
      this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
      .then(loom => {
        this.render.updateVisible(draft);
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
        this.timeline.addHistoryState(draft);
        this.rowShuttleMapping = draft.rowShuttleMapping;
        this.onDrawdownUpdated.emit(draft);
      })
    }else{
      this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
      .then(draft => {
        this.render.updateVisible(draft);
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
        this.timeline.addHistoryState(draft);
        this.rowShuttleMapping = draft.rowShuttleMapping;
        this.onDrawdownUpdated.emit(draft);

      })
    }

   

  }
    /**
   * clones the selected row and pastes into next visible row
   * @param si the screen index of the row we'll insert
   * @param i the absolute (not screen) index of the row we'll insert
   */
  public cloneRow(si: number) {
    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    let loom = this.tree.getLoom(this.id);

    si = this.translateDrawdownRowForView(draft, si);
    let index = this.render.visibleRows[si];

    draft.drawdown = insertDrawdownRow(draft.drawdown, index, draft.drawdown[index].slice());
    draft.rowShuttleMapping = insertMappingRow(draft.rowShuttleMapping, index,draft.rowShuttleMapping[index]);
    draft.rowSystemMapping = insertMappingRow(draft.rowSystemMapping, index,draft.rowSystemMapping[index]);
    const utils = getLoomUtilByType(loom_settings.type);


    if(this.dm.getSelectedDesignMode('drawdown_editing_style').value == 'drawdown'){
      this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
      .then(loom => {
        this.render.updateVisible(draft);
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
        this.timeline.addHistoryState(draft);
        this.rowShuttleMapping = draft.rowShuttleMapping;
        this.onDrawdownUpdated.emit(draft);

      })
    }else{
      loom = utils.insertIntoTreadling(loom, index, loom.treadling[index].slice());

      this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
      .then(draft => {
        this.render.updateVisible(draft);
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
        this.timeline.addHistoryState(draft);
        this.rowShuttleMapping = draft.rowShuttleMapping;
        this.onDrawdownUpdated.emit(draft);

      })
    }

  }

  public deleteRow(si:number) {

    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    let loom = this.tree.getLoom(this.id);

    si = this.translateDrawdownRowForView(draft, si);
    let index = this.render.visibleRows[si];


    draft.drawdown = deleteDrawdownRow(draft.drawdown, index);
    draft.rowShuttleMapping = deleteMappingRow(draft.rowShuttleMapping, index)
    draft.rowSystemMapping = deleteMappingRow(draft.rowSystemMapping, index)
    const utils = getLoomUtilByType(loom_settings.type);
    loom = utils.deleteFromTreadling(loom, index);


    if(this.dm.getSelectedDesignMode('drawdown_editing_style').value == 'drawdown'){
      this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
      .then(loom => {
        this.render.updateVisible(draft);
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
        this.timeline.addHistoryState(draft);
        this.rowShuttleMapping = draft.rowShuttleMapping;
        this.onDrawdownUpdated.emit(draft);

      })
    }else{
      this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
      .then(draft => {
        this.render.updateVisible(draft);
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
        this.timeline.addHistoryState(draft);
        this.rowShuttleMapping = draft.rowShuttleMapping;
        this.onDrawdownUpdated.emit(draft);

      })
    }
  }

    /**
   * In
   * @extends WeaveComponent
   * @returns {void}
   */
  public insertCol(j: number) {
    const draft = this.tree.getDraft(this.id);
    let loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);

    j = this.translateDrawdownColForView(draft, j);

    draft.drawdown = insertDrawdownCol(draft.drawdown, j, null);
    draft.colShuttleMapping = insertMappingCol(draft.colShuttleMapping, j, 0);
    draft.colSystemMapping = insertMappingCol(draft.colSystemMapping, j, 0);
    const utils = getLoomUtilByType(loom_settings.type);
    loom = utils.insertIntoThreading(loom, j, -1);

    if(this.dm.getSelectedDesignMode('drawdown_editing_style').value == 'drawdown'){
      this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
      .then(loom => {
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, warp_systems: true, warp_materials:true});
        this.timeline.addHistoryState(draft);
        this.colShuttleMapping = draft.colShuttleMapping;
        this.onDrawdownUpdated.emit(draft);

      })

    }else{

      this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
      .then(draft => {
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, warp_systems: true, warp_materials:true});
        this.timeline.addHistoryState(draft);
        this.colShuttleMapping = draft.colShuttleMapping;
        this.onDrawdownUpdated.emit(draft);

      })

    }

  }

  public cloneCol(j: number) {
    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    let loom = this.tree.getLoom(this.id);

    //flip the index based on the flipped view
    j = this.translateDrawdownColForView(draft, j);

    const col:Array<Cell> =draft.drawdown.reduce((acc, el) => {
      acc.push(el[j]);
      return acc;
    }, []); 
    
    draft.drawdown = insertDrawdownCol(draft.drawdown, j, col);
    draft.colShuttleMapping = insertMappingCol(draft.colShuttleMapping, j, draft.colShuttleMapping[j]);
    draft.colSystemMapping = insertMappingCol(draft.colSystemMapping, j, draft.colSystemMapping[j]);
    const utils = getLoomUtilByType(loom_settings.type);


    if(this.dm.getSelectedDesignMode('drawdown_editing_style').value == 'drawdown'){
      this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
      .then(loom => {
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, warp_systems: true, warp_materials:true});
        this.timeline.addHistoryState(draft);
        this.colShuttleMapping = draft.colShuttleMapping;
        this.onDrawdownUpdated.emit(draft);

      })

    }else{
      loom = utils.insertIntoThreading(loom, j, loom.threading[j]);

      this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
      .then(draft => {
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, warp_systems: true, warp_materials:true});
        this.timeline.addHistoryState(draft);
        this.colShuttleMapping = draft.colShuttleMapping;
        this.onDrawdownUpdated.emit(draft);

      })

    }

  }


  public deleteCol(j: number) {
    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    let loom = this.tree.getLoom(this.id);

    j = this.translateDrawdownColForView(draft, j);

    
      draft.drawdown = deleteDrawdownCol(draft.drawdown, j);
      draft.colShuttleMapping = deleteMappingCol(draft.colShuttleMapping, j);
      draft.colSystemMapping = deleteMappingCol(draft.colSystemMapping, j);
      const utils = getLoomUtilByType(loom_settings.type);
      loom = utils.deleteFromThreading(loom, j);
  
    
      if(this.dm.getSelectedDesignMode('drawdown_editing_style').value == 'drawdown'){
        this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
        .then(loom => {
          this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, warp_systems: true, warp_materials:true});
          this.timeline.addHistoryState(draft);
          this.colShuttleMapping = draft.colShuttleMapping;
          this.onDrawdownUpdated.emit(draft);

        })
  
      }else{
        this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
        .then(draft => {
          this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, warp_systems: true, warp_materials:true});
          this.timeline.addHistoryState(draft);
          this.colShuttleMapping = draft.colShuttleMapping;
          this.onDrawdownUpdated.emit(draft);

        })
  
      }
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
    draft.drawdown = pasteIntoDrawdown(draft.drawdown,[[createCell(b)]],this.selection.getStartingRowScreenIndex(),this.selection.getStartingColIndex(), width, height);
    
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



  // public pasteViaOperation(type){

  //   const draft =  this.tree.getDraft(this.id);
  //   const copy_draft = initDraftWithParams({warps: warps(this.copy), wefts: wefts(this.copy), drawdown: this.copy});
  //   const loom_settings = this.tree.getLoomSettings(this.id);

  //   const adj_start_i = this.render.visibleRows[this.selection.getStartingRowScreenIndex()];
  //   const adj_end_i = this.render.visibleRows[this.selection.getEndingRowScreenIndex()];
  //   const height = adj_end_i - adj_start_i;
  //   let op: Operation;

  //   let inputs: Array<OpInput> = [];
  
  
  //     const flips = utilInstance.getFlips(this.ws.selected_origin_option, 3);
      


  //     return flipDraft(copy_draft, flips.horiz, flips.vert)
  //     .then(flipped_draft => {

  //       // switch(type){
  //       //   case 'invert':
  //       //     op = this.ops.getOp('invert');
  //       //     inputs.push({op_name: op.name, drafts: [], inlet: -1, params: []});
  //       //     inputs.push({op_name:'child', drafts: [flipped_draft], inlet: 0, params: []});
  //       //   break;
  //       //   case 'mirrorX':
  //       //     op = this.ops.getOp('flip horiz');
  //       //     inputs.push({op_name: op.name, drafts: [], inlet: -1, params: []});
  //       //     inputs.push({op_name:'child', drafts: [flipped_draft], inlet: 0, params: []});
  //       //     break;
  //       //   case 'mirrorY':
  //       //     op = this.ops.getOp('flip vert');
  //       //     inputs.push({op_name: op.name, drafts: [], inlet: -1, params: []});
  //       //     inputs.push({op_name:'child', drafts: [flipped_draft], inlet: 0, params: []});
  //       //     break;
  //       //   case 'shiftLeft':
  //       //     op = this.ops.getOp('shift left');
  //       //     inputs.push({op_name: op.name, drafts: [], inlet: -1, params: [1]});
  //       //     inputs.push({op_name:'child', drafts: [flipped_draft], inlet: 0, params: []});
  //       //     break;
  //       //   case 'shiftUp':
  //       //     op = this.ops.getOp('shift up');
  //       //     inputs.push({op_name: op.name, drafts: [], inlet: -1, params: [1]});
  //       //     inputs.push({op_name:'child', drafts: [flipped_draft], inlet: 0, params: []});
  //       //     break;
  //       // }
  //       // return op.perform(inputs);
  //     })
  //     .then(res => {
  //       return flipDraft(res[0], flips.horiz, flips.vert);
  //     })
  //     .then(finalres => {
  //       draft.drawdown = pasteIntoDrawdown(
  //         draft.drawdown, 
  //         finalres.drawdown, 
  //         adj_start_i, 
  //         this.selection.getStartingColIndex(),
  //         this.selection.getWidth(),
  //         height);
    
  //       this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings).then(loom => {
  //         this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true, weft_materials: true, warp_materials:true, weft_systems:true, warp_systems:true});

  //       })

  //     })
     

  
  
     
    
  // }

  /**
   * Tells weave reference to paste copied pattern.
   * @extends WeaveComponent
   * @param {Event} e - paste event from design component.
   * @returns {void}
   */
   public onPaste(e) {


    console.log("ON PASTE ", this.copy)

    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    const loom_util = getLoomUtilByType(loom_settings.type);
    let pattern:Array<number> = [];
    let mapping:Array<number> = [];

    this.hold_copy_for_paste = false;

    var type;

    if(e.type === undefined) type = "original";
    else type =  e.type;

    // if(type !== 'original'){
    //   this.pasteViaOperation(type);
    // }


    // const adj_start_i = this.render.visibleRows[this.selection.getStartingRowScreenIndex()];
    // const adj_end_i = this.render.visibleRows[this.selection.getEndingRowScreenIndex()];
    console.log("adj start, end ", this.selection.getEndingRowScreenIndex(), this.selection.getStartingRowScreenIndex())

    const height = this.selection.getEndingRowScreenIndex() - this.selection.getStartingRowScreenIndex();


    console.log("TARGET ", this.selection.getTargetId())
    switch(this.selection.getTargetId()){    
      case 'drawdown':
        console.log("IN DRAWDOWN ",  this.selection.getWidth())
        draft.drawdown = pasteIntoDrawdown(
          draft.drawdown, 
          this.copy, 
          this.selection.getStartingRowScreenIndex(), 
          this.selection.getStartingColIndex(),
          this.selection.getWidth(),
          height);
    
        
        //if you do this when updates come from loom, it will erase those updates
        this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
        .then(loom => {
          this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true, weft_materials: true, warp_materials:true, weft_systems:true, warp_systems:true});

        });
       break;

      case 'threading':
        loom_util.pasteThreading(loom, this.copy, {i: this.selection.getStartingRowScreenIndex(), j: this.selection.getStartingColIndex(), val: null}, this.selection.getWidth(), height);
        this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
        .then(draft => {
          this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true, weft_materials: true, warp_materials:true, weft_systems:true, warp_systems:true});
        });
        break;
      case 'tieup':
        loom_util.pasteTieup(loom,this.copy, {i: this.selection.getStartingRowScreenIndex(), j: this.selection.getStartingColIndex(), val: null}, this.selection.getWidth(), height);
        this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
        .then(draft => {
          this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true, weft_materials: true, warp_materials:true, weft_systems:true, warp_systems:true});
        });
        break;
      case 'treadling':
        loom_util.pasteTreadling(loom, this.copy, {i: this.selection.getStartingRowScreenIndex(), j: this.selection.getStartingColIndex(), val: null}, this.selection.getWidth(), height);
        this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
        .then(draft => {
          this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true, weft_materials: true, warp_materials:true, weft_systems:true, warp_systems:true});
        });
        break;

      case 'warp-systems':

         pattern = []; 
          for(let j = 0; j < this.copy[0].length; j++){
              const assigned_to = this.copy.findIndex(sys => getCellValue(sys[j]) == true);
              pattern.push(assigned_to);
           }
            mapping = generateMappingFromPattern(draft.drawdown, pattern, 'col', this.ws.selected_origin_option);

           draft.colSystemMapping = mapping.map((el, ndx) => {
              if(ndx >= this.selection.getStartingColIndex() && ndx < this.selection.getStartingColIndex() + this.selection.getWidth()){
                return el;
              }else{
                return draft.colSystemMapping[ndx];
              }
            });

            this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true, weft_materials: true, warp_materials:true, weft_systems:true, warp_systems:true});

          break;
      case 'warp-materials':

        pattern = []; 
        for(let j = 0; j < this.copy[0].length; j++){
            const assigned_to = this.copy.findIndex(sys => getCellValue(sys[j]) == true);
            pattern.push(assigned_to);
         }
          mapping = generateMappingFromPattern(draft.drawdown, pattern, 'col', this.ws.selected_origin_option);

         draft.colShuttleMapping = mapping.map((el, ndx) => {
            if(ndx >= this.selection.getStartingColIndex() && ndx < this.selection.getStartingColIndex() + this.selection.getWidth()){
              return el;
            }else{
              return draft.colShuttleMapping[ndx];
            }
          });

          this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true, weft_materials: true, warp_materials:true, weft_systems:true, warp_systems:true});


        break;

        case 'weft-systems':

          pattern = []; 
          for(let i = 0; i < this.copy.length; i++){
              const assigned_to = this.copy[i].findIndex(sys => getCellValue(sys) == true);
              pattern.push(assigned_to);
           }
            mapping = generateMappingFromPattern(draft.drawdown, pattern, 'row', this.ws.selected_origin_option);

           draft.rowSystemMapping = mapping.map((el, ndx) => {
              if(ndx >= this.selection.getStartingRowScreenIndex() && ndx < this.selection.getStartingRowScreenIndex() + height){
                return el;
              }else{
                return draft.rowSystemMapping[ndx];
              }
            });

            this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true, weft_materials: true, warp_materials:true, weft_systems:true, warp_systems:true});

          break;

          case 'weft-materials':
          
            pattern = []; 
            for(let i = 0; i < this.copy.length; i++){
                const assigned_to = this.copy[i].findIndex(sys => getCellValue(sys) == true);
                pattern.push(assigned_to);
             }
              mapping = generateMappingFromPattern(draft.drawdown, pattern, 'row', this.ws.selected_origin_option);
  
             draft.rowShuttleMapping = mapping.map((el, ndx) => {
                if(ndx >= this.selection.getStartingRowScreenIndex() && ndx < this.selection.getStartingRowScreenIndex() + height){
                  return el;
                }else{
                  return draft.rowShuttleMapping[ndx];
                }
              });
  
              this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true, weft_materials: true, warp_materials:true, weft_systems:true, warp_systems:true});
  
            break;
    }

  
    this.copyArea();

 

  }

  onCopy(){
    this.copyArea();
    this.hold_copy_for_paste = true;
  }

 



  swapEditingStyle(){
    const loom_settings = this.tree.getLoomSettings(this.id);
    if(loom_settings.type !== 'jacquard'){
      this.selection.onSelectCancel();
      if(this.dm.getSelectedDesignMode('drawdown_editing_style').value === 'drawdown'){
        this.dm.selectDesignMode('loom', 'drawdown_editing_style')
      }else{
        this.dm.selectDesignMode('drawdown', 'drawdown_editing_style')
      }
    }
  
  }
  
  
  loomChange(e:any){
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    this.selected_loom_type =  e.value.loomtype;

    if (loom_settings.type === 'jacquard') this.dm.selectDesignMode('drawdown', 'drawdown_editing_style')
 
    let utils:LoomUtil = null;
  
      const new_settings:LoomSettings = {
        type: e.value.loomtype,
        epi: loom_settings.epi,
        units: loom_settings.units,
        frames: loom_settings.frames,
        treadles: loom_settings.treadles
      }
  

      //make null effectively function as though it was jacquard
      if(loom_settings.type === null) loom_settings.type == 'jacquard';

      //there are several combinations that could take place

      //from jacquard to direct tie loom
      utils = getLoomUtilByType(new_settings.type);
      this.isFrame = isFrame(new_settings);

      if(loom_settings.type === 'jacquard' && new_settings.type === 'direct'){

        this.tree.setLoomSettings(this.id, new_settings);      
        this.loom_settings = new_settings;
       
        utils.computeLoomFromDrawdown(draft.drawdown, new_settings, this.ws.selected_origin_option)
        .then(loom => {
          this.tree.setLoom(this.id, loom);
          const treadles = Math.max(numTreadles(loom), loom_settings.treadles);  
          const frames = Math.max(numFrames(loom), loom_settings.frames);
          this.treadles = Math.max(treadles, frames);
          this.frames = Math.max(treadles, frames);
          this.redraw(draft, loom, new_settings, {loom: true});

          this.onLoomSettingsUpdated.emit();



        });

      }else if(loom_settings.type === 'jacquard' && new_settings.type === 'frame'){
          //from jacquard to floor loom (shaft/treadle) 'frame'
          this.tree.setLoomSettings(this.id, new_settings);      
          this.loom_settings = new_settings;

          utils.computeLoomFromDrawdown(draft.drawdown, new_settings, this.ws.selected_origin_option)
          .then(loom => {
            this.tree.setLoom(this.id, loom);
            this.treadles = Math.max(numTreadles(loom), loom_settings.treadles);
            this.frames = Math.max(numFrames(loom), loom_settings.frames);
            this.redraw(draft, loom, new_settings, {loom: true});
            this.onLoomSettingsUpdated.emit();

          });
      }else if(loom_settings.type === 'direct' && new_settings.type === 'jacquard'){
        // from direct-tie to jacquard
        //do nothing, we'll just keep the drawdown
        this.tree.setLoom(this.id, null);
        this.tree.setLoomSettings(this.id, new_settings);      
        this.loom_settings = new_settings;
        this.onLoomSettingsUpdated.emit();

      }else if(loom_settings.type === 'frame' && new_settings.type === 'jacquard'){
        // from direct-tie to jacquard
        //do nothing, we'll just keep the drawdown
        this.tree.setLoom(this.id, null);
        this.tree.setLoomSettings(this.id, new_settings);      
        this.loom_settings = new_settings;
        this.onLoomSettingsUpdated.emit();

      }else if(loom_settings.type == 'direct' && new_settings.type == 'frame'){
      // from direct-tie to floor

      const converted_loom = convertLiftPlanToTieup(loom);
      this.tree.setLoom(this.id, converted_loom);
      this.frames = numFrames(converted_loom);
      this.treadles = numTreadles(converted_loom);
      this.tree.setLoomSettings(this.id, new_settings);      
      this.loom_settings = new_settings;
      this.redraw(draft, converted_loom, new_settings, {loom: true});
      this.onLoomSettingsUpdated.emit();





      }else if(loom_settings.type == 'frame' && new_settings.type == 'direct'){
        // from floor to direct
        const converted_loom = convertTieupToLiftPlan(loom);
        this.tree.setLoom(this.id, converted_loom);
        this.frames = numFrames(converted_loom);
        this.treadles = numTreadles(converted_loom);
        this.tree.setLoomSettings(this.id, new_settings);      
        this.loom_settings = new_settings;
        this.redraw(draft, converted_loom, new_settings, {loom: true});
        this.onLoomSettingsUpdated.emit();


      }


  
    } 
  
  
  public unitChange(){

    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    loom_settings.units = this.selected_units;
    this.tree.setLoomSettings(this.id, loom_settings);
    this.redraw(draft, loom, loom_settings, {loom: true});
    this.onLoomSettingsUpdated.emit();
  }
  
  
  
  /**
   * recomputes warps and epi if the width of the loom is changed
   * @param f 
   */
  widthChange(f: NgForm) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
  
    if(!f.value.width){
      f.value.width = 1;
      this.width = f.value.width;
    } 
  
    // if(this.warp_locked){
      var new_epi = (loom_settings.units == "in") ? f.value.warps / f.value.width : (10 * f.value.warps / f.value.width);   
      loom_settings.epi = new_epi;
      f.value.epi = new_epi;
      this.tree.setLoomSettings(this.id, loom_settings);
      this.redraw(draft, loom, loom_settings, {loom: true});
      this.onDrawdownUpdated.emit()
    // }else{
    //   var new_warps = (loom_settings.units === "in") 
    //   ? Math.ceil(f.value.width * f.value.epi) : 
    //   Math.ceil((10 * f.value.warps / f.value.width));
  
    //   this.warpNumChange({warps: new_warps});
    // }
  }
  
  public warpNumChange(e:any) {
  
    if(e.warps == "") return;
  
    const draft = this.tree.getDraft(this.id);
    let loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
  
  
    if(e.warps > warps(draft.drawdown)){
      var diff = e.warps -  warps(draft.drawdown);
      for(var i = 0; i < diff; i++){  
  
        let ndx = warps(draft.drawdown);
        const utils = getLoomUtilByType(loom_settings.type);
        loom = utils.insertIntoThreading(loom, ndx, -1);
  
        draft.drawdown = insertDrawdownCol(draft.drawdown,ndx, null);
        draft.colShuttleMapping = insertMappingCol(draft.colShuttleMapping,ndx, 0);
        draft.colSystemMapping = insertMappingCol(draft.colSystemMapping,ndx, 0);
        
      }
    }else{
  
      var diff = warps(draft.drawdown) - e.warps;
      for(var i = 0; i < diff; i++){  
        let ndx = warps(draft.drawdown)-1;
  
        const utils = getLoomUtilByType(loom_settings.type);
        loom = utils.deleteFromThreading(loom, ndx);
        draft.drawdown = deleteDrawdownCol(draft.drawdown, ndx);
        draft.colShuttleMapping = deleteMappingCol(draft.colShuttleMapping,ndx);
        draft.colSystemMapping = deleteMappingCol(draft.colSystemMapping,ndx);
  
      }
  
    }
  
    if(this.dm.getSelectedDesignMode('drawdown_editing_style').value == 'drawdown'){
      this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
      .then(loom => {
          this.redraw(draft, loom, loom_settings, {
            drawdown: true, 
            loom:true, 
            warp_systems: true, 
            warp_materials: true,
          });
          this.onDrawdownUpdated.emit()

        })
  
    }else{
      this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
      .then(draft => {
        this.redraw(draft, loom, loom_settings, {
          drawdown: true, 
          loom:true, 
          warp_systems: true, 
          warp_materials: true,
        });
        this.onDrawdownUpdated.emit()

      })
  
    }
  
  
  }
  
  
  warpChange(f: NgForm) {
  
    const loom_settings = this.tree.getLoomSettings(this.id);
  
    if(!f.value.warps){
     f.value.warps = 2;
     this.warps = f.value.warps;
    }
    this.warpNumChange({warps: f.value.warps})
    this.width = (loom_settings.units =='cm') ? f.value.warps / loom_settings.epi * 10 : f.value.warps / loom_settings.epi;
    f.value.width = this.width;
  
  }
  
  weftChange(f: NgForm) {
    if(!f.value.wefts){
      f.value.wefts = 2;
      this.wefts = 2;
    } 
    this.weftNumChange({wefts: f.value.wefts})
  
  }
  
  public weftNumChange(e:any) {
  
    if(e.wefts === "" || e.wefts =="null") return;
  
  
    const draft = this.tree.getDraft(this.id);
    let loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
  
  
    if(e.wefts > wefts(draft.drawdown)){
      var diff = e.wefts - wefts(draft.drawdown);
  
      for(var i = 0; i < diff; i++){  
        let ndx = wefts(draft.drawdown);
  
        draft.drawdown = insertDrawdownRow(draft.drawdown,ndx, null);
        draft.rowShuttleMapping = insertMappingRow(draft.rowShuttleMapping,  ndx, 1)
        draft.rowSystemMapping = insertMappingRow(draft.rowSystemMapping,  ndx, 0);
        this.render.updateVisible(draft);
        const utils = getLoomUtilByType(loom_settings.type);
        loom = utils.insertIntoTreadling(loom, ndx, []);
      }
    }else{
      var diff = wefts(draft.drawdown) - e.wefts;
      for(var i = 0; i < diff; i++){  
        let ndx = wefts(draft.drawdown)-1;
        draft.drawdown = deleteDrawdownRow(draft.drawdown, ndx);
        draft.rowShuttleMapping = deleteMappingRow(draft.rowShuttleMapping, ndx)
        draft.rowSystemMapping = deleteMappingRow(draft.rowSystemMapping,  ndx)
        const utils = getLoomUtilByType(loom_settings.type);
        loom =  utils.deleteFromTreadling(loom, ndx);
        this.render.updateVisible(draft);

      }
    }
  
    if(this.dm.getSelectedDesignMode('drawdown_editing_style').value == 'drawdown'){
  
      this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
      .then(loom => {
        this.redraw(draft, loom, loom_settings, {
          drawdown: true, 
          loom:true, 
          weft_systems: true, 
          weft_materials: true,
        });
        this.onDrawdownUpdated.emit()

      })
    }else{
      this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
      .then(draft => {

        this.redraw(draft, loom, loom_settings, {
          drawdown: true, 
          loom:true, 
          weft_systems: true, 
          weft_materials: true,
        });  
        this.onDrawdownUpdated.emit()
  
      })
    }
   
  }



  public frameChange(e:any){
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    loom_settings.frames = e.value;
    this.tree.setLoomSettings(this.id, loom_settings);
    this.redraw(draft, loom, loom_settings, {loom: true});
  }

  public treadleChange(e:any){
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    this.tree.setLoomSettings(this.id, loom_settings);
    this.redraw(draft, loom, loom_settings, {loom: true});
  }


  updateMinTreadles(f: NgForm){
    //validate the input
    const loom_settings = this.tree.getLoomSettings(this.id);
    const loom = this.tree.getLoom(this.id);
    const draft = this.tree.getDraft(this.id);

    if(!f.value.treadles){
      f.value.treadles = 2; 
      this.treadles = f.value.treadles;
    } 

    f.value.treadles = Math.ceil(f.value.treadles);
   

      loom_settings.treadles = f.value.treadles;

      if(loom_settings.type == 'direct'){
        this.frames = f.value.treadles;
        this.treadles = f.value.treadles;
        loom_settings.frames = this.frames;
        loom_settings.treadles = this.treadles;
        loom.tieup = generateDirectTieup(f.value.treadles);
        this.tree.setLoom(this.id, loom);

      }

      this.tree.setLoomSettings(this.id, loom_settings);
      this.redraw(draft, loom, loom_settings, {
        loom:true, 
      });
    

  }

  updateMinFrames(f: NgForm){
    const loom_settings = this.tree.getLoomSettings(this.id);
    const loom = this.tree.getLoom(this.id);
    const draft = this.tree.getDraft(this.id);

    if(!f.value.frames){
      f.value.frames = 2; 
      this.frames = f.value.frames;

    }
     

    f.value.frames = Math.ceil(f.value.frames);
    

      loom_settings.frames = f.value.frames;

      if(loom_settings.type == 'direct'){
        this.frames = f.value.frames;
        this.treadles = f.value.frames;
        loom_settings.frames = this.frames;
        loom_settings.treadles = this.treadles;
        loom.tieup = generateDirectTieup(f.value.frames);
        this.tree.setLoom(this.id, loom);
      }

      this.tree.setLoomSettings(this.id, loom_settings);      
      this.redraw(draft, loom, loom_settings, {
        loom:true, 
      });
    
  }


epiChange(f: NgForm) {

  const loom_settings = this.tree.getLoomSettings(this.id);
  const draft = this.tree.getDraft(this.id);

  if(!f.value.epi){
    f.value.epi = 1;
    loom_settings.epi = f.value.epi;
    this.tree.setLoomSettings(this.id, loom_settings);
  } 
  
  //this.loom.overloadEpi(f.value.epi);
  this.ws.epi = f.value.epi;

  this.width = (loom_settings.units =='cm') ? f.value.warps / loom_settings.epi * 10 : f.value.warps / loom_settings.epi;
  f.value.width = this.width;
  
  this.onLoomSettingsUpdated.emit();
  this.onMaterialChange.emit(draft);


  }


  public checkForPaint(source: string, index: number, event: any){
    const draft = this.tree.getDraft(this.id);
    if(this.dm.isSelected('material', 'draw_modes') && this.mouse_pressed){
      
      const material_id:string = this.dm.getSelectedDesignMode('draw_modes').children[0].value;
      if(source == 'weft') draft.rowShuttleMapping[index] = parseInt(material_id);
      if(source == 'warp') draft.colShuttleMapping[index] = parseInt(material_id);
      this.onMaterialChange.emit();

    } 



  }


  public updateWarpSystems(pattern: Array<number>) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    draft.colSystemMapping = generateMappingFromPattern(draft.drawdown, pattern, 'col', this.ws.selected_origin_option);
    this.tree.setDraftOnly(this.id, draft);
    this.redraw(draft, loom, loom_settings, {drawdown: true, warp_systems: true});
    
  }

  public updateWeftSystems(pattern: Array<number>) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    draft.rowSystemMapping =  generateMappingFromPattern(draft.drawdown, pattern, 'row', this.ws.selected_origin_option);
    this.rowSystemMapping = draft.rowSystemMapping.slice();
    this.tree.setDraftOnly(this.id, draft);
     this.redraw(draft, loom, loom_settings, {drawdown: true, weft_systems: true});
     
  }

  public updateWarpShuttles(pattern: Array<number>) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    
    draft.colShuttleMapping = generateMappingFromPattern(draft.drawdown, pattern, 'col', this.ws.selected_origin_option);
    this.tree.setDraftOnly(this.id, draft);
    this.colShuttleMapping = draft.colShuttleMapping.slice();

     this.redraw(draft, loom, loom_settings,{drawdown: true, warp_materials: true});
     this.onMaterialChange.emit();

  }

  public updateWeftShuttles(pattern: Array<number>) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    draft.rowShuttleMapping = generateMappingFromPattern(draft.drawdown, pattern, 'row', this.ws.selected_origin_option);
    this.tree.setDraftOnly(this.id, draft);
    this.rowShuttleMapping = draft.rowShuttleMapping.slice();
     this.redraw(draft, loom, loom_settings,{drawdown: true, weft_materials: true});

     this.onMaterialChange.emit();

  }


  /**
   * Updates the canvas based on the weave view.
   * @extends WeaveComponent
   * @param {Event} e - view change event from design component.
   * @returns {void}
   */
  public viewChange(value: any) {
    
    // const draft = this.tree.getDraft(this.id);
    // const loom = this.tree.getDraft(this.id);
    // const loom_settings = this.tree.getDraft(this.id);

    // this.dm.selectDesignMode(value, 'view_modes');
    // this.render.setCurrentView(value);


    // // this.redraw(draft, loom, loom_settings,  {
    // //   drawdown: true
    // // });
  }

  public renderChange(e: any){

    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
     
     if(e.source === "slider"){
        this.render.setZoom(e.value);
        this.rescale(this.render.getZoom());

     } 

     if(e.source === "in"){
        this.render.zoomIn();
        this.rescale(this.render.getZoom());


     } 

     if(e.source === "out"){
        this.render.zoomOut();
        this.rescale(this.render.getZoom());


     } 
     if(e.source === "front"){
        this.render.setFront(!e.checked);
        this.flip();
        this.redraw(draft, loom, loom_settings, {drawdown:true});
     }      
  }


  public redrawLoomAndDraft(){

    const draft = this.tree.getDraft(this.id)
    const loom = this.tree.getLoom(this.id)
    const loom_settings = this.tree.getLoomSettings(this.id);
    this.render.updateVisible(draft);

    const is_frame = isFrame(loom_settings);
    if(is_frame){
      this.isFrame = true;
    }else{
      this.isFrame = false;
    }
    this.colShuttleMapping = draft.colShuttleMapping.slice();
    this.rowShuttleMapping = draft.rowShuttleMapping.slice();
    this.redraw(draft, loom, loom_settings,{drawdown: true, loom:true, warp_systems: true, warp_materials: true, weft_systems: true, weft_materials:true});
  
  }

    /**
   * Change the name of the brush to reflect selected brush.
   * @extends WeaveComponent
   * @param {Event} e - brush change event from design component.
   * @returns {void}
   */
    public designModeChange(e:any) {

      this.unsetSelection();
      this.onDesignModeChange.emit(e)
;  
    }
  


  public createShuttle(e: any) {
    this.ms.addShuttle(e.shuttle); 
  }

  // public createWarpSystem(e: any) {
  //   this.draft.addWarpSystem(e.system);
  // }

  // public createWeftSystem(e: any) {
  //   this.draft.addWarpSystem(e.system);
  // }

  public hideWarpSystem(e:any) {
    
    //this.weaveRef.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});
  }

  public showWarpSystem(e:any) {

   // this.weaveRef.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});
  }  

  public hideWeftSystem(e:any) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    
    this.render.updateVisible(draft);
    
    // this.weaveRef.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
  }

  public showWeftSystem(e:any) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    
    this.render.updateVisible(draft);

    // this.weaveRef.redraw(draft, loom, loom_settings,{drawdown: true, loom:true, weft_systems: true, weft_materials:true});
  }

 





}
