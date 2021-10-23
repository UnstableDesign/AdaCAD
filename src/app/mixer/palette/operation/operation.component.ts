import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Bounds, DesignMode, DraftMap, Interlacement, Point } from '../../../core/model/datatypes';
import utilInstance from '../../../core/model/util';
import { Draft } from '../../../core/model/draft';
import { OperationService, Operation } from '../../provider/operation.service';
import { OpHelpModal } from '../../modal/ophelp/ophelp.modal';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Form, FormControl } from '@angular/forms';
import { ViewportService } from '../../provider/viewport.service';
import { TreeService } from '../../provider/tree.service';
import { DesignmodesService } from '../../../core/provider/designmodes.service';

@Component({
  selector: 'app-operation',
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.scss']
})
export class OperationComponent implements OnInit {

   @Input() id: number; //generated from the tree service
   @Input() name: string;
   @Input() scale: number;
   @Input() default_cell: number;
   @Input() zndx: number;
   @Output() onConnectionRemoved = new EventEmitter <any>();
   @Output() onConnectionMove = new EventEmitter <any>();
   @Output() onOperationMove = new EventEmitter <any>(); 
   @Output() onOperationParamChange = new EventEmitter <any>(); 
   @Output() deleteOp = new EventEmitter <any>(); 
   @Output() duplicateOp = new EventEmitter <any>(); 
   @Output() onInputAdded = new EventEmitter <any> ();

    /**
    * reference to top, left positioin as absolute interlacement
    */
   interlacement:Interlacement;

  /**
  * reference to the height of this element in units of the base cell 
  */
  base_height:number;

  /**
  * flag to tell if this is being from a loaded from a saved file
  */
   loaded: boolean = false;

  /**
    * flag to tell if this has been duplicated from another operation
    */
   duplicated: boolean = false;


    /**
    * stores a list of components and drafts generated as outputs 
    */
   outputs: Array<DraftMap>; 
   
   tooltip: string = "select drafts to input to this operation"
  
   disable_drag: boolean;
 
   bounds: Bounds = {
     topleft: {x: 0, y:0},
     width: 200,
     height: 30
   };
   
   op:Operation;

   //for input params form control
   loaded_inputs: Array<number> = [];

   //these are the input parameters
   op_inputs: Array<FormControl> = [];

  // has_connections_in: boolean = false;
   subdraft_visible: boolean = true;

  constructor(
    private operations: OperationService, 
    private dialog: MatDialog,
    private viewport: ViewportService,
    private tree: TreeService,
    private dm: DesignmodesService) { 
    this.outputs = [];



  }

  ngOnInit() {

    this.op = this.operations.getOp(this.name);

    this.op.params.forEach((param, ndx) => {
      const value = (this.loaded || this.duplicated) ? this.loaded_inputs[ndx] : param.value;
      this.op_inputs.push(new FormControl(value));
    });

    const tl: Point = this.viewport.getTopLeft();
   
    if(this.bounds.topleft.x == 0 && this.bounds.topleft.y == 0) this.setPosition(tl);
    else  this.interlacement = utilInstance.resolvePointToAbsoluteNdx(this.bounds.topleft, this.scale);

    this.base_height =  30 + 40 * this.op_inputs.length
    this.bounds.height = this.base_height;



  }

  ngAfterViewInit(){
    this.rescale(this.scale);
    if(!this.loaded) this.onOperationParamChange.emit({id: this.id});
    
  }


  setOutputs(dms: Array<DraftMap>){
      this.outputs = dms.slice();

  }



  setBounds(bounds:Bounds){
    this.bounds.topleft = {x: bounds.topleft.x, y: bounds.topleft.y},
    this.bounds.width = bounds.width;
    this.bounds.height = bounds.height;
    this.interlacement = utilInstance.resolvePointToAbsoluteNdx(bounds.topleft, this.scale);
  }

  setPosition(pos: Point){
    this.bounds.topleft =  {x: pos.x, y:pos.y};
    this.interlacement = utilInstance.resolvePointToAbsoluteNdx(pos, this.scale);
  }


  /**
   * performs the operation on the inputs added in load
   * @returns an Array linking the draft ids to compoment_ids
   */
  perform(inputs: Array<Draft>):Promise<Array<DraftMap>>{


    this.op = this.operations.getOp(this.name);
    return this.op.perform(inputs, this.op_inputs.map(fc => fc.value))
      .then(generated_drafts => {
        return generated_drafts.map((draft, ndx) => ({
            component_id: (this.outputs[ndx] === undefined) ? -1 : this.outputs[ndx].component_id,
            draft
          })
      )
        })
  }

  rescale(scale:number){


    this.scale = scale;
    const zoom_factor = this.scale / this.default_cell;
    const container: HTMLElement = document.getElementById('scale-'+this.id);
    container.style.transformOrigin = 'top left';
    container.style.transform = 'scale(' + zoom_factor + ')';


    this.bounds.topleft = {x: this.interlacement.j * this.scale, y: this.interlacement.i * this.scale};
    //this.bounds.height = this.bounds.height * change;

    if(this.outputs.length == 1){
      this.bounds.width = Math.max(200, this.outputs[0].draft.warps * this.scale);
    }else{
      this.bounds.width = 200;
    }

    this.bounds.height = this.base_height * zoom_factor;

  }

  drawForPrint(canvas, cx, scale){
    if(canvas === undefined) return;

    cx.fillStyle = "#ffffff";
    cx.fillRect(this.bounds.topleft.x, this.bounds.topleft.y, this.bounds.width, this.bounds.height); 

    cx.fillStyle = "#666666";
    cx.font = this.scale*2+"px Verdana";

    let datastring: string = this.name+" // ";

    this.op.params.forEach((p, ndx) => {
      datastring = datastring + p.name +": "+ this.op_inputs[ndx].value + ", ";
    });

    cx.fillText(datastring,this.bounds.topleft.x + 5, this.bounds.topleft.y+25 );


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
    this.disableDrag();
    this.onInputAdded.emit(this.id);
  }


  removeConnectionTo(sd_id: number){
    this.onConnectionRemoved.emit({from: sd_id, to: this.id});
  }

  openHelpDialog() {
    const dialogRef = this.dialog.open(OpHelpModal, {
      data: {
        name: this.op.name,
        op: this.op
      }
    });

  }

  onParamChange(id: number, value: number){
    console.log(value);
    this.op_inputs[id].setValue(value);
    this.onOperationParamChange.emit({id: this.id});
  }

  delete(){
    this.deleteOp.emit({id: this.id});
  }

  duplicate(){
    this.duplicateOp.emit({id: this.id});
  }



  dragStart($event: any) {
   
  }

  dragMove($event: any) {
       //position of pointer of the page
       const pointer:Point = $event.pointerPosition;
       const relative:Point = utilInstance.getAdjustedPointerPosition(pointer, this.viewport.getBounds());
       const adj:Point = utilInstance.snapToGrid(relative, this.scale);
       this.bounds.topleft = adj;  
       this.interlacement = utilInstance.resolvePointToAbsoluteNdx(adj, this.scale);
       this.onOperationMove.emit({id: this.id, point: adj});

  }


  dragEnd($event: any) {
   
  }
 

}
