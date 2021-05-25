import { Observable, Subscription, fromEvent, from } from 'rxjs';
import { DesignmodesService } from '../../core/provider/designmodes.service';
import { Component, HostListener, ViewContainerRef, Input, ComponentFactoryResolver, ViewChild, OnInit, ViewRef } from '@angular/core';
import { SubdraftComponent } from './subdraft/subdraft.component';
import { SelectionComponent } from './selection/selection.component';
import { SnackbarComponent } from './snackbar/snackbar.component';
import { Draft } from './../../core/model/draft';
import { Cell } from './../../core/model/cell';
import {MatSnackBar} from '@angular/material/snack-bar';
import { Point, Interlacement, Bounds } from '../../core/model/point';
import { Pattern } from '../../core/model/pattern'; 
import { dsv } from 'd3-fetch';
import { sampleSize } from 'lodash';


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
   * Constructs a palette object
   * @param design_modes a reference to the service containing the current design modes and selections
   * @param resolver a reference to the factory component for dynamically generating components
   * @param _snackBar a reference to the snackbar component that shows data on move and select
   */
  constructor(private design_modes: DesignmodesService, private resolver: ComponentFactoryResolver, private _snackBar: MatSnackBar) { 
    this.subdraft_refs = [];
  }

/**
 * Called when palette is initailized
 */
  ngOnInit(){
    this.scale = 10;
    this.vc.clear();
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

  closeSnackBar(){
    this._snackBar.dismiss();
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
    subdraft.instance.patterns = this.patterns;
    subdraft.instance.filter = "or";
    

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

    if(this.design_modes.isSelected('draw')){

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

  private resolveCoordsToNdx(p: any) : any {    
    const i = Math.floor((p.y - 64) / this.scale);
    const j = Math.floor((p.x) / this.scale);
    return {i: i, j: j};
  }


  private isSameNdx(p1: any, p2:any) : boolean {    
    if(p1.i != p2.i ) return false;
    if(p1.j != p2.j) return false;
    return true;
  }


  private drawSelection(ndx: any){


    this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const bounds ={
      top: this.selection.start.j*this.scale,
      left: this.selection.start.i*this.scale,
      bottom: ndx.j *this.scale,
      right: ndx.i*this.scale
    };

    this.cx.strokeStyle = "#ff4081";
    this.cx.strokeRect(bounds.top, bounds.left, bounds.bottom-bounds.top, bounds.right-bounds.left);
      
  }

  /**
   * sets the value of the scratchpad cell at ndx 
   * @param ndx (i,j)
   */
  private setCell(ndx: any){
    const c: Cell = this.scratch_pad[ndx.i][ndx.j];
  
    if(this.design_modes.isSelected('toggle')){

      const p = {x: ndx.i * this.scale, y: ndx.j * this.scale};
      const isect = this.getIntersectingSubdraftsForPoint(p);

      if(isect.length > 0){
        const prev: boolean = isect[0].resolveToValue(p);
        if(prev != null) c.setHeddle(!prev);
        else c.toggleHeddle();
      }else{
        c.toggleHeddle();
      }

    }else if(this.design_modes.isSelected('up')){
      c.setHeddleUp();
    }else{
      c.setHeddleDown();
    }

  }

  /**
   * draw the cell at position ndx
   * @param ndx (i,j)
   */
  private drawCell(ndx: any){
    
    const c: Cell = this.scratch_pad[ndx.i][ndx.j];

    let is_set = c.isSet();
    let is_up = c.isUp();
  
    if(is_set){
      this.cx.fillStyle = (is_up) ?  '#000000' :  '#ffffff';
      this.cx.fillRect(ndx.j*this.scale, ndx.i*this.scale, this.scale, this.scale);
    } else{
      this.cx.fillStyle =  '#DDDDDD' ;
      this.cx.fillRect(ndx.j*this.scale, ndx.i*this.scale, this.scale, this.scale);
    }
      
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

      if(obj === null) return;
  
      //get the reference to the draft that's moving
      const moving = this.getSubdraft(obj.id);
      if(moving === null) return; 

      const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(moving);

      if(isect.length == 0) return;
      
      const bounds: any = this.getCombinedBounds(moving, isect);
      const temp: Draft = this.getCombinedDraft(bounds, moving, isect);
      this.createAndSetPreview(temp);
      this.preview.drawDraft();
      this.preview.setComponentPosition(bounds.topleft);
     
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: moving
      });
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

drawStarted(){

  
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
   * gets the bounds of a drawing on the scratchpad
   * @returns an object representing the bounds in the format of i, j (the row, column index of the pad)
   */
  getScratchPadBounds(): any{
    let bottom: number = 0;
    let right: number = 0;
    let top: number = this.scratch_pad.length-1;
    let left: number = this.scratch_pad[0].length-1;

    for(let i = 0; i < this.scratch_pad.length; i++ ){
      for(let j = 0; j<  this.scratch_pad[0].length; j++){
        if(this.scratch_pad[i][j].isSet()){
          if(i < top) top = i;
          if(j < left) left = j;
          if(i > bottom) bottom = i;
          if(j > right) right = j;
        } 
      }
    }

    return {
      top: top,
      bottom: bottom,
      left: left,
      right: right
    }
  }

  /**
   * handles checks and actions to take when drawing event ends
   * gets the boudary of drawn segment and creates a subdraft containing that drawing
   * if the drawing sits on top of an existing subdraft, merge the drawing into that subdraft (extending the original if neccessary)
   * @returns 
   */
  processDrawingEnd(){

    if(this.scratch_pad === undefined) return;
    if(this.scratch_pad[0] === undefined) return;
    
    //get bounds
    const bounds: any = this.getScratchPadBounds();

    const warps = bounds.right - bounds.left + 1;
    const wefts = bounds.bottom - bounds.top + 1;

    //there must be at least one cell selected
    if(warps < 1 || wefts < 1){
      this.scratch_pad = undefined;
      return;
    } 

    //if this drawing does not intersect with any existing subdrafts, 
    const sd:SubdraftComponent = this.createSubDraft(new Draft({wefts: wefts,  warps: warps}));
    const pos = {
      topleft: {x: bounds.left * this.scale, y: bounds.top * this.scale},
      width: warps * this.scale,
      height: wefts * this.scale
    }

    sd.setComponentPosition(pos.topleft);
    sd.setComponentSize(pos.width, pos.height);
    sd.disableDrag();

    for(let i = 0; i < sd.draft.wefts; i++ ){
      for(let j = 0; j< sd.draft.warps; j++){
        const c = this.scratch_pad[bounds.top+i][bounds.left+j];
        sd.draft.pattern[i][j].setHeddle(c.isUp());
        if(!c.isSet()) sd.draft.pattern[i][j].unsetHeddle();
      }
    }

    const had_merge = this.mergeSubdrafts(sd);
    console.log("had a merge?", had_merge);

  }


 /**
  * handles actions to take when the mouse is down inside of the palette
  * @param event the mousedown event
  */
  @HostListener('mousedown', ['$event'])
    private onStart(event) {

      const ndx:any = this.resolveCoordsToNdx({x: event.clientX, y:event.clientY});
      this.last = ndx;
      this.selection.start = this.last;
      this.removeSubscription();    
      
      this.moveSubscription = 
      fromEvent(event.target, 'mousemove').subscribe(e => this.onMove(e)); 

      if(this.design_modes.isSelected("select")){
          this.selectionStarted();
      }else if(this.design_modes.isSelected("draw")){
          this.drawStarted();    
          this.setCell(ndx);
          this.drawCell(ndx); 
        
      }
  }


  /**
   * called form the subscription created on start, checks the index of the location and returns null if its the same
   * @param event the event object
   */
  onMove(event){

    const ndx:any = this.resolveCoordsToNdx({x: event.clientX, y:event.clientY});

    if(this.isSameNdx(this.last, ndx)) return;

    if(this.design_modes.isSelected("select")){

     this.drawSelection(ndx);
     const bounds = this.getSelectionBounds(this.selection.start,  this.last);    
     this.selection.setPositionAndSize(bounds);
    
    }else if(this.design_modes.isSelected("draw")){
      this.setCell(ndx);
      this.drawCell(ndx);
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

      this.removeSubscription();   
      this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      if(this.design_modes.isSelected("select")){
        if(this.selection.active)this.processSelection();
      }else if(this.design_modes.isSelected("draw")){
        this.processDrawingEnd();
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
    const bounds = this.getSelectionBounds(this.selection.start,  this.last);    
    const sc:SubdraftComponent = this.createSubDraft(new Draft({wefts: bounds.height/this.scale, warps: bounds.width/this.scale}));
    sc.setComponentPosition(bounds.topleft);
    sc.setComponentSize(bounds.width, bounds.height); //this is a hack to make sure it has a size before intersections are checked
    sc.disableDrag();
    
    
    //get any subdrafts that intersect the one we just made
    const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(sc);

    if(isect.length == 0) return;

    //get a draft that reflects only the poitns in the selection view
    const new_draft: Draft = this.getCombinedDraft(bounds, sc, isect);
    sc.setNewDraft(new_draft);
    sc.drawDraft();

    //get the bounding box of all the intersections
    const expanded_bounds: any = this.getCombinedBounds(sc, isect);

    if(expanded_bounds.width > bounds.width || expanded_bounds.height > bounds.height){

      //unset any points in the intersecting drafts that are now in the selection
      isect.forEach(element => {
       const sd_draft = element.draft.pattern;
       for(let i = 0; i < sd_draft.length; i++){
         for(let j = 0; j < sd_draft[i].length; j++){
         
            let p = element.resolveNdxToPoint({i: i, j: j, si: -1});
            p.x += this.scale/2;
            p.y += this.scale/2;
            if(sc.hasPoint(p)) sd_draft[i][j].unsetHeddle();
         }
       }
       element.drawDraft();
      });

      //delete any
      isect.forEach(element => {
        const to_delete = element.resize();
        console.log("delete this?", to_delete);
       });

    }else{
      //if the boudns haven't changed with the expansion, than everything was within our selection and we should delete it
      isect.forEach(element => {
        //this relies on my array having the same indexing as the view container. 
       this.removeSubdraft(element);
      });
    }
  
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

      const bounds: any = this.getCombinedBounds(moving, isect);
      const temp: Draft = this.getCombinedDraft(bounds, moving, isect);
      if(this.hasPreview()) this.preview.setNewDraft(temp);
      else this.createAndSetPreview(temp);
      
      this.preview.setComponentPosition(bounds.topleft);
   
    }


   /**
    * checks if this subdraft has been dropped onto of another and merges them accordingly 
    * @param obj 
    * @returns 
    */
  subdraftDropped(obj: any){

    this.closeSnackBar();

     if(obj === null) return;
  
      if(this.hasPreview()) this.removePreview();
      //get the reference to the draft that's moving
      const moving = this.getSubdraft(obj.id);
      if(moving === null) return; 

      const had_merge = this.mergeSubdrafts(moving);
      console.log("had merge", had_merge);
      if(!had_merge) moving.drawDraft();

  }

  /**
   * merges a collection of subdraft components into the primary component, deletes the merged components
   * @param primary the draft to merge into
   * @returns true or false to describe if a merge took place. 
   */
  mergeSubdrafts(primary: SubdraftComponent): boolean{
    
    //reposition the primary subdraft to its original 

    
    const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(primary);
    console.log(isect);


      if(isect.length == 0){
        return false;
      }   

      const bounds: any = this.getCombinedBounds(primary, isect);
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

  computeHeddleValue(p:any, main: any, isect: Array<SubdraftComponent>):boolean{
    const a:boolean = main.resolveToValue(p);

    //this may return an empty array, because the intersection might not have the point
    const b_array:Array<SubdraftComponent> = isect.filter(el => el.hasPoint(p));

    //should never have more than one value in barray
    // if(b_array.length > 1) console.log("WARNING: Intersecting with Two Elements");

    const val:boolean = b_array.reduce((acc:boolean, arr) => arr.resolveToValue(p), null);   
    
    return main.computeFilter(a, val);
  }


  doOverlap(l1:any,  r1:any,  l2:any,  r2:any){

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

  getSelectionBounds(c1: any, c2: any): any{
      let bottomright = {x: 0, y:0};
      let bounds:any = {
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

  getIntersectionBounds(primary: SubdraftComponent, isect: Array<SubdraftComponent>):Array<Bounds>{
    const bounds: Array<Bounds> = [];
    bounds.push();


    // const lefts: Array<SubdraftComponent> = isect.map(el => (Math.max(primary.topleft.x, el.topleft.x)));
    // const tops: Array<SubdraftComponent> = isect.map(el => (Math.max(primary.topleft.y, el.topleft.y)));
    // const rights: Array<SubdraftComponent> = isect.map(el => (Math.max((primary.topleft.x + primary.bounds.width), (el.topleft.x + el.bounds.width))));
    // const bottoms: Array<SubdraftComponent> = isect.map(el => (Math.max((primary.topleft.y + primary.bounds.height), (el.topleft.y + el.bounds.height))));

   
  
    // bounds.width = (rm.getTopleft().x + rm.bounds.width) - bounds.topleft.x;
    // bounds.height =(bm.getTopleft().y + bm.bounds.height) - bounds.topleft.y;

    return bounds;

  }

  /**
   * gets the combined boundary of a Subdraft and any of its intersections
   * @param moving A SubdraftComponent that is our primary subdraft
   * @param isect  Any subdrafts that intersect with this component 
   * @returns the bounds of a rectangle that holds both components
   */
  getCombinedBounds(moving: SubdraftComponent, isect: Array<SubdraftComponent>):any{
    
    const bounds = {
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
   * @param moving the primary draft
   * @param isect an Array of the intersecting components
   * @returns 
   */
  getCombinedDraft(bounds: any, moving: any, isect: Array<SubdraftComponent>):Draft{
    const temp: Draft = new Draft({id: moving.draft.id, name: moving.draft.name, warps: Math.floor(bounds.width / moving.scale), wefts: Math.floor(bounds.height / moving.scale)});

    for(var i = 0; i < temp.wefts; i++){
      const top: number = bounds.topleft.y + (i * moving.scale);
      for(var j = 0; j < temp.warps; j++){
        const left: number = bounds.topleft.x + (j * moving.scale);

        const p = {x: left, y: top};
        const val = this.computeHeddleValue(p, moving, isect);

        if(val != null) temp.pattern[i][j].setHeddle(val);
        else temp.pattern[i][j].unsetHeddle();
      }
    }
    return temp;
  }

}