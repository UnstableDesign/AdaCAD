import { Observable, Subscription, fromEvent, from, iif } from 'rxjs';
import { DesignmodesService } from '../../mixer/provider/designmodes.service';
import { Component, HostListener, ViewContainerRef, Input, ComponentFactoryResolver, ViewChild, OnInit, ViewRef, Output, EventEmitter } from '@angular/core';
import { SubdraftComponent } from './subdraft/subdraft.component';
import { SelectionComponent } from './selection/selection.component';
import { SnackbarComponent } from './snackbar/snackbar.component';
import { Draft } from './../../core/model/draft';
import { Cell } from './../../core/model/cell';
import {MatSnackBar} from '@angular/material/snack-bar';
import { Point, Interlacement, Bounds, DraftMap } from '../../core/model/datatypes';
import { Pattern } from '../../core/model/pattern'; 
import { InkService } from '../../mixer/provider/ink.service';
import {cloneDeep, isBuffer} from 'lodash';
import { LayersService } from '../../mixer/provider/layers.service';
import { Shape } from '../model/shape';
import utilInstance from '../../core/model/util';
import { OperationComponent } from './operation/operation.component';
import { ConnectionComponent } from './connection/connection.component';
import { TreeService } from '../provider/tree.service';
import { FileService, SaveObj } from './../../core/provider/file.service';
import { Timeline } from '../../core/model/timeline';

@Component({
  selector: 'app-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.scss']
})


export class PaletteComponent implements OnInit{

  /**
   * a reference to the default patterns (used for fill operations)
   * @property {Array<Pattern>}
   */ 
  @Input() patterns: Array<Pattern>;
  @Input() timeline: Timeline;
  @Output() onDesignModeChange: any = new EventEmitter();  

  /**
   * A container that supports the automatic generation and removal of the components inside of it
   */
  @ViewChild('vc', {read: ViewContainerRef, static: true}) vc: ViewContainerRef;

  subdraftSubscriptions: Array<Subscription> = [];
  operationSubscriptions: Array<Subscription> = [];
  connectionSubscriptions: Array<Subscription> = [];


/**
 * Subscribes to move event after a touch event is started.
 * @property {Subscription}
 */
  moveSubscription: Subscription;


  selecting_connection: boolean = false;

  connection_op_id:number = -1;

    /**
   * a placeholder to reference a temporary rendering of an union between subdrafts
   * used to preview the changes that will happen if the subdraft is to be dropped at that point
   * @property {SubdraftComponent}
   */
  preview: SubdraftComponent;

  /**
   * a reference to the viewref for the intersection component to ease addign and deleting
   * @property {ViewRef}
   */
  preview_ref: ViewRef;
     
  /**
   * holds a reference to the selection component
   * @property {Selection}
   */
  selection = new SelectionComponent();

  /**
   * holds the data of events drawn on this component (that are not associated with a subdraft)
   * @property {Array<Array<Cell>>}
   */
  scratch_pad: Array<Array<Cell>> = [];

  /**
   * HTML Canvas element that draws the selection and currently cells drawn on this component
   * @property {Canvas}
   */
  canvas: HTMLCanvasElement;
  cx: any;

  /**
   * stores an i and j of the last user selected location within the component
   * @property {Point}
   */
  last: Interlacement;

  /**
   * triggers a class to handle disabling pointerevents when switching modes
   * @property {boolean}
   */
   pointer_events: boolean;

  /**
   * a value to represent the current user defined scale for this component. 
   * @property {number}
   */

   scale: number;

  /**
   * links to the z-index to push the canvas to the front or back of view when freehand drawing. 
   */
   canvas_zndx:number = -1;
  

  /**
   * used to manage the area of the screen that is in view based on scrolling and zooming
   */
   viewport:Bounds;
  
  /**
   * stores the bounds of the shape being drawn
   */
   shape_bounds:Bounds;
  
  /**
   * stores the vtx for freehand shapes
   */
   shape_vtxs:Array<Point>;
  

  /**
   * trackable inputs to snackbar
   */
   snack_message:string;
   snack_bounds: Bounds;
  

  /**
   * Constructs a palette object. The palette supports drawing without components and dynamically
   * creates components from shapes and scribbles on the canvas. 
   * @param design_modes  a reference to the service containing the current design modes and selections
   * @param inks a reference to the service manaing the available inks
   * @param layers a reference to the sercie managing the view layers (z-indexes) of components
   * @param resolver a reference to the factory component for dynamically generating components
   * @param _snackBar _snackBar a reference to the snackbar component that shows data on move and select
   */
  constructor(
    private design_modes: DesignmodesService, 
    private tree: TreeService,
    private inks: InkService, 
    private layers: LayersService, 
    private resolver: ComponentFactoryResolver, 
    private fs: FileService,
    private _snackBar: MatSnackBar) { 
    this.shape_vtxs = [];
    this.viewport = {
      topleft: {x:0, y:0}, 
      width: 0, 
      height:0
    };
    this.pointer_events = true;
  }

/**
 * Called when palette is initailized
 */
  ngOnInit(){
    this.scale = 5;
    this.vc.clear();
  }

  /**
   * Gets references to view items and adds to them after the view is initialized
   */
   ngAfterViewInit(){
    
    const div:HTMLElement = document.getElementById('scrollable-container');
    this.viewport.topleft = {x: div.offsetParent.scrollLeft, y: div.offsetParent.scrollTop};
    this.viewport.width = div.offsetParent.clientWidth;
    this.viewport.height = div.offsetParent.clientHeight;

    this.canvas = <HTMLCanvasElement> document.getElementById("scratch");
    this.cx = this.canvas.getContext("2d");
    
    this.canvas.width = this.viewport.width;
    this.canvas.height = this.viewport.height;

    // this.cx.beginPath();
    // this.cx.rect(20, 20, this.viewport.width-40, this.viewport.height-40);
    // this.cx.stroke();

    this.selection.scale = this.scale;
    this.selection.active = false;
    this.designModeChanged();
  }

  /**
   * unsubscribes to all open subscriptions and clears the view component
   */
  ngOnDestroy(){

    this.unsubscribeFromAll();
    this.vc.clear();
    
  }

  /**
   * the only way to prevent memory leaks is to unsubscribe.
   * since we lose access to tree when a new file is uploaded we must unsubscribe 
   * when any upload action is taking place. If no action takes place, then resubscribe
   */
  unsubscribeFromAll(){
    
    this.subdraftSubscriptions.forEach(element => element.unsubscribe());
    this.operationSubscriptions.forEach(element => element.unsubscribe());
    this.connectionSubscriptions.forEach(element => element.unsubscribe());
  }

  /**
   * resubscribes to each subscription
   */
  resubscribe(){

    this.tree.getDrafts().forEach(element => {
     this.setSubdraftSubscriptions(element);
    });


    this.tree.getOperations().forEach(element => {
      this.setOperationSubscriptions(element)
    });

    this.tree.getConnections().forEach(element => {
    });
  }

  /**
   * called when a new file is loaded
   */
   clearComponents(){
    this.unsubscribeFromAll();
    this.vc.clear();
  }

  
/**
 * called when user scrolls the winidow
 * @param data 
 */
  handleScroll(data: any){
    const div:HTMLElement = document.getElementById('scrollable-container');
    this.viewport.topleft = {x: div.offsetParent.scrollLeft, y: div.offsetParent.scrollTop};
    this.viewport.width = div.offsetParent.clientWidth;
    this.viewport.height = div.offsetParent.clientHeight;

    //update the canvas to this position
    this.canvas.style.top = this.viewport.topleft.y+"px";
    this.canvas.style.left = this.viewport.topleft.x+"px";

  }

  /**
   * removes the view associate with this view ref
   * @param ref 
   */
  removeFromViewContainer(ref: ViewRef){
    const ndx: number = this.vc.indexOf(ref);
    if(ndx != -1) this.vc.remove(ndx);
    else console.log('Error: view ref not found for remvoal');

  }

  /**
   * adds a state to the timeline. This should be called 
   * each time a user performs an action that they should be able to undo/redo
   */
  addTimelineState(){
    const so: string = this.fs.saver.ada(
      'mixer', 
      this.tree.exportDraftsForSaving(),
      [],
      this.patterns,
      "",
      true);

    this.timeline.addMixerHistoryState(so);
    console.log('added timeline state', this.timeline);

  }



