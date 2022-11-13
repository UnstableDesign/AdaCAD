import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ZoomService {
  //current zoom scale
  zoom: number = 5; //this is the default
  zoom_max: number = 9;
  zoom_min: number = .1;
  zoom_step: number;


  constructor() { 

    this.zoom_step = (this.zoom_max - this.zoom_min) / 100;

  }


  zoomIn(){
    const new_zoom = this.zoom + 10*this.zoom_step;
      if(new_zoom <= this.zoom_max){
        this.zoom = new_zoom;
      }
    }
  
  
    zoomOut(){
      const new_zoom = this.zoom - 10*this.zoom_step;
      if(new_zoom>= this.zoom_min){
        this.zoom = new_zoom;
      } 
    
     }
   
  
  setZoom(val: number){
    if(val >= this.zoom_min && val <= this.zoom_max){
      this.zoom = val;
    }

  }
  


}
