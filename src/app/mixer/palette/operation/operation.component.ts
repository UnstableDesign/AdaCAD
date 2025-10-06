import { CdkDrag, CdkDragHandle, CdkDragMove, CdkDragStart } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, inject, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { DynamicOperation, Interlacement, Operation, OpParamValType } from 'adacad-drafting-lib';
import { IOTuple, OpExistenceChanged, OpNode, OpStateMove, Point } from '../../../core/model/datatypes';
import { OperationService } from '../../../core/provider/operation.service';
import { StateService } from '../../../core/provider/state.service';
import { SystemsService } from '../../../core/provider/systems.service';
import { TreeService } from '../../../core/provider/tree.service';
import { ViewerService } from '../../../core/provider/viewer.service';
import { ZoomService } from '../../../core/provider/zoom.service';
import { MultiselectService } from '../../provider/multiselect.service';
import { ConnectionComponent } from '../connection/connection.component';
import { DraftContainerComponent } from '../draftcontainer/draftcontainer.component';
import { InletComponent } from './inlet/inlet.component';
import { ParameterComponent } from './parameter/parameter.component';



@Component({
  selector: 'app-operation',
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.scss'],
  imports: [CdkDrag, CdkDragHandle, InletComponent, MatMenu, MatMenuItem, MatTooltip, MatIconButton, MatMenuTrigger, ParameterComponent, DraftContainerComponent]
})
export class OperationComponent implements OnInit {
  private operations = inject(OperationService);
  private dialog = inject(MatDialog);
  tree = inject(TreeService);
  systems = inject(SystemsService);
  multiselect = inject(MultiselectService);
  vs = inject(ViewerService);
  zs = inject(ZoomService);
  ss = inject(StateService);



  @ViewChildren(ParameterComponent) paramsComps!: QueryList<ParameterComponent>;
  @ViewChildren(InletComponent) inletComps!: QueryList<InletComponent>;
  @ViewChildren(DraftContainerComponent) draftContainers!: QueryList<DraftContainerComponent>;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

  @Input() id: number; //generated from the tree service
  @Input() name: string;



  @Input()
  get scale(): number { return this._scale; }
  set scale(value: number) {
    this._scale = value;
  }
  private _scale: number = this.zs.getMixerZoom();

  /**
   * handles actions to take when the mouse is down inside of the palette
   * @param event the mousedown event
   */

  @Input() default_cell: number;
  @Input() zndx: number;
  @Output() onConnectionRemoved = new EventEmitter<any>();
  @Output() onConnectionMove = new EventEmitter<any>();
  @Output() onConnectionStarted = new EventEmitter<any>();
  @Output() onOperationMove = new EventEmitter<any>();
  @Output() onOperationMoveEnded = new EventEmitter<any>();
  @Output() onOperationParamChange = new EventEmitter<any>();
  @Output() deleteOp = new EventEmitter<any>();
  @Output() duplicateOp = new EventEmitter<any>();
  @Output() onInputAdded = new EventEmitter<any>();
  @Output() onInputVisibilityChange = new EventEmitter<any>();
  @Output() onInletLoaded = new EventEmitter<any>();
  @Output() onOpLoaded = new EventEmitter<any>();
  @Output() onOpenInEditor = new EventEmitter<any>();
  @Output() onRedrawOutboundConnections = new EventEmitter<any>();
  @Output() onNameChanged = new EventEmitter<any>();




  params_visible: boolean = true;
  /**
  * reference to top, left positioin as absolute interlacement
  */
  interlacement: Interlacement;

  /**
  * flag to tell if this is being from a loaded from a saved file
  */
  loaded: boolean = false;

  /**
    * flag to tell if this has been duplicated from another operation
    */
  duplicated: boolean = false;

  description: string;

  displayname: string;

  tooltip: string = "select drafts to input to this operation"

  disable_drag: boolean = false;

  topleft: Point = { x: 0, y: 0 };

  op: Operation | DynamicOperation;

  opnode: OpNode;

  //for input params form control
  loaded_inputs: Array<number> = [];

  // has_connections_in: boolean = false;
  subdraft_visible: boolean = true;

  is_dynamic_op: boolean = false;

  //dynamic_type: string = 'main';

  filewarning: string = "";

  all_system_codes: Array<string> = [];

  viewInit: boolean = false;

  hasInlets: boolean = false;

  children: Array<number> = []; //a list of references to any drafts produced by this operation

  color: string = '#000'

  redrawchildren: number = 0; //changing this number will flag a redraw from the draft rendering child

  selecting_connection: boolean = false;

  offset: Point = null;

