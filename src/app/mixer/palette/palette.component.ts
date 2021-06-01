import { Observable, Subscription, fromEvent, from, iif } from 'rxjs';
import { DesignmodesService } from '../../mixer/provider/designmodes.service';
import { Component, HostListener, ViewContainerRef, Input, ComponentFactoryResolver, ViewChild, OnInit, ViewRef, Output, EventEmitter } from '@angular/core';
import { SubdraftComponent } from './subdraft/subdraft.component';
import { SelectionComponent } from './selection/selection.component';
import { SnackbarComponent } from './snackbar/snackbar.component';
import { Draft } from './../../core/model/draft';
import { Cell } from './../../core/model/cell';
import {MatSnackBar} from '@angular/material/snack-bar';
import { Point, Interlacement, Bounds } from '../../core/model/datatypes';
import { Pattern } from '../../core/model/pattern'; 
import { InkService } from '../../mixer/provider/ink.service';
import {cloneDeep, isBuffer} from 'lodash';
import { LayersService } from '../../mixer/provider/layers.service';
import { Shape } from '../model/shape';
import { thresholdFreedmanDiaconis } from 'd3-array';


@Component({
  selector: 'app-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.scss']
})


export class PaletteComponent implements OnInit{


  /**
   * a reference to the default patterns (used for fill operations)
   * @property {Array<Pattern>}
   */ 
  @Input() patterns: Array<Pattern>;
  @Output() onDesignModeChange: any = new EventEmitter();

  /**
   * Subscribes to move event after a touch event is started.
   * @property {Subscription}
   */
  moveSubscription: Subscription;


  /**
   * A container that supports the automatic generation and removal of the components inside of it
   */
  @ViewChild('vc', {read: ViewContainerRef, static: true}) vc: ViewContainerRef;

  /**
   * holds a reference to the Subdraft Components within this view
   * @property {Array<SubdraftComponent>}
   */
  subdraft_refs: Array<SubdraftComponent>;

    /**
   * a placeholder to reference a temporary rendering of an union between subdrafts
   * used to preview the changes that will happen if the subdraft is to be dropped at that point
   * @property {SubdraftComponent}
   */
  preview: SubdraftComponent;

  /**
   * a reference to the viewref for the intersection component to ease addign and deleting
   * @property {ViewRef}
   */
  preview_ref: ViewRef;
     
  /**
   * holds a reference to the selection component
   * @property {Selection}
   */
  selection = new SelectionComponent();

  /**
   * holds the data of events drawn on this component (that are not associated with a subdraft)
   * @property {Array<Array<Cell>>}
   */
  scratch_pad: Array<Array<Cell>> = [];

  /**
   * HTML Canvas element that draws the selection and currently cells drawn on this component
   * @property {Canvas}
   */
  canvas: HTMLCanvasElement;
  cx: any;

  /**
   * stores an i and j of the last user selected location within the component
   * @property {Point}
   */
  last: Interlacement;


  /**
   * a value to represent the current user defined scale for this component. 
   * @property {number}
   */

   scale: number;

  /**
   * links to the z-index to push the canvas to the front or back of view when freehand drawing. 
   */
   canvas_zndx:number = -1;
  

  /**
   * used to manage the area of the screen that is in view based on scrolling and zooming
   */
   viewport:Bounds;
  
  /**
   * stores the bounds of the shape being drawn
   */
   shape_bounds:Bounds;
  
  /**
   * stores the vtx for freehand shapes
   */
   shape_vtxs:Array<Point>;
  


  /**
   * Constructs a palette object. The palette supports drawing without components and dynamically
   * creates components from shapes and scribbles on the canvas. 
   * @param design_modes  a reference to the service containing the current design modes and selections
   * @param inks a reference to the service manaing the available inks
   * @param layers a reference to the sercie managing the view layers (z-indexes) of components
   * @param resolver a reference to the factory component for dynamically generating components
   * @param _snackBar _snackBar a reference to the snackbar component that shows data on move and select
   */
  constructor(private design_modes: DesignmodesService, private inks: InkService, private layers: LayersService, private resolver: ComponentFactoryResolver, private _snackBar: MatSnackBar) { 
    this.subdraft_refs = [];
    this.shape_vtxs = [];
    this.viewport = {
      topleft: {x:0, y:0}, 
      width: 0, 
      height:0
    };
  }

/**
 * Called when palette is initailized
 */
  ngOnInit(){
    this.scale = 10;
    this.vc.clear();
    console.log(this.inks);
  }

  /**
   * unsubscribes to all open subscriptions and clears the view component
   */
  ngOnDestroy(){

    this.subdraft_refs.forEach(element => {
      element.onSubdraftStart.unsubscribe();
      element.onSubdraftDrop.unsubscribe();
      element.onSubdraftMove.unsubscribe();
      element.onDeleteCalled.unsubscribe();
    });

    this.vc.clear();
    
  }

  /**
   * Gets references to view items and adds to them after the view is initialized
   */
  ngAfterViewInit(){
    this.canvas = <HTMLCanvasElement> document.getElementById("scratch");
    this.cx = this.canvas.getContext("2d");
    this.canvas.width = 5000;
    this.canvas.height = 5000;

    this.selection.scale = this.scale;
    this.selection.active = false;
    this.designModeChanged();

  }

  handleScroll(data: any){
    const div:HTMLElement = document.getElementById('scrollable-container');
    this.viewport.topleft = {x: div.offsetParent.scrollLeft, y: div.offsetParent.scrollTop};
  }

