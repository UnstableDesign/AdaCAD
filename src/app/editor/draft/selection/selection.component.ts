import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TreeService } from '../../../core/provider/tree.service';
import { Interlacement } from '../../../core/model/datatypes';
import { numFrames, numTreadles } from '../../../core/model/looms';
import { DesignmodesService } from '../../../core/provider/designmodes.service';
import { RenderService } from '../../../core/provider/render.service';
import { defaults, paste_options } from '../../../core/model/defaults';
import { ZoomService } from '../../../core/provider/zoom.service';

@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit {

  @Input('id') id: number;
  @Output() onFill: any = new EventEmitter();
  @Output() onCopy: any = new EventEmitter();
  @Output() onClear: any = new EventEmitter();
  @Output() onPaste: any = new EventEmitter();
  @Output() onSelectionEnd: any = new EventEmitter();

  private start: Interlacement;
  private end: Interlacement;
  public width: number;
  public height: number;
  public cell_size: number;

  private has_selection = false;

  public design_actions: Array<any>;

  screen_width: number;
  screen_height: number;

  force_height:boolean;
  force_width:boolean;
  
  hide_parent:boolean;
  hide_actions: boolean;

  has_copy: boolean = false;

  selectionEl: HTMLElement = null;
  selectionContainerEl: HTMLElement = null;
  /**
   * reference to the parent div
   */
  parent: HTMLElement;

  target: HTMLElement;


  constructor(
    public dm: DesignmodesService,
    private tree: TreeService,
    public render: RenderService,
    public zs: ZoomService,
    ) { 

   this.design_actions = paste_options;

    this.hide_parent = true;
    this.hide_actions = true;
    this.force_height = false;
    this.force_width = false;

    this.start = {i: 0, si:0, j: 0};
    this.end = {i: 0, si:0, j: 0};

    this.screen_height = 0;
    this.screen_width = 0;
    this.cell_size = defaults.draft_detail_cell_size;
   

  }

  ngOnInit() {
  }

  ngAfterViewInit(){
    // this.selectionEl = document.getElementById('selection');
    // this.parent = document.getElementById('selection-container');
  }

  clearSelection(){
    this.start = {i: 0, si:0, j: 0};
    this.end = {i: 0, si:0, j: 0};


  }


  designActionChange(action : string){


    switch(action){
      case 'up': this.clearEvent(true);
      break;

      case 'down': this.clearEvent(false);
      break;

      case 'copy': this.copyEvent();
      break;

      case 'paste': this.pasteEvent('original');
      break;

      case 'toggle': this.pasteEvent('invert');
      break;

      case 'flip_x': this.pasteEvent('mirrorX');
      break;

      case 'flip_y': this.pasteEvent('mirrorY');
      break;

      case 'shift_left': this.pasteEvent('shiftLeft');
      break;

      case 'shift_up': this.pasteEvent('shiftUp');
      break;

    }

    



  }

  fillEvent(id) {
    var obj: any = {};
    obj.id = id;
    this.onFill.emit(obj);
  }

  copyEvent() {
    this.has_copy = true;
    this.onCopy.emit();
  }

  clearEvent(b:boolean) {
    this.onClear.emit(b);
  }

  pasteEvent(type) {
    var obj: any = {};
    obj.type = type;
    this.has_copy = false;
    this.onPaste.emit(obj);
  }


  /**
   * given the target of a mouse event, check if it is currently enabled (as indicated by the drawdown editing style)
   */
  isTargetEnabled(target: string):boolean{
    const editing_mode = this.dm.cur_draft_edit_source;
    const loom_settings = this.tree.getLoomSettings(this.id);
    switch(target){
      case 'treadling':    
      case 'threading':
        if(editing_mode === "drawdown") return false;
        break;
      case 'tieups':
        if(editing_mode === "drawdown") return false;
        if(loom_settings.type === "direct") return false;
        break;

      case 'drawdown':
        if(editing_mode === "loom") return false;
        break;
    }

    return true;
  }

  /**
   * set parameters and view when starting a new selections
   * @param target he HTML target that receieved the mouse down event
   * @param start the interlacement upon that target that received the mouse click
   * @returns 
   */
  onSelectStart(target: HTMLElement, start: Interlacement){
    if(!target) return;

    this.hide_actions = true;
    const draft = this.tree.getDraft(this.id);
    this.cell_size = this.render.calculateCellSize(draft);

    //clear existing params
    this.unsetParameters();

    this.target = target;
    if(!this.isTargetEnabled(target.id)) return;

    this.selectionEl = document.getElementById("selection");
    this.selectionContainerEl = document.getElementById("selection-container");
  
    this.target.parentNode.appendChild( this.selectionContainerEl);
    
    //pad the selection container to match the padding of the parent. 
    var style = window.getComputedStyle(this.target.parentElement);
    var matrix = new WebKitCSSMatrix(style.transform);

    const size_row = document.getElementById('size-row-id');
    const action_row = document.getElementById('action-row-id');


    //make sure the transform is applied to correct the origination of the text and action icons
    console.log("PADDING ADD ", style.padding);
    this.selectionContainerEl.style.padding = style.padding;
    size_row.style.transform = 'matrix('+matrix.a+','+matrix.b+','+matrix.c+','+matrix.d+','+matrix.e+','+matrix.f+')';
    action_row.style.transform = 'matrix('+matrix.a+','+matrix.b+','+matrix.c+','+matrix.d+','+matrix.e+','+matrix.f+')';

    

    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
  
    
    this.start = start;
    this.hide_parent = false;

    switch(target.id){
      
      case 'treadling-editor':    
        this.start.j = 0;
        this.width =  Math.max(numTreadles(loom), loom_settings.treadles);
        this.force_width = true;
      break;

      case 'threading-editor':
        this.start.i = 0;
        this.start.si = 0;
        this.height = Math.max(numFrames(loom), loom_settings.frames);
        this.force_height = true;
      break;

      case 'weft-system-editor':
      case 'weft-materials-editor':
        this.force_width = true;
        this.width = 1;
      break;

      case 'warp-systems-editor':
      case 'warp-materials-editor':
        this.force_height = true;
        this.height = 1;
      break;

      case 'drawdown-editor':

        break;
      case 'tieups-editor':
      break;

    }

    this.end = this.start;
    
    this.recalculateSize();


    this.has_selection = true;
    this.redraw();



  }

  /**
   * updates selectiono parameters when the user drags the selected area
   * @param pos the mouse position
   * @returns boolean to specify if the point was in range or not
   */
  onSelectDrag(pos: Interlacement): boolean{
   
    if(this.target === undefined) return;
    if(this.target !== null && !this.isTargetEnabled(this.target.id)) return;




    if(pos.si < 0){
      pos.si = 0;
      return false;
    } 


    // if(pos.si > this.render.visibleRows.length){
    //   pos.si = this.render.visibleRows.length;
    //   return false
    // } 
  

    this.end = pos;

    switch(this.target.id){
      
      case 'treadling-editor':    
        this.end.i = pos.i;
        this.end.si = pos.si;
      break;

      case 'threading-editor':
        this.end.j = pos.j;
      break;

      case 'weft-systems':
      case 'weft-materials':
      case 'warp-systems':
      case 'warp-materials':
      case 'drawdown-editor':
      case 'tieups-editor':
      
      break;
    }

    this.recalculateSize()    
    this.redraw();
  }

  /**
   * triggers view changes when the selection event ends OR mouse leaves valid view
   */
  onSelectStop(){

    if(this.target === undefined) return;
    if(this.target !== null && !this.isTargetEnabled(this.target.id)) return;
    this.hide_actions = false;
    this.onSelectionEnd.emit();

  }

  onSelectCancel(){
    this.unsetParameters();
  }

  getStartingRowScreenIndex(): number{
    return  Math.min(this.start.si, this.end.si);    
  }

  getStartingRowIndex(): number{
    return  Math.min(this.start.i, this.end.i);    
  }

  getStartingColIndex(): number{
    return  Math.min(this.start.j, this.end.j);    
  }

  getEndingColIndex(): number{
    return  Math.max(this.start.j, this.end.j);    
  }

  getEndingRowScreenIndex(): number{
    return  Math.max(this.start.si, this.end.si);    
  }

  // getEndingIndex(): number{
  //   return Math.min(this.start.j, this.end.j);
  // }

  getWidth():number{
    return this.width;
  }

  getHeight():number{
    return this.height;
  }



  setEnd(end: Interlacement){
    this.end = end;
    this.recalculateSize();
  }

  setStart(start: Interlacement){


    this.hide_parent = false;
    this.hide_actions = true;
    this.start = start;
    this.recalculateSize();

    
  }

  recalculateSize(){

    if(!this.force_width){
      this.width = Math.abs(this.end.j - this.start.j)+1; //make this inclusive
    } 
    if(!this.force_height){
      this.height = Math.abs(this.end.i - this.start.i) + 1;
    } 
  
    this.screen_width = this.width * this.cell_size;
    this.screen_height = this.height * this.cell_size;   
  

  }



  unsetParameters() {

    // if(this.selectionEl !== null){
    //   this.selectionEl.remove(); 
    //   this.selectionEl = null;
    // }

    this.has_selection = false;
    this.width = -1;
    this.height = -1;
    this.force_width = false;
    this.force_height = false;
    //this.hide_parent = true;
    // this.hide_options = true;
  }

  hasSelection(){
    return (this.width > 0 && this.height > 0 && this.has_selection);
  }

  getTop(){
    return Math.min(this.start.si, this.end.si);
  }

  getLeft(){
    return Math.min(this.start.j, this.end.j);
  }

  setTarget(t){
  	this.target = t;
  }

  getTarget(){
  	return this.target;
  }


  getTargetId(){
    if(this.target !== undefined) return this.target.id;
    return undefined;
  }


  redraw(){

    if(this.hasSelection()){

      this.hide_parent = false;


      let top_ndx = Math.min(this.start.si, this.end.si);
      let left_ndx = Math.min(this.start.j, this.end.j);

      //this needs to take the transform of the current element into account
      let in_div_top:number = top_ndx * this.cell_size;
      let in_div_left:number = left_ndx * this.cell_size;


      if(this.selectionContainerEl !== null && this.selectionEl !== null){

        this.selectionContainerEl.style.top = in_div_top+"px"
        this.selectionContainerEl.style.left = in_div_left+"px";
        this.selectionEl.style.width = this.screen_width -5 + "px";
        this.selectionEl.style.height = this.screen_height -5 + "px";
      }
    
    }else{
      this.hide_parent = true;
    }

    
  }

}
