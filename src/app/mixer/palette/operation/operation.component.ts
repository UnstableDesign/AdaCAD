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
import { ImageService } from '../../../core/provider/image.service';
import { SystemsService } from '../../../core/provider/systems.service';


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

   has_image_preview: boolean = false;

   //these are the drafts with any input parameters
   inlets: Array<FormControl> = [];


  // has_connections_in: boolean = false;
   subdraft_visible: boolean = true;

   is_dynamic_op: boolean = false;

   textValidate: any;

   filewarning: string = "";

   all_system_codes: Array<string> = [];

  constructor(
    private operations: OperationService, 
    private dialog: MatDialog,
    private viewport: ViewportService,
    public tree: TreeService,
    public dm: DesignmodesService,
    private imageService: ImageService,
    public systems: SystemsService) { 
    
      //this.outputs = [];
  
      this.textValidate = new MyErrorStateMatcher();

      this.all_system_codes = this.systems.weft_systems.map(el => el.name);
     

  }

  ngOnInit() {


    this.op = this.operations.getOp(this.name);
    this.is_dynamic_op = this.operations.isDynamic(this.name);

    const graph_node = <OpNode> this.tree.getNode(this.id);

    this.op.params.forEach((val, ndx) => {
      if(ndx < graph_node.params.length) this.op_inputs.push(new FormControl(graph_node.params[ndx], [Validators.required, Validators.pattern('[1-9 ]*')]));
      else this.op_inputs.push(new FormControl(val.value));
    });


    /**
     * Dynamic ops will always have one inlet, valued zero, and all additional inputs are added on top of that
     * we do not draw the 0th element to the screen
     */
    if(this.is_dynamic_op){
      //get the current param value and generate input slots
      const dynamic_param: number = (<DynamicOperation>this.op).dynamic_param_id;
      const dynamic_type: string = (<DynamicOperation>this.op).dynamic_param_type;
      let dynamic_value: number = 0;
      const inlet_values: Array<any> = graph_node.inlets.slice();

      if(dynamic_type === 'color'){
        dynamic_value = inlet_values.length-1;
      }else{
        dynamic_value = graph_node.params[dynamic_param];
      }


      //if inlet values is greater than 1, then we need to load the existing values in
      if(inlet_values.length > 1){
        //push the first zero calue
        inlet_values.forEach(inlet => {

          switch(dynamic_type){
            case 'system':
              this.inlets.push(new FormControl(this.systems.weft_systems[inlet].name));
              this.systems.weft_systems[inlet].in_use = true;
              break;

              default:
                this.inlets.push(new FormControl(inlet));
                break;
          }
        });

      }else{
        //we need to load the default values 
        for(let i = 0; i < dynamic_value+1; i++){
        
          switch(dynamic_type){
            case 'color':
              this.inlets.push(new FormControl(i));
              if(i >=graph_node.inlets.length) graph_node.inlets.push(i);
              break;
            case 'number':
              this.inlets.push(new FormControl(i));
              if(i >=graph_node.inlets.length) graph_node.inlets.push(i);
              break;
            case 'system':
              let adj_i = (i > 0) ? i -1 : i;
              this.inlets.push(new FormControl(this.systems.weft_systems[adj_i].name));
              if(i >=graph_node.inlets.length) graph_node.inlets.push(adj_i);
              this.systems.weft_systems[adj_i].in_use = true;

              break;
          }

        }

      }
    
    }else{
      graph_node.inlets.forEach(inlet => {
        this.inlets.push(new FormControl(0));
      });
    }

    if(graph_node.inlets.length != this.inlets.length ) console.error("inlets do not match", graph_node.inlets, this.inlets)




    const tl: Point = this.viewport.getTopLeft();
   
    if(this.bounds.topleft.x == 0 && this.bounds.topleft.y == 0) this.setPosition(tl);
    this.interlacement = utilInstance.resolvePointToAbsoluteNdx(this.bounds.topleft, this.scale);

    this.base_height =  60 + 40 * this.op_inputs.length
    this.bounds.height = this.base_height;



  }


  ngAfterViewInit(){
    this.rescale();
    this.onOperationParamChange.emit({id: this.id});
    if(this.name == 'imagemap'){
      this.drawImagePreview();
    }

  }

  drawImagePreview(){
      const obj = this.imageService.getImageData(this.op_inputs[0].value);
      if(obj === undefined) return;

      console.log("obj data image", obj.data.image);

      this.has_image_preview = true;
      const image_div =  document.getElementById('param-image-'+this.id);
      image_div.style.display = 'flex';

      const dims_div =  document.getElementById('param-image-dims-'+this.id);
      dims_div.innerHTML=obj.data.width+"px x "+obj.data.height+"px";

      const canvas: HTMLCanvasElement =  <HTMLCanvasElement> document.getElementById('preview_canvas-'+this.id);
      const ctx = canvas.getContext('2d');

      const max_dim = (obj.data.width > obj.data.height) ? obj.data.width : obj.data.height;
      canvas.width = obj.data.width / max_dim * 100;
      canvas.height = obj.data.height / max_dim * 100;
      ctx.drawImage(obj.data.image, 0, 0, obj.data.width / max_dim * 100, obj.data.height / max_dim * 100);
     
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
      value = value+1;
      //check to see if we should add or remove draft inputs
      if(id === (<DynamicOperation>this.op).dynamic_param_id){
        const type = (<DynamicOperation>this.op).dynamic_param_type;
        switch(type){

          case 'number':
          case 'system':
            if(value > this.inlets.length){
              for(let i = this.inlets.length; i < value; i++){

                if(type === 'number'){
                  this.inlets.push(new FormControl(i));
                  opnode.inlets.push(i);
                }else{
                  this.inlets.push(new FormControl(this.systems.weft_systems[i-1].name))
                  this.systems.weft_systems[i-1].in_use = true;
                  opnode.inlets.push(i-1);
                } 
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

  //returned from a file upload event
  /**
   * get the data type and process it here
   * @param obj 
   */
  handleFile(id: number, obj: any){

    const image_div =  document.getElementById('param-image-'+this.id);
    image_div.style.display = 'none';


    obj = obj.data;


    switch(obj.type){
      case 'image':

        if(this.operations.isDynamic(this.name) && (<DynamicOperation> this.op).dynamic_param_type !== 'color') return;

        if(obj.warning !== ''){
          image_div.style.display = 'flex';
          this.filewarning = obj.warning;
        }else{

   


          const opnode = this.tree.getOpNode(this.id);
          this.op_inputs[id].setValue(obj.id);
          opnode.params[id] = obj.id;




          obj.colors.forEach(hex => {

            //add any new colors
            const ndx = this.inlets.findIndex(el => el.value === hex);
            if(ndx === -1){
              this.inlets.push(new FormControl(hex));
              opnode.inlets.push(hex);
            }
          });

          const remove = [];
          //now remove any inlets that no longer have values
          opnode.inlets.forEach((inlet, ndx) => {
            if(inlet === 0) return;
            const found = obj.colors.find(el => el === inlet);
            if(found === undefined){
              remove.push(ndx);
            }
          })
          remove.forEach(removeid => {
            opnode.inlets.splice(removeid, 1);
            this.inlets.splice(removeid, 1);
          });


          //now update the default parameters to the original size 
          this.op_inputs[1].setValue(obj.data.width/10);
          this.op_inputs[2].setValue(obj.data.height/10);
          opnode.params[1] = obj.data.width/10;
          opnode.params[2] = obj.data.height/10;

          this.drawImagePreview();


        }
        break;
    }
  }

  /**
   * 
   * @param id 
   * @param value 
   */
  onInletChange(id: number, value: any){
    const opnode: OpNode = <OpNode> this.tree.getNode(this.id);
    this.inlets[id].setValue(value);

    
    if(this.is_dynamic_op){
      const type = (<DynamicOperation> this.op).dynamic_param_type;
      switch(type){
        case 'system':
          opnode.inlets[id] = this.systems.weft_systems.findIndex(el => el.name === value);
          break;

        default:
          opnode.inlets[id] = value;
        break;
      }

    }else{
      opnode.inlets[id] = value;
    }
  
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