  closeSnackBar(){
    this._snackBar.dismiss();
  }

  //called when the palette needs to change the design mode, emits output to parent
  changeDesignmode(name: string) {
    this.design_modes.select(name);
    const mode = this.design_modes.getMode(name);
    if(!mode.enable_inks){
        this.inks.select('neq');
    }

    
    this.onDesignModeChange.emit(name);
  }

  /**
   * dynamically creates a subdraft component, adds its inputs and event listeners, pushes the subdraft to the list of references
   * @param d a Draft object for this component to contain
   * @returns the created subdraft instance
   */
  createSubDraft(d: Draft):SubdraftComponent{
    const factory = this.resolver.resolveComponentFactory(SubdraftComponent);
    const subdraft = this.vc.createComponent<SubdraftComponent>(factory);
    subdraft.instance.onSubdraftDrop.subscribe(this.subdraftDropped.bind(this));
    subdraft.instance.onSubdraftMove.subscribe(this.subdraftMoved.bind(this));
    subdraft.instance.onSubdraftStart.subscribe(this.subdraftStarted.bind(this));
    subdraft.instance.onDeleteCalled.subscribe(this.onDeleteSubdraftCalled.bind(this));
    subdraft.instance.draft = d;
    subdraft.instance.viewport = this.viewport;
    subdraft.instance.patterns = this.patterns;
    subdraft.instance.ink = this.inks.getSelected(); //default to the currently selected ink
  
    this.subdraft_refs.push(subdraft.instance);
    return subdraft.instance;
  }

  /**
   * removes the subdraft sent to the function
   * @param subdraft 
   */
  removeSubdraft(subdraft: SubdraftComponent){
    const ndx = this.subdraft_refs.findIndex((sr) => (subdraft.canvas.id.toString() === sr.canvas.id.toString()));
    this.vc.remove(ndx);
    this.subdraft_refs.splice(ndx, 1);
  }

    /**
   * dynamically creates a subdraft component with specific requirements of the intersection, adds its inputs and event listeners, pushes the subdraft to the list of references
   * @param d a Draft object for this component to contain
   * @returns the created subdraft instance
   */
    createAndSetPreview(d: Draft){
      const factory = this.resolver.resolveComponentFactory(SubdraftComponent);
      const subdraft = this.vc.createComponent<SubdraftComponent>(factory);
      subdraft.instance.draft = d;
      subdraft.instance.setAsPreview();
      subdraft.instance.disableDrag();
      this.preview_ref = subdraft.hostView;
      this.preview = subdraft.instance;
    }

    hasPreview():boolean{
      if(this.preview_ref === undefined) return false;
      return true;
    }

  /**
   * destorys the 
   * @param d a Draft object for this component to contain
   * @returns the created subdraft instance
   */
    removePreview(){
      const ndx = this.vc.indexOf(this.preview_ref);
      this.vc.remove(ndx);
      this.preview_ref = undefined;
      this.preview = undefined;
  }

  /**
   * Called from mixer when it receives a change from the design mode tool or keyboard press
   * triggers view mode changes required for this mode
   */
  public designModeChanged(){

    if(this.design_modes.isSelected('draw') || this.design_modes.isSelected('shape')){

      this.subdraft_refs.forEach(sd => {
        sd.disableDrag();
      });

    }else if(this.design_modes.isSelected('move')){

      this.subdraft_refs.forEach(sd => {
        sd.enableDrag();
      });


    }else if(this.design_modes.isSelected('select')){
      this.subdraft_refs.forEach(sd => {
        sd.disableDrag();
      });
    }

  }


   private removeSubscription() {    
    if (this.moveSubscription) {
      this.moveSubscription.unsubscribe();
    }
  }

  private resolveCoordsToNdx(p: Point) : Interlacement {    
    const i = Math.floor((p.y - 64) / this.scale);
    const j = Math.floor((p.x) / this.scale);
    return {i: i, j: j, si: i};
  }


  private isSameNdx(p1: any, p2:any) : boolean {    
    if(p1.i != p2.i ) return false;
    if(p1.j != p2.j) return false;
    return true;
  }


  private drawSelection(ndx: Interlacement){


    this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const bounds ={
      top: this.selection.start.j*this.scale,
      left: this.selection.start.i*this.scale,
      bottom: ndx.j *this.scale,
      right: ndx.i*this.scale
    };

    //will draw on outside of selection
    this.cx.strokeStyle = "#ff4081";
    this.cx.strokeRect(bounds.top, bounds.left, bounds.bottom-bounds.top, bounds.right-bounds.left);
      
  }

  /**
   * sets the value of the scratchpad cell at ndx
   * checks for self interselcting 
   * @param ndx (i,j)
   */
  private setCell(ndx: Interlacement){
    const c: Cell = this.scratch_pad[ndx.i][ndx.j];
    if(this.inks.getSelected() === "down") c.setHeddle(false);
    else c.setHeddle(true);
    //use the code below to use past scratchpad values, but this seems wrong
    // console.log(c);
    // const val: boolean = c.isSet(); //check for a previous value
    // c.setHeddle(true);

    // if(val){
    //   const newval:boolean = this.computeCellValue(this.inks.getSelected(), c, val);
    //   console.log("setting to", newval);
    //   c.setHeddle(newval);
    // } 
  }