  previous_topleft: Point = null;

  // @HostListener('window:resize', ['$event'])
  // onResize(event) {
  //   console.log("FORCE TRANSFORM TO ZERO", this.disable_drag);
  //   this.disable_drag = true;
  // }


  constructor() {

  }

  ngOnDestroy(): void {
  }

  ngOnInit() {

    console.log("ON INIT OPERATION ", this.id, this.name)


    this.op = this.operations.getOp(this.name);
    this.is_dynamic_op = this.operations.isDynamic(this.name);
    this.description = this.op.meta.desc ?? '';
    this.displayname = this.op.meta.displayname ?? this.name;

    if (this.op.meta.categories !== undefined && this.op.meta.categories.length > 0) {
      const active_cat = this.op.meta.categories[0];
      this.color = active_cat.color;
    }



    this.opnode = <OpNode>this.tree.getNode(this.id);
    //if(this.is_dynamic_op) this.dynamic_type = (<DynamicOperation>this.op).dynamic_param_type;

  }

  ngAfterViewInit() {

    console.log("ON AFTER VIEW INIT OPERATION ", this.id, this.name)

    // const children = this.tree.getDraftNodes().filter(node => this.tree.getSubdraftParent(node.id) === this.id);
    // if(children.length > 0) this.updatePositionFromChild(<SubdraftComponent>this.tree.getComponent(children[0].id));

    this.viewInit = true;
    this.hasInlets = this.op.inlets.length > 0 || this.opnode.inlets.length > 0;

    let op_container = document.getElementById('scale-' + this.id);
    op_container.style.transform = 'none'; //negate angulars default positioning mechanism
    op_container.style.top = this.topleft.y + "px";
    op_container.style.left = this.topleft.x + "px";



    this.onOpLoaded.emit({ id: this.id })

  }

  mousedown(e: any) {
    //this.disable_drag = false;
    e.stopPropagation();
  }

  onDoubleClick(event: any) {
    this.trigger.openMenu();
  }

  setParamFromStateEvent(paramid: number, value: OpParamValType) {
    this.paramsComps.get(paramid).setValueFromStateEvent(value);
  }


  setPosition(pos: Point) {
    this.topleft = { x: pos.x, y: pos.y };
    let op_container = document.getElementById('scale-' + this.id);
    op_container.style.transform = 'none'; //negate angulars default positioning mechanism
    op_container.style.top = this.topleft.y + "px";
    op_container.style.left = this.topleft.x + "px";
  }

  drawForPrint(canvas, cx, scale) {

    if (canvas === undefined) return;
    const bounds = document.getElementById('scale-' + this.id);

    cx.fillStyle = "#ffffff";
    cx.fillRect(this.topleft.x, this.topleft.y, bounds.offsetWidth, bounds.offsetHeight);

    cx.fillStyle = "#666666";
    cx.font = this.scale * 2 + "px Verdana";

    let datastring: string = this.name + " // ";
    let opnode = this.tree.getOpNode(this.id);

    this.op.params.forEach((p, ndx) => {
      datastring = datastring + p.name + ": " + opnode.params[ndx] + ", ";
    });

    cx.fillText(datastring, this.topleft.x + 5, this.topleft.y + 25);


  }


  disableDrag() {
    this.disable_drag = true;
  }

  enableDrag() {
    this.disable_drag = false;
  }

  toggleParamsVisible() {
    this.params_visible = !this.params_visible;
  }


  updateConnectionStyling() {

    //remove the selected class for all connections
    let cxns = this.tree.getConnections();
    for (let cxn of cxns) {
      if (cxn !== null) {
        cxn.updateConnectionStyling(false);
      }
    }

    let outputs = [];
    if (this.children.length > 0) {
      let child = this.children[0];
      outputs = outputs.concat(this.tree.getOutputs(child))
    }

    //add the class selected to any of the connections going into and out of this node
    let ios = outputs.concat(this.tree.getInputs(this.id));
    for (let io of ios) {
      let cxn = <ConnectionComponent>this.tree.getComponent(io);
      if (cxn !== null) cxn.updateConnectionStyling(true)
    }

  }


  toggleSelection(e: any) {

    this.updateConnectionStyling();

    if (this.children.length > 0) {
      let child = this.children[0];
      this.vs.setViewer(child);
    }

    if (e.shiftKey == true) {
      this.multiselect.toggleSelection(this.id, this.topleft);
    } else {
      this.multiselect.clearSelections();
    }

  }


  hasPin(): boolean {
    if (!this.vs.hasPin()) return false;
    return (this.children.find(el => el == this.vs.getPin()) !== undefined)
  }


