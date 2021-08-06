import { Component, Input, OnInit } from '@angular/core';
import { Interlacement } from '../../model/datatypes';
import { Render } from '../../model/render';
import { Loom } from '../../model/loom';

@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit {

  @Input('render') render:Render;
  @Input('loom') loom:Loom;


  private start: Interlacement;
  private end: Interlacement;
  private width: number;
  private height: number;
  private target: any;

  screen_width: number;
  screen_height: number;
  top:number;
  left: number;

  force_height:boolean;
  force_width:boolean;
  
  hide_parent:boolean;
  hide_options: boolean;

  /**
   * reference to the SVG element edrawing the boundary
   */
  selectionEl: HTMLElement;
  
  /**
   * reference to the parent div
   */
  parent: HTMLElement;



  constructor() { 
    this.hide_options = true;
    this.hide_parent = true;
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

  /**
   * set parameters and view when starting a new selections
   * @param target he HTML target that receieved the mouse down event
   * @param start the interlacement upon that target that received the mouse click
   * @returns 
   */
  onSelectStart(target: HTMLElement, start: Interlacement){

    //clear existing params
    this.unsetParameters();

    if(!target) return;
    
    this.target = target;
    this.start = start;

    switch(target.id){
      
      case 'treadling':    
        this.start.i = 0;
        this.start.si = 0;
        this.height = this.loom.num_treadles;
        this.force_height = true;
      break;

      case 'threading':
        this.start.j = 0;
        this.width = this.loom.num_frames;
        this.force_width = true;
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

    if(pos.si >= this.render.visibleRows.length){
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
   * triggers view changes when the selection event ends
   */
  onSelectStop(){
    this.hide_options = false;

  }

  onSelectCancel(){
    this.hide_options = true;
    this.hide_parent = true;
    this.unsetParameters();
  }

  getStartingScreenIndex(): number{
    return  Math.min(this.start.si, this.end.si);    
  }

  getEndingIndex(): number{
    return Math.min(this.start.j, this.end.j);
  }

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


  hide(){
    //this.hide_selection = true;
    this.parent.style.display = "none";

  //  this.selectionEl.style.display = "none";

    // d3.select(this.svgEl).style('display', 'none');
    // d3.select(this.parent).style('display', 'none');

  }

  show(dims: {w:number, h:number}){
    
    //this.hide_selection = false;
   
    // var x = dims.w / 4;
    // var y = dims.h;
    // var anchor = 'start';

    // //styling for the text
    // if (this.start.j < this.end.j) {
    //     x = this.width*dims.w ;
    //     anchor = 'end';
    //  }

    //  if (this.start.i < this.end.i) {
    //    y = this.height*dims.h;
    //  }


    // var fs = this.render.zoom * .18;
    // var fw = this.render.zoom * 9;

    
    // this.svgEl.style.transformOrigin = '0 0';

    // d3.select(this.parent)
    // .style('display', 'initial')
    // .attr('x', x)
    // .attr('y', y);

    // d3.select(this.svgEl)
    //       .style('display', 'initial')
    //       .style('width', (this.width) * dims.w)
    //       .style('height', (this.height) * dims.h)

    //       d3.select(this.svgEl)
    //       .select('text')
    //       .attr('fill', '#424242')
    //       .attr('font-weight', 900)
    //       .attr('font-size', fs)
    //       .attr('stroke', 'white')
    //       .attr('stroke-width', 1)
    //       .attr('text-anchor', anchor)
    //       .attr('x', x)
    //       .attr('y', y)
    //       .text(this.width +' x '+ this.height);
  }

  scale(scale:number, top: number, left:number){
    //this.svgEl.style.transform = 'scale(' + scale + ') translate('+left+'px,'+top+'px)';
  }


  // setParameters() {
  //   this.width = Math.abs(this.start.j - this.end.j);
  //   this.height = Math.abs(this.start.si - this.end.si);

  //   if(this.target.id == "weft-systems" || this.target.id == "weft-materials"){
  //     this.width = 1;
  //   }else if(this.target.id == "warp-systems" || this.target.id == "warp-materials"){
  //     this.height = 1;
  //   }
  // }


  unsetParameters() {
    this.width = -1;
    this.height = -1;
    this.force_width = false;
    this.force_height = false;
  }

  hasSelection(){
    return (this.width >= 0 && this.height >= 0);
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

  }

}
