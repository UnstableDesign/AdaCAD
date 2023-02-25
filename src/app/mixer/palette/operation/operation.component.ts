import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Bounds, DynamicOperation, Interlacement, IOTuple, Operation, OpNode, Point } from '../../../core/model/datatypes';
import utilInstance from '../../../core/model/util';
import { DesignmodesService } from '../../../core/provider/designmodes.service';
import { ImageService } from '../../../core/provider/image.service';
import { OperationDescriptionsService } from '../../../core/provider/operation-descriptions.service';
import { OperationService } from '../../../core/provider/operation.service';
import { SystemsService } from '../../../core/provider/systems.service';
import { TreeService } from '../../../core/provider/tree.service';
import { OpHelpModal } from '../../modal/ophelp/ophelp.modal';
import { MultiselectService } from '../../provider/multiselect.service';
import { ViewportService } from '../../provider/viewport.service';
import { ConnectionComponent } from '../connection/connection.component';
import { SubdraftComponent } from '../subdraft/subdraft.component';



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
   @Output() onInputVisibilityChange = new EventEmitter <any> ();


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

    description: string; 
    application: string; 
    displayname: string; 

   tooltip: string = "select drafts to input to this operation"

   disable_drag: boolean = false;
 
   topleft: Point = {x: 0, y:0};


  //  bounds: Bounds = {
  //    topleft: {x: 0, y:0},
  //    width: 200,
  //    height: 100
  //  };
   
   op:Operation | DynamicOperation;

   opnode: OpNode;

   //for input params form control
   loaded_inputs: Array<number> = [];

   has_image_preview: boolean = false;

  // has_connections_in: boolean = false;
   subdraft_visible: boolean = true;

   is_dynamic_op: boolean = false;
   
   dynamic_type: string = 'main';

   filewarning: string = "";

   all_system_codes: Array<string> = [];

   viewInit: boolean = false;

  constructor(
    private operations: OperationService, 
    private dialog: MatDialog,
    private viewport: ViewportService,
    public tree: TreeService,
    public dm: DesignmodesService,
    private imageService: ImageService,
    public systems: SystemsService,
    public multiselect: MultiselectService,
    public opdescriptions: OperationDescriptionsService) { 
     


  }

  ngOnInit() {

    this.op = this.operations.getOp(this.name);
    this.is_dynamic_op = this.operations.isDynamic(this.name);
    this.description = this.opdescriptions.getOpDescription(this.name);
    this.displayname = this.opdescriptions.getDisplayName(this.name);
    this.application = this.opdescriptions.getOpApplication(this.name);

    const tl: Point = this.viewport.getTopLeft();
    const tl_offset = {x: tl.x + 60, y: tl.y};

     if(this.topleft.x == 0 && this.topleft.y == 0) this.setPosition(tl_offset);
     this.interlacement = utilInstance.resolvePointToAbsoluteNdx(this.topleft, this.scale);


    this.opnode = <OpNode> this.tree.getNode(this.id);
    if(this.is_dynamic_op) this.dynamic_type = (<DynamicOperation>this.op).dynamic_param_type;
    // this.base_height =  60 + 40 * this.opnode.params.length
    // this.bounds.height = this.base_height;

  }

  ngAfterViewInit(){
    this.rescale();
   // this.onOperationParamChange.emit({id: this.id});
    if(this.name == 'imagemap' || this.name == 'bwimagemap'){
      this.drawImagePreview();
    }

    // const container: HTMLElement = document.getElementById('scale-'+this.id);
    // this.bounds.height = container.offsetHeight;

    const children = this.tree.getDraftNodes().filter(node => this.tree.getSubdraftParent(node.id) === this.id);
    if(children.length > 0) this.updatePositionFromChild(<SubdraftComponent>this.tree.getComponent(children[0].id));


    this.viewInit = true;



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

      console.log("IMAGE DATA", obj.data)
      const max_dim = (obj.data.width > obj.data.height) ? obj.data.width : obj.data.height;
      const use_width = (obj.data.width > 100) ? obj.data.width / max_dim * 100 : obj.data.width;
      const use_height = (obj.data.height > 100) ? obj.data.height / max_dim * 100 : obj.data.height;

      canvas.width = use_width;
      canvas.height = use_height;


      ctx.drawImage(obj.data.image, 0, 0, use_width, use_height);
     
    }


  // setBounds(bounds:Bounds){
  //   this.bounds.topleft = {x: bounds.topleft.x, y: bounds.topleft.y},
  //   this.bounds.width = bounds.width;
  //   this.bounds.height = bounds.height;
  //   this.interlacement = utilInstance.resolvePointToAbsoluteNdx(bounds.topleft, this.scale);
  // }

  setPosition(pos: Point){
    this.topleft =  {x: pos.x, y:pos.y};
    this.interlacement = utilInstance.resolvePointToAbsoluteNdx(pos, this.scale);
  }

  refreshInlets(){
    this.opnode.inlets
  }



  rescale(){

    const zoom_factor = this.scale / this.default_cell;
    const container: HTMLElement = document.getElementById('scale-'+this.id);
    if(container === null) return;

    container.style.transformOrigin = 'top left';
    container.style.transform = 'scale(' + zoom_factor + ')';

    this.topleft = {
      x: this.interlacement.j * this.scale,
      y: this.interlacement.i * this.scale
    };

    // this.bounds.height = this.base_height * zoom_factor;

 
  


  }

  drawForPrint(canvas, cx, scale){
    if(canvas === undefined) return;
    const bounds = document.getElementById('scale-'+this.id);

    cx.fillStyle = "#ffffff";
    cx.fillRect(this.topleft.x, this.topleft.y, bounds.offsetWidth, bounds.offsetHeight); 

    cx.fillStyle = "#666666";
    cx.font = this.scale*2+"px Verdana";

    let datastring: string = this.name+" // ";
    let opnode = this.tree.getOpNode(this.id);

    this.op.params.forEach((p, ndx) => {
      datastring = datastring + p.name +": "+ opnode.params[ndx] + ", ";
    });

    cx.fillText(datastring,this.topleft.x + 5, this.topleft.y+25 );


  }

   /**
   * updates this components position based on the child component's position
   * */
    updatePositionFromChild(child: SubdraftComponent){

       const container = <HTMLElement> document.getElementById("scale-"+this.id);
       if(container !== null) this.setPosition({x: child.topleft.x, y: child.topleft.y - (container.offsetHeight * this.scale/this.default_cell) });
  
    }

  /**
   * set's the width to at least 200, but w if its large
   */
  // setWidth(w:number){
  //   this.bounds.width = (w > 200) ? w : 200;
  // }

  // addOutput(dm: DraftMap){
  //   this.outputs.push(dm);
  // }

  disableDrag(){
    this.disable_drag = true;
  }

  enableDrag(){
    this.disable_drag = false;
  }

  toggleParamsVisible(){
    this.params_visible = !this.params_visible;
  }

  toggleSelection(e: any){


      if(e.shiftKey == true){
        this.multiselect.toggleSelection(this.id, this.topleft);
      }else{
        this.multiselect.clearSelections();
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


  inputSelected(obj: any){
    let input_id = obj.inletid;
    this.disableDrag();
    this.onInputAdded.emit({id: this.id, ndx: input_id});
  }

  visibilityChange(obj: any){
    this.onInputVisibilityChange.emit({id: this.id, ndx:  obj.inletid, ndx_in_inlets: obj.ndx_in_inlets, show: obj.show});
  }


  removeConnectionTo(obj:any){
    this.onConnectionRemoved.emit(obj);

    // const inlets = this.tree.getInputs(this.id);
    // inlets.forEach(id => {
    //   const comp = <ConnectionComponent> this.tree.getComponent(id);
    //   comp.updateToPosition(this);

    // })

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

    console.log("on param change", this.is_dynamic_op)


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
      const new_inlets = this.tree.onDynanmicOperationParamChange(this.id, this.name, opnode.inlets, obj.id, obj.value)
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

    switch(obj.data.type){
      case 'image':

        if(this.operations.isDynamic(this.name) && (<DynamicOperation> this.op).dynamic_param_type !== 'color') return;

        if(obj.data.warning !== ''){
          image_div.style.display = 'flex';
          this.filewarning = obj.warning;
        }else{

          const opnode = this.tree.getOpNode(this.id);
          
          obj.inlets.forEach(hex => {

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
            const found = obj.inlets.find(el => el === inlet);
            if(found === undefined){
              remove.push(ndx);
            }
          })
          remove.forEach(removeid => {
            opnode.inlets.splice(removeid, 1);
          });

        
          //now update the default parameters to the original size 
          opnode.params[1] = obj.data.width;
          opnode.params[2] = obj.data.height;
          this.drawImagePreview();


        }
        break;
    }

    this.onOperationParamChange.emit({id: this.id});  

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



  dragStart(e: any) {
      //set the relative position of this operation if its the one that's dragging

      const container: HTMLElement = document.getElementById('scale-'+this.id);
      const parent_height = container.offsetHeight;
     if(this.multiselect.isSelected(this.id)){
      this.multiselect.setRelativePosition(this.topleft);
     }else{
      this.multiselect.clearSelections();
     }
  }

  dragMove($event: any) {
       //position of pointer of the page



       const pointer:Point = $event.pointerPosition;
       const relative:Point = utilInstance.getAdjustedPointerPosition(pointer, this.viewport.getBounds());
       const adj:Point = utilInstance.snapToGrid(relative, this.scale);
       this.topleft = adj;  
       this.interlacement = utilInstance.resolvePointToAbsoluteNdx(adj, this.scale);
       this.onOperationMove.emit({id: this.id, point: adj});

  }


  dragEnd($event: any) {
    this.multiselect.setRelativePosition(this.topleft);
    this.onOperationMoveEnded.emit({id: this.id});

  }
 

}