  /**
   * called anytime an operation is added
   * @param name 
   */
  addOperation(name:string){
    this.changeDesignmode('operation');
    const op:OperationComponent = this.createOperation(name);
  }

  /**
   * redraws each operation and subdraft at the new scale, then redraws each of their connections
   * @param scale 
   */
  rescale(scale:number){

    this.scale = scale;
    
    const generations: Array<Array<number>> = this.tree.convertTreeToGenerations();

    //rescale all the non connections first, then go through and rescale the connections
    generations.forEach(generation => {
      generation.forEach(node => {
        const comp = this.tree.getComponent(node);
        if(this.tree.getType(node) != "cxn") comp.rescale(scale);
      })
    });

    this.tree.getConnections().forEach(sd => {
      sd.rescale(scale);
    });

    if(this.preview !== undefined) this.preview.scale = this.scale;
  }

  
  /**
   * loads the snackbar at the bottom of the screen
   * @param message the message to show on the snack bar
   * @param bounds the bounds of the element that we are showing info aboout
   */
  startSnackBar(message: string, bounds:Bounds){
    this.updateSnackBar(message, bounds);
    this._snackBar.openFromComponent(SnackbarComponent, {
      data: {
        message: this.snack_message,
        bounds: this.snack_bounds,
        scale: this.scale
      }
    });
  }

  /**
   * updates data shown on the snackbar
   * @param message 
   * @param bounds 
   */
  updateSnackBar(message: string, bounds:Bounds){
    this.snack_bounds = bounds;
    this.snack_message = message;
  }

  /**
   * called to close the snackbar
   */
  closeSnackBar(){
    this._snackBar.dismiss();
  }


  /**
   * called when the palette needs to change the design mode, emits output to parent
   * @param name - the mode to switchh to
   */
  changeDesignmode(name: string) {
    this.design_modes.select(name);
   
    const mode = this.design_modes.getMode(name);
   
    if(!mode.enable_inks){
        this.inks.select('neq');
    }

    this.onDesignModeChange.emit(name);
  }

  // disablePointerEvents(){
  //   this.pointer_events = false;
  // }

  // enablePointerEvents(){
  //   this.pointer_events = true;
  // }

  /**
   * called when a new subdraft is created
   * @param sd 
   */
  setSubdraftSubscriptions(sd: SubdraftComponent){
    this.subdraftSubscriptions.push(sd.onSubdraftDrop.subscribe(this.subdraftDropped.bind(this)));
    this.subdraftSubscriptions.push(sd.onSubdraftMove.subscribe(this.subdraftMoved.bind(this)));
    this.subdraftSubscriptions.push(sd.onSubdraftStart.subscribe(this.subdraftStarted.bind(this)));
    this.subdraftSubscriptions.push(sd.onDeleteCalled.subscribe(this.onDeleteSubdraftCalled.bind(this)));
    this.subdraftSubscriptions.push(sd.onDuplicateCalled.subscribe(this.onDuplicateSubdraftCalled.bind(this)));
    this.subdraftSubscriptions.push(sd.onConnectionMade.subscribe(this.connectionMade.bind(this)));
    this.subdraftSubscriptions.push(sd.onConnectionRemoved.subscribe(this.removeConnection.bind(this)));
    this.subdraftSubscriptions.push(sd.onDesignAction.subscribe(this.onSubdraftAction.bind(this)));
  }

  /**
   * dynamically creates a subdraft component, adds its inputs and event listeners, pushes the subdraft to the list of references
   * @param d a Draft object for this component to contain
   * @returns the created subdraft instance
   */
  createSubDraft(d: Draft):SubdraftComponent{
    const factory = this.resolver.resolveComponentFactory(SubdraftComponent);
    const subdraft = this.vc.createComponent<SubdraftComponent>(factory);
    const id = this.tree.createNode('draft', subdraft.instance, subdraft.hostView);

    this.setSubdraftSubscriptions(subdraft.instance);

    subdraft.instance.draft = d;
    subdraft.instance.id = id;
    subdraft.instance.viewport = this.viewport;
    subdraft.instance.patterns = this.patterns;
    subdraft.instance.ink = this.inks.getSelected(); //default to the currently selected ink
    subdraft.instance.scale = this.scale;
    return subdraft.instance;
  }

  /**
   * loads a subdraft component from data
   * @param d a Draft object for this component to contain
   * @returns the id of the instance created
   */
   loadSubDraft(d: Draft, bounds:Bounds):number{
   
    const sd:SubdraftComponent = this.createSubDraft(d);
    sd.bounds = bounds;
    return sd.id;
  }

  /**
   * called when a new operation is added
   * @param op 
   */
  setOperationSubscriptions(op: OperationComponent){
    this.operationSubscriptions.push(op.onSelectInputDraft.subscribe(this.selectInputDraft.bind(this)));
    this.operationSubscriptions.push(op.onOperationMove.subscribe(this.operationMoved.bind(this)));
    this.operationSubscriptions.push(op.onOperationParamChange.subscribe(this.operationParamChanged.bind(this)));
  }

  /**
   * creates an operation component
   * @param name the name of the operation this component will perform
   * @returns the OperationComponent created
   */
    createOperation(name: string):OperationComponent{
      const factory = this.resolver.resolveComponentFactory(OperationComponent);
      const op = this.vc.createComponent<OperationComponent>(factory);
      const id = this.tree.createNode('op', op.instance, op.hostView);

      this.setOperationSubscriptions(op.instance);

      op.instance.name = name;
      op.instance.id = id;
      op.instance.zndx = this.layers.createLayer();
      op.instance.viewport = this.viewport;
      op.instance.scale = this.scale;
      return op.instance;
    }

    /**
   * loads an operation with the information supplied. 
   * @param name the name of the operation this component will perform
   * @params params the input data to be used in this operation
   * @returns the id of the node this has been assigned to
   */
     loadOperation(name: string, params: Array<number>, bounds:Bounds):number{
      
      const op:OperationComponent = this.createOperation(name);
      
      op.loaded_inputs = params;
      op.bounds.topleft = {x: bounds.topleft.x, y: bounds.topleft.y};
      op.bounds.width = bounds.width;
      op.bounds.height = bounds.height;
      op.loaded = true;

      return op.id;
    }


    /**
     * creates a connection component and registers it with the tree
     * @returns the list of all id's connected to the "to" node 
     */
     createConnection(id_from: number, id_to:number):{input_ids: Array<number>, id: number}{

      const factory = this.resolver.resolveComponentFactory(ConnectionComponent);
      const cxn = this.vc.createComponent<ConnectionComponent>(factory);
      const id = this.tree.createNode('cxn', cxn.instance, cxn.hostView);
      const to_input_ids: Array<number> =  this.tree.addConnection(id_from, id_to, id);
      
      cxn.instance.id = id;
      cxn.instance.scale = this.scale;
      cxn.instance.from = id_from;
      cxn.instance.to = id_to;


      to_input_ids.forEach((el, ndx) => {
        const sd: SubdraftComponent = <SubdraftComponent> this.tree.getComponent(el);
        sd.active_connection_order = ndx+1;
      });

      return {input_ids: to_input_ids, id: id};
    }




  /**
   * called from upload or import events
   * @param d 
   */
  addSubdraftFromDraft(d: Draft){
    console.log("adding from uplaod", d);
    const sd: SubdraftComponent = this.createSubDraft(d);
    sd.setPosition({x: this.viewport.topleft.x, y: this.viewport.topleft.y});
  }

