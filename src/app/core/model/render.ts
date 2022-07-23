import { SystemsService } from "../provider/systems.service";
import { Draft } from "./datatypes";
import { wefts } from "./drafts";

/**
 * Definition of render object.
 * @class
 */
export class Render {

 // view_frames: boolean;

  current_view: string;
  
  view_front: boolean;
  
  visibleRows: Array<number>; 

  zoom: number;

  base_cell: {
    w: {max: number, min: number},
    h: {max: number, min: number},
    margin_fill_x: {max: number, min: number},
    margin_fill_y: {max: number, min: number},
    margin_clear_x: {max: number, min: number},
    margin_clear_y: {max: number, min: number},
  };

  select:{
    offset_x: {max: number, min: number},
    offset_y: {max: number, min: number};
  }

  constructor(view_frames:boolean, draft: Draft, private ss: SystemsService) {

    //max values
    this.zoom = 1;
   // this.view_frames = view_frames;
    this.current_view = 'pattern';
    this.view_front = true;

    this.visibleRows = [];
    for(let i = 0; i < wefts(draft.drawdown); i++){
      this.visibleRows[i] =i;
    }


    //renders at min -  expands to max
    this.base_cell = {
    w: {max: 10, min: 0},
    h: {max: 10, min: 0},
    margin_fill_x: {max: 1, min: 0},
    margin_fill_y: {max: 1, min: 0},
    margin_clear_x: {max: 2, min: 0},
    margin_clear_y: {max: 2, min: 0},
  };

   this.select = {
    offset_x: {max: 7, min: 0},
    offset_y: {max: 7, min: 0}
   }

  }

  // setPositions(
  //   drawdown: HTMLCanvasElement, 
  //   threading: HTMLCanvasElement,
  //   treadling: HTMLCanvasElement,
  //   tieups: HTMLCanvasElement,
  //   wesy: HTMLCanvasElement,
  //   wema: HTMLCanvasElement,
  //   wasy: HTMLCanvasElement,
  //   wama: HTMLCanvasElement,
  //   div_wesy: HTMLElement,
  //   div_wasy: HTMLElement){

  //   this.positions_frames.push({
  //     name: 'drawdown',
  //     top: 0,
  //     left: 0
  //   }
  //   );

  // }

  interpolate(base: any){
    // console.log("interp", base);
    //   var r1 = base.max - base.min; 
    //   if(r1 == 0) return 0;
    //  //console.log("i", r1, this.zoom/100, base.min);

    //  var diff = this.zoom - 50; //difference from base zoom

    //   return r1 * (diff/50) + base.min;


  }


  getTextInterval(){
    if(this.zoom > 1.75) return 1;
    if(this.zoom > 1.5) return 2;
    if(this.zoom > 1.25) return 4;
    if(this.zoom > 1) return 5;
    if(this.zoom > .75) return 8; 
    if(this.zoom > .5) return 10;
    if(this.zoom > .25) return 12;
    return 15;
  }

  /**
   * given the ndx, get the next visible row or -1 if there isn't a next
   * @param ndx 
   */
  getNextVisibleRow(ndx: number) : number {

    const next: number = ndx ++;
    if(next >= this.visibleRows.length) return -1;

    return this.visibleRows[next];

  }

  getCellDims(type: string){

    return {
      x: 0,
      y: 0,
      w: 10,
      h: 10
    };

    // return {
    //   x: this.getOffset(type+"_x"),
    //   y: this.getOffset(type+"_y"),
    //   w: this.base_cell.w.min,
    //   h: this.base_cell.h.min
    // };

  }

  // getInterpolationDims(type: string){
  //   var x = this.interpolate({max: this.getOffset(type+"_x"), min: this.getOffset(type+"_x")});
  //   var y = this.interpolate({max: this.getOffset(type+"_y"), min: this.getOffset(type+"_y")});


  //   return {
  //     x: x,
  //     y: y,
  //     w: this.interpolate({max: this.base_cell.w.max - (x*2), min: this.base_cell.w.min}),
  //     h: this.interpolate({max: this.base_cell.h.max - (y*2), min: this.base_cell.h.min})
  //   }

  // }

  setZoom(z: number){
    this.zoom = z;
  }

  getZoom(){
    return this.zoom;
  }

   zoomOut(){
    this.zoom -= 10; 
    if(this.zoom < 1) this.zoom = 1;
  }

  zoomIn(){
    this.zoom += 10; 
    if(this.zoom > 100) this.zoom = 100;

  }

  private getOffset(type) {
    if(type ==="select_x") return this.select.offset_x.min;
    if(type ==="select_y") return this.select.offset_y.min;
    if(type ==="base_clear_x") return this.base_cell.margin_clear_x.min;
    if(type ==="base_clear_y") return this.base_cell.margin_clear_y.min;
    if(type ==="base_fill_x") return this.base_cell.margin_fill_x.min;
    if(type ==="base_fill_y") return this.base_cell.margin_fill_y.min;
    else return 0;
  }


  isYarnBasedView(): boolean{
    return (this.current_view == 'visual' || this.current_view == 'yarn');
  }

  getCurrentView(): string{
    return this.current_view;
  }

  setCurrentView(view:string){
    this.current_view = view;
  }

  isFront(){
    return this.view_front;
  }

  setFront(value:boolean){
    return this.view_front = value;
  }

  updateVisible(draft: Draft) {

    this.visibleRows = 
      draft.rowSystemMapping.map((val, ndx) => {
        return (this.ss.weftSystemIsVisible(val)) ? ndx : -1;  
      })
      .filter(el => el !== -1);

  }


}
