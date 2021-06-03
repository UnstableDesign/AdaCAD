import { Subscription, fromEvent } from 'rxjs';
import { Component, HostListener, Input, OnInit } from '@angular/core';
import { Bounds } from '../../../../core/model/datatypes';
import { Splice } from '../../../operations/splice';
import { ConnectionComponent } from '../connection/connection.component';

@Component({
  selector: 'app-operation',
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.scss']
})
export class OperationComponent implements OnInit {

  
   @Input() bounds: Bounds;
   @Input() name: string;

    /**
   * Subscribes to move event after a touch event is started.
   * @property {Subscription}
   */
  moveSubscription: Subscription;



   selecting_connection: boolean;

   op: any;
   inputs: Array<number>; //store draft Ids
   ouputs: Array<number>; //store draft Ids
   
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

  disableDrag(){
    this.disable_drag = true;
  }

  enableDrag(){
    this.disable_drag = false;
  }

  inputSelected(event: any, ndx: number){
    console.log(event);
    this.selecting_connection = true;
    this.disableDrag();
    console.log("input from ", event);
    
    this.moveSubscription = 
    fromEvent(event.target, 'mousemove').subscribe(e => this.findConnection(e)); 

  }

  findConnection(event){
    console.log(event);

  }



  dragStart($event: any) {
   
  }

  dragMove($event: any) {
    
  }
  dragEnd($event: any) {
   
  }
  /**
 * Called when the mouse is up or leaves the boundary of the view
 * @param event 
 * @returns 
 */
   @HostListener('mouseleave', ['$event'])
   @HostListener('mouseup', ['$event'])
      private onEnd(event) {
 
          this.removeSubscription();
   }

  private removeSubscription() {    
    console.log("remove");
    if (this.moveSubscription) {
      this.moveSubscription.unsubscribe();
    }
  }


}