  /**
   * called by drawcell. Draws on screen based on the current ink
   * @param ink 
   * @param over 
   * @param under 
   * @returns 
   */
  private computeCellColor(ink: string, over: Cell, under: boolean): string{

    const res: boolean = this.computeCellValue(ink, over, under);
    if(ink === 'unset' && res == true) return "#cccccc"; 
    if(res ===null) return "#fafafa";
    if(res) return "#000000";
    return "#ffffff";      
  }

  /**
   * applies the filter betetween over and under and returns the result
   * @param ink the ink with which to compute the transition
   * @param over the value of the primary (top) cell
   * @param under the value of the intersecting (bottom) cell 
   * @returns 
   */
  private computeCellValue(ink: string, over: Cell, under: boolean): boolean{
    
    let res: boolean = this.computeFilter(ink, over.getHeddle(), under);
    return res;   
  }

  /**
   * called when creating a subdraft from the drawing on the screen. Computes the resulting value based on
   * all intersections with the drawing
   * @param ndx the i,j location of the cell we are checking
   * @param ink the currently selected ink
   * @param over the Cell we are checking against
   * @returns true/false or null
   */
  private getScratchpadProduct(ndx: Interlacement, ink: string, over: Cell): boolean{
    
    switch(ink){
      case 'neq':
      case 'and':
      case 'or':

        const p = {x: ndx.j * this.scale, y: ndx.i * this.scale};
        const isect = this.getIntersectingSubdraftsForPoint(p);
  
        if(isect.length > 0){
          const prev: boolean = isect[0].resolveToValue(p);
          return this.computeCellValue(ink, over, prev);
        }else{
          return this.computeCellValue(ink, over, null);
        }
      break;

      default: 
        return this.computeCellValue(ink, over, null);
      break;
    }
   return null; 
  }
  /**
   * takes two booleans and returns their result based on the ink assigned
   * @param ink the name of the ink in question 
   * @param a the first (top) value 
   * @param b the second (under) value
   * @returns boolean result
   */
  public computeFilter(ink: string, a: boolean, b: boolean):boolean{
    switch(ink){
      case 'neq':
        if(a === null) return b;
        if(b === null) return a;
        return (a !== b);
      break;

      case 'up':
        if(a === null) return b;
        if(a === true) return true;
        return false;
      break;

      case 'down':
        if(a === null) return b;
        if(b === null) return a;
        if(a === false) return false;
        return b;
      break;

      case 'unset':
        if(a === null) return b;
        if(b === null) return a;
        if(a === true) return null;
        else return b;
      break;

      case 'and':
      if(a === null || b === null) return null;
      return (a && b)
      break;

      case 'or':
        if(a === null) return b;
        if(b === null) return a;
        return (a || b);
      break;

    }
  }

  /**
   * draw the cell at position ndx
   * @param ndx (i,j)
   */
  private drawCell(ndx: Interlacement){

    const c: Cell = this.scratch_pad[ndx.i][ndx.j];
    this.cx.fillStyle = "#cccccc";
  
    const selected_ink:string = this.inks.getSelected();

    switch(selected_ink){
      case 'neq':
      case 'and':
      case 'or':

        const p = {x: ndx.j * this.scale, y: ndx.i * this.scale};
        const isect = this.getIntersectingSubdraftsForPoint(p);

        if(isect.length > 0){
          const prev: boolean = isect[0].resolveToValue(p);
          this.cx.fillStyle = this.computeCellColor(selected_ink, c, prev);
        }else{
          this.cx.fillStyle =  this.computeCellColor(selected_ink, c, null);;
        }
      break;

      default: 
        this.cx.fillStyle = this.computeCellColor(selected_ink, c, null);
      break;

    }

      this.cx.fillRect(ndx.j*this.scale, ndx.i*this.scale, this.scale, this.scale);      
  }

  /**
   * Deletes the subdraft that called this function.
   */
    onDeleteSubdraftCalled(obj: any){
      console.log("deleting "+obj.id);
      if(obj === null) return;
      const sd = this.subdraft_refs.find((sr) => (obj.id.toString() === sr.canvas.id.toString()));
      this.removeSubdraft(sd);
   }

  /**
   * A mouse event, originated in a subdraft, has been started
   * checkes the design mode and handles the event as required
   * @param obj contains the id of the moving subdraft
   */
  subdraftStarted(obj: any){

    if(obj === null) return;

    if(this.design_modes.isSelected("move")){
  
      //get the reference to the draft that's moving
      const moving = this.getSubdraft(obj.id);
      if(moving === null) return; 
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: moving
      });
      const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(moving);

      if(isect.length == 0) return;
      
      const bounds: any = this.getCombinedBounds(moving, isect);
      const temp: Draft = this.getCombinedDraft(bounds, moving, isect);
      this.createAndSetPreview(temp);
      this.preview.drawDraft();
      this.preview.setComponentPosition(bounds.topleft);
     
    }else if(this.design_modes.isSelected("select")){
      this.selectionStarted();
    }else if(this.design_modes.isSelected("draw")){
      this.drawStarted();
    }

 }


 selectionStarted(){

  this.selection.start = this.last;
  this.selection.active = true;
  this._snackBar.openFromComponent(SnackbarComponent, {
    data: this.selection
  });
 }

 /**
 * brings the base canvas to view and begins to render the
 * @param mouse the absolute position of the mouse on screen
 */
shapeStarted(mouse: Point){
  
  this.shape_bounds = {
    topleft: mouse,
    width: this.scale,
    height: this.scale
  };


  this.shape_vtxs = [];
  this.canvas_zndx = this.layers.createLayer(); //bring this canvas forward
  this.cx.fillStyle = "#ff4081";
  this.cx.fillRect( this.shape_bounds.topleft.x, this.shape_bounds.topleft.y, this.shape_bounds.width,this.shape_bounds.height);


}

  /**
   * resizes and redraws the shape between the the current mouse and where the shape started
   * @param mouse the absolute position of the mouse on screen
   */
