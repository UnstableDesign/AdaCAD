import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { OperationService } from '../../provider/operation.service';

@Component({
  selector: 'app-flow',
  templateUrl: './flow.component.html',
  styleUrls: ['./flow.component.scss']
})
export class FlowComponent implements OnInit {
  
  @Output() onOperationAdded:any = new EventEmitter();

  constructor(private ops: OperationService) { }

  ngOnInit() {
  }


  addOp(name: string){
    this.onOperationAdded.emit(name);
  }



}
