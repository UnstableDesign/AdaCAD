import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit {
  
  @Input() zoom;
  @Input() view;
  @Input() view_modes;
  @Output() onViewChange: any = new EventEmitter();
  @Output() onZoomChange: any = new EventEmitter();


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

}