shapeDragged(mouse: Point, shift: boolean){

  this.shape_bounds.width =  (mouse.x - this.shape_bounds.topleft.x);
  this.shape_bounds.height =  (mouse.y - this.shape_bounds.topleft.y);

  if(shift){
    const max: number = Math.max(this.shape_bounds.width, this.shape_bounds.height);
    
    //allow lines to snap to coords
    if(this.design_modes.isSelected('line')){
        if(Math.abs(this.shape_bounds.width) < Math.abs(this.shape_bounds.height/2)){
          this.shape_bounds.height = max;
          this.shape_bounds.width = this.scale;
        }else if(Math.abs(this.shape_bounds.height) < Math.abs(this.shape_bounds.width/2)){
          this.shape_bounds.width = max;
          this.shape_bounds.height = this.scale;
        }else{
          this.shape_bounds.width = max;
          this.shape_bounds.height = max;  
        }
        
    }else{
      this.shape_bounds.width = max;
      this.shape_bounds.height = max;    
  
    }
  }

  this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.cx.beginPath();
  this.cx.fillStyle = "#ff4081";
  this.cx.strokeStyle = "#ff4081";
  this.cx.lineWidth = this.scale;

  if(this.design_modes.isSelected('line')){
    this.cx.moveTo(this.shape_bounds.topleft.x+this.scale, this.shape_bounds.topleft.y+this.scale);
    this.cx.lineTo(this.shape_bounds.topleft.x + this.shape_bounds.width, this.shape_bounds.topleft.y + this.shape_bounds.height);
    this.cx.stroke();
  }else if(this.design_modes.isSelected('fill_circle')){
    this.shape_bounds.width = Math.abs(this.shape_bounds.width);
    this.shape_bounds.height = Math.abs(this.shape_bounds.height);
    this.cx.ellipse(this.shape_bounds.topleft.x, this.shape_bounds.topleft.y, this.shape_bounds.width, this.shape_bounds.height, 2 * Math.PI, 0,  this.shape_bounds.height/2);
    this.cx.fill();
  }else if(this.design_modes.isSelected('stroke_circle')){
    this.cx.ellipse(this.shape_bounds.topleft.x, this.shape_bounds.topleft.y, this.shape_bounds.width, this.shape_bounds.height, 2 * Math.PI, 0,  this.shape_bounds.height/2);
    this.cx.stroke();
  }else if(this.design_modes.isSelected('fill_rect')){
    this.cx.fillRect(this.shape_bounds.topleft.x, this.shape_bounds.topleft.y,this.shape_bounds.width,this.shape_bounds.height);
  
  }else if(this.design_modes.isSelected('stroke_rect')){
    this.cx.strokeRect(this.shape_bounds.topleft.x + this.scale, this.shape_bounds.topleft.y+ this.scale,this.shape_bounds.width- this.scale,this.shape_bounds.height-this.scale);

  }else{

    if(this.shape_vtxs.length > 1){
      this.cx.moveTo(this.shape_vtxs[0].x, this.shape_vtxs[0].y);

      for(let i = 1; i < this.shape_vtxs.length; i++){
        this.cx.lineTo(this.shape_vtxs[i].x, this.shape_vtxs[i].y);
        //this.cx.moveTo(this.shape_vtxs[i].x, this.shape_vtxs[i].y);
      }

    }else{
      this.cx.moveTo(this.shape_bounds.topleft.x, this.shape_bounds.topleft.y);
    }

    this.cx.lineTo(this.shape_bounds.topleft.x + this.shape_bounds.width, this.shape_bounds.topleft.y + this.shape_bounds.height);
    this.cx.stroke();
    this.cx.fill();
    
  }
}

/**
 * converts the shape on screen to a component
 */
processShapeEnd(){

  //if circle, the topleft functoins as the center and the bounsd need to expand to fit the entire shape 
  if(this.design_modes.isSelected('fill_circle') || this.design_modes.isSelected('stroke_circle')){
    this.shape_bounds.topleft.x -=  this.shape_bounds.width;
    this.shape_bounds.topleft.y -=  this.shape_bounds.height;
    this.shape_bounds.width *=2;
    this.shape_bounds.height *= 2;
  }else if(this.design_modes.isSelected('free')){
    
    if(this.shape_vtxs.length === 0) return;
      //default to current segment
    let top = this.shape_bounds.topleft.y;
    let left = this.shape_bounds.topleft.x;
    let bottom = this.shape_bounds.topleft.y +this.shape_bounds.height;
    let right = this.shape_bounds.topleft.x +this.shape_bounds.width;
    
    //iteraate through the poitns and find the leftmost and topmost 
    for(let i = 1; i < this.shape_vtxs.length; i++ ){
        if(this.shape_vtxs[i].y < top) top = this.shape_vtxs[i].y;
        if(this.shape_vtxs[i].x < left) left = this.shape_vtxs[i].x;
        if(this.shape_vtxs[i].y > bottom) bottom = this.shape_vtxs[i].y;
        if(this.shape_vtxs[i].x > right) right = this.shape_vtxs[i].x;
    }

    this.shape_bounds.topleft = {x: left, y: top};
    this.shape_bounds.width = right - left;
    this.shape_bounds.height = bottom - top;

    this.shape_vtxs = [];
    
  }else{
    if( this.shape_bounds.width < 0){
      this.shape_bounds.width = Math.abs(this.shape_bounds.width);
      this.shape_bounds.topleft.x-= this.shape_bounds.width
    }  

    if( this.shape_bounds.height < 0){
      this.shape_bounds.height = Math.abs(this.shape_bounds.height);
      this.shape_bounds.topleft.y-= this.shape_bounds.height
    }  
  }
  
  const shape: Shape = new Shape(this.canvas, this.shape_bounds, this.scale); 
  //const img_data = shape.getImageData();
  // this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  // this.cx.putImageData(img_data, 0, 0);
  const pattern: Array<Array<Cell>> = shape.getDraft();

  const wefts: number = pattern.length;
  if(wefts <= 0) return;
  const warps: number = pattern[0].length;

  const sd:SubdraftComponent = this.createSubDraft(new Draft({wefts: wefts,  warps: warps, pattern: pattern}));
  sd.setComponentPosition(this.shape_bounds.topleft);
  sd.setComponentSize(this.shape_bounds.width, this.shape_bounds.height);
  sd.disableDrag();
  
}

