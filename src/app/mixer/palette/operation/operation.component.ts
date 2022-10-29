import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Bounds, Interlacement, Point,Operation, DynamicOperation,IOTuple, OpNode } from '../../../core/model/datatypes';
import utilInstance from '../../../core/model/util';
import { OperationService } from '../../../core/provider/operation.service';
import { OpHelpModal } from '../../modal/ophelp/ophelp.modal';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl} from '@angular/forms';
import { ViewportService } from '../../provider/viewport.service';
import { TreeService } from '../../../core/provider/tree.service';
import { DesignmodesService } from '../../../core/provider/designmodes.service';
import { SubdraftComponent } from '../subdraft/subdraft.component';
import { ImageService } from '../../../core/provider/image.service';
import { SystemsService } from '../../../core/provider/systems.service';
import { stat } from 'fs';
import { MultiselectService } from '../../provider/multiselect.service';



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
 
 /**
  * handles actions to take when the mouse is down inside of the palette
  * @param event the mousedown event
  */

   @Input() default_cell: number;
   @Input() zndx: number;
   @Output() onConnectionRemoved = new EventEmitter <any>();
   @Output() onConnectionMove = new EventEmitter <any>();
   @Output() onOperationMove = new EventEmitter <any>(); 
   @Output() onOperationMoveEnded = new EventEmitter <any>(); 
   @Output() onOperationParamChange = new EventEmitter <any>(); 
   @Output() deleteOp = new EventEmitter <any>(); 
   @Output() duplicateOp = new EventEmitter <any>(); 
   @Output() onInputAdded = new EventEmitter <any> ();


   params_visible: boolean = true;
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


   tooltip: string = "select drafts to input to this operation"

   disable_drag: boolean = false;
 
   bounds: Bounds = {
     topleft: {x: 0, y:0},
     width: 200,
     height: 100
   };
   
   op:Operation | DynamicOperation;

   opnode: OpNode;

   //for input params form control
   loaded_inputs: Array<number> = [];

   has_image_preview: boolean = false;

   //these are the drafts with any input parameters
  //  inlets: Array<FormControl> = [];


  // has_connections_in: boolean = false;
   subdraft_visible: boolean = true;

   is_dynamic_op: boolean = false;
   
   dynamic_type: string = 'main';

   filewarning: string = "";

   all_system_codes: Array<string> = [];

  constructor(
    private operations: OperationService, 
    private dialog: MatDialog,
    private viewport: ViewportService,
    public tree: TreeService,
    public dm: DesignmodesService,
    private imageService: ImageService,
    public systems: SystemsService,
    public multiselect: MultiselectService) { 
     


  }

  ngOnInit() {

    this.op = this.operations.getOp(this.name);
    this.is_dynamic_op = this.operations.isDynamic(this.name);
    

    const tl: Point = this.viewport.getTopLeft();
    const tl_offset = {x: tl.x + 60, y: tl.y};

    if(this.bounds.topleft.x == 0 && this.bounds.topleft.y == 0) this.setPosition(tl_offset);
    this.interlacement = utilInstance.resolvePointToAbsoluteNdx(this.bounds.topleft, this.scale);


    this.opnode = <OpNode> this.tree.getNode(this.id);
    if(this.is_dynamic_op) this.dynamic_type = (<DynamicOperation>this.op).dynamic_param_type;
    this.base_height =  60 + 40 * this.opnode.params.length
    this.bounds.height = this.base_height;

  }

  ngAfterViewInit(){
    this.rescale();
   // this.onOperationParamChange.emit({id: this.id});
    if(this.name == 'imagemap'){
      this.drawImagePreview();
    }

    const container: HTMLElement = document.getElementById('scale-'+this.id);
    this.bounds.height = container.offsetHeight;

    const children = this.tree.getDraftNodes().filter(node => this.tree.getSubdraftParent(node.id) === this.id);
    if(children.length > 0) this.updatePositionFromChild(<SubdraftComponent>this.tree.getComponent(children[0].id));


  }

  

  drawImagePreview(){

      const opnode = this.tree.getOpNode(this.id);
      const paramid = this.op.params.findIndex(el => el.type === 'file');
      const obj = this.imageService.getImageData(opnode.params[paramid]);

      if(obj === undefined) return;

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
    let opnode = this.tree.getOpNode(this.id);

    this.op.params.forEach((p, ndx) => {
      datastring = datastring + p.name +": "+ opnode.params[ndx] + ", ";
    });

    cx.fillText(datastring,this.bounds.topleft.x + 5, this.bounds.topleft.y+25 );


  }

   /**
   * updates this components position based on the child component's position
   * */
    updatePositionFromChild(child: SubdraftComponent){


       const container = <HTMLElement> document.getElementById("scale-"+this.id);
       if(container !== null) this.setPosition({x: child.bounds.topleft.x, y: child.bounds.topleft.y - (container.offsetHeight * this.scale/this.default_cell) });
  
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

  toggleSelection(e: any){

    let container;

      if(e.shiftKey == true){
       const added =  this.multiselect.toggleSelection(this.id, this.bounds.topleft);
       if(added){
         container = <HTMLElement> document.getElementById("scale-"+this.id);
        container.style.border = "thin solid black";

        const cxn_outs = this.tree.getOutputs(this.id);
        cxn_outs.forEach(o => {
          this.multiselect.toggleSelection(o, null)
          const child = this.tree.getConnectionOutput(o);
          const child_comp = this.tree.getComponent(child);
          this.multiselect.toggleSelection(child, child_comp.bounds.topleft);
          container = <HTMLElement> document.getElementById("scale-"+child);
          container.style.border = "thin solid black";

        });

       }else{
        container = <HTMLElement> document.getElementById("scale-"+this.id);
        container.style.border = "thin solid transparent"


        const cxn_outs = this.tree.getOutputs(this.id);
        cxn_outs.forEach(o => {
          this.multiselect.toggleSelection(o, null)
          const child = this.tree.getConnectionOutput(o);
          const child_comp = this.tree.getComponent(child);
          this.multiselect.toggleSelection(child, child_comp.bounds.topleft);
          container = <HTMLElement> document.getElementById("scale-"+child);
          container.style.border = "thin solid transparent";

        });

       }
      }

  }

  

  /**
   * prevents hits on the operation to register as a palette click, thereby voiding the selection
   * @param e 
   */
  mousedown(e: any){
    e.stopPropagation();


  }

  drop(){
    console.log("dropped");
  }


  inputSelected(input_id: number){
    this.disableDrag();
    this.onInputAdded.emit({id: this.id, ndx: input_id});
  }


  removeConnectionTo(obj:any){
    this.onConnectionRemoved.emit(obj);
  }

  openHelpDialog() {
    const dialogRef = this.dialog.open(OpHelpModal, {
      data: {
        name: this.op.name,
        op: this.op
      }
    });

  }



  /**
   * called from the child parameter when a value has changed, this functin then updates the inlets
   * @param id an object containing the id of hte parameter that has changed
   * @param value 
   */
  onParamChange(obj: any){

    if(this.is_dynamic_op){
      const opnode = <OpNode> this.tree.getNode(this.id);
      const op = <DynamicOperation> this.operations.getOp(opnode.name);
      //this is a hack to use an input draft to generate inlets
      if(op.params[obj.id].type == 'draft'){
        const inputs:Array<IOTuple> = this.tree.getInputsAtNdx(this.id, 0);
        if(inputs.length === 0) obj.value = -1;
        else {
          const draft_node_in_id = inputs[0].tn.inputs[0].tn.node.id;
          obj.value = draft_node_in_id;
        }
        
      }
      const new_inlets = this.tree.onDynanmicOperationParamChange(this.name, opnode.inlets, obj.id, obj.value)
      this.opnode.inlets = new_inlets.slice();

      if(op.dynamic_param_type == "number") this.opnode.inlets = this.opnode.inlets.map(el => parseInt(el));
    }
    
    this.onOperationParamChange.emit({id: this.id});
  }

  //returned from a file upload event
  /**
   * get the data type and process it here
   * @param obj 
   */
  handleFile(obj: any){


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

          obj.colors.forEach(hex => {

            //add any new colors
            const ndx = opnode.inlets.findIndex(el => el.value === hex);
            if(ndx === -1){
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
          });

        
          //now update the default parameters to the original size 
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
  onInletChange(obj: any){
    this.onOperationParamChange.emit({id: this.id});  
  }

  delete(){
    this.deleteOp.emit({id: this.id});
  }

  duplicate(){
    this.duplicateOp.emit({id: this.id});
  }



  dragStart($event: any) {
      this.multiselect.setRelativePosition(this.bounds.topleft);
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
    this.multiselect.setRelativePosition(this.bounds.topleft);
    this.onOperationMoveEnded.emit({id: this.id});

  }
 

}