  /**
   * removes the subdraft sent to the function
   * updates the tree view_id's in response
   * @param id {number}  

   */
  removeSubdraft(id: number){

    const parent_id = this.tree.getSubdraftParent(id);

    //removoe the node but get alll the ops before it is removed 
    const ref:ViewRef = this.tree.getViewRef(id);
    const inputs:Array<number> = this.tree.getNonCxnInputs(id);

    inputs.forEach(input => {
      if(this.tree.getType(input) == 'draft'){
        const comp = <SubdraftComponent> this.tree.getComponent(input);
        comp.has_active_connection = false;
        comp.active_connection_order = 0;
      }
    })

    const downstream_ops:Array<number> = this.tree.getDownstreamOperations(id);
    this.tree.removeNode(id);

    const old_cxns:Array<number> = this.tree.getUnusuedConnections();
    old_cxns.forEach(cxn => {
      const cxn_view_ref = this.tree.getViewRef(cxn);
      this.removeFromViewContainer(cxn_view_ref);
      this.tree.removeNode(cxn);
    });    

    //calls manually here so that the affected branches can be pinged before the node is deleted 
    this.recalculateDownstreamDrafts(downstream_ops);
    this.removeFromViewContainer(ref);

    //if it has a parent, recursively call on its parent
    if(parent_id != -1){
      this.removeSubdraft(parent_id);
    }

  }

  /**
   * this function will
   * 1. delete the associated output subdraft
   * 2. recompue downsteam operations
   * 3. delete all input + output connections
   * @param id 
   */
  removeOperation(id:number){
    this.addTimelineState();
  }

    /**
   * dynamically creates a subdraft component with specific requirements of the intersection, adds its inputs and event listeners, pushes the subdraft to the list of references
   * @param d a Draft object for this component to contain
   * @returns the created subdraft instance
   */
  createAndSetPreview(d: Draft){
      const factory = this.resolver.resolveComponentFactory(SubdraftComponent);
      const subdraft = this.vc.createComponent<SubdraftComponent>(factory);
      //note, the preview is not added to the tree, as it will only be added if it eventually accepted by droppings
      subdraft.instance.draft = d;
      subdraft.instance.id = -1;
      subdraft.instance.setAsPreview();
      subdraft.instance.disableDrag();
      this.preview_ref = subdraft.hostView;
      this.preview = subdraft.instance;
      this.preview.scale = this.scale;
    }

  hasPreview():boolean{
      if(this.preview_ref === undefined) return false;
      return true;
  }

  /**
   * destorys the 
   * @param d a Draft object for this component to contain
   * @returns the created subdraft instance
   */
  removePreview(){
      const ndx = this.vc.indexOf(this.preview_ref);
      this.vc.remove(ndx);
      this.preview_ref = undefined;
      this.preview = undefined;
  }

  /**
   * Called from mixer when it receives a change from the design mode tool or keyboard press
   * triggers view mode changes required for this mode
   */
  public designModeChanged(){

    if(this.design_modes.isSelected('move')){
      this.unfreezePaletteObjects();

    }else{
      this.freezePaletteObjects();
    }

    // if(this.design_modes.isSelected('operation')){
    //   this.disablePointerEvents();
    // }else{
    //   this.enablePointerEvents();
    // }


  }

  /**
   * specifically removes the subscription from the move event
   */
   private removeSubscription() {    
    if (this.moveSubscription) {
      this.moveSubscription.unsubscribe();
    }
  }

  /**
   * draws the selection atop the view
   * todo: update this to account for scroll
   * @param ndx 
   */
  private drawSelection(ndx: Interlacement){


    this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const bounds ={
      top: this.selection.start.j*this.scale,
      left: this.selection.start.i*this.scale,
      bottom: ndx.j *this.scale,
      right: ndx.i*this.scale
    };

    //will draw on outside of selection
    this.cx.beginPath();
    this.cx.strokeStyle = "#ff4081";
    this.cx.lineWidth = 1;
    this.cx.setLineDash([this.scale, 2]);
    this.cx.strokeRect(bounds.top, bounds.left, bounds.bottom-bounds.top, bounds.right-bounds.left);
      
  }

  /**
   * Takes an absolute index and returns it to an index relative to the viewport. 
   * @param abs 
   * @returns 
   */
  private getRelativeInterlacement(abs: Interlacement) : Interlacement {
    const i_offset: number = Math.floor(this.viewport.topleft.y / this.scale);
    const j_offset: number = Math.floor(this.viewport.topleft.x / this.scale);
    const rel: Interlacement = {
      i: abs.i - i_offset,
      j: abs.j - j_offset,
      si: -1
    }

    return rel;
  }


  /**
   * sets the value of the scratchpad cell at ndx
   * checks for self interselcting 
   * @param ndx (i,j)
   */
  private setCell(ndx: Interlacement){

    const rel: Interlacement = this.getRelativeInterlacement(ndx);
    const c: Cell = this.scratch_pad[rel.i][rel.j];
    if(this.inks.getSelected() === "down") c.setHeddle(false);
    else c.setHeddle(true);
    //use the code below to use past scratchpad values, but this seems wrong
    // console.log(c);
    // const val: boolean = c.isSet(); //check for a previous value
    // c.setHeddle(true);

    // if(val){
    //   const newval:boolean = this.computeCellValue(this.inks.getSelected(), c, val);
    //   console.log("setting to", newval);
    //   c.setHeddle(newval);
    // } 
  }

  /**
   * called by drawcell. Draws on screen based on the current ink
   * @param ink 
   * @param over 
   * @param under 
   * @returns 
   */
  private computeCellColor(ink: string, over: Cell, under: boolean): string{

    const res: boolean = this.computeCellValue(ink, over, under);
    if(ink === 'unset' && res == true) return "#cccccc"; 
    if(res ===null) return "#fafafa";
    if(res) return "#000000";
    return "#ffffff";      
  }

  /**
   * applies the filter betetween over and under and returns the result
   * @param ink the ink with which to compute the transition
   * @param over the value of the primary (top) cell
   * @param under the value of the intersecting (bottom) cell 
   * @returns 
   */
  private computeCellValue(ink: string, over: Cell, under: boolean): boolean{
    
    let res: boolean = utilInstance.computeFilter(ink, over.getHeddle(), under);
    return res;   
  }

  /**
   * called when creating a subdraft from the drawing on the screen. Computes the resulting value based on
   * all intersections with the drawing
   * @param ndx the i,j location of the cell we are checking
   * @param ink the currently selected ink
   * @param over the Cell we are checking against
   * @returns true/false or null
   */
  private getScratchpadProduct(ndx: Interlacement, ink: string, over: Cell): boolean{
    
    switch(ink){
      case 'neq':
      case 'and':
      case 'or':

        const p = {x: ndx.j * this.scale, y: ndx.i * this.scale};
        const isect = this.getIntersectingSubdraftsForPoint(p);
  
        if(isect.length > 0){
          const prev: boolean = isect[0].resolveToValue(p);
          return this.computeCellValue(ink, over, prev);
        }else{
          return this.computeCellValue(ink, over, null);
        }
      break;

      default: 
        return this.computeCellValue(ink, over, null);
      break;
    }
   return null; 
  }
 

  /**
   * draw the cell at position ndx
   * @param ndx (i,j)
   */
  private drawCell(ndx: Interlacement){

    const rel: Interlacement = this.getRelativeInterlacement(ndx);
    const c: Cell = this.scratch_pad[rel.i][rel.j];
    this.cx.fillStyle = "#cccccc";
  
    const selected_ink:string = this.inks.getSelected();

    switch(selected_ink){
      case 'neq':
      case 'and':
      case 'or':

        const p = {x: ndx.j * this.scale, y: ndx.i * this.scale};
        const isect = this.getIntersectingSubdraftsForPoint(p);

        if(isect.length > 0){
          const prev: boolean = isect[0].resolveToValue(p);
          this.cx.fillStyle = this.computeCellColor(selected_ink, c, prev);
        }else{
          this.cx.fillStyle =  this.computeCellColor(selected_ink, c, null);;
        }
      break;

      default: 
        this.cx.fillStyle = this.computeCellColor(selected_ink, c, null);
      break;

    }

      this.cx.fillRect(rel.j*this.scale, rel.i*this.scale, this.scale, this.scale);      
  }

  /**
   * Deletes the subdraft that called this function.
   */
    onDeleteSubdraftCalled(obj: any){
      
      console.log("deleting "+obj.id);
      if(obj === null) return;
      this.removeSubdraft(obj.id);
      this.addTimelineState();
   }