  pinToView() {
    if (this.children.length > 0) {
      let child = this.children[0];
      this.vs.setPin(child);
    }
  }


  /**
   * TO DO - right now, this defalts to the first child, if there are multiple children, does not offer a way to select...figure that part out
   */
  async saveAsWif() {

    if (this.draftContainers.length > 0) {
      this.draftContainers.get(0).saveAsWif();
    }

  }

  async saveAsPrint() {
    if (this.draftContainers.length > 0) {
      this.draftContainers.get(0).saveAsPrint();
    }
  }

  async saveAsBmp(): Promise<any> {
    if (this.draftContainers.length > 0) {
      this.draftContainers.get(0).saveAsBmp();
    }

  }




  unpinFromView() {
    this.vs.clearPin();
  }

  drop() {
  }


  inputSelected(obj: any) {
    let input_id = obj.inletid;
    let val = obj.val;
    this.onInputAdded.emit({ id: this.id, ndx: input_id, val: val });
  }

  visibilityChange(obj: any) {
    this.onInputVisibilityChange.emit({ id: this.id, ndx: obj.inletid, ndx_in_inlets: obj.ndx_in_inlets, show: obj.show });
  }

  updateChildren(children: Array<number>) {
    this.children = children;
    this.redrawchildren++;
  }

  /**
 * this is called when the draft container displaying this draft has had a size change 
 */
  updateOutboundConnections(sd_id: number) {
    this.onRedrawOutboundConnections.emit(sd_id);
  }


  /**
   * resets the visibility on any inlet in the attached list
   * @param inlets 
   */
  resetVisibliity(inlets: Array<number>) {

    inlets.forEach(id => {
      const ilet = this.inletComps.find(el => el.inletid == id);
      if (ilet !== undefined) ilet.show_connection_name = -1;
    })
  }

  connectionStarted(event) {
    this.onConnectionStarted.emit(event);

  }




  removeConnectionTo(obj: any) {
    this.onConnectionRemoved.emit(obj);
  }



  openHelpDialog() {

    let regex = new RegExp(' ', 'g');
    let op_name_format = this.op.name.replace(regex, '_');
    window.open('https://docs.adacad.org/docs/reference/operations/' + op_name_format, '_blank');
    ;

  }

  openInEditor() {
    let children = this.tree.getNonCxnOutputs(this.id);
    if (children.length > 0) {
      let child = children[0];
      this.onOpenInEditor.emit(child);
    }
  }



  /**
   * called from the child parameter when a value has changed, this functin then updates the inlets
   * @param id an object containing the id of hte parameter that has changed
   * @param value 
   */
  onParamChange(obj: any) {
    const opnode = <OpNode>this.tree.getNode(this.id);
    const original_inlets = this.opnode.inlets.slice();


    console.log("ON PARAM CHANGE IN OPERATIONS ", this.is_dynamic_op)

    if (this.is_dynamic_op) {

      const opnode = <OpNode>this.tree.getNode(this.id);
      const op = <DynamicOperation>this.operations.getOp(opnode.name);

      if (op.dynamic_param_id === obj.id) {

        if (op.params[obj.id].type == 'draft') {
          const inputs: Array<IOTuple> = this.tree.getInputsAtNdx(this.id, 0);
          if (inputs.length === 0) obj.value = -1;
          else {
            const draft_node_in_id = inputs[0].tn.inputs[0].tn.node.id;
            obj.value = draft_node_in_id;
          }

        }

        this.opnode.inlets = this.tree.onDynanmicOperationParamChange(this.id, this.name, opnode.inlets, obj.id, obj.value)


        this.hasInlets = opnode.inlets.length > 0;

        if (opnode.name == 'imagemap' || opnode.name == 'bwimagemap') {

          //update the width and height
          // let image_param = opnode.params[op.dynamic_param_id];
          let image_param = opnode.params[0];
          if (image_param.id != '') {
            opnode.params[1] = image_param.data.width;
            opnode.params[2] = image_param.data.height;
          }
        }
      }

    }

    this.onOperationParamChange.emit({ id: this.id, prior_inlet_vals: original_inlets });
  }

  nameChanged(id) {
    this.onNameChanged.emit(id);
  }

