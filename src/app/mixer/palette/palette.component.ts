import { Observable, Subscription, fromEvent, from } from 'rxjs';
import { DesignmodesService } from '../../core/provider/designmodes.service';
import { Component, HostListener, ViewContainerRef, Input, ComponentFactoryResolver, ViewChild, OnInit, ViewRef } from '@angular/core';
import { SubdraftComponent } from './subdraft/subdraft.component';
import { SelectionComponent } from './selection/selection.component';
import { SnackbarComponent } from './snackbar/snackbar.component';
import { Draft } from './../../core/model/draft';
import { Cell } from './../../core/model/cell';
import {MatSnackBar} from '@angular/material/snack-bar';
import { Point } from '../../core/model/point';
import { Pattern } from '../../core/model/pattern';


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
   * stores an x and y of the last user selected location within the component
   * @property {Point}
   */
  last: Point;


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
    });

    this.vc.clear();
    
  }

  /**
   * Gets references to view items and adds to them after the view is initialized
   */
  ngAfterViewInit(){
    this.canvas = <HTMLCanvasElement> document.getElementById("scratch");
    this.cx = this.canvas.getContext("2d");
    this.canvas.width = 1000;
    this.canvas.height = 1000;

    console.log(this.selection);
    this.selection.scale = this.scale;
    this.selection.active = false;
    console.log(this.selection.getDraftId());

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
    subdraft.instance.draft = d;
    console.log(this.patterns);
    subdraft.instance.patterns = this.patterns;

    this.subdraft_refs.push(subdraft.instance);
    return subdraft.instance;
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

  private resolveCoords(p: any) : any {   
    return {
      x: p.x,
      y: p.y - 64
    } 
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


  private drawCell(ndx: any){
    
    const c: Cell = this.scratch_pad[ndx.i][ndx.j];


    if(this.design_modes.isSelected('toggle')) c.toggleHeddle();
    else if(this.design_modes.isSelected('up')) c.setHeddleUp();
    else c.setHeddleDown();

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


  subdraftStarted(obj: any){
    
    if(obj === null) return;
    const moving = this.getMovingSubdraft(obj.id);
    if(moving === null) return; 
    this._snackBar.openFromComponent(SnackbarComponent, {
      data: moving
    });

 }

 selectionStarted(){
  this.selection.start = this.last;
  this.selection.active = true;
  this._snackBar.openFromComponent(SnackbarComponent, {
    data: this.selection
  });
 }

  @HostListener('mousedown', ['$event'])
    private onStart(event) {




      this.last = this.resolveCoordsToNdx({x: event.clientX, y:event.clientY});
      this.selection.start = this.last;
    

      this.removeSubscription();    
      
      this.moveSubscription = 
      fromEvent(event.target, 'mousemove').subscribe(e => this.onMove(e)); 

      if(this.design_modes.isSelected("select")){
          this.selectionStarted();
      }else{
                 
        this.scratch_pad = [];
        for(let i = 0; i < this.canvas.height; i+=this.scale ){
          const row = [];
          for(let j = 0; j< this.canvas.width; j+=this.scale ){
            row.push(new Cell(null));
          }
          this.scratch_pad.push(row);
      }
    }
  }



  onMove(event){


    const ndx:any = this.resolveCoordsToNdx({x: event.clientX, y:event.clientY});

    if(this.isSameNdx(this.last, ndx)) return;

    if(this.design_modes.isSelected("select")){

     this.drawSelection(ndx);
     const bounds = this.getSelectionBounds(this.selection.start,  this.last);    
     this.selection.setPositionAndSize(bounds);
    
    }else{
      this.drawCell(ndx);
    }
    
    this.last = ndx;
  }

  


  @HostListener('mouseleave', ['$event'])
  @HostListener('mouseup', ['$event'])
     private onEnd(event) {

      if(this.last === undefined) return;

      this.removeSubscription();   

      this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      if(this.design_modes.isSelected("select")){
        if(this.selection.active)this.processMarquee();
      }else{
        this.processDrawingEnd();
      } 

      //unset vars that would have been created on press
      this.scratch_pad = undefined;
      this.last = undefined;
      this.selection.active = false;
  }
  
 

  processMarquee(){

    this.closeSnackBar();

    //create the selection as a subdraft
    const bounds = this.getSelectionBounds(this.selection.start,  this.last);    
    const sc:SubdraftComponent = this.createSubDraft(new Draft({wefts: bounds.height/this.scale, warps: bounds.width/this.scale}));
    sc.setPositionAndSize(bounds);
    const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(sc);



    if(isect.length == 0) return;
   

    //expand the selection to include any intersecting drafts
    const i_bounds: any = this.getIntersectionBounds(sc, isect);
    const temp: Draft = this.getCombinedDraft(i_bounds, sc, isect);

    sc.setNewDraft(bounds, temp);
    sc.drawDraft(temp); //can't do this until the view is initiatied, might need to listed for that here. 

    //write a function here to split drafts that the selection is intersecting.
    isect.forEach(element => {
        //this relies on my array having the same indexing as the view container. 
        const ndx = this.subdraft_refs.findIndex((sr) => (element.canvas.id === sr.canvas.id));
        this.vc.remove(ndx);
        this.subdraft_refs.splice(ndx, 1);
    });
  
  }

  processDrawingEnd(){

    if(this.scratch_pad === undefined) return;
    if(this.scratch_pad[0] === undefined) return;
    
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


    const warps = right - left + 1;
    const wefts = bottom - top + 1;



    if(warps < 1 || wefts < 1){
      this.scratch_pad = undefined;
      return;
    } 

    const sd:SubdraftComponent = this.createSubDraft(new Draft({wefts: wefts,  warps: warps}));
    sd.topleft = {x: left * this.scale, y: top * this.scale};

    for(let i = 0; i < sd.draft.wefts; i++ ){
      for(let j = 0; j< sd.draft.warps; j++){
        const c = this.scratch_pad[top+i][left+j];
        sd.draft.pattern[i][j].setHeddle(c.isUp());
        if(!c.isSet()) sd.draft.pattern[i][j].unsetHeddle();
      }
    }

  }


  subdraftMoved(obj: any){

      if(obj === null) return;
  
      //get the reference to the draft that's moving
      const moving = this.getMovingSubdraft(obj.id);
      if(moving === null) return; 

      const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(moving);

      if(isect.length == 0){
        //moving.drawDraft(moving.draft);
        return;
      }   

      const bounds: any = this.getMovingBounds(moving);
      const temp: Draft = this.getCombinedDraft(bounds, moving, isect);
      moving.drawDraft(temp);

   }


  //check intersections
  subdraftDropped(obj: any){

    this.closeSnackBar();

     if(obj === null) return;
  
      //get the reference to the draft that's moving
      const moving = this.getMovingSubdraft(obj.id);
      if(moving === null) return; 

      const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(moving);

      if(isect.length == 0){
        moving.drawDraft(moving.draft);
        return;
      }   

      const bounds: any = this.getIntersectionBounds(moving, isect);
      const temp: Draft = this.getCombinedDraft(bounds, moving, isect);

      moving.setNewDraft(bounds, temp);
      moving.drawDraft(temp);

    //remove the intersecting drafts from the view containier and from subrefts
    isect.forEach(element => {
        //this relies on my array having the same indexing as the view container. 
        const ndx = this.subdraft_refs.findIndex((sr) => (element.canvas.id === sr.canvas.id));
        this.vc.remove(ndx);
        this.subdraft_refs.splice(ndx, 1);
    });

  }

  computeHeddleValue(p:any, main: any, isect: Array<SubdraftComponent>):boolean{
    //return  this.subdraft_refs.find(sr => (sr.draft.id.toString() === id.toString()));
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
      if(isect.topleft.x < acc.topleft.x) {
        acc = isect;
      }
      return acc;
    }, main);    
  }



  getTopMost(main:SubdraftComponent,  isects:Array<SubdraftComponent>):SubdraftComponent{

    return isects.reduce((acc, isect) => {
      if(isect.topleft.y < acc.topleft.y) {
        acc = isect;
      }
      return acc;
    }, main);    
  }



  getRightMost(main:SubdraftComponent,  isects:Array<SubdraftComponent>):SubdraftComponent{

    return isects.reduce((acc, isect) => {
      if((isect.topleft.x + isect.size.w) > (acc.topleft.x + acc.size.w)) {
        acc = isect;
      }
      return acc;
    }, main);    
  }

  getBottomMost(main:SubdraftComponent,  isects:Array<SubdraftComponent>):SubdraftComponent{

    return isects.reduce((acc, isect) => {
      if((isect.topleft.y + isect.size.h)> (acc.topleft.y + acc.size.h)) {
        acc = isect;
      }
      return acc;
    }, main);    
  }


  getMovingSubdraft(id:number): SubdraftComponent {
    return  this.subdraft_refs.find(sr => (sr.draft.id.toString() === id.toString()));
  }


  getSubdraftsIntersectingSelection(selection: SelectionComponent){

    //find intersections between main and the others
    const isect:Array<SubdraftComponent> = this.subdraft_refs.filter(sr => (this.doOverlap(
      selection.topleft, 
      {x:  selection.topleft.x + selection.size.w, y: selection.topleft.y + selection.size.h}, 
      sr.topleft, 
      {x: sr.topleft.x + sr.size.w, y: sr.topleft.y + sr.size.h}
      ) ? sr : null));

    return isect;
  
  }


  getIntersectingSubdrafts(moving: SubdraftComponent){
    const to_check:Array<SubdraftComponent> =  this.subdraft_refs.filter(sr => (sr.draft.id.toString() !== moving.draft.id.toString()));

    //find intersections between main and the others
    const isect:Array<SubdraftComponent> = to_check.filter(sr => (this.doOverlap(
      moving.topleft, 
      {x:  moving.topleft.x + moving.size.w, y: moving.topleft.y + moving.size.h}, 
      sr.topleft, 
      {x: sr.topleft.x + sr.size.w, y: sr.topleft.y + sr.size.h}
      ) ? sr : null));

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


  getMovingBounds(moving: SubdraftComponent):any{

    const bounds = {
      topleft: moving.topleft,
      width: moving.size.w,
      height: moving.size.h
    }

    return bounds;
  }

  getIntersectionBounds(moving: SubdraftComponent, isect: Array<SubdraftComponent>):any{
    const bounds = {
      topleft: {x: 0, y:0},
      width: 0,
      height: 0
    }

    bounds.topleft.x = this.getLeftMost(moving, isect).topleft.x;
    bounds.topleft.y = this.getTopMost(moving, isect).topleft.y;

    const rm =  this.getRightMost(moving, isect);
    const bm =  this.getBottomMost(moving, isect);

    bounds.width = (rm.topleft.x + rm.size.w) - bounds.topleft.x;
    bounds.height =(bm.topleft.y + bm.size.h) - bounds.topleft.y;

    return bounds;

  }


  getCombinedDraft(bounds: any, moving: any, isect: Array<SubdraftComponent>):Draft{

    const temp: Draft = new Draft({name: "combined", warps: Math.floor(bounds.width / moving.scale), wefts: Math.floor(bounds.height / moving.scale)});
    //iterate over the combined area

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