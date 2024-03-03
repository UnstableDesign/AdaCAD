import { Injectable } from '@angular/core';
import { defaults } from '../model/defaults';

@Injectable({
  providedIn: 'root'
})
export class ZoomService {
  //current zoom scale
  

  num_steps: number = 15;
  zoom_min: number = .2;
  zoom_step: number = .004;
  zoom_table: Array<number> = [];

  zoom_table_ndx_mixer: number = defaults.zoom_ndx_mixer;
  zoom_table_ndx_editor: number = defaults.zoom_ndx_editor;


  constructor() { 


    for(let i = 0; i < this.num_steps; i++){
      const raw = this.zoom_min + this.zoom_step*(i*i);
      this.zoom_table.push(this.manageZoomRounding(raw));
    }
  }

  getZoomMax(): number{
    return this.zoom_table[this.zoom_table.length -1];
  }

  manageZoomRounding(val: number) : number {
    // if(val >= 1) return Math.floor(val);
    return Math.round(val * 1000) / 1000; 
  }


  zoomInMixer(){
      this.zoom_table_ndx_mixer++;
      if(this.zoom_table_ndx_mixer >= this.zoom_table.length){
        this.zoom_table_ndx_mixer = this.zoom_table.length;
      }
    }

  zoomInEditor(){
    this.zoom_table_ndx_editor++;
    if(this.zoom_table_ndx_editor >= this.zoom_table.length){
      this.zoom_table_ndx_editor = this.zoom_table.length;
    }
  }


  
  zoomOutMixer(){
    this.zoom_table_ndx_mixer--;
    if(this.zoom_table_ndx_mixer < 0){
      this.zoom_table_ndx_mixer = 0;
    }
  }

  zoomOutEditor(){
    this.zoom_table_ndx_editor--;
    if(this.zoom_table_ndx_editor < 0){
      this.zoom_table_ndx_editor = 0;
    }
  }
   
  
  /**
   * set zoom takes a number representing the scale of the content to the window and matches it to the 
   * closest value in the predefined sets of values
   * @param val 
   */
  setEditorIndexFromZoomValue(zoom: number){

    let closest = this.zoom_table.reduce((acc, val, ndx) => {
      let diff = zoom - val;
      if(diff > 0 && diff < acc.min) return {min: diff, ndx: ndx}
      else return acc;

    }, {min: 1000000, ndx: 0})


    this.zoom_table_ndx_editor =  closest.ndx;

  }

  setMixerIndexFromZoomValue(zoom: number){

    let closest = this.zoom_table.reduce((acc, val, ndx) => {
      let diff = zoom - val;
      if(diff > 0 && diff < acc.min) return {min: diff, ndx: ndx}
      else return acc;

    }, {min: 1000000, ndx: 0})


    this.zoom_table_ndx_mixer=  closest.ndx;

  }

  setZoomIndexOnMixer(ndx: number){
    if(ndx >= 0 && ndx < this.zoom_table.length)
    this.zoom_table_ndx_mixer = ndx;
 }

  setZoomIndexOnEditor(ndx: number){
    if(ndx >= 0 && ndx < this.zoom_table.length)
    this.zoom_table_ndx_editor = ndx;
  }

  getMixerZoom(){
    return this.zoom_table[this.zoom_table_ndx_mixer];
  }

  getEditorZoom(){
    return this.zoom_table[this.zoom_table_ndx_editor];
  }



  


}
