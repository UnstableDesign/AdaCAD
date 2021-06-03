import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-flow',
  templateUrl: './flow.component.html',
  styleUrls: ['./flow.component.scss']
})
export class FlowComponent implements OnInit {
  
  @Output() onOperationAdded:any = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }


  addSplice(){
    this.onOperationAdded.emit('splice');
  }



}
