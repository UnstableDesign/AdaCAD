import { Component, OnInit, Input, Output, EventEmitter, HostListener} from '@angular/core';
import { Draft } from '../../../core/model/draft';
import { Point, Interlacement, Bounds } from '../../../core/model/datatypes';
import { ConnectionComponent } from '../connection/connection.component';
import { InkService } from '../../../core/provider/ink.service';
import { LayersService } from '../../../core/provider/layers.service';




interface DesignActions{
  value: string;
  viewValue: string;
  icon: string;
}

@Component({
  selector: 'app-subdraft',
  templateUrl: './subdraft.component.html',
  styleUrls: ['./subdraft.component.scss']
})



export class SubdraftComponent implements OnInit {

  @Input()  draft: Draft;
  @Input()  patterns: any;
  @Input()  parent: ConnectionComponent;
  @Input()  children: Array<ConnectionComponent>;
  @Output() onSubdraftMove = new EventEmitter <any>(); 
  @Output() onSubdraftDrop = new EventEmitter <any>(); 
  @Output() onSubdraftStart = new EventEmitter <any>(); 
  @Output() onDeleteCalled = new EventEmitter <any>(); 

 //operations you can perform on a selection 
 design_actions: DesignActions[] = [
  {value: 'toggle', viewValue: 'Invert Region', icon: "fas fa-adjust"},
  {value: 'flip_x', viewValue: 'Vertical Flip', icon: "fas fa-arrows-alt-v"},
  {value: 'flip_y', viewValue: 'Horizontal Flip', icon: "fas fa-arrows-alt-h"},
  {value: 'shift_left', viewValue: 'Shift 1 Warp Left', icon: "fas fa-arrow-left"},
  {value: 'shift_up', viewValue: 'Shift 1 Pic Up', icon: "fas fa-arrow-up"},
  {value: 'copy', viewValue: 'Copy Selected Region', icon: "fa fa-clone"},
  {value: 'paste', viewValue: 'Paste Copyed Pattern to Selected Region', icon: "fa fa-paste"}
];


  canvas: HTMLCanvasElement;
  cx: any;

  bounds: Bounds = {
    topleft: {x: 0, y: 0},
    width: 0, 
    height: 0
  }

  scale = 10; 
  ink = 'neq'; //can be or, and, neq, not, splice
  counter:number  =  0; // keeps track of how frequently to call the move functions
  counter_limit: number = 50;  //this sets the threshold for move calls, lower number == more calls
  last_ndx:Interlacement = {i: -1, j:-1, si: -1}; //used to check if we should recalculate a move operation

  moving: boolean  = false;
  disable_drag: boolean = false;
  is_preview: boolean = false;
  zndx = 0;


  constructor(private inks: InkService, private layer: LayersService) { 
    this.zndx = layer.createLayer();
    console.log(this.zndx);
  }

  ngOnInit(){
    this.bounds.width = this.draft.warps * this.scale;
    this.bounds.height = this.draft.wefts * this.scale;


  }


  ngAfterViewInit() {


    this.canvas = <HTMLCanvasElement> document.getElementById(this.draft.id.toString());
    this.cx = this.canvas.getContext("2d");
    this.canvas.width = this.draft.warps * this.scale;
    this.canvas.height = this.draft.wefts * this.scale;
    this.bounds.width = this.draft.warps * this.scale;
    this.bounds.height = this.draft.wefts * this.scale;
    this.drawDraft();


  }

  // /**
  //  * sets the size and position of this element (but does not resize the canvas! due to error)
  //  * @param bounds an object including topleft, width, and height 
  //  */
  // public setStaticPositionAndSize(bounds: any){

  //   this.static_tl = bounds.topleft;
  //   this.dynamic_tl = this.static_tl;
  //   console.log("setting size on set static");
  //   this.bounds.width = bounds.width;
  //   this.bounds.height = bounds.height;
  //   this.dynamic_size = this.size;
  
  // }




  public inkActionChange(name: any){
    this.ink = name;
    this.inks.select(name);
    this.drawDraft();
  }

  /**
   * gets the next z-ndx to place this in front
   */
  public setAsPreview(){
     this.zndx = this.layer.createLayer();
  }

 