     /**
   * Deletes the subdraft that called this function.
   */
    onDuplicateSubdraftCalled(obj: any){
        console.log("duplicating "+obj.id);
        if(obj === null) return;
        const sd = <SubdraftComponent> this.tree.getComponent(obj.id);
        const new_sd:SubdraftComponent = this.createSubDraft(new Draft({wefts: sd.draft.wefts, warps: sd.draft.warps, pattern: sd.draft.pattern}));
        new_sd.setComponentSize(sd.bounds.width, sd.bounds.height);
        new_sd.setComponentPosition({
          x: sd.bounds.topleft.x + sd.bounds.width + this.scale *2, 
          y: sd.bounds.topleft.y});
        new_sd.drawDraft();
        this.addTimelineState();
   }

  /**
   * A mouse event, originated in a subdraft, has been started
   * checkes the design mode and handles the event as required
   * @param obj contains the id of the moving subdraft
   */
  subdraftStarted(obj: any){
    if(obj === null) return;

    if(this.design_modes.isSelected("move")){
  
      //get the reference to the draft that's moving
      const moving = <SubdraftComponent> this.tree.getComponent(obj.id);
      if(moving === null) return; 


      this.startSnackBar("Using Ink: "+moving.ink, moving.bounds);
      
      const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(moving);

      if(isect.length == 0) return;
      
      const bounds: any = utilInstance.getCombinedBounds(moving, isect);
      const temp: Draft = this.getCombinedDraft(bounds, moving, isect);
      this.createAndSetPreview(temp);
      this.preview.drawDraft();
      this.preview.setComponentPosition(bounds.topleft);
     
    }else if(this.design_modes.isSelected("select")){
      this.selectionStarted();
    }else if(this.design_modes.isSelected("draw")){
      this.drawStarted();
    }

 }

 /**
  * triggers a mode that allows mouse-mouse to be followed by a line.
  * todo; add code that holds the point on scroll
  * @param obj - contains event, id of component who called
  */
 selectInputDraft(obj: any){
  this.connection_op_id = obj.id;
  const op: OperationComponent = <OperationComponent> this.tree.getComponent(obj.id);
  this.changeDesignmode('operation');
  this.connectionStarted(op.bounds.topleft);

 }

 /**
 * adds a connector flag to any subdrafts that we are allowed to connect to from this operation
 */
  setDraftsConnectable(op_id: number){
    const nodes: Array<SubdraftComponent> = this.tree.getDrafts();
    const op: OperationComponent = <OperationComponent> this.tree.getComponent(op_id);
    const inputs: Array<number> = this.tree.getInputs(op_id);
    if(inputs.length >= op.maxInputs()){
      nodes.forEach(el => {
        el.unsetConnectable();

        //now unset the ones that are already assigned to other ops
        const connections: Array<number> = this.tree.getNonCxnOutputs(el.id);
        const op_ndx: number = connections.findIndex(id => (id === op_id));
        //if it had connections and the connection was not this operation, unset it
        if(op_ndx !== -1){
          el.setConnectable();
        }    
      });
    }else{

      nodes.forEach(el => {

        //look upstream to see if this operation is linked in any way to this op
        const upstream: Array<number> = this.tree.getUpstreamOperations(el.id);
        const ndx: number = upstream.findIndex(i => i === op_id);
        if(ndx === -1) el.setConnectable();
  
        //now unset the ones that are already assigned to other ops
        const connections: Array<number> = this.tree.getOutputs(el.id);
        const ops: Array<number> = connections.map(cxn => this.tree.getConnectionOutput(cxn));
        const op_ndx: number = ops.findIndex(op => (op === op_id));
        //if it had connections and the connection was not this operation, unset it
        if(ops.length > 0 && op_ndx === -1){
          el.unsetConnectable();
        }    
  
      });
    }

    const ops: Array<OperationComponent> = this.tree.getOperations();
    ops.forEach(op => {
      if(op.id != op_id) op.active_connection = true;
    });
   
   }

    /**
 * disables selection and pointer events on all
 */
  unsetDraftsConnectable(){
    const nodes: Array<SubdraftComponent> = this.tree.getDrafts();
    nodes.forEach(el => {
      el.unsetConnectable();
    });

    const ops: Array<OperationComponent> = this.tree.getOperations();
    ops.forEach(op => {
      op.active_connection = false;
    });

   }

/**
 * disables selection and pointer events on all
 */
 freezePaletteObjects(){
  const nodes: Array<any> = this.tree.getComponents();
  nodes.forEach(el => {
    el.disableDrag();
  });
 }

 /**
 * unfreezes all palette objects (except connections)
 */
  unfreezePaletteObjects(){
    const nodes: Array<any> = this.tree.getComponents();
    nodes.forEach(el => {
      if(el.type != 'cxn') el.enableDrag();
    });
   }
  

 /**
  * called when a connection event starts
  */
 connectionStarted(topleft: Point){
  this.selecting_connection = true;
  this.unfreezePaletteObjects();
  this.setDraftsConnectable(this.connection_op_id);

  this.shape_bounds = {
    topleft: topleft,
    width: this.scale,
    height: this.scale
  };

  this.startSnackBar("Click an empty space on the palette to stop selecting", this.shape_bounds);
 }

 /**
   * draws when a user is using the mouse to identify an input to a component
   * @param mouse the absolute position of the mouse on screen
   * @param shift boolean representing if shift is pressed as well 
   */
connectionDragged(mouse: Point, shift: boolean){

  this.shape_bounds.width =  (mouse.x - this.shape_bounds.topleft.x);
  this.shape_bounds.height =  (mouse.y - this.shape_bounds.topleft.y);

  if(shift){

  }

  this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.cx.beginPath();
  // this.cx.fillStyle = "#ff4081";
  // this.cx.strokeStyle = "#ff4081";
   this.cx.fillStyle = "#0000ff";
   this.cx.strokeStyle = "#0000ff";
  this.cx.setLineDash([this.scale, 2]);
  this.cx.lineWidth = 2;


  this.cx.moveTo(this.shape_bounds.topleft.x+this.scale, this.shape_bounds.topleft.y+this.scale);
  this.cx.lineTo(this.shape_bounds.topleft.x + this.shape_bounds.width, this.shape_bounds.topleft.y + this.shape_bounds.height);
  this.cx.stroke();
 

}


/**
 * resets the view when a connection event ends
 */
 processConnectionEnd(){
  this.closeSnackBar();
  this.selecting_connection = false;
  this.unsetDraftsConnectable();
  this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);

  if(this.connection_op_id == -1 ) return;
  const op: OperationComponent = <OperationComponent> this.tree.getComponent(this.connection_op_id);
  op.unsetActiveConnection();
  this.connection_op_id = -1;
} 

/**
 * given a node id, calculate any drafts that take place "downstream" from this draft
 * @param id 
 */
recalculateDownstreamDrafts(downstream_ops:Array<number>){
  //recalculate downstream drafts
  downstream_ops.forEach(op => {
    
    this.performOp(op);

  });
}


performOp(op_id:number){
  
  const op:OperationComponent = <OperationComponent>this.tree.getComponent(op_id);

  const inputs: Array<number> =  this.tree.getNonCxnInputs(op_id);


  const input_drafts: Array<Draft> = inputs.map(input => {
    const  sd:SubdraftComponent = <SubdraftComponent> this.tree.getNode(input).component;
    return sd.draft;
   });

  
  const draft_map: Array<DraftMap> = op.perform(input_drafts);


  const leftoffset: Point = {x: op.bounds.topleft.x, y: op.bounds.topleft.y};  
  
  draft_map.forEach(el => {
    let sd:SubdraftComponent = null;

    if(el.component_id >= 0){
       sd = <SubdraftComponent> this.tree.getComponent(el.component_id);
       sd.setNewDraft(el.draft);
       leftoffset.x = sd.bounds.topleft.x + sd.bounds.width + this.scale * 2;
    }else{
      sd = this.createSubDraft(el. draft);
      op.addOutput({component_id: sd.id, draft:el.draft});
      sd.setComponentPosition({x: leftoffset.x, y: leftoffset.y + op.bounds.height});
      sd.setComponentSize(el.draft.warps * this.scale, el.draft.wefts * this.scale);
      sd.setParent(op.id);
      this.createConnection(op.id, sd.id);
      this.tree.setSubdraftParent(sd.id, op.id);
      
    }

    op.setWidth(sd.bounds.width);
    sd.drawDraft();
  });

}

