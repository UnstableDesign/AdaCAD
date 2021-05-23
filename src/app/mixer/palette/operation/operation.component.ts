import { Component, Input, OnInit } from '@angular/core';
//import { Operation } from 'src/app/core/ops/operation';
import { ConnectionComponent } from '../connection/connection.component';

@Component({
  selector: 'app-operation',
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.scss']
})
export class OperationComponent implements OnInit {

  // @Input inbound: Array<ConnectionComponent>;
  // @Input outbound:  Array<ConnectionComponent>;
  // @Input class: Operation;
 
  //allowable types 

  constructor() { }

  ngOnInit() {

  }

}
