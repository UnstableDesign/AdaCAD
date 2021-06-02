import { Directive, OnInit } from '@angular/core';
import { Draft } from '../../../core/model/draft';
import { Point, Bounds, Interlacement } from '../../../core/model/datatypes';

@Directive({
  selector: 'app-selection'
})


export class SelectionComponent implements OnInit{


  draft: Draft = new Draft({name: "selection"});

  bounds:Bounds = {
    topleft: {x: 0, y:0},
    width: 0,
    height: 0
  }

  start:Interlacement = {i: 0, j:0, si: 0};
  active = false;
  scale: number; 
  filter = "or"

  ngOnInit(){
    console.log(this.draft.id);
    console.log("created directive selection");
  }

  public getDraftId(){
    return this.draft.id;
  }


  public setPositionAndSize(bounds: Bounds){
    this.bounds  = bounds;
  }

      /**
   * gets the position of this elment on the canvas represented as an interlacement based on this components scale
   * @returns Interlacement describing the topleft cell
   */
    getTopleftAsInterlacement(): Interlacement{
        return {i: this.bounds.topleft.y / this.scale, j: this.bounds.topleft.x / this.scale, si: null};
    }
  
    /**
     * represents width as j component and height as i component
     * @returns Interlacement describing the width and height
     */
    getBoundsAsInterlacement(): Interlacement{
          return {i: this.draft.warps, j:  this.draft.wefts, si: null};
    }



}