  /**
   * does this subdraft exist at this point?
   * @param p the absolute position of the coordinate (based on the screen)
   * @returns true/false for yes or no
   */
  public hasPoint(p:Point) : boolean{

      const endPosition = {
        x: this.bounds.topleft.x + this.bounds.width,
        y: this.bounds.topleft.y + this.bounds.height,
      };

      if(p.x < this.bounds.topleft.x || p.x > endPosition.x) return false;
      if(p.y < this.bounds.topleft.y || p.y > endPosition.y) return false;

    
    return true;

  }


/**
 * Takes row/column position in this subdraft and translates it to an absolution position  
 * @param ndx the index
 * @returns the absolute position as nxy
 */
 public resolveNdxToPoint(ndx:Interlacement) : Point{
  
  let y = this.bounds.topleft.y + ndx.i * this.scale;
  let x = this.bounds.topleft.x + ndx.j * this.scale;
  return {x: x, y:y};

}

/**
 * Takes an absolute coordinate and translates it to the row/column position Relative to this subdraft
 * @param p the screen coordinate
 * @returns the row and column within the draft (i = row, j=col), returns -1 if out of bounds
 */
  public resolvePointToNdx(p:Point) : Interlacement{
    
    let i = Math.floor((p.y -this.bounds.topleft.y) / this.scale);
    let j = Math.floor((p.x - this.bounds.topleft.x) / this.scale);

    if(i < 0 || i >= this.draft.wefts) i = -1;
    if(j < 0 || j >= this.draft.warps) j = -1;

    return {i: i, j:j, si: i};

  }

  /**
 * Takes an absolute coordinate and translates to a number that would represent its grid position on screen
 * used only for testing if a new move calculation should be called
 * @param p the screen coordinate
 * @returns the row and column within the draft (i = row, j=col), returns -1 if out of bounds
 */
   public resolvePointToAbsoluteNdx(p:Point) : Interlacement{
    
    let i = Math.floor((p.y) / this.scale);
    let j = Math.floor((p.x) / this.scale);

    return {i: i, j:j, si: i};

  }

/**
 * takes an absolute reference and returns the value at that cell boolean or null if its unset
 * @param p a point of the absolute poistion of coordinate in question
 * @returns true/false/or null representing the eddle value at this point
 */
  public resolveToValue(p:Point) : boolean{

    const coords = this.resolvePointToNdx(p);

    if(coords.i < 0 || coords.j < 0) return null; //this out of range

    if(!this.draft.pattern[coords.i][coords.j].isSet()) return null;
    
    return this.draft.pattern[coords.i][coords.j].isUp();
  
  }


  /**
   * sets a new draft
   * @param temp the draft to set this component to
   */
  setNewDraft(temp: Draft) {

    this.bounds.width = temp.warps * this.scale;
    this.bounds.height = temp.wefts * this.scale;
    this.draft.reloadForMixer(temp);

  }

  setComponentPosition(point: Point){
    this.bounds.topleft = point;
  }


  setComponentBounds(bounds: Bounds){
    this.bounds = bounds;
  }
  /**
   * manually sets the component size. While such an operation should be handled on init but there is a bug where this value is checked before the 
   * component runds its init sequence. Manually adding the data makes it possible for check for intersections on selection and drawing end.
   * @param width 
   * @param height 
   */
  setComponentSize(width: number, height: number){
    this.bounds.width = width;
    this.bounds.height = height;
  }


  /**
   * draw whetever is stored in the draft object to the screen
   * @returns 
   */
  drawDraft() {

    if(this.canvas === undefined) return;
   
    this.canvas.width = this.bounds.width;
    this.canvas.height = this.bounds.height;

    for (let i = 0; i < this.draft.visibleRows.length; i++) {
      for (let j = 0; j < this.draft.warps; j++) {
        let row:number = this.draft.visibleRows[i];
        let is_up = this.draft.isUp(row,j);
        let is_set = this.draft.isSet(row, j);
        if(is_set){
          if(this.ink === 'unset' && is_up){
            this.cx.fillStyle = "#999999"; 
          }else{
            this.cx.fillStyle = (is_up) ?  '#000000' :  '#ffffff';
          }
        } else{
          this.cx.fillStyle =  '#00000070';
        }
        this.cx.fillRect(j*this.scale, i*this.scale, this.scale, this.scale);
      }
    }
  }


  /**
   * scans the draft and deletes any boundary rows or columns that are entirely unset. 
   * Called after selection 
   * @returns a boolean to say if this compoennt is empty or not after the scan
   */
  resize():boolean{
    const hasrows:boolean = this.draft.trimUnsetRows();
    if(!hasrows) return true;

    const hascols = this.draft.trimUnsetCols();
    return false;
  }

  /**
   * gets the position of this elment on the canvas. Dyanic top left might be bigger due to scolling intersection
   * previews. Use static for all calculating of intersections, etc. 
   * @returns 
   */
  getTopleft(): Point{
    return this.bounds.topleft;
  }

  /**
   * takes an absolute point and returns the "cell" boundary that is closest. 
   * @param p the absolute point
   * @returns the snapped point 
   */
  snapToGrid(p: Point):Point{

    p.x = Math.floor(p.x / this.scale) * this.scale;
    p.y = Math.floor(p.y / this.scale) * this.scale;
    return p;

  }

