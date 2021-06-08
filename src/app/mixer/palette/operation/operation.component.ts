import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Bounds, DraftMap, Point } from '../../../core/model/datatypes';
import utilInstance from '../../../core/model/util';
import { Draft } from '../../../core/model/draft';
import { OperationService, Operation } from '../../provider/operation.service';

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
   @Output() onOperationMove = new EventEmitter <any>(); 
   @Output() onOperationParamChange = new EventEmitter <any>(); 


   selecting_connection: boolean;
   outputs: Array<DraftMap>; //stores a list of components and drafts
   tooltip: string = "select drafts to input to this operation"
   disable_drag: boolean;
   bounds: Bounds = {
     topleft: {x: 0, y:0},
     width: 200,
     height: 30
   };
   active_connection_order: number = 0;
   op:Operation;
   op_inputs: Array<number> = [];

  constructor(private operations: OperationService) { 
    this.outputs = [];
    this.selecting_connection = false;

  }

  ngOnInit() {
    this.bounds.topleft = this.viewport.topleft;
    this.op = this.operations.getOp(this.name);
    this.op_inputs = this.op.params.map(param => param.value);
  }

  ngAfterViewInit(){
    console.log("after view", this.op_inputs);
    this.onOperationParamChange.emit({id: this.id});
  }

  updatePositionAndSize(id: number, topleft: Point, width: number, height: number){    
  
    this.bounds.topleft  = topleft;
    this.bounds.topleft.y = topleft.y - this.bounds.height
    
  }

  setPosition(pos: Point){
    this.bounds.topleft = pos;
  }


  /**
   * performs the operation on the inputs added in load
   * @returns an Array linking the draft ids to compoment_ids
   */
  perform(inputs: Array<Draft>):Array<DraftMap>{
    this.op = this.operations.getOp(this.name);

    const draft_map: Array<DraftMap> = [];
    const generated_drafts: Array<Draft> = this.op.perform(inputs, this.op_inputs);
    generated_drafts.forEach((draft, ndx) => {
      const component_id:number = (this.outputs[ndx] === undefined) ? -1 : this.outputs[ndx].component_id;

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
   * set's the width to at least 200, but w if its large
   */
  setWidth(w:number){
    this.bounds.width = (w > 200) ? w : 200;
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

  maxInputs():number{
    return this.op.max_inputs;
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

  onParamChange(){
    console.log(this.op.params);
    this.onOperationParamChange.emit({id: this.id});
  }




  dragStart($event: any) {
   
  }

  dragMove($event: any) {
       //position of pointer of the page
       const pointer:Point = $event.pointerPosition;
       const relative:Point = utilInstance.getAdjustedPointerPosition(pointer, this.viewport);
       const adj:Point = utilInstance.snapToGrid(relative, this.scale);
       this.bounds.topleft = adj;  
       this.onOperationMove.emit({id: this.id, point: adj});

  }


  dragEnd($event: any) {
   
  }
 

}
