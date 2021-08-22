import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-mixerview',
  templateUrl: './mixerview.component.html',
  styleUrls: ['./mixerview.component.scss']
})
export class MixerViewComponent implements OnInit {
  
  @Input() zoom;
  @Output() onZoomChange: any = new EventEmitter();


 constructor() { }
 
  ngOnInit() {
  }

  // viewChange(e:any){
  //   this.onViewChange.emit(e.value);
  // }

  zoomChange(e:any, source: string){
    e.source = source;
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


}
