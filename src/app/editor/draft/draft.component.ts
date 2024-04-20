import { Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { ZoomService } from '../../core/provider/zoom.service';
import { createCell, getCellValue, setCellValue } from '../../core/model/cell';
import { CanvasList, Cell, Draft, Drawdown, Interlacement, Loom, LoomSettings, RenderingFlags } from '../../core/model/datatypes';
import { defaults } from '../../core/model/defaults';
import { copyDraft, createBlankDrawdown, deleteDrawdownCol, deleteDrawdownRow, deleteMappingCol, deleteMappingRow, generateMappingFromPattern, getDraftAsImage, hasCell, initDraftWithParams, insertDrawdownCol, insertDrawdownRow, insertMappingCol, insertMappingRow, isSet, isUp, pasteIntoDrawdown, setHeddle, warps, wefts } from '../../core/model/drafts';
import { getLoomUtilByType, isFrame, isInUserThreadingRange, isInUserTieupRange, isInUserTreadlingRange, numFrames, numTreadles } from '../../core/model/looms';
import { DesignmodesService } from '../../core/provider/designmodes.service';
import { FileService } from '../../core/provider/file.service';
import { MaterialsService } from '../../core/provider/materials.service';
import { OperationService } from '../../core/provider/operation.service';
import { StateService } from '../../core/provider/state.service';
import { SystemsService } from '../../core/provider/systems.service';
import { TreeService } from '../../core/provider/tree.service';
import { WorkspaceService } from '../../core/provider/workspace.service';
import { RenderService } from '../../core/provider/render.service';
import { SelectionComponent } from './selection/selection.component';

@Component({
  selector: 'app-draft',
  templateUrl: './draft.component.html',
  styleUrls: ['./draft.component.scss']
})
export class DraftComponent implements OnInit {

  @ViewChild('bitmapImage') bitmap;
  @ViewChild('selection', {read: SelectionComponent, static: true}) selection: SelectionComponent;

  /**
   * a descriptor of the parent who generated this window
   * @property {string} will be "weaver" or "mixer"
   */
   @Input('source') source: string;
   @Input('current_view') current_view: string;

 
 /**
    * The Timeline object containing state histories for undo and redo
    * @property {Timeline}
   */
  //  @Input('timeline') timeline: any;
 
   @Input() viewonly: boolean;
   @Input() hasFocus: boolean;

 
 
   @Output() onNewSelection = new EventEmitter();
   @Output() onDrawdownUpdated = new EventEmitter();
   @Output() onViewerExpanded = new EventEmitter();
   @Output() onDesignModeChange = new EventEmitter();
   @Output() onMaterialChange = new EventEmitter();
   @Output() onLoomSettingsUpdated = new EventEmitter();
   @Output() onDraftChanged = new EventEmitter();


  hold_copy_for_paste: boolean = false;

  //store this here as you need it to draw the view
  colShuttleMapping: Array<number> = [];
  rowShuttleMapping: Array<number>= [];
  colSystemMapping: Array<number>= [];
  rowSystemMapping: Array<number>= [];

   /**
    * flag defining if there needs to be a recomputation of the draft on Mouse Up
    */
   flag_recompute: boolean;
 
 
   /**
    * flag defining if there needs to be a recomputation of the draft on Mouse Up
    */
   flag_history: boolean;


   copy: Drawdown;


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
    * The HTML SVG element used to show the row
    * @property {HTMLElement}
    */
   svgSelectRow: HTMLElement;
 
 
  /**
    * The HTML SVG element used to show the row
    * @property {HTMLElement}
    */
   svgSelectCol: HTMLElement;
 
 
 
   canvases: CanvasList = null;
 
 
  //  weftMaterialsCanvas: HTMLCanvasElement;
  //  warpMaterialsCanvas: HTMLCanvasElement;
 
   private tempPattern: Array<Array<Cell>>;
   private unsubscribe$ = new Subject();

 
   private lastPos: Interlacement;
 

   isFrame: boolean;
   treadles: number;
   frames: number;
   warps: number; 
   wefts: number;
   width: number;
   epi: number;

   selected_loom_type;

   selected_units: 'cm' | 'in';

  /** VIEW OPTIONS */

  expanded: boolean = false;

  system_codes: Array<string> = [];

  id: number = -1;

  is_dirty: boolean = false;

  selected_material_id: number = 0;

 
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
    public render: RenderService,
    private zs: ZoomService
  ) { 

    this.flag_recompute = false;
    this.flag_history = false;
    this.system_codes = defaults.weft_system_codes;

  }

  ngOnInit() {

  }

  ngAfterViewInit(){

    // define the elements and context of the weave draft, threading, treadling, and tieups.
    const canvasEl = <HTMLCanvasElement> document.getElementById('drawdown-editor');
    const threadingCanvas = <HTMLCanvasElement> document.getElementById('threading-editor');
    const tieupsCanvas = <HTMLCanvasElement> document.getElementById('tieups-editor');
    const treadlingCanvas = <HTMLCanvasElement> document.getElementById('treadling-editor');
    const warp_systems_canvas =  
    <HTMLCanvasElement> document.getElementById('warp-systems-editor');
    const warp_mats_canvas =  <HTMLCanvasElement> document.getElementById('warp-materials-editor');
    const weft_systems_canvas =  <HTMLCanvasElement> document.getElementById('weft-systems-editor');
    const weft_mats_canvas =  <HTMLCanvasElement> document.getElementById('weft-materials-editor');



    this.canvases = {
      id: -1, 
      drawdown: canvasEl, 
      threading: threadingCanvas, 
      tieup: tieupsCanvas, 
      treadling: treadlingCanvas,
      warp_systems: warp_systems_canvas, 
      warp_mats: warp_mats_canvas, 
      weft_systems: weft_systems_canvas,
      weft_mats: weft_mats_canvas
    }
    
  
  
    // this.svgSelectRow = el.nativeElement.children[12];
    // this.svgSelectCol = el.nativeElement.children[13];
    this.divWesy =  document.getElementById('weft-systems-text-editor');
    this.divWasy =  document.getElementById('warp-systems-text-editor');

   


    this.rescale();

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



  /**
   * called when a new draft is loaded. updates the zoom such that the draft content fills the window. 
   * @param draft 
   * @param loom 
   * @param loom_settings 
   */
  computeAndSetScale(draft: Draft, loom: Loom, loom_settings: LoomSettings) {

    let adj = 1;
    let margin = 160;

    let div_draftviewer = document.getElementById('draft_viewer');
     let rect_draftviewer = div_draftviewer.getBoundingClientRect();
     let cell_size = this.render.calculateCellSize(draft);

    let weft_num = wefts(draft.drawdown);
    let warp_num = warps(draft.drawdown);
    let treadles = (isFrame(loom_settings)) ? numTreadles(loom) : 0;
    let frames = (isFrame(loom_settings)) ? numTreadles(loom) : 0;
    let draft_width = (isFrame(loom_settings)) ? (warp_num + treadles) * cell_size : (warp_num)  * cell_size; 
    let draft_height = (isFrame(loom_settings)) ? (weft_num + frames)* cell_size : (weft_num)  * cell_size; 

    //add 100 to make space for the warp and weft selectors
    draft_width += margin;
    draft_height += margin;

   
    //get the ration of the view to the item
    let width_adj = rect_draftviewer.width / draft_width;
    let height_adj = rect_draftviewer.height /draft_height;

      //make the zoom the smaller of the width or height
      adj = Math.min(width_adj, height_adj);
     
      if(adj !== 0) this.zs.setEditorIndexFromZoomValue(adj);
      
      this.rescale();     

  }




  //this is called anytime a new draft object is loaded. 
  onNewDraftLoaded(id: number) {  

    this.id = id;  

    if(id == -1) return;

    const loom_settings = this.tree.getLoomSettings(id);
    const draft = this.tree.getDraft(id);
    const loom = this.tree.getLoom(id);
    this.isFrame = isFrame(loom_settings);

    this.resetDirty();
    
    this.selected_loom_type = loom_settings.type;
    if(this.selected_loom_type == 'jacquard') this.dm.selectDraftEditSource('drawdown')

    this.frames = Math.max(numFrames(loom), loom_settings.frames);
    this.treadles = Math.max(numTreadles(loom), loom_settings.treadles);

    this.warps = warps(draft.drawdown);
    this.wefts = wefts(draft.drawdown);
    this.width = warps(draft.drawdown) / loom_settings.epi;
    if(loom_settings.units == 'cm') this.width *= 10;
    this.selected_units = loom_settings.units;

    const warp_num:number = warps(draft.drawdown);
    const weft_num:number = wefts(draft.drawdown);

    this.colShuttleMapping = draft.colShuttleMapping.slice();
    this.colSystemMapping = draft.colSystemMapping.slice();
    this.rowShuttleMapping = draft.rowShuttleMapping.slice();
    this.rowSystemMapping = draft.rowSystemMapping.slice();


    // this.cdRef.detectChanges();

     this.redraw(draft, loom, loom_settings, {
      drawdown: true, 
      loom:true, 
      warp_systems: true, 
      weft_systems: true, 
      warp_materials: true,
      weft_materials:true
    });

    this.computeAndSetScale(draft, loom, loom_settings);

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
      
      console.log("TARGET ", target)

      const editing_style = this.dm.cur_draft_edit_source

      if(target && target.id =='warp-materials-editor'){
        this.drawOnWarpMaterials(draft, currentPos);
      }else if(target && target.id =='warp-systems-editor'){
        
      }else if(target && target.id =='weft-materials-editor'){
        this.drawOnWeftMaterials(draft, currentPos)

      } else if(target && target.id =='warp-systems-editor'){

      } else if (target && target.id =='treadling-editor') {
        if(editing_style == "loom") this.drawOnTreadling(loom, loom_settings, currentPos);
      } else if (target && target.id === 'tieups-editor') {
        if(loom_settings.type === "direct") return;
        if(editing_style == "loom") this.drawOnTieups(loom, loom_settings, currentPos);
      } else if (target && target.id === ('threading-editor')) {
        //currentPos.i = this.loom.frame_mapping[currentPos.i];
        if(editing_style == "loom")  this.drawOnThreading(loom, loom_settings, currentPos);
    } else{
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

    if(this.id == -1) return;

    this.mouse_pressed = true;



    const loom_settings = this.tree.getLoomSettings(this.id);
    const draft = this.tree.getDraft(this.id);
    let cell_size = this.render.calculateCellSize(draft);

    const frames = (loom_settings !== null ) ? loom_settings.frames : 0;
    const treadles = (loom_settings !== null ) ? loom_settings.treadles : 0;
  
    var screen_row = Math.floor(event.offsetY / cell_size);
    var screen_col = Math.floor(event.offsetX / cell_size);

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
      console.log("__________________________________ ")
      console.log("EVENT TARGET ID ", event.target.id)

      //reject out of bounds requests
      switch(event.target.id){
        case 'drawdown':

          if(!this.dm.isSelectedDraftEditSource('drawdown')) return;
          currentPos.i -= 1;
          currentPos.j -= 1;
          currentPos.si -=1;

          if(currentPos.i < 0 || currentPos.i >= this.render.visibleRows.length) return;
          if(currentPos.j < 0 || currentPos.j >= warps(draft.drawdown)) return;    
          break;

        case 'threading':

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
      

      switch (this.dm.cur_draft_edit_mode) {

        case 'draw':

          switch(this.dm.cur_pencil){

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
    let cell_size = this.render.calculateCellSize(draft);

    // var screen_row = Math.floor(event.offsetY / dims.h);
    // var screen_col = Math.floor(event.offsetX / dims.w);

    // let dims ={
    //   w: this.canvasEl.width / warps(draft.drawdown),
    //   h:  this.canvasEl.height /this.render.visibleRows.length
    // };    

    
    // set up the point based on touched square.
    //var screen_row = Math.floor((event.offsetY + offset.y) / dims.h);
     var screen_row = Math.floor(event.offsetY / cell_size);
     var screen_col = Math.floor(event.offsetX / cell_size);

    const currentPos: Interlacement = {
      si: screen_row,
      i:  screen_row,
      j:  screen_col
    };

   


    if(event.target && event.target.id==="drawdown-editor"){
      // currentPos.si -=1;
      // currentPos.i -=1;
      // currentPos.j -=1;
    }

   

    //don't call unless you've moved to a new spot
    if(this.isSame(currentPos, this.lastPos)) return;

    // determine action based on brush type. invert inactive on move.
    switch (this.dm.cur_draft_edit_mode) {
      case 'draw':
        switch(this.dm.cur_pencil){
          case 'up':
          case 'down':
          case 'unset':
          case 'material':
          case 'toggle':
          //this.unsetSelection();

          if(currentPos.i < 0 || currentPos.i >= wefts(draft.drawdown)) return;
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

    if(this.id == -1) return;

     this.lastPos = {
      si: -1,
      i: -1,
      j: -1
     }

     if(this.flag_history && event.type == 'mouseup'){
        // this.onDrawdownUpdated.emit(draft);
        this.flag_history = false;
      } 


     if(this.flag_recompute && event.type == 'mouseup'){
      this.flag_recompute = false;
     }



    // remove subscription unless it is leave event with select.
    if (!(event.type === 'mouseleave' && (this.dm.isSelectedDraftEditingMode('select')))){
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
            temp_copy[i][j] = (loom.treadling[screen_row].find(el => el === col) !== undefined);
          break;
          case 'tieups':
           // console.log("COPYING ", i, j, loom.tieup)
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

  // private drawWarpMaterialCell(draft:Draft, cx:any, j:number){

  //       var dims = this.render.getCellDims("base");
  //       var margin = this.render.zoom*2;
  //      const ndx: number = draft.colShuttleMapping[j];
  //       cx.fillStyle = this.ms.getColor(ndx);
  //       cx.strokeStyle = "#000000";
  //       cx.lineWidth = '1';

  //     //  if(j == warps(draft.drawdown)-1) cx.fillRect((dims.w*j)+margin, 0, dims.w-(margin*2), (dims.h) - margin);
  //     //  else cx.fillRect( (dims.w*j)+margin, 0, dims.w-margin, (dims.h) - margin);
  //     cx.fillRect( (dims.w*j)+margin, 0, dims.w-margin, (dims.h) - margin);
  //     cx.strokeRect( (dims.w*j)+margin, 0, dims.w-margin, (dims.h) - margin);
  // }


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

  // private drawWarpSelectorCell(draft:Draft, cx:any, j:number){

  //       var dims = this.render.getCellDims("base");
  //       var margin = this.render.zoom;
  //       cx.fillStyle = "#ffffff";

  //       if(j == warps(draft.drawdown)-1) cx.fillRect((dims.w*j)+margin, 0, dims.w-(margin*2), (dims.h) - margin);
  //       else cx.fillRect( (dims.w*j)+margin, 0, dims.w-margin, (dims.h) - margin);
  
  //        cx.fillStyle = "#000000";  
  //        cx.font = "10px Arial";

  //        const sys = draft.colSystemMapping[j];
  //        cx.fillText(this.ss.getWarpSystemCode(sys),(dims.w*j)+dims.w/3, dims.w-(margin*3));

  // }


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
  // private drawGrid(loom: Loom, loom_settings: LoomSettings, cx:any,canvas:HTMLCanvasElement) {
  //   var i,j;

  //   var dims = this.render.getCellDims("base");
  //   dims.w *= this.pixel_ratio;
  //   dims.h *= this.pixel_ratio;

  //   cx.fillStyle="black";
  //   cx.lineWidth = .5;
  //   cx.lineCap = 'round';
  //   cx.strokeStyle = '#000';


  //   if(canvas.id=== "drawdown"){
  //     cx.fillStyle = "white";
  //     cx.strokeRect(dims.w,dims.h,canvas.width-2*dims.w,canvas.height-2*dims.w);

  //   }else if(canvas.id=== "threading"){
  //     cx.fillStyle = "white";
  //     cx.fillRect(0,0,canvas.style.width,canvas.style.height);
  //     // cx.fillStyle = "#cccccc";
  //     // cx.fillRect(0, 0, canvas.width, (frames - loom_settings.frames)*dims.h);
  //   }
  //   else if (canvas.id=== "treadling"){
  //     cx.fillStyle = "white";
  //     cx.fillRect(0,0,canvas.width,canvas.height);
  //     // cx.fillStyle = "#cccccc";
  //     // var start = loom_settings.frames * dims.w;
  //     // cx.fillRect(start, 0, canvas.width - start, canvas.height);

  //   }
  //   else if (canvas.id=== "tieups"){
  //     cx.fillStyle = "white";
  //     cx.fillRect(0,0,canvas.width,canvas.height);
  //     // cx.fillStyle = "#cccccc";
  //     // var start = loom_settings.treadles * dims.w;
  //     // cx.fillRect(start, 0, canvas.width - start, canvas.height);
  //     // cx.fillRect(0, 0, canvas.width, (frames -loom_settings.frames)*dims.h);

  //   }


  //   cx.fillStyle="black";
  //   cx.lineWidth = .5;
  //   cx.lineCap = 'round';
  //   cx.strokeStyle = '#000';

  //   //only draw the lines if the zoom is big enough to render them well

      
  //     // draw vertical lines
  //     for (i = 0; i <= canvas.width; i += dims.w) {
        
  //         if(canvas.id == 'drawdown'){
  //           if(i > dims.w && i < canvas.width - dims.w){
  //           cx.beginPath();
  //           cx.moveTo(i, dims.h);
  //           cx.lineTo(i, canvas.height-dims.h);
  //           cx.stroke();
  //           }
  //         }else{
  //           cx.beginPath();
  //           cx.moveTo(i, 0);
  //           cx.lineTo(i, canvas.height);
  //           cx.stroke();
  //         }
        

  //     }

  //     // draw horizontal lines
  //     for (i = 0; i <= canvas.height; i += dims.h) {

  //       if(canvas.id == "drawdown"){
  //         if(i > dims.h && i < canvas.height - dims.h){
  //         cx.beginPath();
  //         cx.moveTo(dims.w, i);
  //         cx.lineTo(canvas.width-dims.w, i);
  //         cx.stroke();
  //         }
  //       }else{
  //         cx.beginPath();
  //         cx.moveTo(0, i);
  //         cx.lineTo(canvas.width, i);
  //         cx.stroke();
  //       }
  //     }


  //     // reset the line dash.
  //     //cx.setLineDash([0]);
    
  // }



  public markDirty(){
    this.is_dirty = true;
    this.onDraftChanged.emit(this.id);
  }  


  public resetDirty(){
    this.is_dirty = false;

  }  
 

  public incrementWeftSystem(i: number){
    this.markDirty();

    const draft = this.tree.getDraft(this.id);
    let weft = this.render.visibleRows[i];
    var newSystem = this.ss.getNextWeftSystem(weft, draft);
    draft.rowSystemMapping[weft] = newSystem;
    this.rowSystemMapping = draft.rowSystemMapping.slice();
    this.tree.setDraftOnly(this.id, draft);



  }


  
  incrementWeftMaterial(si: number){
    this.markDirty();

    const weft = this.render.visibleRows[si];
    const draft = this.tree.getDraft(this.id);
    if(this.dm.isSelectedPencil('material')){
      draft.rowShuttleMapping[weft] = this.selected_material_id;
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
    this.markDirty();

    const draft = this.tree.getDraft(this.id);
    var newSystem = this.ss.getNextWarpSystem(j,draft);
    draft.colSystemMapping[j] = newSystem;
    this.colSystemMapping = draft.colSystemMapping.slice();

    this.tree.setDraftOnly(this.id, draft);
    // this.cdRef.detectChanges();

  }

  incrementWarpMaterial(col: number){
    this.markDirty();
    const warp = col;

    const draft = this.tree.getDraft(this.id);
    if(this.dm.isSelectedPencil('material')){
      draft.colShuttleMapping[warp] = this.selected_material_id;
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

    var val  = false;


    if (this.canvases.drawdown == null || !currentPos) { return; }


    
    if(hasCell(draft.drawdown, currentPos.i, currentPos.j)){
      this.markDirty();

      // Set the heddles based on the brush.
      console.log("DM CUR PENCIL ", this.dm.cur_pencil)
      switch (this.dm.cur_pencil) {
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


      this.tree.setDraftAndRecomputeLoom(this.id, draft, this.tree.getLoomSettings(this.id))
      .then(loom => {
         this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true});
        // console.log("on drawdown updated called from draw on drawdown")
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
    var val = false;

    if (this.canvases.tieup === null || !currentPos) { return; }


    if (isInUserTieupRange(loom, loom_settings,  currentPos)){
      this.markDirty();



      switch (this.dm.cur_pencil) {
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
    

    if (this.canvases.threading == null || !currentPos) { return; }
    
    

    if (isInUserThreadingRange(loom, loom_settings, currentPos)){
      var val;
      const draft = this.tree.getDraft(this.id)
      this.markDirty();


      switch (this.dm.cur_pencil) {
        case 'up':
          val = true;
          break;
        case 'down':
          val = false;
          break;
        case 'toggle':
          val = !(loom.threading[currentPos.j] == currentPos.i);
          break;
        case 'material':
           val = (loom.threading[currentPos.j] == currentPos.i);
           this.drawOnWarpMaterials(draft, currentPos)
          break;
        default:
          break;
      }


      const utils = getLoomUtilByType(loom_settings.type);
      if(this.dm.cur_pencil !== 'material') loom = utils.updateThreading(loom, {i:currentPos.i, j:currentPos.j, val:val});
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

    if (this.canvases.treadling == null || !currentPos) { return; }
    this.markDirty();
    const draft = this.tree.getDraft(this.id)
    var val = false;

    if(isInUserTreadlingRange(loom, loom_settings, currentPos)){
      switch (this.dm.cur_pencil) {
        case 'up':
          val = true;
          break;
        case 'down':
          val = false;
          break;
        case 'toggle':
          val = !(loom.treadling[currentPos.i].find(el => el === currentPos.j) !== undefined);
          break;
        case 'material':
          this.drawOnWeftMaterials(draft, currentPos)
          break;
        default:
          break;
      }
    


      //this updates the value in the treadling
      const utils = getLoomUtilByType(loom_settings.type);
      if(this.dm.cur_pencil !== 'material') loom = utils.updateTreadling(loom, {i:currentPos.i, j:currentPos.j, val:val});
      this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
      .then(draft => {
        this.redraw(draft, loom, loom_settings, {drawdown:true, loom:true});
        this.tree.setDraftOnly(this.id, draft);
        this.onDrawdownUpdated.emit(draft);
      })
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
    if(this.render.view_front) container.style.transform = "matrix(1, 0, 0, 1, 0, 0) scale(" + this.zs.getEditorZoom() + ')';
    else container.style.transform = "matrix(-1, 0, 0, 1, 0, 0) scale(" + this.zs.getEditorZoom() + ')';

  }

  /**
   * this rescales the canvas and updates the view from scroll events
   * receives offset of the scroll from the CDKScrollable created when the scroll was initiated
   */
  //this does not draw on canvas but just rescales the canvas
  public rescale(){

    const container: HTMLElement = document.getElementById('draft-scale-container');
    container.style.transformOrigin = 'top left';
    container.style.transform = 'scale(' + this.zs.getEditorZoom() + ')';

   
   }



  public getTextInterval(){
    let ls = this.tree.getLoomSettings(this.id);
    return ls.epi;
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



public clearAll(){
  this.colSystemMapping = [];
  this.rowSystemMapping = [];
  this.render.visibleRows = [];

      // this.cx.clearRect(0,0, this.canvasEl.width, this.canvasEl.height);   
      // this.cx.canvas.width = 0;
      // this.cx.canvas.height = 0;
      // this.cx.canvas.style.width = "0px";
      // this.cx.canvas.style.height = "0px";
      // this.cx.strokeStyle = "#3d3d3d";
      // this.cx.fillStyle = "#f0f0f0";
      // this.cx.fillRect(0,0,this.canvasEl.width,this.canvasEl.height);
      // this.cx.strokeRect(0,0,this.canvasEl.width,this.canvasEl.height);
  
      // this.cxThreading.clearRect(0,0, this.cxThreading.canvas.width, this.cxThreading.canvas.height);
      // this.cxTreadling.clearRect(0,0, this.cxTreadling.canvas.width, this.cxTreadling.canvas.height);
      // this.cxTieups.clearRect(0,0, this.cxTieups.canvas.width, this.cxTieups.canvas.height);
  
      // this.cxThreading.canvas.width = 0;
      // this.cxThreading.canvas.height = 0;
      // this.cxThreading.canvas.style.width =  "0px"
      // this.cxThreading.canvas.style.height = "0px"
  
  
      // this.cxTreadling.canvas.width = 0;
      // this.cxTreadling.canvas.height = 0;
      // this.cxTreadling.canvas.style.width = "0px";
      // this.cxTreadling.canvas.style.height = "0px";
  
      // this.cxTieups.canvas.width = 0;
      // this.cxTieups.canvas.height = 0;
      // this.cxTieups.canvas.style.width = "0px";
      // this.cxTieups.canvas.style.height = "0px";
    
}

//takes inputs about what, exactly to redraw
public redraw(draft:Draft, loom: Loom, loom_settings:LoomSettings, flags:any){

    this.colSystemMapping = draft.colSystemMapping;
    this.rowSystemMapping = draft.rowSystemMapping;


    let rf: RenderingFlags = {
      u_drawdown: (flags.drawdown !== undefined), 
      u_threading: (flags.loom !== undefined),
      u_tieups: (flags.loom !== undefined),
      u_treadling: (flags.loom !== undefined),
      u_warp_mats: (flags.warp_materials  !== undefined),
      u_weft_mats: (flags.weft_materials  !== undefined),
      u_warp_sys: (flags.warp_systems  !== undefined),
      u_weft_sys: (flags.weft_systems  !== undefined),
      use_colors: this.current_view == 'color',
      use_floats: this.current_view !== 'draft', 
      show_loom: isFrame(loom_settings)
    }
    this.render.drawDraft(draft, loom, loom_settings, this.canvases, rf);

  }


  /**
   * Redraws the entire canvas based on weave pattern.
   * @extends WeaveDirective
   * @returns {void}
   */
  // public redrawDraft(draft: Draft, loom: Loom, loom_settings: LoomSettings) {


  //   var base_dims = this.render.getCellDims("base");
  //   let cell_size = this.calculateCellSize(draft);
  //  // let cell_size = base_dims.w;
  //   const draft_cx = this.canvasEl.getContext("2d");

  //   this.canvasEl.width = (warps(draft.drawdown)+2)*cell_size;
  //   this.canvasEl.height = (wefts(draft.drawdown)+2)*cell_size;
  //   this.canvasEl.style.width = ((warps(draft.drawdown)+2)*cell_size)+"px";
  //   this.canvasEl.style.height = ((wefts(draft.drawdown)+2)*cell_size)+"px";

  //   let img = getDraftAsImage(draft, cell_size, false, false, this.ms.getShuttles());
  //   draft_cx.putImageData(img, cell_size, cell_size);
  //   this.tree.setDraftClean(this.id);

  // }


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


    // public print(e){
    //   let draft = this.tree.getDraft(this.id);
    //   let loom = this.tree.getLoom(this.id);
    //   let width = (Math.max(500, warps(draft.drawdown)+ numTreadles(loom))*this.cell_size + 200);
    //   let height = Math.max(500, (wefts(draft.drawdown)+ numFrames(loom))*this.cell_size + 200);
    //   var node = document.getElementById('draft-container');
    //   htmlToImage.toPng(node, {  backgroundColor: 'white', width, height})
    //   .then(function (dataUrl) {

    //     var win = window.open('about:blank', "_new");
    //     win.document.open();
    //     win.document.write([
    //         '<html>',
    //         '   <head>',
    //         '   </head>',
    //         '   <body onload="window.print()" onafterprint="window.close()">',
    //         '       <img src="' + dataUrl + '"/>',
    //         '   </body>',
    //         '</html>'
    //     ].join(''));
    //     win.document.close();

    //     // const link = document.createElement('a')
    //     // link.href= dataUrl;
    //     // link.download = getDraftName(draft)+"_detailview.jpg";
    //     // link.click();

    
   

    //   })
    //   .catch(function (error) {
    //     console.error('oops, something went wrong!', error);
    //   });
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

    if(this.dm.isSelectedDraftEditSource('drawdown')){
      this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
      .then(loom => {
        this.render.updateVisible(draft);
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
        this.rowShuttleMapping = draft.rowShuttleMapping;
        console.log("on drawdown updated called from draw on insert row")
        this.onDrawdownUpdated.emit(draft);
      })
    }else{
      this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
      .then(draft => {
        this.render.updateVisible(draft);
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
        this.rowShuttleMapping = draft.rowShuttleMapping;
        console.log("on drawdown updated called from draw on insert row")
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


    if(this.dm.isSelectedDraftEditSource('drawdown')){
      this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
      .then(loom => {
        this.render.updateVisible(draft);
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
        this.rowShuttleMapping = draft.rowShuttleMapping;
        console.log("on drawdown updated called from draw on clone row")
        this.onDrawdownUpdated.emit(draft);

      })
    }else{
      loom = utils.insertIntoTreadling(loom, index, loom.treadling[index].slice());

      this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
      .then(draft => {
        this.render.updateVisible(draft);
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
        this.rowShuttleMapping = draft.rowShuttleMapping;
        console.log("on drawdown updated called from draw on clone row")

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


    if(this.dm.isSelectedDraftEditSource('drawdown')){
      this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
      .then(loom => {
        this.render.updateVisible(draft);
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
        this.rowShuttleMapping = draft.rowShuttleMapping;
        console.log("on drawdown updated called from draw on delete row")

        this.onDrawdownUpdated.emit(draft);

      })
    }else{
      this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
      .then(draft => {
        this.render.updateVisible(draft);
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
        this.rowShuttleMapping = draft.rowShuttleMapping;
        console.log("on drawdown updated called from draw on delete row")

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

    if(this.dm.isSelectedDraftEditSource('drawdown')){
      this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
      .then(loom => {
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, warp_systems: true, warp_materials:true});
        this.colShuttleMapping = draft.colShuttleMapping;
        console.log("on drawdown updated called from draw on insert col")

        this.onDrawdownUpdated.emit(draft);

      })

    }else{

      this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
      .then(draft => {
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, warp_systems: true, warp_materials:true});
        this.colShuttleMapping = draft.colShuttleMapping;
        console.log("on drawdown updated called from draw on insert col")

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


    if(this.dm.isSelectedDraftEditSource('drawdown')){
      this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
      .then(loom => {
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, warp_systems: true, warp_materials:true});
        this.colShuttleMapping = draft.colShuttleMapping;
        console.log("on drawdown updated called from draw on clone col")

        this.onDrawdownUpdated.emit(draft);

      })

    }else{
      loom = utils.insertIntoThreading(loom, j, loom.threading[j]);

      this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
      .then(draft => {
        this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, warp_systems: true, warp_materials:true});
        this.colShuttleMapping = draft.colShuttleMapping;
        console.log("on drawdown updated called from draw on clone col")

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
  
    
      if(this.dm.isSelectedDraftEditSource('drawdown')){
        this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
        .then(loom => {
          this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, warp_systems: true, warp_materials:true});
          this.colShuttleMapping = draft.colShuttleMapping;
          console.log("on drawdown updated called from draw on delete col")

          this.onDrawdownUpdated.emit(draft);

        })
  
      }else{
        this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
        .then(draft => {
          this.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, warp_systems: true, warp_materials:true});
          this.colShuttleMapping = draft.colShuttleMapping;
          console.log("on drawdown updated called from draw on delete col")

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

    const height = this.selection.getEndingRowScreenIndex() - this.selection.getStartingRowScreenIndex();


    switch(this.selection.getTargetId()){    
      case 'drawdown':
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
      case 'tieups':
        
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
    }
  
  }
  
  



  


  



  public checkForPaint(source: string, index: number, event: any){
    const draft = this.tree.getDraft(this.id);
    if(this.dm.isSelectedPencil('material') && this.mouse_pressed){
      if(source == 'weft') draft.rowShuttleMapping[index] = this.selected_material_id;
      if(source == 'warp') draft.colShuttleMapping[index] = this.selected_material_id;
      this.onMaterialChange.emit();
    } 
  }

  public drawOnWarpMaterials(draft: Draft, currentPos: Interlacement){
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    draft.colShuttleMapping[currentPos.j] = this.selected_material_id;
    this.tree.setDraftOnly(this.id, draft);
    this.redraw(draft, loom, loom_settings, {drawdown: true, warp_systems: true});
    this.onMaterialChange.emit();
  }

  public drawOnWeftMaterials(draft: Draft, currentPos: Interlacement){
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    draft.rowShuttleMapping[currentPos.i] = this.selected_material_id;
    this.tree.setDraftOnly(this.id, draft);
    this.redraw(draft, loom, loom_settings, {drawdown: true, weft_systems: true});
    this.onMaterialChange.emit();
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
    
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);

    this.redraw(draft, loom, loom_settings,  {
      drawdown: true
    });
  }

  public renderChange(){


    this.rescale();     

  }


  // public redrawLoomAndDraft(){

  //   const draft = this.tree.getDraft(this.id)
  //   const loom = this.tree.getLoom(this.id)
  //   const loom_settings = this.tree.getLoomSettings(this.id);
  //   this.render.updateVisible(draft);

  //   const is_frame = isFrame(loom_settings);
  //   if(is_frame){
  //     this.isFrame = true;
  //   }else{
  //     this.isFrame = false;
  //   }
  //   this.colShuttleMapping = draft.colShuttleMapping.slice();
  //   this.rowShuttleMapping = draft.rowShuttleMapping.slice();
  //   this.redraw(draft, loom, loom_settings,{drawdown: true, loom:true, warp_systems: true, warp_materials: true, weft_systems: true, weft_materials:true});
  
  // }

   

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
