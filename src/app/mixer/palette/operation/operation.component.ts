import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Bounds, DesignMode, DraftMap, Interlacement, Point } from '../../../core/model/datatypes';
import utilInstance from '../../../core/model/util';
import { OperationService, Operation, DynamicOperation } from '../../provider/operation.service';
import { OpHelpModal } from '../../modal/ophelp/ophelp.modal';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Form, FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ViewportService } from '../../provider/viewport.service';
import { OpNode, TreeService } from '../../provider/tree.service';
import { DesignmodesService } from '../../../core/provider/designmodes.service';
import { SubdraftComponent } from '../subdraft/subdraft.component';
import {ErrorStateMatcher} from '@angular/material/core';


/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}

@Component({
  selector: 'app-operation',
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.scss']
})
export class OperationComponent implements OnInit {

   @Input() id: number; //generated from the tree service
   @Input() name: string;


   @Input()
   get scale(): number { return this._scale; }
   set scale(value: number) {
     this._scale = value;
     this.rescale();
   }
   private _scale:number = 5;
 


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


  //   /**
  //   * stores a lit of the subdraft ids 
  //   */
  //  outputs: Array<number>;  
   
   tooltip: string = "select drafts to input to this operation"
  
   disable_drag: boolean = false;
 
   bounds: Bounds = {
     topleft: {x: 0, y:0},
     width: 200,
     height: 60
   };
   
   op:Operation | DynamicOperation;

   //for input params form control
   loaded_inputs: Array<number> = [];

   //these are the input parameters
   op_inputs: Array<FormControl> = [];


   //these are the drafts with any input parameters
   inlets: Array<FormControl> = [];


  // has_connections_in: boolean = false;
   subdraft_visible: boolean = true;

   is_dynamic_op: boolean = false;

   textValidate: any;

  constructor(
    private operations: OperationService, 
    private dialog: MatDialog,
    private viewport: ViewportService,
    public tree: TreeService,
    public dm: DesignmodesService) { 
    
      //this.outputs = [];
  
      this.textValidate = new MyErrorStateMatcher();

  }

  ngOnInit() {


    this.op = this.operations.getOp(this.name);
    this.is_dynamic_op = this.operations.isDynamic(this.name);

    const graph_node = <OpNode> this.tree.getNode(this.id);

    this.op.params.forEach((val, ndx) => {
      if(ndx < graph_node.params.length) this.op_inputs.push(new FormControl(graph_node.params[ndx], [Validators.required, Validators.pattern('[1-9 ]*')]));
      else this.op_inputs.push(new FormControl(val.value));
    });


    if(this.is_dynamic_op){
      //get the current param value and generate input slots
      const dynamic_param: number = (<DynamicOperation>this.op).dynamic_param_id;
      const dynamic_type: string = (<DynamicOperation>this.op).dynamic_param_type;

      const dynamic_value: number = graph_node.params[dynamic_param];
      const inlet_values: Array<any> = graph_node.inlets.slice();


      for(let i = 0; i < dynamic_value; i++){
        if(i < inlet_values.length){
          /**@todo hacky way around inlet default values to 0 is to assume that user can never explicity set zero */
          if(inlet_values[i] === 0)   this.inlets.push(new FormControl(i+1));
          else   this.inlets.push(new FormControl(inlet_values[i]))
        
        }else{
          this.inlets.push(new FormControl(i+1));
        }
      }

      if(inlet_values.length > dynamic_value){
        for(let j = dynamic_value; j < inlet_values.length; j++){
          this.inlets.push(new FormControl(j+1));
        }
      }

    }else{
      this.inlets.push(new FormControl(0));
    }

    //make sure the graph is aligned with these values
    this.inlets.forEach((fc, ndx) => {
      graph_node.inlets[ndx] = fc.value;
    })

    const tl: Point = this.viewport.getTopLeft();
   
    if(this.bounds.topleft.x == 0 && this.bounds.topleft.y == 0) this.setPosition(tl);
    this.interlacement = utilInstance.resolvePointToAbsoluteNdx(this.bounds.topleft, this.scale);

    this.base_height =  60 + 40 * this.op_inputs.length
    this.bounds.height = this.base_height;

    



  }


  ngAfterViewInit(){
    this.rescale();
    this.onOperationParamChange.emit({id: this.id});

  }


  getInputName(id: number) : string {
    const sd = this.tree.getDraft(id);
    if(sd === null || sd === undefined) return "null draft"
    return sd.getName();
  }


  // setOutputs(dms: Array<DraftMap>){
  //    // this.outputs = dms.slice();

  // }



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



  rescale(){

    const zoom_factor = this.scale / this.default_cell;
    const container: HTMLElement = document.getElementById('scale-'+this.id);
    if(container === null) return;

    container.style.transformOrigin = 'top left';
    container.style.transform = 'scale(' + zoom_factor + ')';

    this.bounds.topleft = {
      x: this.interlacement.j * this.scale,
      y: this.interlacement.i * this.scale
    };

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
   * updates this components position based on the child component's position
   * */
    updatePositionFromChild(child: SubdraftComponent){


       const container = <HTMLElement> document.getElementById("scale-"+this.id);
       this.setPosition({x: child.bounds.topleft.x, y: child.bounds.topleft.y - (container.offsetHeight * this.scale/this.default_cell) });
  
    }

  /**
   * set's the width to at least 200, but w if its large
   */
  setWidth(w:number){
    this.bounds.width = (w > 200) ? w : 200;
  }

  // addOutput(dm: DraftMap){
  //   this.outputs.push(dm);
  // }

  disableDrag(){
    this.disable_drag = true;
  }

  enableDrag(){
    this.disable_drag = false;
  }

  drop(){
    console.log("dropped");
  }

  maxInputs():number{
    return this.op.max_inputs;
  }

  inputSelected(input_id: number){
    console.log("Input", input_id);
    this.disableDrag();
    this.onInputAdded.emit({id: this.id, ndx: input_id});
  }


  removeConnectionTo(sd_id: number, ndx: number){
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

  onCheckboxParamChange(id: number, value: number){
    const opnode: OpNode = <OpNode> this.tree.getNode(this.id);
    opnode.params[id] = (value) ? 1 : 0;
    this.op_inputs[id].setValue(value);
    this.onOperationParamChange.emit({id: this.id});
  }

  onParamChange(id: number, value: number){

    //if(this.op_inputs[id].hasError('pattern') || this.op_inputs[id].hasError('required')) return;

    const opnode: OpNode = <OpNode> this.tree.getNode(this.id);
    opnode.params[id] = value;
    this.op_inputs[id].setValue(value);
    
    if(this.is_dynamic_op){
      //check to see if we should add or remove draft inputs
      if(id === (<DynamicOperation>this.op).dynamic_param_id){
        switch((<DynamicOperation>this.op).dynamic_param_type){

          case 'number':
            if(value > this.inlets.length){
              for(let i = this.inlets.length; i < value; i++){
                this.inlets.push(new FormControl(i+1));
                opnode.inlets.push(i+1);
              }
            }else if(value < this.inlets.length){
              this.inlets.splice(value, this.inlets.length - value);
              opnode.inlets.splice(value,  opnode.inlets.length - value);
            }
          break;

        }
      }
    }
    
    
    this.onOperationParamChange.emit({id: this.id});
   
  }

  /**
   * 
   * @param id 
   * @param value 
   */
  onInletChange(id: number, value: number){
    const opnode: OpNode = <OpNode> this.tree.getNode(this.id);
    opnode.inlets[id] = value;
    this.inlets[id].setValue(value);
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
