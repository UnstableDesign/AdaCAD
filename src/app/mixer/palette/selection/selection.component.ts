import { Directive, OnInit } from '@angular/core';
import { Point, Bounds, Interlacement } from '../../../core/model/point';

@Directive({
  selector: 'app-selection'
})


export class SelectionComponent implements OnInit{


  draft = {
    id: "selection"
  };

  bounds:Bounds = {
    topleft: {x: 0, y:0},
    width: 0,
    height: 0
  }

  start:Interlacement = {i: 0, j:0, si: 0};
  active = false;
  scale: number; 
  filter = "marquee"

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



}