/**
 * emitted from subdraft when it receives a hit on its connection button, the id refers to the subdraft id
 */
connectionMade(sd_id:number){

  //this is defined in the order that the line was drawn
  // const sd:SubdraftComponent = <SubdraftComponent>this.tree.getComponent(id);
  this.createConnection(sd_id, this.connection_op_id);
  this.performOp(this.connection_op_id);
  this.processConnectionEnd();
  this.addTimelineState();

}

/**
 * emitted from subdraft when it receives a hit on its connection button but already 
 * had something assigned there
 * @param id the subdraft id that called the function
 */
 removeConnection(sd_id:number){


  const cxn:ConnectionComponent = <ConnectionComponent>this.tree.getConnectionComponentFromSubdraft(sd_id);
  const from: number = this.tree.getConnectionInput(cxn.id); // get the outputs from this conection - thre should only be one
  const to:number = this.tree.getConnectionOutput(cxn.id); // get the outputs from this conection - thre should only be one
  const downstream:Array<number> = this.tree.getDownstreamOperations(cxn.id);
  const inputs_to_update: Array<number> = this.tree.getNonCxnInputs(to);
  const from_comp: any = this.tree.getComponent(from);
  const from_order_id = from_comp.active_connection_order;
  
  //upddate the assignment order on input subdrafts
  inputs_to_update.forEach((el) => {
    const comp: any = this.tree.getComponent(el);
    if(comp.active_connection_order == from_order_id) comp.active_connection_order = 0;
    if(comp.active_connection_order > from_order_id) comp.active_connection_order--;
  });

  const view_ref = this.tree.getViewRef(cxn.id);
  this.removeFromViewContainer(view_ref);
  this.tree.removeNode(cxn.id);
  const to_delete:Array<number> = this.tree.getUnusuedConnections();
  if(to_delete.length > 0) console.log("Error: Removing Connection triggered other deletions");

  //this list has to be calculated before the node is deleted, and udpated after
  this.recalculateDownstreamDrafts(downstream);
  this.processConnectionEnd();
  this.addTimelineState();


}

 

 selectionStarted(){

  this.selection.start = this.last;
  this.selection.active = true;
  this.startSnackBar("Select Drafts to Join", this.selection.bounds);
 }

 /**
 * brings the base canvas to view and begins to render the
 * @param mouse the absolute position of the mouse on screen
 */
shapeStarted(mouse: Point){

  const rel:Point = {
    x: mouse.x - this.viewport.topleft.x,
    y: mouse.y - this.viewport.topleft.y
  }
  
  this.shape_bounds = {
    topleft: rel,
    width: this.scale,
    height: this.scale
  };


  this.shape_vtxs = [];
  this.canvas_zndx = this.layers.createLayer(); //bring this canvas forward
  this.cx.fillStyle = "#ff4081";
  this.cx.fillRect( this.shape_bounds.topleft.x, this.shape_bounds.topleft.y, this.shape_bounds.width,this.shape_bounds.height);
  
  if(this.design_modes.isSelected('free')){
    this.startSnackBar("CTRL+Click to end drawing", this.shape_bounds);
  }else{
    this.startSnackBar("Press SHIFT while dragging to constrain shape", this.shape_bounds);
  }
 

}

  /**
   * resizes and redraws the shape between the the current mouse and where the shape started
   * @param mouse the absolute position of the mouse on screen
   */
shapeDragged(mouse: Point, shift: boolean){

  const rel:Point = {
    x: mouse.x - this.viewport.topleft.x,
    y: mouse.y - this.viewport.topleft.y
  }

  this.shape_bounds.width =  (rel.x - this.shape_bounds.topleft.x);
  this.shape_bounds.height =  (rel.y - this.shape_bounds.topleft.y);

  if(shift){
    const max: number = Math.max(this.shape_bounds.width, this.shape_bounds.height);
    
    //allow lines to snap to coords
    if(this.design_modes.isSelected('line')){
        if(Math.abs(this.shape_bounds.width) < Math.abs(this.shape_bounds.height/2)){
          this.shape_bounds.height = max;
          this.shape_bounds.width = this.scale;
        }else if(Math.abs(this.shape_bounds.height) < Math.abs(this.shape_bounds.width/2)){
          this.shape_bounds.width = max;
          this.shape_bounds.height = this.scale;
        }else{
          this.shape_bounds.width = max;
          this.shape_bounds.height = max;  
        }
        
    }else{
      this.shape_bounds.width = max;
      this.shape_bounds.height = max;    
  
    }
  }

  this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.cx.beginPath();
  this.cx.fillStyle = "#ff4081";
  this.cx.strokeStyle = "#ff4081";
  this.cx.setLineDash([]);
  this.cx.lineWidth = this.scale;

  if(this.design_modes.isSelected('line')){
    this.cx.moveTo(this.shape_bounds.topleft.x+this.scale, this.shape_bounds.topleft.y+this.scale);
    this.cx.lineTo(this.shape_bounds.topleft.x + this.shape_bounds.width, this.shape_bounds.topleft.y + this.shape_bounds.height);
    this.cx.stroke();
  }else if(this.design_modes.isSelected('fill_circle')){
    this.shape_bounds.width = Math.abs(this.shape_bounds.width);
    this.shape_bounds.height = Math.abs(this.shape_bounds.height);
    this.cx.ellipse(this.shape_bounds.topleft.x, this.shape_bounds.topleft.y, this.shape_bounds.width, this.shape_bounds.height, 2 * Math.PI, 0,  this.shape_bounds.height/2);
    this.cx.fill();
  }else if(this.design_modes.isSelected('stroke_circle')){
    this.cx.ellipse(this.shape_bounds.topleft.x, this.shape_bounds.topleft.y, this.shape_bounds.width, this.shape_bounds.height, 2 * Math.PI, 0,  this.shape_bounds.height/2);
    this.cx.stroke();
  }else if(this.design_modes.isSelected('fill_rect')){
    this.cx.fillRect(this.shape_bounds.topleft.x, this.shape_bounds.topleft.y,this.shape_bounds.width,this.shape_bounds.height);
  
  }else if(this.design_modes.isSelected('stroke_rect')){
    this.cx.strokeRect(this.shape_bounds.topleft.x + this.scale, this.shape_bounds.topleft.y+ this.scale,this.shape_bounds.width- this.scale,this.shape_bounds.height-this.scale);

  }else{

    if(this.shape_vtxs.length > 1){
      this.cx.moveTo(this.shape_vtxs[0].x, this.shape_vtxs[0].y);

      for(let i = 1; i < this.shape_vtxs.length; i++){
        this.cx.lineTo(this.shape_vtxs[i].x, this.shape_vtxs[i].y);
        //this.cx.moveTo(this.shape_vtxs[i].x, this.shape_vtxs[i].y);
      }

    }else{
      this.cx.moveTo(this.shape_bounds.topleft.x, this.shape_bounds.topleft.y);
    }

    this.cx.lineTo(this.shape_bounds.topleft.x + this.shape_bounds.width, this.shape_bounds.topleft.y + this.shape_bounds.height);
    this.cx.stroke();
    this.cx.fill();
    
  }

  if(this.design_modes.isSelected('free')){
    this.updateSnackBar("CTRL+click to end drawing", this.shape_bounds);
  }else{
    this.updateSnackBar("Press SHIFT to contstrain shape", this.shape_bounds);
  }
}

/**
 * converts the shape on screen to a component
 */
