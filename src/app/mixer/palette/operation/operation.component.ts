import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Bounds, DraftMap, Point } from '../../../core/model/datatypes';
import { Splice } from '../../operations/splice';
import utilInstance from '../../../core/model/util';
import { Draft } from '../../../core/model/draft';
import { ScaleBand } from 'd3-scale';

@Component({
  selector: 'app-operation',
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.scss']
})
export class OperationComponent implements OnInit {

   @Input() id: number; //generated from the tree service
   @Input() name: string;
   @Input() viewport: Bounds;
   @Input() scale: number;
   @Input() zndx: number;
   @Output() onSelectInputDraft:any = new EventEmitter()


   selecting_connection: boolean;
   op: any;
   outputs: Array<DraftMap>; //stores a list of components and drafts
   tooltip: string = "select drafts to input to this operation"
   disable_drag: boolean;
   bounds: Bounds = {
     topleft: {x: 0, y:0},
     width: 100,
     height: 30
   };
   active_connection_order: number = 0;


  constructor() { 
    this.outputs = [];
    this.selecting_connection = false;
  }

  ngOnInit() {

    this.bounds.topleft = this.viewport.topleft;

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
    console.log("outputs are", this.outputs);
    generated_drafts.forEach((draft, ndx) => {
      const component_id:number = (this.outputs[ndx] === undefined) ? -1 : this.outputs[ndx].component_id;
      console.log("found id", component_id);

      draft_map.push({
        component_id: component_id,
        draft: draft
      });
    });

   return draft_map;
  }

  rescale(scale:number){

  }

  /**
   * set's the width to at least 100, but w if its large
   */
  setWidth(w:number){
    this.bounds.width = (w > 100) ? w : 100;
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
