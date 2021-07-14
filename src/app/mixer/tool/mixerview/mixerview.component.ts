import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Bounds, Point } from '../../../core/model/datatypes';

@Component({
  selector: 'app-mixerview',
  templateUrl: './mixerview.component.html',
  styleUrls: ['./mixerview.component.scss']
})
export class MixerViewComponent implements OnInit {
  
  @Input() zoom;
  @Output() onZoomChange: any = new EventEmitter();
  @Output() onViewPortMove: any = new EventEmitter();

  local_view:Bounds;

  factor:number = 250/ 16384;

 constructor() { 
  this.local_view = {
    topleft: {x:0, y:0}, 
    width: 100, 
    height:100
  };
 }
 
  ngOnInit() {
   // console.log('viewport', this.local_view);

  }

  ngAfterViewInit() {
   
  }


  updateViewPort(data: any){
    const div:HTMLElement = data.elementRef.nativeElement;
    this.local_view.topleft = {
      x: div.scrollLeft / this.zoom * this.factor, 
      y: div.scrollTop / this.zoom * this.factor};
    this.local_view.width = div.clientWidth / this.zoom * this.factor;
    this.local_view.height = div.clientHeight / this.zoom * this.factor;
   // console.log(data, this.local_view);

  }

  updateViewPortFromZoom(){
    const div:Element = document.getElementById('scrollable-container').offsetParent;
    this.local_view.topleft = {
      x: div.scrollLeft/ this.zoom * this.factor, 
      y: div.scrollTop / this.zoom * this.factor};
    this.local_view.width = div.clientWidth / this.zoom * this.factor;
    this.local_view.height = div.clientHeight / this.zoom * this.factor;
   // console.log("update from zoom", this.zoom,  this.local_view)

  }


  // viewChange(e:any){
  //   this.onViewChange.emit(e.value);
  // }

  zoomChange(e:any, source: string){
    e.source = source;
    this.zoom = e.value;
    this.updateViewPortFromZoom();
    this.onZoomChange.emit(e);
  }

  // viewFront(e:any, value:any, source: string){
  //   console.log("value", value, "source", source);
  //   e.source = source;
  //   e.value = value;
  //   this.onViewFront.emit(e);
  // }
  
//  visibleButton(id, visible, type) {
//     console.log("called", id, visible, type);
//     if(type == "weft"){
//       if (visible) {
//         this.onShowWeftSystem.emit({systemId: id});
//       } else {
//         this.onHideWeftSystem.emit({systemId: id});
//       }
//     }else{
//       if (visible) {
//         this.onShowWarpSystem.emit({systemId: id});
//       } else {
//         this.onHideWarpSystem.emit({systemId: id});
//       }
//     }

//   }

dragEnd($event: any) {
  
}

dragStart($event: any) {

}

dragMove($event: any) {
  const factor: number = 250/ 16384;

  //position of pointer of the page
  const mouse_offset:Point = {x: $event.layerX, y: $event.layerY};
  const adjusted: Point = {x: mouse_offset.x / factor,y:mouse_offset.y / factor };
  
  //this.onZoomChange.emit(pointer);


}


}
