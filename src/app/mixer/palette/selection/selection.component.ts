import { Directive, OnInit } from '@angular/core';


interface Point {
  x: number;
  y: number;
}




@Directive({
  selector: 'app-selection'
})


export class SelectionComponent implements OnInit{


  draft = {
    id: "selection"
  };

  start = {i: 0, j:0};
  active = false;
  topleft: Point = {x: 0, y:0};
  scale: number; 
  size = {w: 0, h: 0};
  filter = "marquee"

  ngOnInit(){
    console.log(this.draft.id);
    console.log("created directive selection");
  }

  public getDraftId(){
    return this.draft.id;
  }


  public setPositionAndSize(bounds: any){
    this.topleft = bounds.topleft;
    this.size.w = bounds.width;
    this.size.h = bounds.height;
  }



}
