import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Bounds, DraftMap, Point } from '../../../core/model/datatypes';
import utilInstance from '../../../core/model/util';
import { Draft } from '../../../core/model/draft';
import { OperationService, Operation } from '../../provider/operation.service';
import { OpHelpModal } from '../../modal/ophelp/ophelp.modal';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Form, FormControl } from '@angular/forms';

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

   active_connection: boolean = false

   selecting_connection: boolean;

   loaded: boolean = false;

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

   loaded_inputs: Array<number> = [];

   op_inputs: Array<FormControl> = [];
   
   has_connections_in: boolean = false;

  constructor(private operations: OperationService, private dialog: MatDialog) { 
    this.outputs = [];
    this.selecting_connection = false;
  }

  ngOnInit() {

    const center: Point = {
      x: this.viewport.topleft.x + this.viewport.width/2,
      y: this.viewport.topleft.y + this.viewport.height/2
    }

    if(this.bounds.topleft.x == 0 && this.bounds.topleft.y == 0) this.setPosition(center);
    this.op = this.operations.getOp(this.name);


    this.op.params.forEach((param, ndx) => {
      const value = (this.loaded) ? this.loaded_inputs[ndx] : param.value;
      this.op_inputs.push(new FormControl(value));
    });

  }

  ngAfterViewInit(){
    if(!this.loaded) this.onOperationParamChange.emit({id: this.id});
  }


  setOutputs(dms: Array<DraftMap>){
      this.outputs = dms.slice();

  }



  setBounds(bounds:Bounds){
    this.bounds.topleft = {x: bounds.topleft.x, y: bounds.topleft.y},
    this.bounds.width = bounds.width;
    this.bounds.height = bounds.height;
  }

  setPosition(pos: Point){
    this.bounds.topleft =  {x: pos.x, y:pos.y};
  }


  /**
   * performs the operation on the inputs added in load
   * @returns an Array linking the draft ids to compoment_ids
   */
  perform(inputs: Array<Draft>):Array<DraftMap>{
    if(inputs.length > 0) this.has_connections_in = true;
    else this.has_connections_in = false;

    this.op = this.operations.getOp(this.name);

    const draft_map: Array<DraftMap> = [];
    const generated_drafts: Array<Draft> = this.op.perform(inputs, this.op_inputs.map(fc => fc.value));
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


    const change = scale / this.scale;
    
    this.bounds.topleft = {x: this.bounds.topleft.x * change, y: this.bounds.topleft.y * change};

    if(this.outputs.length == 1){
      this.bounds.width = Math.max(200, this.outputs[0].draft.warps * scale);
    }else{
      this.bounds.width = 200;
    }
    this.scale = scale;

  }

  drawForPrint(canvas, cx, scale){
    if(canvas === undefined) return;

    cx.fillStyle = "#ffffff";
    cx.fillRect(this.bounds.topleft.x, this.bounds.topleft.y, this.bounds.width, this.bounds.height); 

    cx.fillStyle = "#666666";
    cx.font = "20px Verdana";

    let datastring: string = this.name+" // ";

    this.op.params.forEach((p, ndx) => {
      datastring = datastring + p.name +": "+ this.op_inputs[ndx] + ", ";
    });

    cx.fillText(datastring,this.bounds.topleft.x + 5, this.bounds.topleft.y+25 );


  }


  unsetActiveConnection(){
    this.selecting_connection = false;
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

    this.onSelectInputDraft.emit({
      event: event,
      id: this.id
    });

  }

  openHelpDialog() {
    const dialogRef = this.dialog.open(OpHelpModal, {
      data: {
        name: this.op.name,
        op: this.op
      }
    });

  }

  onParamChange(){
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
