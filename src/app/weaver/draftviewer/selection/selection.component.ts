import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TreeService } from '../../../core/provider/tree.service';
import { Interlacement, LoomSettings } from '../../../core/model/datatypes';
import { numFrames, numTreadles } from '../../../core/model/looms';
import { DesignmodesService } from '../../../core/provider/designmodes.service';
import { RenderService } from '../../provider/render.service';
import { MatMenu } from '@angular/material/menu';

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
  private target: any;

  public design_actions: Array<any>;

  screen_width: number;
  screen_height: number;

  top:number;
  left: number;

  force_height:boolean;
  force_width:boolean;
  
  hide_parent:boolean;
  hide_options: boolean;
  hide_actions: boolean;
  hide_selection: boolean = false;

  /**
   * reference to the SVG element edrawing the boundary
   */
  selectionEl: HTMLElement;
  
  /**
   * reference to the parent div
   */
  parent: HTMLElement;



  constructor(
    private dm: DesignmodesService,
    private tree: TreeService,
    public render: RenderService
    ) { 

      this.design_actions = dm.getOptionSet('design_actions');

    this.hide_options = true;
    this.hide_parent = true;
    this.hide_actions = false;
    this.force_height = false;
    this.force_width = false;

    this.start = {i: 0, si:0, j: 0};
    this.end = {i: 0, si:0, j: 0};
    this.top = 0;
    this.left = 0;

    this.screen_height = 0;
    this.screen_width = 0;
   

  }

  ngOnInit() {
  }

  ngAfterViewInit(){
    this.selectionEl = document.getElementById('selection');
    this.parent = document.getElementById('selection-container');
  }


  designActionChange(action : string){
    console.log("Design action", action)


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
    this.onCopy.emit();
  }

  clearEvent(b:boolean) {
    this.onClear.emit(b);
  }

  pasteEvent(type) {
    var obj: any = {};
    obj.type = type;
    this.onPaste.emit(obj);
  }

  /**
   * set parameters and view when starting a new selections
   * @param target he HTML target that receieved the mouse down event
   * @param start the interlacement upon that target that received the mouse click
   * @returns 
   */
  onSelectStart(target: HTMLElement, start: Interlacement){

    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);

    //clear existing params
    this.unsetParameters();

    if(!target) return;
    
    this.target = target;
    this.start = start;
    this.hide_parent = false;

    switch(target.id){
      
      case 'treadling':    
        this.start.j = 0;
        this.width =  Math.max(numTreadles(loom), loom_settings.treadles);
        this.force_width = true;
      break;

      case 'threading':
        this.start.i = 0;
        this.start.si = 0;
        this.height = Math.max(numFrames(loom), loom_settings.frames);
        this.force_height = true;
      break;

      case 'weft-systems':
      case 'weft-materials':
        this.force_width = true;
        this.width = 1;
      break;

      case 'warp-systems':
      case 'warp-materials':
        this.force_height = true;
        this.height = 1;
      break;

      case 'drawdown':
      case 'tieups':
      
      break;

    }

    this.end = start;
    this.recalculateSize();

    //set view flags
    this.hide_options = true;
    this.hide_parent = false;

    this.redraw();



  }

  /**
   * updates selectiono parameters when the user drags the selected area
   * @param pos the mouse position
   * @returns boolean to specify if the point was in range or not
   */
  onSelectDrag(pos: Interlacement): boolean{
   
    if(pos.si < 0){
      pos.si = 0;
      return false;
    } 


    if(pos.si > this.render.visibleRows.length){
      pos.si = this.render.visibleRows.length;
      return false
    } 
  

    this.end = pos;


    switch(this.target.id){
      
      case 'treadling':    
        this.end.i = pos.i;
        this.end.si = pos.si;
      break;

      case 'threading':
        this.end.j = pos.j;
      break;

      case 'weft-systems':
      case 'weft-materials':
      case 'warp-systems':
      case 'warp-materials':
      case 'drawdown':
      case 'tieups':
      
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

    switch(this.target.id){
      case "threading":
      case "treadling":
      case "tieups":
      case "warp-materials":
      case "warp-systems":
      case "weft-materials":
      case "weft-systems":
        this.hide_actions = true;

        break;

        default:
          this.hide_actions = false;
          break;
    }



    this.hide_options = false;
    this.onSelectionEnd.emit();

  }

  onSelectCancel(){
    this.hide_options = true;
    this.hide_parent = true;
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
    this.hide_options = true;
    this.start = start;
    this.recalculateSize();

    this.top = this.start.i * this.render.getCellDims('base').h;
    this.left = this.start.j * this.render.getCellDims('base').w;
  }

  recalculateSize(){


    if(!this.force_width) this.width = Math.abs(this.end.j - this.start.j);
    if(!this.force_height) this.height = Math.abs(this.end.i - this.start.i);
  
    this.screen_width = this.width * this.render.getCellDims('base').w;
    this.screen_height = this.height * this.render.getCellDims('base').h;
    
  
  }



  unsetParameters() {
    this.width = -1;
    this.height = -1;
    this.force_width = false;
    this.force_height = false;
    this.hide_parent = true;
    this.hide_options = true;
  }

  hasSelection(){
    return (this.width > 0 && this.height > 0);
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

    if(this.hasSelection() && this.target.id !== 'tieups'){

      this.hide_parent = false;
      let top_ndx = Math.min(this.start.si, this.end.si);
      let left_ndx = Math.min(this.start.j, this.end.j);


      let in_div_top:number = top_ndx * 10;
      let in_div_left:number = left_ndx * 10;

      let abs_top = this.target.offsetTop;
      let abs_left = this.target.offsetLeft;

      if(this.target.id == 'drawdown'){
        abs_top+=10;
        abs_left+=10;
      } 


      this.parent.style.top = abs_top+in_div_top+"px";
      this.parent.style.left = abs_left+in_div_left+"px";
    }else{
      this.hide_parent = true;
    }

    
  }

}
