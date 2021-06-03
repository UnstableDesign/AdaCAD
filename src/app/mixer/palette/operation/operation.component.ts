import { Subscription, fromEvent } from 'rxjs';
import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Bounds } from '../../../core/model/datatypes';
import { Splice } from '../../operations/splice';
import { ConnectionComponent } from '../connection/connection.component';

@Component({
  selector: 'app-operation',
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.scss']
})
export class OperationComponent implements OnInit {

   @Input() id: number; //generated from the tree service
   @Input() bounds: Bounds;
   @Input() name: string;
   @Output() onSelectInputDraft:any = new EventEmitter()


   selecting_connection: boolean;
   op: any;
   inputs: Array<number>; //store draft Ids
   ouputs: Array<number>; //store draft Ids
   tooltip: string = "select drafts to input to this operation"
   zndx: number;
   disable_drag: boolean;

  constructor() { 
    this.inputs = [];
    this.ouputs = [];
    this.selecting_connection = false;
  }

  ngOnInit() {

    if(this.name === 'splice'){
      this.op = new Splice();
      this.inputs.push(-1);
    }

  }

  rescale(scale:number){
    
  }

  disableDrag(){
    this.disable_drag = true;
  }

  enableDrag(){
    this.disable_drag = false;
  }

  inputSelected(event: any, ndx: number){
    this.selecting_connection = true;
    this.disableDrag();
    console.log("input from ", event);

    this.onSelectInputDraft.emit({
      event: event,
      id: this.id,
      topleft: this.bounds.topleft
    });

  }




  dragStart($event: any) {
   
  }

  dragMove($event: any) {
    
  }
  dragEnd($event: any) {
   
  }
 

}