  //returned from a file upload event
  /**
   * get the data type and process it here
   * @param obj 
   */
  handleFile(obj: any) {


    const image_div = document.getElementById('param-image-' + this.id);
    image_div.style.display = 'none';

    switch (obj.data.type) {

      case 'image':
        // if(this.operations.isDynamic(this.name) && (<DynamicOperation> this.op).dynamic_param_type !== 'color') return;

        if (obj.data.warning !== '') {
          image_div.style.display = 'flex';
          this.filewarning = obj.warning;
        } else {

          const opnode = this.tree.getOpNode(this.id);

          obj.inlets.forEach(hex => {

            //add any new colors
            const ndx = opnode.inlets.findIndex(el => el.value === hex);
            if (ndx === -1) {
              opnode.inlets.push(hex);
            }
          });

          const remove = [];
          //now remove any inlets that no longer have values
          opnode.inlets.forEach((inlet, ndx) => {
            if (inlet === 0) return;
            const found = obj.inlets.find(el => el === inlet);
            if (found === undefined) {
              remove.push(ndx);
            }
          })
          remove.forEach(removeid => {
            opnode.inlets.splice(removeid, 1);
          });


          //now update the default parameters to the original size 
          opnode.params[1] = obj.data.width;
          opnode.params[2] = obj.data.height;


        }
        break;
    }

    this.onOperationParamChange.emit({ id: this.id });

  }

  inletLoaded(obj) {
    obj.opid = this.id;
    this.onInletLoaded.emit(obj);
  }

  /**
   * 
   * @param id 
   * @param value 
   */
  onInletChange(obj: any) {
    this.onOperationParamChange.emit({ id: this.id });
  }

  delete() {
    const change: OpExistenceChanged = {
      originator: 'OP',
      type: 'REMOVED',
      node: this.tree.getNode(this.id),
      inputs: this.tree.getInwardConnectionProxies(this.id),
      outputs: this.tree.getOutwardConnectionProxies(this.id)
    }
    this.ss.addStateChange(change);

    this.deleteOp.emit({ id: this.id });
  }

  duplicate() {

    this.duplicateOp.emit({ id: this.id });
  }




  dragStart($event: CdkDragStart) {
    this.updateConnectionStyling();

    this.previous_topleft = this.topleft;


    this.offset = null;

    if (this.multiselect.isSelected(this.id)) {
      this.multiselect.setRelativePosition(this.topleft);
    } else {
      this.multiselect.clearSelections();
    }
  }


  /**
   * ANGULARS default drag handler does not consider the scaled palette, it will move relative to the 
   * absolute mouse position 
   * @param $event 
   */
  dragMove($event: CdkDragMove) {

    this.updateConnectionStyling();

    //GET THE LOCATION OF THE POINTER RELATIVE TO THE TOP LEFT OF THE NODE

    let parent = document.getElementById('scrollable-container');
    let op_container = document.getElementById('scale-' + this.id);
    let rect_palette = parent.getBoundingClientRect();


    const zoom_factor = 1 / this.zs.getMixerZoom();


    //this gives the position of top left corner of the div relative to the palette div
    let op_topleft_inscale = {
      x: op_container.offsetLeft,
      y: op_container.offsetTop
    }

    let scaled_pointer = {
      x: ($event.pointerPosition.x - rect_palette.x + parent.scrollLeft) * zoom_factor,
      y: ($event.pointerPosition.y - rect_palette.y + parent.scrollTop) * zoom_factor,
    }



    if (this.offset == null) {
      this.offset = {
        x: scaled_pointer.x - op_topleft_inscale.x,
        y: scaled_pointer.y - op_topleft_inscale.y
      }
    }


    this.topleft = {
      x: scaled_pointer.x - this.offset.x,
      y: scaled_pointer.y - this.offset.y

    }

    op_container.style.transform = 'none'; //negate angulars default positioning mechanism
    op_container.style.top = this.topleft.y + "px";
    op_container.style.left = this.topleft.x + "px";


    this.onOperationMove.emit({ id: this.id, point: this.topleft });


  }





  dragEnd($event: any) {

    //CATCH THE CASE WHERE THIS IS DROPPED OUTSIDE OF SELECTABLE AREA

    let op_container = document.getElementById('scale-' + this.id);


    this.topleft = {
      x: (op_container.offsetLeft < 0) ? 0 : this.topleft.x,
      y: (op_container.offsetTop < 0) ? 0 : this.topleft.y,

    }

    op_container.style.transform = 'none'; //negate angulars default positioning mechanism
    op_container.style.top = this.topleft.y + "px";
    op_container.style.left = this.topleft.x + "px";



    this.updateConnectionStyling();


    this.multiselect.setRelativePosition(this.topleft);
    this.onOperationMoveEnded.emit({ id: this.id });

    const change: OpStateMove = {
      originator: 'OP',
      type: 'MOVE',
      before: this.previous_topleft,
      after: this.topleft //before move
    }

    this.ss.addStateChange(change);


  }




}