/**
 * clears the scratchpad for the new drawing event
 */
drawStarted(){

  this.canvas_zndx = this.layers.createLayer(); //bring this canvas forward
  this.scratch_pad = [];
  for(let i = 0; i < this.canvas.height; i+=this.scale ){
      const row = [];
      for(let j = 0; j< this.canvas.width; j+=this.scale ){
          row.push(new Cell(null));
      }
    this.scratch_pad.push(row);
    }
  }


  /**
   * gets the bounds of a drawing on the scratchpad, a drawing is represented by set cells
   * @returns an object representing the bounds in the format of i, j (the row, column index of the pad)
   */
  getScratchPadBounds(): Array<Interlacement>{
    let bottom: number = 0;
    let right: number = 0;
    let top: number = this.scratch_pad.length-1;
    let left: number = this.scratch_pad[0].length-1;

    for(let i = 0; i < this.scratch_pad.length; i++ ){
      for(let j = 0; j<  this.scratch_pad[0].length; j++){
        if((this.scratch_pad[i][j].isSet())){
          if(i < top) top = i;
          if(j < left) left = j;
          if(i > bottom) bottom = i;
          if(j > right) right = j;
        } 
      }
    }

    return [{i: top, j: left, si: -1}, {i: bottom, j: right, si: -1}];

  }

  /**
   * handles checks and actions to take when drawing event ends
   * gets the boudary of drawn segment and creates a subdraft containing that drawing
   * if the drawing sits on top of an existing subdraft, merge the drawing into that subdraft (extending the original if neccessary)
   * @returns 
   */
  processDrawingEnd(){

    this.canvas_zndx = -1;

    if(this.scratch_pad === undefined) return;
    if(this.scratch_pad[0] === undefined) return;
    
    const corners: Array<Interlacement> = this.getScratchPadBounds();

    const warps = corners[1].j - corners[0].j + 1;
    const wefts = corners[1].i - corners[0].i + 1;

  
    //there must be at least one cell selected
    if(warps < 1 || wefts < 1){
      this.scratch_pad = undefined;
      return;
    } 

    //if this drawing does not intersect with any existing subdrafts, 
    const sd:SubdraftComponent = this.createSubDraft(new Draft({wefts: wefts,  warps: warps}));
    const pos = {
      topleft: {x: corners[0].j * this.scale, y: corners[0].i * this.scale},
      width: warps * this.scale,
      height: wefts * this.scale
    }

    sd.setComponentPosition(pos.topleft);
    sd.setComponentSize(pos.width, pos.height);
    sd.disableDrag();


    for(let i = 0; i < sd.draft.wefts; i++ ){
      for(let j = 0; j< sd.draft.warps; j++){
        const c = this.scratch_pad[corners[0].i+i][corners[0].j+j];
        const b = this.getScratchpadProduct({i:i, j:j, si:-1}, this.inks.getSelected(),c);
        sd.draft.pattern[i][j].setHeddle(b); 
      }
    }

    // const had_merge = this.mergeSubdrafts(sd);
    // console.log("had a merge?", had_merge);

  }


 /**
  * handles actions to take when the mouse is down inside of the palette
  * @param event the mousedown event
  */
  @HostListener('mousedown', ['$event'])
    private onStart(event) {
      const ctrl: boolean = event.ctrlKey;
      const mouse:Point = {x: this.viewport.topleft.x + event.clientX, y:this.viewport.topleft.y+event.clientY};
      const ndx:any = this.resolveCoordsToNdx(mouse);

      //use this to snap the mouse to the nearest coord
      mouse.x = ndx.j * this.scale;
      mouse.y = ndx.i * this.scale;

      
      this.last = ndx;
      this.selection.start = this.last;
      this.removeSubscription();    
      
      this.moveSubscription = 
      fromEvent(event.target, 'mousemove').subscribe(e => this.onDrag(e)); 

      if(this.design_modes.isSelected("select")){
          this.selectionStarted();
      }else if(this.design_modes.isSelected("draw")){
          this.drawStarted();    
          this.setCell(ndx);
          this.drawCell(ndx); 
      }else if(this.design_modes.isSelected("shape")){

        if(this.design_modes.isSelected('free')){
          if(ctrl){
            this.processShapeEnd();
            this.changeDesignmode('move');
            this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          }else{
            if(this.shape_vtxs.length == 0) this.shapeStarted(mouse);
            this.shape_vtxs.push(mouse);
          }
            
          
        }else{
          this.shapeStarted(mouse);
        }
      }
  }


  @HostListener('mousemove', ['$event'])
  private onMove(event) {

    if(this.design_modes.isSelected('free') && this.shape_vtxs.length > 0){
      const shift: boolean = event.shiftKey;
      const mouse:Point = {x: this.viewport.topleft.x + event.clientX, y:this.viewport.topleft.y+event.clientY};
      const ndx:any = this.resolveCoordsToNdx(mouse);
      mouse.x = ndx.j * this.scale;
      mouse.y = ndx.i * this.scale;
      this.shapeDragged(mouse, shift);
    }
  }
  



  /**
   * called form the subscription created on start, checks the index of the location and returns null if its the same
   * @param event the event object
   */
  onDrag(event){


    const shift: boolean = event.shiftKey;
    const mouse: Point = {x: this.viewport.topleft.x + event.clientX, y:this.viewport.topleft.y+event.clientY};
    const ndx:Interlacement = this.resolveCoordsToNdx(mouse);
    //use this to snap the mouse to the nearest coord
    mouse.x = ndx.j * this.scale;
    mouse.y = ndx.i * this.scale;

    if(this.isSameNdx(this.last, ndx)) return;

    if(this.design_modes.isSelected("select")){

     this.drawSelection(ndx);
     const bounds = this.getSelectionBounds(this.selection.start,  this.last);    
     this.selection.setPositionAndSize(bounds);
    
    }else if(this.design_modes.isSelected("draw")){
      this.setCell(ndx);
      this.drawCell(ndx);
    }else if(this.design_modes.isSelected("shape")){
      this.shapeDragged(mouse, shift);
    }
    
    this.last = ndx;
  }

  