processShapeEnd(){

  this.closeSnackBar();

  //if circle, the topleft functoins as the center and the bounsd need to expand to fit the entire shape 
  if(this.design_modes.isSelected('fill_circle') || this.design_modes.isSelected('stroke_circle')){
    this.shape_bounds.topleft.x -=  this.shape_bounds.width;
    this.shape_bounds.topleft.y -=  this.shape_bounds.height;
    this.shape_bounds.width *=2;
    this.shape_bounds.height *= 2;
  }else if(this.design_modes.isSelected('free')){
    
    if(this.shape_vtxs.length === 0) return;
      //default to current segment
    let top = this.shape_bounds.topleft.y;
    let left = this.shape_bounds.topleft.x;
    let bottom = this.shape_bounds.topleft.y +this.shape_bounds.height;
    let right = this.shape_bounds.topleft.x +this.shape_bounds.width;
    
    //iteraate through the poitns and find the leftmost and topmost 
    for(let i = 1; i < this.shape_vtxs.length; i++ ){
        if(this.shape_vtxs[i].y < top) top = this.shape_vtxs[i].y;
        if(this.shape_vtxs[i].x < left) left = this.shape_vtxs[i].x;
        if(this.shape_vtxs[i].y > bottom) bottom = this.shape_vtxs[i].y;
        if(this.shape_vtxs[i].x > right) right = this.shape_vtxs[i].x;
    }

    this.shape_bounds.topleft = {x: left, y: top};
    this.shape_bounds.width = right - left;
    this.shape_bounds.height = bottom - top;

    this.shape_vtxs = [];
    
  }else{
    if( this.shape_bounds.width < 0){
      this.shape_bounds.width = Math.abs(this.shape_bounds.width);
      this.shape_bounds.topleft.x-= this.shape_bounds.width
    }  

    if( this.shape_bounds.height < 0){
      this.shape_bounds.height = Math.abs(this.shape_bounds.height);
      this.shape_bounds.topleft.y-= this.shape_bounds.height
    }  
  }
  
  const shape: Shape = new Shape(this.canvas, this.shape_bounds, this.scale); 
  //const img_data = shape.getImageData();
  // this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  // this.cx.putImageData(img_data, 0, 0);
  const pattern: Array<Array<Cell>> = shape.getDraft();

  const wefts: number = pattern.length;
  if(wefts <= 0) return;
  const warps: number = pattern[0].length;

  const sd:SubdraftComponent = this.createSubDraft(new Draft({wefts: wefts,  warps: warps, pattern: pattern}));
  sd.setComponentPosition(this.shape_bounds.topleft);
  sd.setComponentSize(this.shape_bounds.width, this.shape_bounds.height);
  sd.disableDrag();

  this.addTimelineState();

  
}

/**
 * clears the scratchpad for the new drawing event
 */
drawStarted(){

  this.canvas_zndx = this.layers.createLayer(); //bring this canvas forward
  this.scratch_pad = [];
  for(let i = 0; i < this.canvas.height; i+=this.scale ){
      const row = [];
      for(let j = 0; j< this.canvas.width; j+=this.scale ){
          row.push(new Cell(null));
      }
    this.scratch_pad.push(row);
    }

    this.startSnackBar("Drag to Draw", null);
  }


  /**
   * gets the bounds of a drawing on the scratchpad, a drawing is represented by set cells
   * @returns an object representing the bounds in the format of i, j (the row, column index of the pad)
   */
  getScratchPadBounds(): Array<Interlacement>{
    let bottom: number = 0;
    let right: number = 0;
    let top: number = this.scratch_pad.length-1;
    let left: number = this.scratch_pad[0].length-1;

    for(let i = 0; i < this.scratch_pad.length; i++ ){
      for(let j = 0; j<  this.scratch_pad[0].length; j++){
        if((this.scratch_pad[i][j].isSet())){
          if(i < top) top = i;
          if(j < left) left = j;
          if(i > bottom) bottom = i;
          if(j > right) right = j;
        } 
      }
    }

    return [{i: top, j: left, si: -1}, {i: bottom, j: right, si: -1}];

  }

  /**
   * handles checks and actions to take when drawing event ends
   * gets the boudary of drawn segment and creates a subdraft containing that drawing
   * if the drawing sits on top of an existing subdraft, merge the drawing into that subdraft (extending the original if neccessary)
   * @returns 
   */
  processDrawingEnd(){

    this.canvas_zndx = -1;

    if(this.scratch_pad === undefined) return;
    if(this.scratch_pad[0] === undefined) return;
    
    const corners: Array<Interlacement> = this.getScratchPadBounds();
    const warps = corners[1].j - corners[0].j + 1;
    const wefts = corners[1].i - corners[0].i + 1;

  
    //there must be at least one cell selected
    if(warps < 1 || wefts < 1){
      this.scratch_pad = undefined;
      return;
    } 

    //if this drawing does not intersect with any existing subdrafts, 
    const sd:SubdraftComponent = this.createSubDraft(new Draft({wefts: wefts,  warps: warps}));
    const pos = {
      topleft: {x: this.viewport.topleft.x + (corners[0].j * this.scale), y: this.viewport.topleft.y + (corners[0].i * this.scale)},
      width: warps * this.scale,
      height: wefts * this.scale
    }
    console.log(pos);

    sd.setComponentPosition(pos.topleft);
    sd.setComponentSize(pos.width, pos.height);
    sd.disableDrag();


    for(let i = 0; i < sd.draft.wefts; i++ ){
      for(let j = 0; j< sd.draft.warps; j++){
        const c = this.scratch_pad[corners[0].i+i][corners[0].j+j];
        const b = this.getScratchpadProduct({i:i, j:j, si:-1}, this.inks.getSelected(),c);
        sd.draft.pattern[i][j].setHeddle(b); 
      }
    }

    const had_merge = this.mergeSubdrafts(sd);
    console.log("had a merge?", had_merge);
    this.addTimelineState();

  }

  /**
   * update the viewport when the window is resized
   * @param event 
   */
  @HostListener('window:resize', ['$event'])
    onResize(event) {
      this.viewport.width = event.target.innerWidth;
      this.viewport.height = event.target.innerHeight;

      this.canvas.width = this.viewport.width;
      this.canvas.height = this.viewport.height;
    }


 /**
  * handles actions to take when the mouse is down inside of the palette
  * @param event the mousedown event
  */
  @HostListener('mousedown', ['$event'])
    private onStart(event) {

      const ctrl: boolean = event.ctrlKey;
      const mouse:Point = {x: this.viewport.topleft.x + event.clientX, y:this.viewport.topleft.y+event.clientY};
      const ndx:any = utilInstance.resolveCoordsToNdx(mouse, this.scale);

      //use this to snap the mouse to the nearest coord
      mouse.x = ndx.j * this.scale;
      mouse.y = ndx.i * this.scale;

      
      this.last = ndx;
      this.selection.start = this.last;
      this.removeSubscription();    
      
     
      if(this.design_modes.isSelected("select")){
          this.selectionStarted();
          this.moveSubscription = 
          fromEvent(event.target, 'mousemove').subscribe(e => this.onDrag(e)); 
    
      }else if(this.design_modes.isSelected("draw")){
        this.moveSubscription = 
        fromEvent(event.target, 'mousemove').subscribe(e => this.onDrag(e)); 
  
          this.drawStarted();    
          this.setCell(ndx);
          this.drawCell(ndx); 
      }else if(this.design_modes.isSelected("shape")){
        this.moveSubscription = 
        fromEvent(event.target, 'mousemove').subscribe(e => this.onDrag(e)); 
  

        if(this.design_modes.isSelected('free')){
          if(ctrl){
            this.processShapeEnd();
            this.changeDesignmode('move');
            this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          }else{
            if(this.shape_vtxs.length == 0) this.shapeStarted(mouse);
            this.shape_vtxs.push(mouse);
          }
            
          
        }else{
          this.shapeStarted(mouse);
        }
      }else if(this.design_modes.isSelected("operation")){
        this.processConnectionEnd();
        this.changeDesignmode('move');
      }
  }


  @HostListener('mousemove', ['$event'])
  private onMove(event) {
    const shift: boolean = event.shiftKey;
    const mouse:Point = {x: this.viewport.topleft.x + event.clientX, y:this.viewport.topleft.y+event.clientY};
    const ndx:any = utilInstance.resolveCoordsToNdx(mouse, this.scale);
    mouse.x = ndx.j * this.scale;
    mouse.y = ndx.i * this.scale;

    if(this.design_modes.isSelected('free') && this.shape_vtxs.length > 0){
      this.shapeDragged(mouse, shift);
    }else if(this.selecting_connection){
      this.connectionDragged(mouse, shift);
    }
  }
  
 /**
  * called when the operation input is selected and used to draw
   * @param event the event object
   */
  mouseSelectingDraft(event: any, id: number){

    const shift: boolean = event.shiftKey;
    const mouse: Point = {x: this.viewport.topleft.x + event.clientX, y:this.viewport.topleft.y+event.clientY};
    const ndx:Interlacement = utilInstance.resolveCoordsToNdx(mouse, this.scale);
    //use this to snap the mouse to the nearest coord
    mouse.x = ndx.j * this.scale;
    mouse.y = ndx.i * this.scale;

    if(utilInstance.isSameNdx(this.last, ndx)) return;

    if(this.design_modes.isSelected("operation")){

     
    
    }
    
    this.last = ndx;
  }

  /**
   * called form the subscription created on start, checks the index of the location and returns null if its the same
   * @param event the event object
   */
  onDrag(event){


    const shift: boolean = event.shiftKey;
    const mouse: Point = {x: this.viewport.topleft.x + event.clientX, y:this.viewport.topleft.y+event.clientY};
    const ndx:Interlacement = utilInstance.resolveCoordsToNdx(mouse, this.scale);
    //use this to snap the mouse to the nearest coord
    mouse.x = ndx.j * this.scale;
    mouse.y = ndx.i * this.scale;

    if(utilInstance.isSameNdx(this.last, ndx)) return;

    if(this.design_modes.isSelected("select")){

     this.drawSelection(ndx);
     const bounds = this.getSelectionBounds(this.selection.start,  this.last);    
     this.selection.setPositionAndSize(bounds);
     this.updateSnackBar("Select Drafts to Join",  this.selection.bounds);

    
    }else if(this.design_modes.isSelected("draw")){
      this.setCell(ndx);
      this.drawCell(ndx);
    }else if(this.design_modes.isSelected("shape")){
      this.shapeDragged(mouse, shift);
    }
    
    this.last = ndx;
  }

  

