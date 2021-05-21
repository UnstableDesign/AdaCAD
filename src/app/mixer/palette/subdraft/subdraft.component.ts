import { Component, OnInit, Input, Output, EventEmitter, HostListener} from '@angular/core';
import { Draft } from '../../../core/model/draft';
import { ConnectionComponent } from '../connection/connection.component';


interface Point {
  x: number;
  y: number;
}

interface Interlacement {
  i:number;
  j:number;
}

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
  {value: 'paste', viewValue: 'Paste Copyed Pattern to Selected Region', icon: "fa fa-paste"},
  {value: 'delete', viewValue: 'Delete this Draft', icon: "fa fa-trash"}
];


  canvas: HTMLCanvasElement;
  cx: any;

  topleft = {x: 0, y: 0};  
  size = {w: 0, h: 0};

  scale = 10; 
  filter = 'or'; //can be or, and, neq, not, splice
  counter:number  =  0; // only call functions every so often
  
  moving = false;
  disable_drag = false;


  constructor() { 
   
  }

  ngOnInit(){
    this.size.w = this.draft.warps * this.scale;
    this.size.h = this.draft.wefts * this.scale;

  }


  ngAfterViewInit() {


    this.canvas = <HTMLCanvasElement> document.getElementById(this.draft.id.toString());
    this.cx = this.canvas.getContext("2d");
    this.canvas.width = this.draft.warps * this.scale;
    this.canvas.height = this.draft.wefts * this.scale;
    this.size.w = this.draft.warps * this.scale;
    this.size.h = this.draft.wefts * this.scale;
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
  //   this.size.w = bounds.width;
  //   this.size.h = bounds.height;
  //   this.dynamic_size = this.size;
  
  // }




  public filterActionChange(event: any){
    this.filter = event;

  }

  public computeFilter(a: boolean, b: boolean):boolean{


    if(this.filter == 'or'){
      if(a === null) return b;
      if(b === null) return a;
      return (a || b);
    }else if(this.filter ==="and"){
      if(a === null || b === null) return null;
      return (a && b)
    }else if(this.filter === "neq"){

      if(a === null) return b;
      if(b === null) return a;
      return (a !== b);
    }else if(this.filter === "inv"){
      return (!b);
    }

  }

  /**
   * does this subdraft exist at this point?
   * @param p the absolute position of the coordinate (based on the screen)
   * @returns true/false for yes or no
   */
  public hasPoint(p:Point) : boolean{

      const endPosition = {
        x: this.topleft.x + this.size.w,
        y: this.topleft.y + this.size.h,
      };

      if(p.x < this.topleft.x || p.x > endPosition.x) return false;
      if(p.y < this.topleft.y || p.y > endPosition.y) return false;

    
    return true;

  }

/**
 * Takes an absolute coordinate and translates it to the row/column position in this subdraft
 * @param p the screen coordinate
 * @returns the row and column within the draft (i = row, j=col), returns -1 if out of bounds
 */
  public resolvePointToNdx(p:Point) : Interlacement{
    
    let i = Math.floor((p.y -this.topleft.y) / this.scale);
    let j = Math.floor((p.x - this.topleft.x) / this.scale);

    if(i < 0 || i >= this.draft.wefts) i = -1;
    if(j < 0 || j >= this.draft.warps) j = -1;

    return {i: i, j:j};

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

  setNewDraft(temp: Draft) {

    this.size.w = temp.warps * this.scale;
    this.size.h = temp.wefts * this.scale;
    this.draft.reload(temp);

  }

  setComponentPosition(point: any){
    this.topleft = point;
  }

  /**
   * manually sets the component size. While such an operation should be handled on init but there is a bug where this value is checked before the 
   * component runds its init sequence. Manually adding the data makes it possible for check for intersections on selection and drawing end.
   * @param width 
   * @param height 
   */
  setComponentSize(width: number, height: number){
    this.size.w = width;
    this.size.h = height;
  }


  /**
   * draw whetever is stored in the draft object to the screen
   * @returns 
   */
  drawDraft() {

    if(this.canvas === undefined) return;
   
    this.canvas.width = this.size.w;
    this.canvas.height = this.size.h;

    for (let i = 0; i < this.draft.visibleRows.length; i++) {
      for (let j = 0; j < this.draft.warps; j++) {
        let row:number = this.draft.visibleRows[i];
    
        let is_up = this.draft.isUp(row,j);
        let is_set = this.draft.isSet(row, j);
        if(is_set){
          this.cx.fillStyle = (is_up) ?  '#000000' :  '#ffffff';
          this.cx.fillRect(j*this.scale, i*this.scale, this.scale, this.scale);
        } else{
          this.cx.fillStyle =  '#DDDDDD' ;
          this.cx.fillRect(j*this.scale, i*this.scale, this.scale, this.scale);
        }
 
      }
    }
  }

  /**
   * gets the position of this elment on the canvas. Dyanic top left might be bigger due to scolling intersection
   * previews. Use static for all calculating of intersections, etc. 
   * @returns 
   */
  getTopleft(){
    return this.topleft;
  }


  snapToGrid(p: Point):Point{

    p.x = Math.floor(p.x / this.scale) * this.scale;
    p.y = Math.floor(p.y / this.scale) * this.scale;
    return p;

  }
  
  dragEnd($event: any) {
    this.moving = false;
    this.counter = 0;  
    this.onSubdraftDrop.emit({id: this.draft.id});
  }

  dragStart($event: any) {
    this.moving = true;
    this.counter = 0;  
    this.onSubdraftStart.emit({id: this.draft.id});
  }

  dragMove($event: any) {
    //position of pointer of the page
    const pointer = $event.pointerPosition;
   
    const relative = {
      x: pointer.x, 
      y: pointer.y - 64 //pointer position is relative to window, not this parent div.
    }

    const adj = this.snapToGrid(relative);
    this.topleft = adj;


    if(this.counter%1 === 0){
      this.onSubdraftMove.emit({id: this.draft.id});
      this.counter = 0;
    } 
    this.counter++;
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
