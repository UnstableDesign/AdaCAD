import { Directive, OnInit } from '@angular/core';
import { Draft } from '../../../core/model/draft';
import { Point, Bounds, Interlacement } from '../../../core/model/datatypes';

@Directive({
  selector: 'app-marquee'
})


export class MarqueeComponent implements OnInit{

  id: number;
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



}
