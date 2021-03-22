import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit {
  
  @Input() collapsed;
  @Input() zoom;
  @Input() view;
  @Input() view_modes;
  @Input() warp_systems;
  @Input() weft_systems;
  @Output() onViewChange: any = new EventEmitter();
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
  
 visibleButton(id, visible, type) {
    if(type == "weft"){
      if (visible) {
        this.onShowWarpSystem.emit({systemId: id});
      } else {
        this.onHideWarpSystem.emit({systemId: id});
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
