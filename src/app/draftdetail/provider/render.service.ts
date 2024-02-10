import { Injectable } from '@angular/core';
import {defaults} from '../../core/model/defaults'
import { Draft } from '../../core/model/datatypes';
import { wefts } from '../../core/model/drafts';
import { SystemsService } from '../../core/provider/systems.service';

@Injectable({
  providedIn: 'root'
})
export class RenderService {
// view_frames: boolean;

current_view: string;
  
view_front: boolean;

visibleRows: Array<number>; 

zoom: number;

select:{
  offset_x: {max: number, min: number},
  offset_y: {max: number, min: number};
}
  constructor(
    private ss: SystemsService
    ) { 
 //max values
   this.zoom = defaults.draft_detail_zoom; //zoom can range from .1 to 2
 // this.view_frames = view_frames;
  this.current_view = 'draft';
  this.view_front = true;



  //renders at min -  expands to max
//   this.base_cell = {
//   w: {max: 10, min: 0},
//   h: {max: 10, min: 0},
//   margin_fill_x: {max: 1, min: 0},
//   margin_fill_y: {max: 1, min: 0},
//   margin_clear_x: {max: 2, min: 0},
//   margin_clear_y: {max: 2, min: 0},
// };

//  this.select = {
//   offset_x: {max: 7, min: 0},
//   offset_y: {max: 7, min: 0}
//  }
  }



  loadNewDraft(draft: Draft){

    this.visibleRows = [];
    for(let i = 0; i < wefts(draft.drawdown); i++){
      this.visibleRows[i] =i;
    }
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

  /**SET DEFAULT CELL SIZE */
  getCellDims(type: string){

    return {
      x: 0,
      y: 0,
      w: defaults.draft_detail_cell_size,
      h: defaults.draft_detail_cell_size
    };



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