/**
 * Called when the mouse is up or leaves the boundary of the view
 * @param event 
 * @returns 
 */
  @HostListener('mouseleave', ['$event'])
  @HostListener('mouseup', ['$event'])
     private onEnd(event) {

      //if this.last is null, we have a mouseleave with no mousestart
      if(this.last === undefined) return;
      const mouse: Point = {x: this.viewport.topleft.x + event.clientX, y:this.viewport.topleft.y+event.clientY};
      const ndx:Interlacement = utilInstance.resolveCoordsToNdx(mouse, this.scale);
      //use this to snap the mouse to the nearest coord
      mouse.x = ndx.j * this.scale;
      mouse.y = ndx.i * this.scale;

      this.removeSubscription();   

      if(this.design_modes.isSelected("select")){
        if(this.selection.active)this.processSelection();
        this.closeSnackBar();
        this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.changeDesignmode('move');


      }else if(this.design_modes.isSelected("draw")){
        this.processDrawingEnd();
        this.closeSnackBar();
        this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.changeDesignmode('move');



      }else if(this.design_modes.isSelected("shape")){
        if(!this.design_modes.isSelected('free')){
          this.processShapeEnd();
          this.changeDesignmode('move');
          this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
      }

      //unset vars that would have been created on press
      this.scratch_pad = undefined;
      this.last = undefined;
      this.selection.active = false;
  }
  
 
  /**
   * Called when a selection operation ends. Checks to see if this selection intersects with any subdrafts and 
   * merges and or splits as required. 
   */
  processSelection(){

    this.closeSnackBar();

    //create the selection as subdraft
    const bounds:Bounds = this.getSelectionBounds(this.selection.start,  this.last);    
    
    const sc:SubdraftComponent = this.createSubDraft(new Draft({wefts: bounds.height/this.scale, warps: bounds.width/this.scale}));
    sc.setComponentBounds(bounds);
    sc.disableDrag();
    
    //get any subdrafts that intersect the one we just made
    const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(sc);

    if(isect.length == 0){
      this.addTimelineState();
      return;
    } 

    //get a draft that reflects only the poitns in the selection view
    const new_draft: Draft = this.getCombinedDraft(bounds, sc, isect);
    sc.setNewDraft(new_draft);
    sc.drawDraft();

    isect.forEach(el => {
      const ibound = utilInstance.getIntersectionBounds(sc, el);

      if(el.isSameBoundsAs(ibound)){
         console.log("Component had same Bounds as Intersection, Consumed");
         this.removeSubdraft(el.id);
      }else{
         const sd_draft = el.draft.pattern;
         for(let i = 0; i < sd_draft.length; i++){
           for(let j = 0; j < sd_draft[i].length; j++){
           
              let p:Point = el.resolveNdxToPoint({i: i, j: j, si: -1});
              p.x += this.scale/2;
              p.y += this.scale/2;
              if(sc.hasPoint(p)) sd_draft[i][j].unsetHeddle();
           }
         }
         
        el.drawDraft();
        }
    });
    this.addTimelineState();

  }


  /**
   * this function will update any components that should move when the compoment passed by obj moves
   * moves all compoments returned from tree.getNodesToUpdate(). All changes to what updates should be 
   * handled by getNodesToUpdateOnMove
   * @param obj 
   */
  updateAttachedComponents(obj: any){

    const moving : any = this.tree.getComponent(obj.id);
    const updates: Array<number> = this.tree.getNodesToUpdateOnMove(obj.id);


    updates.forEach(u => {
      const type: string = this.tree.getType(u);
      const u_comp = this.tree.getComponent(u);
      
      //if this is a node that didn't call the command, its a parent or child. 
      if(obj.id !== u){

         if(type=='op') u_comp.setPosition({x: obj.point.x, y: obj.point.y - 30});
         if(type=='draft') u_comp.setPosition({x: obj.point.x, y: obj.point.y + 30});         
      
         const cxns: Array<number> = this.tree.getNodeConnections(u);

         cxns.forEach(cxn => {
           const comp: ConnectionComponent = <ConnectionComponent>this.tree.getComponent(cxn);
            if(type=='op') comp.updatePositionAndSize(u_comp.id,  {x: obj.point.x, y: obj.point.y-30}, u_comp.bounds.width, u_comp.bounds.height);
            if(type=='draft') comp.updatePositionAndSize(u_comp.id, {x: obj.point.x, y: obj.point.y}, u_comp.bounds.width, u_comp.bounds.height);  
         });
      
      }else{
        const cxns: Array<number> = this.tree.getNodeConnections(u);
        cxns.forEach(cxn => {
          const comp: ConnectionComponent = <ConnectionComponent>this.tree.getComponent(cxn);
          comp.updatePositionAndSize(moving.id, obj.point, moving.bounds.width, moving.bounds.height);
        })
      }
     }); 
  }


  /**
   * emitted from a subdraft when an internal action has changeded its value 
   * checks for a child subdraft, recomputes, redraws. 
   * @param obj with attribute id describing the subdraft that called this
   * @returns 
   */
  onSubdraftAction(obj: any){
    console.log("on subdraft action", obj);
    if(obj === null) return;
    const ds: Array<number> = this.tree.getDownstreamOperations(obj.id);
    this.recalculateDownstreamDrafts(ds);
    this.addTimelineState();

  }

  /**
   * emitted from an operatioin when its param has changed 
   * checks for a child subdraft, recomputes, redraws. 
   * @param obj with attribute id describing the operation that called this
   * @returns 
   */
   operationParamChanged(obj: any){
    console.log("op param change", obj);

    if(obj === null) return;

    this.performOp(obj.id);

    const ds: Array<number> = this.tree.getDownstreamOperations(obj.id);
    this.recalculateDownstreamDrafts(ds);
    this.addTimelineState();

  }


/**
 * called from an operatiino cmoponent when it is dragged
 * @param obj (id, point of toplleft)
 */
  operationMoved(obj: any){
    if(obj === null) return;

    //get the reference to the draft that's moving
    const moving = <OperationComponent> this.tree.getComponent(obj.id);
    if(moving === null) return; 
    this.updateSnackBar("moving opereation "+moving.name,moving.bounds);
    this.updateAttachedComponents(obj);
    this.addTimelineState();

  }



  subdraftMoved(obj: any){
      if(obj === null) return;
  
      //get the reference to the draft that's moving
      const moving = <SubdraftComponent> this.tree.getComponent(obj.id);
      if(moving === null) return; 

      this.updateSnackBar("Using Ink: "+moving.ink,moving.bounds);
      
      this.updateAttachedComponents(obj);

      const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(moving);
      
      if(isect.length == 0){
        if(this.hasPreview()) this.removePreview();
        return;
      } 

      //const bounds: Bounds = this.getIntersectionBounds(moving, isect[0]);
      const bounds: Bounds = utilInstance.getCombinedBounds(moving, isect);
      const temp: Draft = this.getCombinedDraft(bounds, moving, isect);
      if(this.hasPreview()) this.preview.setNewDraft(temp);
      else this.createAndSetPreview(temp);
      this.preview.setComponentPosition(bounds.topleft);
      this.preview.drawDraft();      
    }


   /**
    * checks if this subdraft has been dropped onto of another and merges them accordingly 
    * @param obj 
    * @returns 
    */
  subdraftDropped(obj: any){

    this.closeSnackBar();

     if(obj === null) return;
  
      //creaet a subdraft of this intersection
      if(this.hasPreview()){
        const sd: SubdraftComponent = this.createSubDraft(new Draft({wefts: this.preview.draft.wefts, warps: this.preview.draft.warps}));
        const to_right: Point = this.preview.getTopleft();
        to_right.x += this.preview.bounds.width + this.scale *4;
        sd.draft.pattern = cloneDeep(this.preview.draft.pattern);
        sd.setComponentPosition(to_right);
        sd.setComponentSize(this.preview.bounds.width, this.preview.bounds.height);
        sd.zndx = this.layers.createLayer();
        this.removePreview();
      } 

      this.addTimelineState();
      
      //get the reference to the draft that's moving
      const moving = this.tree.getComponent(obj.id);
      if(moving === null) return; 


      

      //disable this too see what happens
      // const had_merge = this.mergeSubdrafts(moving);
      // console.log("had merge", had_merge);
      // if(!had_merge) 
      // moving.drawDraft();

  }

  /**
   * merges a collection of subdraft components into the primary component, deletes the merged components
   * @param primary the draft to merge into
   * @returns true or false to describe if a merge took place. 
   */
  mergeSubdrafts(primary: SubdraftComponent): boolean{

    const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(primary);

      if(isect.length == 0){
        return false;
      }   

      const bounds: Bounds = utilInstance.getCombinedBounds(primary, isect);
      const temp: Draft = this.getCombinedDraft(bounds, primary, isect);

      primary.setNewDraft(temp);
      primary.setComponentPosition(bounds.topleft);
      primary.drawDraft();

    //remove the intersecting drafts from the view containier and from subrefts
    isect.forEach(element => {
      this.removeSubdraft(element.id);
    });
    return true;
  }

  computeHeddleValue(p:Point, main: SubdraftComponent, isect: Array<SubdraftComponent>):boolean{
    const a:boolean = main.resolveToValue(p);
    //this may return an empty array, because the intersection might not have the point
    const b_array:Array<SubdraftComponent> = isect.filter(el => el.hasPoint(p));

    //should never have more than one value in barray
    // if(b_array.length > 1) console.log("WARNING: Intersecting with Two Elements");

    const val:boolean = b_array.reduce((acc:boolean, arr) => arr.resolveToValue(p), null);   
    
    return utilInstance.computeFilter(main.ink, a, val);
  }



  getSubdraftsIntersectingSelection(selection: SelectionComponent){

    //find intersections between main and the others
    const drafts: Array<SubdraftComponent> = this.tree.getDrafts();
    const isect:Array<SubdraftComponent> = drafts.filter(sr => (utilInstance.doOverlap(
      selection.bounds.topleft, 
      {x:  selection.bounds.topleft.x + selection.bounds.width, y: selection.bounds.topleft.y + selection.bounds.height}, 
      sr.getTopleft(), 
      {x: sr.getTopleft().x + sr.bounds.width, y: sr.getTopleft().y + sr.bounds.height}
      ) ? sr : null));

    return isect;
  
  }


 /**
   * get any subdrafts that intersect a given screen position
   * @param p the x, y position of this cell 
   * @returns 
   */
  getIntersectingSubdraftsForPoint(p: any){

    const primary_topleft = {x:  p.x, y: p.y };
    const primary_bottomright = {x:  p.x + this.scale, y: p.y + this.scale};

    const isect:Array<SubdraftComponent> = [];
    const drafts: Array<SubdraftComponent> = this.tree.getDrafts();
    drafts.forEach(sr => {
      let sr_bottomright = {x: sr.getTopleft().x + sr.bounds.width, y: sr.getTopleft().y + sr.bounds.height};
      const b: boolean = utilInstance.doOverlap(primary_topleft, primary_bottomright, sr.getTopleft(), sr_bottomright);
      if(b) isect.push(sr);
     });

    return isect;
  }

  /**
   * get any subdrafts that intersect primary based on checks on their boundaries
   * @param primary 
   * @returns 
   */
  getIntersectingSubdrafts(primary: SubdraftComponent){

    const drafts:Array<SubdraftComponent> = this.tree.getDrafts(); 
    const to_check:Array<SubdraftComponent> =  drafts.filter(sr => (sr.draft.id.toString() !== primary.draft.id.toString()));
    const primary_bottomright = {x:  primary.getTopleft().x + primary.bounds.width, y: primary.getTopleft().y + primary.bounds.height};


     const isect:Array<SubdraftComponent> = [];
     to_check.forEach(sr => {
      let sr_bottomright = {x: sr.getTopleft().x + sr.bounds.width, y: sr.getTopleft().y + sr.bounds.height};
      const b: boolean = utilInstance.doOverlap(primary.getTopleft(), primary_bottomright, sr.getTopleft(), sr_bottomright);
      if(b) isect.push(sr);
     });

    return isect;
  }

  getSelectionBounds(c1: any, c2: any): Bounds{
      let bottomright = {x: 0, y:0};
      let bounds:Bounds = {
        topleft:{x: 0, y:0},
        width: 0,
        height: 0
      }
      if(c1.i < c2.i){
        bounds.topleft.y = c1.i * this.scale;
        bottomright.y = c2.i * this.scale;
      }else{
        bounds.topleft.y = c2.i * this.scale;
        bottomright.y = c1.i * this.scale;
      }

      if(c1.j < c2.j){
        bounds.topleft.x = c1.j * this.scale;
        bottomright.x = c2.j * this.scale;
      }else{
        bounds.topleft.x = c1.j * this.scale;
        bottomright.x = c2.j * this.scale;
      }

      bounds.width = bottomright.x - bounds.topleft.x;
      bounds.height = bottomright.y - bounds.topleft.y;

      return bounds;
  }

      /**
     * creates a draft in size bounds that contains all of the computed points of its intersections
     * @param bounds the boundary of all the intersections
     * @param primary the primary draft that we are checking for intersections
     * @param isect an Array of the intersecting components
     * @returns 
     */
       getCombinedDraft(bounds: Bounds, primary: SubdraftComponent, isect: Array<SubdraftComponent>):Draft{
  
        const temp: Draft = new Draft({id: primary.draft.id, name: primary.draft.name, warps: Math.floor(bounds.width / primary.scale), wefts: Math.floor(bounds.height / primary.scale)});
    
        for(var i = 0; i < temp.wefts; i++){
          const top: number = bounds.topleft.y + (i * primary.scale);
          for(var j = 0; j < temp.warps; j++){
            const left: number = bounds.topleft.x + (j * primary.scale);
    
            const p = {x: left, y: top};
            const val = this.computeHeddleValue(p, primary, isect);
            if(val != null) temp.pattern[i][j].setHeddle(val);
            else temp.pattern[i][j].unsetHeddle();
          }
        }
        return temp;
      }



  getPrintableCanvas(obj): HTMLCanvasElement{

    this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const drafts: Array<SubdraftComponent> = this.tree.getDrafts();
    drafts.forEach(sd => {
      sd.drawForPrint(this.canvas, this.cx, this.scale);
    });

    const ops: Array<OperationComponent> = this.tree.getOperations();
    ops.forEach(op => {
      op.drawForPrint(this.canvas, this.cx, this.scale);
    });

    const cxns: Array<ConnectionComponent> = this.tree.getConnections();
    cxns.forEach(cxn => {
      cxn.drawForPrint(this.canvas, this.cx, this.scale);
    });

    return this.canvas;

  }

  clearCanvas(){
    this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

}