  private isSameNdx(p1: Interlacement, p2:Interlacement) : boolean {    
    if(p1.i != p2.i ) return false;
    if(p1.j != p2.j) return false;
    return true;
  }

  private getAdjusted(p: Point) : any {   
    return {
      x: p.x,
      y: p.y - 64
    } 
  }
  
  isSameBoundsAs(bounds: Bounds) : boolean {   
    if(bounds.topleft.x != this.bounds.topleft.x) return false;
    if(bounds.topleft.y != this.bounds.topleft.y) return false;
    if(bounds.width != this.bounds.width) return false;
    if(bounds.height != this.bounds.height) return false;
    return true;
  }
  

  dragEnd($event: any) {
    this.moving = false;
    this.counter = 0;  
    this.last_ndx = {i: -1, j:-1, si: -1};
    this.onSubdraftDrop.emit({id: this.draft.id});
  }

  dragStart($event: any) {
    this.moving = true;
    this.counter = 0;  
    this.onSubdraftStart.emit({id: this.draft.id});
 

  }

  dragMove($event: any) {
    //position of pointer of the page
    const pointer:Point = $event.pointerPosition;
    const relative:Point = this.getAdjusted(pointer);
    const adj:Point = this.snapToGrid(relative);

    this.bounds.topleft = adj;

    const ndx = this.resolvePointToAbsoluteNdx(relative);
    
    if(this.counter%this.counter_limit === 0 || !this.isSameNdx(this.last_ndx, ndx)){
      this.onSubdraftMove.emit({id: this.draft.id});
      this.counter = 0;
    } 

    this.counter++;
    this.last_ndx = ndx;
  }

  disableDrag(){
    this.disable_drag = true;
  }

  enableDrag(){
    this.disable_drag = false;
  }


  designActionChange(e){

    switch(e){
      // case 'copy': this.copyEvent(e);
      // break;

      // case 'duplicate': this.duplicate(e, 'original');
      // break;

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

      case 'delete': 
        this.onDeleteCalled.emit({id: this.draft.id});
      break;

    }
  }

    fill(id) {
      var p = this.patterns[id].pattern;
      //need a way to specify an area within the fill
      this.draft.fill(p, 'original');
      this.drawDraft();

    }

    // copyEvent(e) {
    //   this.onCopy();
    // }

    clearEvent(b:boolean) {
     // this.onClear(b);
    }

    pasteEvent(type) {

      var p = this.draft.pattern;

      if(type === undefined) type = "original";

     this.draft.fill(p, type);
     this.drawDraft();



    }
    
    /**
  //  * Tell the weave directive to fill selection with pattern.
  //  * @extends WeaveComponent
  //  * @param {Event} e - fill event from design component.
  //  * @returns {void}
  //  */
  // public onFill(e) {
    
  //   var p = this.patterns[e.id].pattern;
  //   console.log(p);
    

  //   //need a way to specify an area within the fill
  //   this.draft.fill(p, 'original');
  //   this.drawDraft(this.draft);


  //   // if(this.render.showingFrames()) this.draft.recomputeLoom();

  //   // if(this.render.isYarnBasedView()) this.draft.computeYarnPaths();
    
  //   // this.palette.redraw({drawdown:true, loom:true});

  //   // this.timeline.addHistoryState(this.draft);
    
  // }

  /**
   * Tell weave reference to clear selection.
   * @extends WeaveComponent
   * @param {Event} Delte - clear event from design component.
   * @returns {void}
   */
  public onClear(b:boolean) {
    
    // this.draft.fillArea(this.palette.selection, [[b]], 'original')

    // this.palette.copyArea();

    // this.palette.redraw({drawdown:true, loom:true});

    // this.timeline.addHistoryState(this.draft);

  }

 
  /**
   * Tells weave reference to paste copied pattern.
   * @extends WeaveComponent
   * @param {Event} e - paste event from design component.
   * @returns {void}
   */
  public onPaste(e) {

     var p = this.draft.pattern;
     var type;

    if(e.type === undefined) type = "original";
    else type =  e.type;

     this.draft.fill(p, type);
     this.drawDraft();

    // if(this.render.showingFrames()) this.draft.recomputeLoom();
    
    // if(this.render.isYarnBasedView()) this.draft.computeYarnPaths();

    // this.timeline.addHistoryState(this.draft);

    // this.palette.copyArea();

    // this.palette.redraw({drawdown:true, loom:true, weft_materials: true, warp_materials:true, weft_systems:true, warp_systems:true});
 

  }

}
