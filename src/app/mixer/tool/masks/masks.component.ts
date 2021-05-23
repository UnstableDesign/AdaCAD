import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-masks',
  templateUrl: './masks.component.html',
  styleUrls: ['./masks.component.scss']
})
export class MasksComponent implements OnInit {
  
  @Output() onMask: any = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  maskEvent(e, id) {
    var obj: any = {};
    obj.id = id;
    this.onMask.emit(obj);
  }

}
