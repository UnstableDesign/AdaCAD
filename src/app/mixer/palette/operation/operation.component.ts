import { Subscription, fromEvent } from 'rxjs';
import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Bounds, DraftMap, Point } from '../../../core/model/datatypes';
import { Splice } from '../../operations/splice';
import { ConnectionComponent } from '../connection/connection.component';
import utilInstance from '../../../core/model/util';
import { Draft } from '../../../core/model/draft';

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
   outputs: Array<DraftMap>; //stores a list of components and drafts
   tooltip: string = "select drafts to input to this operation"
   zndx: number;
   disable_drag: boolean;
   scale: number;
   viewport: Bounds;

  constructor() { 
    this.outputs = [];
    this.selecting_connection = false;
  }

  ngOnInit() {

    if(this.name === 'splice'){
      this.op = new Splice();
    }

  }

  /**
   * calls the operations load function and returns if the inputs are valid
   * @param drafts 
   * @returns 
   */
  load(drafts: Array<Draft>):boolean{
    return this.op.load(drafts);
  }

  /**
   * performs the operation on the inputs added in load
   * @returns an Array linking the draft ids to compoment_ids
   */
  perform():Array<DraftMap>{
    const draft_map: Array<DraftMap> = [];
    const generated_drafts: Array<Draft> = this.op.perform();
    
    generated_drafts.forEach((draft, ndx) => {
      const compoment_id:number = (this.outputs[ndx] === undefined) ? -1 : this.outputs[ndx].component_id;
      draft_map.push({
        component_id: compoment_id,
        draft: draft
      });
    });
   return draft_map;
  }

  rescale(scale:number){

  }

  addOutput(dm: DraftMap){
    this.outputs.push(dm);
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
      id: this.id
    });

  }




  dragStart($event: any) {
   
  }

  dragMove($event: any) {
       //position of pointer of the page
       const pointer:Point = $event.pointerPosition;
       const relative:Point = utilInstance.getAdjustedPointerPosition(pointer, this.viewport);
       const adj:Point = utilInstance.snapToGrid(relative, this.scale);
       this.bounds.topleft = adj;  
  }


  dragEnd($event: any) {
   
  }
 

}