/**
 * Called when the mouse is up or leaves the boundary of the view
 * @param event 
 * @returns 
 */
  @HostListener('mouseleave', ['$event'])
  @HostListener('mouseup', ['$event'])
     private onEnd(event) {

      //if this.last is null, we have a mouseleave with no mousestart
      if(this.last === undefined) return;
      const mouse: Point = {x: this.viewport.topleft.x + event.clientX, y:this.viewport.topleft.y+event.clientY};
      const ndx:Interlacement = this.resolveCoordsToNdx(mouse);
      //use this to snap the mouse to the nearest coord
      mouse.x = ndx.j * this.scale;
      mouse.y = ndx.i * this.scale;

      this.removeSubscription();   

      if(this.design_modes.isSelected("select")){
        if(this.selection.active)this.processSelection();
        this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.changeDesignmode('move');

      }else if(this.design_modes.isSelected("draw")){
        this.processDrawingEnd();
        this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.changeDesignmode('move');


      }else if(this.design_modes.isSelected("shape")){
        if(!this.design_modes.isSelected('free')){
          this.processShapeEnd();
          this.changeDesignmode('move');
          this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
      } 

      //unset vars that would have been created on press
      this.scratch_pad = undefined;
      this.last = undefined;
      this.selection.active = false;
  }
  
 
  /**
   * Called when a selection operation ends. Checks to see if this selection intersects with any subdrafts and 
   * merges and or splits as required. 
   */
  processSelection(){

    this.closeSnackBar();

    //create the selection as subdraft
    const bounds:Bounds = this.getSelectionBounds(this.selection.start,  this.last);    
    
    const sc:SubdraftComponent = this.createSubDraft(new Draft({wefts: bounds.height/this.scale, warps: bounds.width/this.scale}));
    sc.setComponentBounds(bounds);
    sc.disableDrag();
    
    //get any subdrafts that intersect the one we just made
    const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(sc);

    if(isect.length == 0) return;

    //get a draft that reflects only the poitns in the selection view
    const new_draft: Draft = this.getCombinedDraft(bounds, sc, isect);
    sc.setNewDraft(new_draft);
    sc.drawDraft();

    isect.forEach(el => {
      const ibound = this.getIntersectionBounds(sc, el);

      if(el.isSameBoundsAs(ibound)){
         console.log("Component had same Bounds as Intersection, Consumed");
         this.removeSubdraft(el);
      }else{
         const sd_draft = el.draft.pattern;
         for(let i = 0; i < sd_draft.length; i++){
           for(let j = 0; j < sd_draft[i].length; j++){
           
              let p:Point = el.resolveNdxToPoint({i: i, j: j, si: -1});
              p.x += this.scale/2;
              p.y += this.scale/2;
              if(sc.hasPoint(p)) sd_draft[i][j].unsetHeddle();
           }
         }
         
        el.drawDraft();
        }
    });
  }






  subdraftMoved(obj: any){
      if(obj === null) return;
  
      //get the reference to the draft that's moving
      const moving = this.getSubdraft(obj.id);
      if(moving === null) return; 

      const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(moving);
      
      if(isect.length == 0){
        if(this.hasPreview()) this.removePreview();
        return;
      } 

      //const bounds: Bounds = this.getIntersectionBounds(moving, isect[0]);
      const bounds: Bounds = this.getCombinedBounds(moving, isect);
      const temp: Draft = this.getCombinedDraft(bounds, moving, isect);
      if(this.hasPreview()) this.preview.setNewDraft(temp);
      else this.createAndSetPreview(temp);
      
      this.preview.setComponentPosition(bounds.topleft);
      this.preview.drawDraft();
    }


   /**
    * checks if this subdraft has been dropped onto of another and merges them accordingly 
    * @param obj 
    * @returns 
    */
  subdraftDropped(obj: any){

    this.closeSnackBar();

     if(obj === null) return;
  
      //creaet a subdraft of this intersection
      if(this.hasPreview()){
        const sd: SubdraftComponent = this.createSubDraft(new Draft({wefts: this.preview.draft.wefts, warps: this.preview.draft.warps}));
        const to_right: Point = this.preview.getTopleft();
        to_right.x += this.preview.bounds.width + 20;
        sd.draft.pattern = cloneDeep(this.preview.draft.pattern);
        sd.setComponentPosition(to_right);
        sd.setComponentSize(this.preview.bounds.width, this.preview.bounds.height);
        sd.setAsPreview(); //this is a hack - get better way of brining tot fronott
        this.removePreview();
      } 
      
      //get the reference to the draft that's moving
      const moving = this.getSubdraft(obj.id);
      if(moving === null) return; 

      //disable this too see what happens
      // const had_merge = this.mergeSubdrafts(moving);
      // console.log("had merge", had_merge);
      // if(!had_merge) 
      // moving.drawDraft();

  }

  /**
   * merges a collection of subdraft components into the primary component, deletes the merged components
   * @param primary the draft to merge into
   * @returns true or false to describe if a merge took place. 
   */
  mergeSubdrafts(primary: SubdraftComponent): boolean{
    
    const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(primary);

      if(isect.length == 0){
        return false;
      }   

      const bounds: Bounds = this.getCombinedBounds(primary, isect);
      const temp: Draft = this.getCombinedDraft(bounds, primary, isect);

      primary.setNewDraft(temp);
      primary.setComponentPosition(bounds.topleft);
      primary.drawDraft();

    //remove the intersecting drafts from the view containier and from subrefts
    isect.forEach(element => {
      this.removeSubdraft(element);
    });
    return true;
  }

  computeHeddleValue(p:Point, main: SubdraftComponent, isect: Array<SubdraftComponent>):boolean{
    const a:boolean = main.resolveToValue(p);
    //this may return an empty array, because the intersection might not have the point
    const b_array:Array<SubdraftComponent> = isect.filter(el => el.hasPoint(p));

    //should never have more than one value in barray
    // if(b_array.length > 1) console.log("WARNING: Intersecting with Two Elements");

    const val:boolean = b_array.reduce((acc:boolean, arr) => arr.resolveToValue(p), null);   
    
    return this.computeFilter(main.ink, a, val);
  }

/**
 * check if the rectangles defined by the points overlap
 * @param l1 top left point of rectangle 1
 * @param r1 bottom right point of rectangle 1
 * @param l2 top left point of rectangle 2
 * @param r2 bottom right point of rectanble 2
 * @returns true or false in accordance to whether or not they overlap
 */
  doOverlap(l1:Point,  r1:Point,  l2:Point,  r2:Point){

    if (l1.x == r1.x || l1.y == r2.y || l2.x == r2.x
        || l2.y == r2.y) {
        // the line cannot have positive overlap
        return false;
    }
 
    // If one rectangle is on left side of other
    if (l1.x >= r2.x || l2.x >= r1.x){
        return false;
      }
 
    // If one rectangle is above other
    if (l1.y >= r2.y || l2.y >= r1.y){
        return false;
    }
    return true;
  }



  getLeftMost(main:SubdraftComponent,  isects:Array<SubdraftComponent>):SubdraftComponent{

    return isects.reduce((acc, isect) => {
      if(isect.getTopleft().x < acc.getTopleft().x) {
        acc = isect;
      }
      return acc;
    }, main);    
  }



  getTopMost(main:SubdraftComponent,  isects:Array<SubdraftComponent>):SubdraftComponent{

    return isects.reduce((acc, isect) => {
      if(isect.getTopleft().y < acc.getTopleft().y) {
        acc = isect;
      }
      return acc;
    }, main);    
  }



  getRightMost(main:SubdraftComponent,  isects:Array<SubdraftComponent>):SubdraftComponent{

    return isects.reduce((acc, isect) => {
      if((isect.getTopleft().x + isect.bounds.width) > (acc.getTopleft().x + acc.bounds.width)) {
        acc = isect;
      }
      return acc;
    }, main);    
  }

  getBottomMost(main:SubdraftComponent,  isects:Array<SubdraftComponent>):SubdraftComponent{

    return isects.reduce((acc, isect) => {
      if((isect.getTopleft().y + isect.bounds.height)> (acc.getTopleft().y + acc.bounds.height)) {
        acc = isect;
      }
      return acc;
    }, main);    
  }


  /**
   * returns the subdraft component associated with this id
   * @param id the unique draft id contined in the subdraft
   * @returns the subdraft Component
   */
  getSubdraft(id:number): SubdraftComponent {
    return  this.subdraft_refs.find(sr => (sr.draft.id.toString() === id.toString()));
  }


  getSubdraftsIntersectingSelection(selection: SelectionComponent){

    //find intersections between main and the others
    const isect:Array<SubdraftComponent> = this.subdraft_refs.filter(sr => (this.doOverlap(
      selection.bounds.topleft, 
      {x:  selection.bounds.topleft.x + selection.bounds.width, y: selection.bounds.topleft.y + selection.bounds.height}, 
      sr.getTopleft(), 
      {x: sr.getTopleft().x + sr.bounds.width, y: sr.getTopleft().y + sr.bounds.height}
      ) ? sr : null));

    return isect;
  
  }


 /**
   * get any subdrafts that intersect a given screen position
   * @param p the x, y position of this cell 
   * @returns 
   */
  getIntersectingSubdraftsForPoint(p: any){


    const primary_topleft = {x:  p.x, y: p.y };
    const primary_bottomright = {x:  p.x + this.scale, y: p.y + this.scale};

    const isect:Array<SubdraftComponent> = [];
     this.subdraft_refs.forEach(sr => {
      let sr_bottomright = {x: sr.getTopleft().x + sr.bounds.width, y: sr.getTopleft().y + sr.bounds.height};
      const b: boolean = this.doOverlap(primary_topleft, primary_bottomright, sr.getTopleft(), sr_bottomright);
      if(b) isect.push(sr);
     });

    return isect;
  }

  /**
   * get any subdrafts that intersect primary based on checks on their boundaries
   * @param primary 
   * @returns 
   */
  getIntersectingSubdrafts(primary: SubdraftComponent){

    const to_check:Array<SubdraftComponent> =  this.subdraft_refs.filter(sr => (sr.draft.id.toString() !== primary.draft.id.toString()));
    const primary_bottomright = {x:  primary.getTopleft().x + primary.bounds.width, y: primary.getTopleft().y + primary.bounds.height};


     const isect:Array<SubdraftComponent> = [];
     to_check.forEach(sr => {
      let sr_bottomright = {x: sr.getTopleft().x + sr.bounds.width, y: sr.getTopleft().y + sr.bounds.height};
      const b: boolean = this.doOverlap(primary.getTopleft(), primary_bottomright, sr.getTopleft(), sr_bottomright);
      if(b) isect.push(sr);
     });

    return isect;
  }

  getSelectionBounds(c1: any, c2: any): Bounds{
      let bottomright = {x: 0, y:0};
      let bounds:Bounds = {
        topleft:{x: 0, y:0},
        width: 0,
        height: 0
      }
      if(c1.i < c2.i){
        bounds.topleft.y = c1.i * this.scale;
        bottomright.y = c2.i * this.scale;
      }else{
        bounds.topleft.y = c2.i * this.scale;
        bottomright.y = c1.i * this.scale;
      }

      if(c1.j < c2.j){
        bounds.topleft.x = c1.j * this.scale;
        bottomright.x = c2.j * this.scale;
      }else{
        bounds.topleft.x = c1.j * this.scale;
        bottomright.x = c2.j * this.scale;
      }

      bounds.width = bottomright.x - bounds.topleft.x;
      bounds.height = bottomright.y - bounds.topleft.y;

      return bounds;
  }

  /**
   * returns a Bounds type that represents the intersection between primary and one intersecting subdraft
   * @param primary the rectangular area we are checking for intersections
   * @param isect an array of all the components that intersect
   * @returns the array of bounds of all intersections
   */
  getIntersectionBounds(primary: SubdraftComponent, isect: SubdraftComponent):Bounds{

    const left: number = Math.max(primary.bounds.topleft.x, isect.bounds.topleft.x);
    const top: number = Math.max(primary.bounds.topleft.y, isect.bounds.topleft.y);
    const right: number = Math.min((primary.bounds.topleft.x + primary.bounds.width), (isect.bounds.topleft.x + isect.bounds.width));
    const bottom: number = Math.min((primary.bounds.topleft.y + primary.bounds.height), (isect.bounds.topleft.y + isect.bounds.height));

    return {
      topleft: {x: left, y: top},
      width: right - left,
      height: bottom - top
    };

  }

  /**
   * gets the combined boundary of a Subdraft and any of its intersections
   * @param moving A SubdraftComponent that is our primary subdraft
   * @param isect  Any subdrafts that intersect with this component 
   * @returns the bounds of a rectangle that holds both components
   */
  getCombinedBounds(moving: SubdraftComponent, isect: Array<SubdraftComponent>):Bounds{
    
    const bounds: Bounds = {
      topleft: {x: 0, y:0},
      width: 0,
      height: 0
    }

    bounds.topleft.x = this.getLeftMost(moving, isect).getTopleft().x;
    bounds.topleft.y = this.getTopMost(moving, isect).getTopleft().y;

    const rm =  this.getRightMost(moving, isect);
    const bm =  this.getBottomMost(moving, isect);

    bounds.width = (rm.getTopleft().x + rm.bounds.width) - bounds.topleft.x;
    bounds.height =(bm.getTopleft().y + bm.bounds.height) - bounds.topleft.y;

    return bounds;

  }

  /**
   * creates a draft in size bounds that contains all of the computed points of its intersections
   * @param bounds the boundary of all the intersections
   * @param primary the primary draft that we are checking for intersections
   * @param isect an Array of the intersecting components
   * @returns 
   */
  getCombinedDraft(bounds: Bounds, primary: SubdraftComponent, isect: Array<SubdraftComponent>):Draft{

    const temp: Draft = new Draft({id: primary.draft.id, name: primary.draft.name, warps: Math.floor(bounds.width / primary.scale), wefts: Math.floor(bounds.height / primary.scale)});

    for(var i = 0; i < temp.wefts; i++){
      const top: number = bounds.topleft.y + (i * primary.scale);
      for(var j = 0; j < temp.warps; j++){
        const left: number = bounds.topleft.x + (j * primary.scale);

        const p = {x: left, y: top};
        const val = this.computeHeddleValue(p, primary, isect);
        if(val != null) temp.pattern[i][j].setHeddle(val);
        else temp.pattern[i][j].unsetHeddle();
      }
    }
    return temp;
  }

}