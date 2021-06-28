import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-weaverview',
  templateUrl: './weaverview.component.html',
  styleUrls: ['./weaverview.component.scss']
})
export class WeaverViewComponent implements OnInit {
  
  @Input() zoom;
  @Input() view;
  @Input() front;
  @Input() view_modes;
  @Input() warp_systems;
  @Input() weft_systems;
  @Output() onViewChange: any = new EventEmitter();
  @Output() onViewFront: any = new EventEmitter();
  @Output() onZoomChange: any = new EventEmitter();
  @Output() onCreateWarpSystem: any = new EventEmitter();
  @Output() onShowWarpSystem: any = new EventEmitter();
  @Output() onHideWarpSystem: any = new EventEmitter();
  @Output() onCreateWeftSystem: any = new EventEmitter();
  @Output() onShowWeftSystem: any = new EventEmitter();
  @Output() onHideWeftSystem: any = new EventEmitter();


 constructor() { }
 
  ngOnInit() {
  }

  viewChange(e:any){
    this.onViewChange.emit(e.value);
  }

  zoomChange(e:any, source: string){
    e.source = source;
    this.onZoomChange.emit(e);
  }

  viewFront(e:any, value:any, source: string){
    console.log("value", value, "source", source);
    e.source = source;
    e.value = value;
    this.onViewFront.emit(e);
  }
  
 visibleButton(id, visible, type) {
    console.log("called", id, visible, type);
    if(type == "weft"){
      if (visible) {
        this.onShowWeftSystem.emit({systemId: id});
      } else {
        this.onHideWeftSystem.emit({systemId: id});
      }
    }else{
      if (visible) {
        this.onShowWarpSystem.emit({systemId: id});
      } else {
        this.onHideWarpSystem.emit({systemId: id});
      }
    }

  }


}
