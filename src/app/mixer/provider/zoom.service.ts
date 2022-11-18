import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ZoomService {
  //current zoom scale
  zoom: number; //this is the default
  num_steps: number = 15;
  zoom_min: number = .1;
  zoom_step: number = .05;
  zoom_table: Array<number> = [];
  zoom_table_ndx: number;


  constructor() { 

    //create a table that stores each zoom value, which increments exponentally as it gets larger
    this.zoom_table_ndx = Math.floor(this.num_steps/2);
    
    for(let i = 0; i < this.num_steps; i++){
      const raw = this.zoom_min + this.zoom_step*(i*i);
      this.zoom_table.push(this.manageZoomRounding(raw));
    }
    this.zoom = this.zoom_table[this.zoom_table_ndx];

  }

  getZoomMax(): number{
    return this.zoom_table[this.zoom_table.length -1];
  }

  manageZoomRounding(val: number) : number {
    // if(val >= 1) return Math.floor(val);
    return Math.round(val * 1000) / 1000; 
  }


  zoomIn(){
      this.zoom_table_ndx++;
      if(this.zoom_table_ndx < this.zoom_table.length){
       this.zoom =  this.zoom_table[this.zoom_table_ndx];
      }else{
        this.zoom_table_ndx = this.zoom_table.length;
      }
    }
  
  
    zoomOut(){
      this.zoom_table_ndx--;
      if(this.zoom_table_ndx >= 0){
       this.zoom = this.zoom_table[this.zoom_table_ndx];
      }else{
        this.zoom_table_ndx = 0;
      }
     }
   
  
  setZoom(val: number){
    if(val >= this.zoom_min && val <= this.zoom_table.length){
       this.zoom_table_ndx = val;
       this.zoom =  this.zoom_table[this.zoom_table_ndx];
    }

  }
  


}
