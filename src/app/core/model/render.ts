import { Draft } from "./draft";

/**
 * Definition of render object.
 * @class
 */
export class Render {

  view_frames: boolean;
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

  constructor(view_frames:boolean, draft: Draft) {

    //max values
    this.zoom = 50;
    this.view_frames = view_frames;
    this.current_view = 'pattern';
    this.view_front = true;

    this.visibleRows = [];
    for(let i = 0; i < draft.wefts; i++){
      this.visibleRows[i] =i;
    }


    //renders at min -  expands to max
    this.base_cell = {
    w: {max: 20, min: 10},
    h: {max: 20, min: 10},
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

  interpolate(base: any){
    // console.log("interp", base);
      var r1 = base.max - base.min; 
      if(r1 == 0) return 0;
     //console.log("i", r1, this.zoom/100, base.min);

     var diff = this.zoom - 50; //difference from base zoom

      return r1 * (diff/50) + base.min;


  }


  getTextInterval(){
    if(this.zoom > 90) return 1;
    if(this.zoom > 85) return 2;
    if(this.zoom > 80) return 4;
    if(this.zoom > 75) return 5;
    if(this.zoom > 60) return 8; 
    if(this.zoom > 50) return 10;
    if(this.zoom > 45) return 12;
    if(this.zoom > 40) return 15;
    if(this.zoom > 35) return 20;
    if(this.zoom > 30) return 30; 
    if(this.zoom > 25) return 50; 
    return 100;
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
      x: this.getOffset(type+"_x"),
      y: this.getOffset(type+"_y"),
      w: this.base_cell.w.min,
      h: this.base_cell.h.min
    };

  }

  getInterpolationDims(type: string){
    var x = this.interpolate({max: this.getOffset(type+"_x"), min: this.getOffset(type+"_x")});
    var y = this.interpolate({max: this.getOffset(type+"_y"), min: this.getOffset(type+"_y")});


    return {
      x: x,
      y: y,
      w: this.interpolate({max: this.base_cell.w.max - (x*2), min: this.base_cell.w.min}),
      h: this.interpolate({max: this.base_cell.h.max - (y*2), min: this.base_cell.h.min})
    }

  }

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

  toggleViewFrames(){
    this.view_frames = !this.view_frames;
  }

  showingFrames():boolean{
    return this.view_frames;
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
    var i = 0;
    var systems = [];
    var visible = [];


    for (i = 0; i < draft.weft_systems.length; i++) {
      systems.push(draft.weft_systems[i].visible);
    }

    for (i = 0; i< draft.rowSystemMapping.length; i++) {
      var show = systems[draft.rowSystemMapping[i]];

      if (show) {
        visible.push(i);
      }
    }

    this.visibleRows = visible;
  }


}
