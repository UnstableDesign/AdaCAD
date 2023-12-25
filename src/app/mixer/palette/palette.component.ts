import { Component, ComponentFactoryResolver, EventEmitter, HostListener, OnInit, Output, ViewChild, ViewContainerRef, ViewRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { fromEvent, Subscription } from 'rxjs';
import { defaults } from '../../core/model/defaults';
import { createCell, getCellValue, setCellValue } from '../../core/model/cell';
import { Bounds, Draft, DraftNode, DraftNodeProxy, Interlacement, NodeComponentProxy, Note, Node, Point, Cell, OpNode, Operation} from '../../core/model/datatypes';
import { copyDraft, getDraftName, initDraftWithParams, warps, wefts } from '../../core/model/drafts';
import utilInstance from '../../core/model/util';
import { DesignmodesService } from '../../core/provider/designmodes.service';
import { NotesService } from '../../core/provider/notes.service';
import { StateService } from '../../core/provider/state.service';
import { TreeService } from '../../core/provider/tree.service';
import { InkService } from '../../mixer/provider/ink.service';
import { LayersService } from '../../mixer/provider/layers.service';
import { MultiselectService } from '../provider/multiselect.service';
import { ViewportService } from '../provider/viewport.service';
import { ZoomService } from '../provider/zoom.service';
import { FileService } from './../../core/provider/file.service';
import { ConnectionComponent } from './connection/connection.component';
import { MarqueeComponent } from './marquee/marquee.component';
import { NoteComponent } from './note/note.component';
import { OperationComponent } from './operation/operation.component';
import { SnackbarComponent } from './snackbar/snackbar.component';
import { SubdraftComponent } from './subdraft/subdraft.component';

@Component({
  selector: 'app-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.scss']
})


export class PaletteComponent implements OnInit{


  @Output() onDesignModeChange: any = new EventEmitter();  
  @Output() onRevealDraftDetails: any = new EventEmitter();  

  /**
   * A container that supports the automatic generation and removal of the components inside of it
   */
  @ViewChild('vc', {read: ViewContainerRef, static: true}) vc: ViewContainerRef;

  subdraftSubscriptions: Array<Subscription> = [];
  operationSubscriptions: Array<Subscription> = [];
  connectionSubscriptions: Array<Subscription> = [];
  noteSubscriptions: Array<Subscription> = [];


/**
 * Subscribes to move event after a touch event is started.
 * @property {Subscription}
 */
  moveSubscription: Subscription;

  /**
   * flag to determine how conneection should be drawn
   */
  selecting_connection: boolean = false;

  /**
   * holds a reference to the selection component
   * @property {Selection}
   */
  selection = new MarqueeComponent();

  /**
   * stores an i and j of the last user selected location within the component
   * @property {Point}
   */
  last: Interlacement;


    /**
   * stores an i and j of the last user selected location within the component
   * @property {Point}
   */
    last_point: Point;

  /**
   * triggers a class to handle disabling pointerevents when switching modes
   * @property {boolean}
   */
   pointer_events: boolean;

  /**
   * trackable inputs to snackbar
   */
   snack_message:string;
   snack_bounds: Bounds;

     /**
   * stores the bounds of the shape being drawn
   */
   active_connection:Bounds;

   /**
    * a reference to the base size of each cell. Zoom in and out only modifies the view, not this base size.
    */
   default_cell_size: number = 5;

   needs_init: boolean = true;

   visible_op: number = -1;

   visible_op_inlet: number = -1;
  
  /**
   * Constructs a palette object. The palette supports drawing without components and dynamically
   * creates components from shapes and scribbles on the canvas. 
   * @param dm  a reference to the service containing the current design modes and selections
   * @param tree reference to the objects and relationships within this palette
   * @param inks a reference to the service manaing the available inks
   * @param layers a reference to the sercie managing the view layers (z-indexes) of components
   * @param resolver a reference to the factory component for dynamically generating components
   * @param fs file service for saving and loading files
   * @param _snackBar _snackBar a reference to the snackbar component that shows data on move and select
   * @param viewport reference to the window and palette variables and where the viewer is currently lookin
   * @param notes reference the service that stores all the tagged comments
   */
  constructor(
    public dm: DesignmodesService, 
    private tree: TreeService,
    private inks: InkService, 
    private layers: LayersService, 
    private resolver: ComponentFactoryResolver, 
    private fs: FileService,
    private _snackBar: MatSnackBar,
    public viewport: ViewportService,
    private notes: NotesService,
    private ss: StateService,
    private zs: ZoomService,
    private multiselect: MultiselectService) { 
    this.pointer_events = true;
  }

/**
 * Called when palette is initailized
 */
  ngOnInit(){
    this.vc.clear();
    this.default_cell_size = defaults.mixer_cell_size; 


    
  }

  /**
   * Gets references to view items and adds to them after the view is initialized
   */
   ngAfterViewInit(){
    
    const div:HTMLElement = document.getElementById('scrollable-container');
    this.viewport.set(div.offsetParent.scrollLeft, div.offsetParent.scrollTop,  div.offsetParent.clientWidth,  div.offsetParent.clientHeight);
    
    // const center:Point = this.viewport.setViewportCenter();
    // div.offsetParent.scrollLeft = this.viewport.getTopLeft().x;
    // div.offsetParent.scrollTop = this.viewport.getTopLeft().y;

    

    // this.cx.beginPath();
    // this.cx.rect(20, 20, this.viewport.width-40, this.viewport.height-40);
    // this.cx.stroke();

    this.selection.scale = this.zs.zoom;

    this.selection.active = false;
    
    this.designModeChanged();

    this.rescale(-1);

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
    this.noteSubscriptions.forEach(element => element.unsubscribe());
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

    this.tree.getConnections().forEach(element => {
    });



  }

  /**
   * called when a new file is loaded
   */
   clearComponents(){
    this.unsubscribeFromAll();

    this.notes.getRefs().forEach(ref => this.removeFromViewContainer(ref));

    this.vc.clear();
  }

  
/**
 * called when user moves position within viewer
 * @param data 
 */
  handleScroll(position: Point){
    this.viewport.setTopLeft(position);
    const div:HTMLElement = document.getElementById('scrollable-container');  
     div.offsetParent.scrollLeft = this.viewport.getTopLeft().x;
     div.offsetParent.scrollTop = this.viewport.getTopLeft().y;
  }

/**
 * called when user moves position within viewer
 * @param data 
 */
handlePan(diff: Point){
  const div:HTMLElement = document.getElementById('scrollable-container');  
   div.offsetParent.scrollLeft += diff.x;
   div.offsetParent.scrollTop += diff.y;
}



  /**
 * when someone zooms in or out, we'd like to keep the center point the same. We do this by scaling the entire palette and 
 * elements and then manually scrolling to the new center point. 
 * @param data 
 */
   handleScrollFromZoom(old_zoom: number){
    // this.viewport.setTopLeft(position);
    // console.log(old_center, this.viewport.getCenterPoint());
    const div:HTMLElement = document.getElementById('scrollable-container');  
    const past_scroll_x = div.offsetParent.scrollLeft / old_zoom;
    const new_scroll_x = past_scroll_x * this.zs.zoom;

    const past_scroll_y = div.offsetParent.scrollTop / old_zoom;
    const new_scroll_y = past_scroll_y * this.zs.zoom;

     div.offsetParent.scrollLeft = new_scroll_x;
     div.offsetParent.scrollTop = new_scroll_y;
  }


  
  /**
 * called when user scrolls the winidow
 * @param data 
 */
   handleWindowScroll(data: any){


    const div:HTMLElement = document.getElementById('scrollable-container');
    this.viewport.set(div.offsetParent.scrollLeft, div.offsetParent.scrollTop,  div.offsetParent.clientWidth,  div.offsetParent.clientHeight);
    //update the canvas to this position
  }

  /**
   * removes the view associate with this view ref
   * @param ref 
   */
  removeFromViewContainer(ref: ViewRef){
    const ndx: number = this.vc.indexOf(ref);
    if(ndx !== -1) this.vc.remove(ndx);
    else console.log('Error: view ref not found for removal', ref);

  }

  /**
   * adds a state to the timeline. This should be called 
   * each time a user performs an action that they should be able to undo/redo
   */
  addTimelineState(){
    console.log("ADD TIMELINE");


   this.fs.saver.ada(
      'mixer', 
      true,
      this.zs.zoom)
      .then(so => {
        this.ss.addMixerHistoryState(so);
      });
  }

  /**
   * this cycles through all subdrafts and calls the download call on any subdrafts
   * who are currently visible. 
   */
  async downloadVisibleDraftsAsBmp() : Promise<any>{

    const drafts: Array<SubdraftComponent> = this.tree.getDrafts();
    const visible_drafts: Array<SubdraftComponent> = drafts.filter(el => el.draft_visible)
    const functions: Array<Promise<any>> = visible_drafts.map(el => el.draft_rendering.saveAsBmp());
    return Promise.all(functions).then(el =>
      console.log("Downloaded "+functions.length+" files")
    );

  }
  
  /**
   * this cycles through all subdrafts and calls the download call on any subdrafts
   * who are currently visible. 
   */
   async downloadVisibleDraftsAsWif() : Promise<any>{

    const drafts: Array<SubdraftComponent> = this.tree.getDrafts();
    const visible_drafts: Array<SubdraftComponent> = drafts.filter(el => el.draft_visible)
    const functions: Array<Promise<any>> = visible_drafts.map(el => el.saveAsWif());
    return Promise.all(functions)
    .then(el =>
      console.log("Downloaded "+functions.length+" files")
    );

  }
  


  /**
  //  * called anytime an operation is added. Adds the operation to the tree. 
  //  * @param name the name of the operation to add
  //  */
  addOperation(name:string) : number{
      
      const opcomp:OperationComponent = this.createOperation(name);
      this.performAndUpdateDownstream(opcomp.id).then(el => {
        this.addTimelineState();
      });

      return opcomp.id;
      
  }

   /**
  //  * called anytime an operation is added. Adds the operation to the tree. 
  //  * @param name the name of the operation to add
  //  */
  pasteOperation(opnode:OpNode) : Promise<number>{
      
    const opcomp:OperationComponent = this.createOperation(opnode.name);

    const new_node = <OpNode> this.tree.getNode(opcomp.id);
    new_node.inlets = opnode.inlets.slice();
    new_node.params = opnode.params.slice();
    new_node.component.topleft = {x: opnode.component.topleft.x+100, y:opnode.component.topleft.y+100};

   
    return this.performAndUpdateDownstream(opcomp.id).then(el => {

      this.addTimelineState();
      return Promise.resolve(new_node.id);
    });
    
}




  /**
   * redraws each operation and subdraft at the new scale, then redraws each of their connections
   * @param scale 
   */
  rescale(prev_zoom: number){


    //these subdrafts are all rendered independely of the canvas and need to indivdiually rescalled. This 
    //essentially rerenders (but does not redraw them) and updates their top/lefts to scaled points
    this.tree.nodes.forEach(node => {
        if(node.type !== "cxn"){
          if(node.component !== null) node.component.scale = this.zs.zoom;
        } 
      });


    this.tree.getConnections().forEach(sd => {
      if(sd !== null) sd.rescale(this.zs.zoom);
    });

    this.notes.getComponents().forEach(el => {
      el.scale = this.zs.zoom;
    });

  

     if(this.tree.getPreview() !== undefined) this.tree.getPreviewComponent().scale = this.zs.zoom;

    this.handleScrollFromZoom(prev_zoom);

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
        scale: this.zs.zoom
      }
    });
  }

  snackBarAlert(message: string){
    this._snackBar.open(message, 'Undo', {
      duration: 3000
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
    this.dm.selectMixerEditingMode(name);
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
    this.subdraftSubscriptions.push(sd.onConnectionStarted.subscribe(this.onConnectionStarted.bind(this)));
    this.subdraftSubscriptions.push(sd.onDesignAction.subscribe(this.onSubdraftAction.bind(this)));
    this.subdraftSubscriptions.push(sd.onSubdraftViewChange.subscribe(this.onSubdraftViewChange.bind(this)));
    this.subdraftSubscriptions.push(sd.onNameChange.subscribe(this.onSubdraftNameChange.bind(this)));
    this.subdraftSubscriptions.push(sd.onShowDetails.subscribe(this.revealDraftDetails.bind(this)));
  }



  revealDraftDetails(id: number){
    this.onRevealDraftDetails.emit(id);
  }

  /**
   * dynamically creates a a note component
   * @returns the created note instance
   */
   createNote(note: Note):NoteComponent{


    let tl: Interlacement = null;

    const factory = this.resolver.resolveComponentFactory(NoteComponent);
    const notecomp = this.vc.createComponent<NoteComponent>(factory);
    this.setNoteSubscriptions(notecomp.instance);

    if(note === null || note.interlacement == null){
      tl = utilInstance.resolvePointToAbsoluteNdx(this.viewport.getCenterPoint(), this.zs.zoom);
    }else{
      tl = note.interlacement
    }
    let id = this.notes.createNote(tl,  notecomp.instance, notecomp.hostView, note);

    notecomp.instance.id = id;
    notecomp.instance.scale = this.zs.zoom;
    notecomp.instance.default_cell = this.default_cell_size;


    this.changeDesignmode('move');
    return notecomp.instance;
  }


  //   /**
  //  * dynamically creates a a note component
  //  * @returns the created note instance
  //  */
  //   loadNote(note: Note):NoteComponent{

  //     console.log("LOADING NOTE", note);
  //     if(note.component === null || note.component === undefined){
  //       const noteinstance  = this.createNote();
       
  
  //     }else{

  //     }
      
  //     const notecomp = this.vc.createComponent(NoteComponent);
  //     this.setNoteSubscriptions(notecomp.instance);

  //     note.component = notecomp.instance;
  //     note.ref = notecomp.hostView;

  //     notecomp.instance.id = note.id;
  //     notecomp.instance.scale = this.zs.zoom;
  //     notecomp.instance.default_cell = this.default_cell_size;
  
  //     return notecomp.instance;
  //   }

    
    
      /**
   * called when a new operation is added
   * @param op 
   */
  setNoteSubscriptions(note: NoteComponent){
    this.noteSubscriptions.push(note.deleteNote.subscribe(this.deleteNote.bind(this)));
    this.noteSubscriptions.push(note.saveNoteText.subscribe(this.saveNote.bind(this)));
  }

  deleteNote(id: number){
    const note = this.notes.get(id);
    if(note === undefined) return;
    this.removeFromViewContainer(note.ref);
    this.notes.delete(id);
  }

  saveNote(){
    this.changeDesignmode('move');
    this.addTimelineState();
  }



  /**
   * dynamically creates a subdraft component, adds its inputs and event listeners, pushes the subdraft to the list of references
   * @param d a Draft object for this component to contain
   * @returns the created subdraft instance
   */
  createSubDraft(d: Draft, parent: number) : Promise<SubdraftComponent>{
    

    const factory = this.resolver.resolveComponentFactory(SubdraftComponent);
    const subdraft = this.vc.createComponent<SubdraftComponent>(factory);
    const id = this.tree.createNode('draft', subdraft.instance, subdraft.hostView);
    this.setSubdraftSubscriptions(subdraft.instance);
   
    subdraft.instance.id = id;
    subdraft.instance.draft = d;
    subdraft.instance.default_cell = this.default_cell_size;
    subdraft.instance.scale = this.zs.zoom;
    subdraft.instance.ink = this.inks.getSelected(); //default to the currently selected ink


    return this.tree.loadDraftData({prev_id: -1, cur_id: id}, d, null, null, true)
      .then(d => {
        return Promise.resolve(subdraft.instance);
        }
      )
  }

  createSubDraftFromEditedDetail(id: number) : Promise<SubdraftComponent>{
    
    const node  = this.tree.getNode(id);
    const factory = this.resolver.resolveComponentFactory(SubdraftComponent);
    const subdraft = this.vc.createComponent<SubdraftComponent>(factory);
    this.setSubdraftSubscriptions(subdraft.instance);

    node.component = subdraft.instance;
    node.ref = subdraft.hostView;

    subdraft.instance.id = id;
    subdraft.instance.draft = this.tree.getDraft(id);
    subdraft.instance.default_cell = this.default_cell_size;
    subdraft.instance.scale = this.zs.zoom;
    subdraft.instance.ink = this.inks.getSelected(); //default to the currently selected ink

    return Promise.resolve(subdraft.instance);

  }


  

  /**
   * loads a subdraft component from data
   * @param id the node id assigned to this element on load
   * @param d the draft object to load into this subdraft
   * @param nodep the component proxy used to define
   */
   loadSubDraft(id: number, d: Draft, nodep: NodeComponentProxy, draftp: DraftNodeProxy,  saved_scale: number){


    const factory = this.resolver.resolveComponentFactory(SubdraftComponent);
    const subdraft = this.vc.createComponent<SubdraftComponent>(factory);
    const node = this.tree.getNode(id)
    node.component = subdraft.instance;
    node.ref = subdraft.hostView;
    this.setSubdraftSubscriptions(subdraft.instance);
    subdraft.instance.id = id;
    subdraft.instance.default_cell = this.default_cell_size;
    subdraft.instance.scale = this.zs.zoom;
    subdraft.instance.draft_visible = true;
    subdraft.instance.use_colors = true;
    subdraft.instance.ink = this.inks.getSelected(); //default to the currently selected ink
    subdraft.instance.draft = d;
    subdraft.instance.parent_id = this.tree.getSubdraftParent(id);

    if(nodep !== null && nodep.topleft !== null){
      
      const topleft_ilace = {j: nodep.topleft.x/saved_scale, i: nodep.topleft.y/saved_scale};
      const adj_topleft: Point = {x: topleft_ilace.j*this.zs.zoom, y: topleft_ilace.i*this.zs.zoom};
      
    
      subdraft.instance.topleft = adj_topleft;

      if(draftp !== null && draftp !== undefined){
        subdraft.instance.draft_visible = draftp.draft_visible;
      }

      if(draftp !== null && draftp !== undefined && draftp.render_colors !== undefined){
        subdraft.instance.use_colors = draftp.render_colors;
      }
    } 

  }

  setConnectionSubscriptions(cxn: ConnectionComponent){
    this.connectionSubscriptions.push(cxn.onConnectionRemoved.subscribe(this.removeConnection.bind(this)));

  }

  /**
   * called when a new operation is added
   * @param op 
   */
  setOperationSubscriptions(op: OperationComponent){
    this.operationSubscriptions.push(op.onOperationMove.subscribe(this.operationMoved.bind(this)));
    this.operationSubscriptions.push(op.onOperationMoveEnded.subscribe(this.operationMoveEnded.bind(this)));
    this.operationSubscriptions.push(op.onOperationParamChange.subscribe(this.operationParamChanged.bind(this)));
    this.operationSubscriptions.push(op.deleteOp.subscribe(this.onDeleteOperationCalled.bind(this)));
    this.operationSubscriptions.push(op.duplicateOp.subscribe(this.onDuplicateOpCalled.bind(this)));
    this.operationSubscriptions.push(op.onConnectionRemoved.subscribe(this.removeConnection.bind(this)));
    this.operationSubscriptions.push(op.onConnectionStarted.subscribe(this.onConnectionStarted.bind(this)));
    this.operationSubscriptions.push(op.onInputAdded.subscribe(this.connectionMade.bind(this)));
    this.operationSubscriptions.push(op.onInputVisibilityChange.subscribe(this.updateVisibility.bind(this)));
    this.operationSubscriptions.push(op.onInletLoaded.subscribe(this.inletLoaded.bind(this)));
    this.operationSubscriptions.push(op.onOpLoaded.subscribe(this.opCompLoaded.bind(this)));
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




      this.tree.loadOpData({prev_id: -1, cur_id: id}, name, undefined, undefined);
      this.setOperationSubscriptions(op.instance);

      op.instance.name = name;
      op.instance.id = id;
      op.instance.zndx = this.layers.createLayer();
      op.instance.scale =this.zs.zoom ;
      op.instance.default_cell = this.default_cell_size;

      const tr =  this.viewport.getTopRight()
      op.instance.topleft ={x: tr.x - 340, y: tr.y+120};

     



      return op.instance;
    }

    /**
   * loads an operation with the information supplied. 
   * @param name the name of the operation this component will perform
   * @params params the input data to be used in this operation
   * @returns the id of the node this has been assigned to
   */
    loadOperation(id: number, name: string, params: Array<any>, inlets: Array<any>, topleft:Point, saved_scale: number){

        const factory = this.resolver.resolveComponentFactory(OperationComponent);
        const op = this.vc.createComponent<OperationComponent>(factory);
        const node = this.tree.getNode(id)
        node.component = op.instance;
        node.ref = op.hostView;
    
        this.setOperationSubscriptions(op.instance);
  
        op.instance.name = name;
        op.instance.id = id;
        op.instance.zndx = this.layers.createLayer();
        op.instance.scale = this.zs.zoom;
        op.instance.default_cell = this.default_cell_size;
        op.instance.loaded_inputs = params;
        op.instance.topleft = {x: topleft.x, y: topleft.y};
        op.instance.loaded = true;
  
        // if(bounds !== null){
        
        //   const topleft_ilace = {j: bounds.topleft.x/saved_scale, i: bounds.topleft.y/saved_scale};
        //   const adj_topleft: Point = {x: topleft_ilace.j*this.zs.zoom, y: topleft_ilace.i*this.zs.zoom};
          
        //   const new_bounds: Bounds = {
        //     topleft: adj_topleft,
        //     width: bounds.width / saved_scale * this.zs.zoom,
        //     height: bounds.height / saved_scale * this.zs.zoom,
        //   }
    
        //   op.instance.bounds = new_bounds;
          
        // } 
  
       
      }

   

    /**
     * duplicates an operation with the information supplied. 
     * @param name the name of the operation this component will perform
     * @params params the input data to be used in this operation
     * @returns the id of the node this has been assigned to
     */
     duplicateOperation(name: string, params: Array<number>, topleft:Point, inlets: Array<any>):number{

      const op:OperationComponent = this.createOperation(name);
          
          this.tree.setOpParams(op.id, params.slice(), inlets.slice());
          op.loaded_inputs = params.slice();
          op.topleft = {x: topleft.x, y: topleft.y};
          op.duplicated = true;
    
          return op.id;
      }



    /**
     * creates a connection and draws it to screen
     * @param id - the id of this node
     */
     loadConnection(id: number){
      const factory = this.resolver.resolveComponentFactory(ConnectionComponent);
      const cxn = this.vc.createComponent<ConnectionComponent>(factory);
      const node = this.tree.getNode(id);

      node.component = cxn.instance;
      this.setConnectionSubscriptions(cxn.instance);
      node.ref = cxn.hostView;
        
      cxn.instance.id = id;
      cxn.instance.scale = this.zs.zoom;
      cxn.instance.default_cell_size = this.default_cell_size;

    }



    /**
     * creates a connection component and registers it with the tree
     * @returns the list of all id's connected to the "to" node 
     */
     createConnection(id_from: number, id_to:number, to_ndx: number):{input_ids: Array<number>, id: number}{

      const factory = this.resolver.resolveComponentFactory(ConnectionComponent);
      const cxn = this.vc.createComponent<ConnectionComponent>(factory);
      const id = this.tree.createNode('cxn', cxn.instance, cxn.hostView);
      const to_input_ids: Array<number> =  this.tree.addConnection(id_from, 0, id_to, to_ndx, id);
      
      cxn.instance.id = id;
      cxn.instance.scale = this.zs.zoom;
      cxn.instance.default_cell_size = this.default_cell_size;

      this.setConnectionSubscriptions(cxn.instance);


      this.connectionSubscriptions.push()
      return {input_ids: to_input_ids, id: id};
    }




  /**
   * called from upload or import events
   * @param d 
   */
  addSubdraftFromDraft(d: Draft){
    this.createSubDraft(d, -1).then(sd => {
      sd.setPosition({x: this.viewport.getTopLeft().x + 60, y: this.viewport.getTopLeft().y + 60});
      // const interlacement = utilInstance.resolvePointToAbsoluteNdx(sd.bounds.topleft, this.scale); 
      // this.viewport.addObj(sd.id, interlacement);
      this.addTimelineState();
    });
    
  }

  /**
  //  * called anytime an operation is added. Adds the operation to the tree. 
  //  * @param name the name of the operation to add
  //  */
  pasteSubdraft(draftnode:DraftNode): Promise<number>{
    //create a new idea for this draft node: 

    
    let d = copyDraft(draftnode.draft);
    d.id = utilInstance.generateId(8);


    return this.createSubDraft(d, -1).then(sd => {
      sd.setPosition({x: this.viewport.getTopLeft().x + 60, y: this.viewport.getTopLeft().y + 60});
      sd.topleft = {x: draftnode.component.topleft.x+100, y:draftnode.component.topleft.y+100};

      this.addTimelineState();
      return Promise.resolve(sd.id);
    });
    
}

  /**
   * a subdraft can only have an operation for a parent
   * removes the subdraft sent to the function
   * updates the tree view_id's in response
   * @param id {number}  

   */
  removeSubdraft(id: number){


    if(id === undefined) return;

    const outputs = this.tree.getNonCxnOutputs(id);
    const delted_nodes = this.tree.removeSubdraftNode(id);

    delted_nodes.forEach(node => {
      this.removeFromViewContainer(node.ref);
      this.viewport.removeObj(node.id);
    })

    outputs.forEach(out => {
      this.performAndUpdateDownstream(out);
    })

  }

  /**
   * this calls the tree to delete the operation.
   * the tree returns a list of all nodes deleted and this function updates the view to remove those elements
   * @param id 
   */
  removeOperation(id:number){


    if(id === undefined) return;

    const drafts_out = this.tree.getNonCxnOutputs(id);

    const outputs:Array<number> = drafts_out.reduce((acc, el) => {
      return acc.concat(this.tree.getNonCxnOutputs(el));
    }, []);


    const delted_nodes = this.tree.removeOperationNode(id);
    delted_nodes.forEach(node => {
      this.removeFromViewContainer(node.ref);
      this.viewport.removeObj(node.id);
    });

    outputs.forEach(out => {
      this.performAndUpdateDownstream(out);
    })

  }

    /**
   * dynamically creates a subdraft component with specific requirements of the intersection, adds its inputs and event listeners, pushes the subdraft to the list of references
   * @param d a Draft object for this component to contain
   * @returns the created subdraft instance
   */
  createAndSetPreview(d: Draft) : Promise<DraftNode> {

      const factory = this.resolver.resolveComponentFactory(SubdraftComponent);
      const subdraft = this.vc.createComponent<SubdraftComponent>(factory);

      return this.tree.setPreview(subdraft, d).then( dn=> {
          //note, the preview is not added to the tree, as it will only be added if it eventually accepted by droppings
          const sd: SubdraftComponent = <SubdraftComponent> dn.component;
         
          sd.id = -1;
          sd.default_cell = this.default_cell_size;
          sd.scale = this.zs.zoom;
          sd.draft = d;
          sd.ink = this.inks.getSelected(); //default to the currently selected ink
          sd.setAsPreview();
          // sd.disableDrag();
          
          return dn;

      });


    }



  /**
   * Called from mixer when it receives a change from the design mode tool or keyboard press
   * triggers view mode changes required for this mode
   */
  public designModeChanged(){

    if(this.dm.isSelectedMixerEditingMode('move')){
      this.unfreezePaletteObjects();

    }else{
      console.log("DESIGN MODE CHANGED")
      this.freezePaletteObjects();
    }

    // if(this.dm.getDesignMode('draw', 'design_modes').selected || this.dm.getDesignMode('shape',  'design_modes').selected){
    //   const old_zoom = this.zs.zoom;
    //   this.zs.setZoom(Math.ceil(this.zs.zoom))
    //   this.rescale(old_zoom);
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

    // //instantiate the canvas at this point
    // this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // const bounds ={
    //   left: this.selection.start.j*this.zs.zoom,
    //   top: this.selection.start.i*this.zs.zoom,
    //   right: ndx.j *this.zs.zoom,
    //   bottom: ndx.i*this.zs.zoom
    // };

    // //will draw on outside of selection
    // this.cx.beginPath();
    // this.cx.strokeStyle = "#ff4081";
    // this.cx.lineWidth = 1;
    // this.cx.setLineDash([this.zs.zoom, 2]);
    // this.cx.strokeRect(bounds.left - this.viewport.getTopLeft().x, bounds.top  - this.viewport.getTopLeft().y, bounds.right-bounds.left, bounds.bottom-bounds.top);
    // this.cx.fillStyle = "#ff4081";
    // this.cx.font = "12px Arial";
    // const w = Math.round(this.selection.bounds.width /this.zs.zoom);
    // const h = Math.round(this.selection.bounds.height / this.zs.zoom);
    // this.cx.fillText(w.toString()+"x"+h.toString(),  bounds.left- this.viewport.getTopLeft().x, bounds.bottom+16-this.viewport.getTopLeft().y);

  }


  /**
   * Deletes the subdraft that called this function.
   */
    onDeleteSubdraftCalled(obj: any){
      
      if(obj === null) return;
      this.removeSubdraft(obj.id);
      this.addTimelineState();
   }

     /**
   * Deletes the subdraft that called this function.
   */
      onDeleteOperationCalled(obj: any){
      
        if(obj === null) return;
        this.removeOperation(obj.id);
        this.addTimelineState();
     }

   /**
   * Duplicates the operation that called this function.
   */
    onDuplicateOpCalled(obj: any){
      if(obj === null) return;

      const op = this.tree.getOpNode(obj.id);
      const op_comp = <OperationComponent> this.tree.getComponent(obj.id);


      let new_tl: Point = null;


      if(this.tree.hasSingleChild(obj.id) && this.tree.opHasHiddenChild(obj.id)){
          new_tl = {x: op_comp.topleft.x + 200, y: op_comp.topleft.y}
      }else{
        let container = document.getElementById('scale-'+obj.id);
          new_tl =  {x: op_comp.topleft.x + 10 + container.offsetWidth*this.zs.zoom/this.default_cell_size, y: op_comp.topleft.y}
      }


      const id: number = this.duplicateOperation(op.name, op.params, new_tl, op.inlets);
      const new_op = <OperationComponent> this.tree.getComponent(id);

      //duplicate the connections as well
      const cxns = this.tree.getInputsWithNdx(op.id);
      cxns.forEach(cxn => {
        if(cxn.tn.inputs.length > 0){
        const from = cxn.tn.inputs[0].tn.node.id;
        this.createConnection(from, new_op.id, cxn.ndx);
        }
      })



      this.operationParamChanged({id: id});
      this.addTimelineState();
 }

 /**
  This is called when the finetune mode is closed and we need to create a new subdraft to hold the changes. 
  * @param obj {parent_id, new_id}
  * @returns 
  */
  // createNewSubdraftFromEdits(obj: any){
  //   this.changeDesignmode('move')

  //   if(obj === null) return;

  //   const sd = <SubdraftComponent> this.tree.getComponent(obj.parent_id);
  //   const new_draft = this.tree.getDraft(obj.new_id);
  //   const new_loom = this.tree.getLoom(obj.new_id);
  //   const new_ls = this.tree.getLoomSettings(obj.new_id);
  //   const new_topleft = {
  //       x: sd.topleft.x + 40 + this.zs.zoom *2, 
  //       y: sd.topleft.y}

    


  //   this.loadSubDraft(
  //     obj.new_id, 
  //     new_draft, 
  //     {
  //       node_id: obj.new_id,
  //       type: 'draft',
  //       topleft: sd.topleft
  //     },
  //     {
  //       node_id: obj.new_id,
  //       draft_id: new_draft.id,
  //       draft_name: new_draft.ud_name,
  //       draft: new_draft,
  //       draft_visible: true,
  //       loom: new_loom,
  //       loom_settings:new_ls,
  //       render_colors: true
  //     },
  //     this.zs.zoom);
  //     this.addTimelineState();

   
  //  }


    onDuplicateSubdraftCalled(obj: any){
        if(obj === null) return;

        const sd = <SubdraftComponent> this.tree.getComponent(obj.id);
        const sd_draft = <Draft> this.tree.getDraft(obj.id);
        

      this.createSubDraft(initDraftWithParams(
        {wefts: wefts(sd_draft.drawdown), 
          warps: warps(sd_draft.drawdown), 
          drawdown: sd_draft.drawdown.slice(), 
          rowShuttleMapping: sd_draft.rowShuttleMapping.slice(),
          colShuttleMapping: sd_draft.colShuttleMapping.slice(),
          rowSystemMapping: sd_draft.rowSystemMapping.slice(),
          colSystemMapping: sd_draft.colSystemMapping.slice(),
          gen_name: getDraftName(sd_draft)+" copy"
        }), -1)
        .then(new_sd => {

          const orig_size = document.getElementById('scale-'+obj.id);

          new_sd.setPosition({
            x: sd.topleft.x + orig_size.offsetWidth*(this.zs.zoom/this.default_cell_size) + this.zs.zoom *2, 
            y: sd.topleft.y});  
          //const interlacement = utilInstance.resolvePointToAbsoluteNdx(new_sd.bounds.topleft, this.scale); 
          //this.viewport.addObj(new_sd.id, interlacement);
          this.addTimelineState();
        }).catch(console.error);
       
   }

  /**
   * A mouse event, originated in a subdraft, has been started
   * checkes the design mode and handles the event as required
   * @param obj contains the id of the moving subdraft
   */
  subdraftStarted(obj: any){
    if(obj === null) return;

    if(this.dm.isSelectedMixerEditingMode("move")){
  
      //get the reference to the draft that's moving
      const moving = <SubdraftComponent> this.tree.getComponent(obj.id);
      
      if(moving === null) return; 


      // // this.startSnackBar("Using Ink: "+moving.ink, null);
      
      // const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(moving);
      // const seed_drafts = isect.filter(el => !this.tree.hasParent(el.id)); //filter out drafts that were generated

      // if(seed_drafts.length === 0) return;
      
      // const bounds: any = utilInstance.getCombinedBounds(moving, seed_drafts);
      // const temp: Draft = this.getCombinedDraft(bounds, moving, seed_drafts);



      // this.createAndSetPreview(temp).then(dn => {
      //   this.tree.getPreviewComponent().setPosition(bounds.topleft);
      // }).catch(console.error);
      
    }else if(this.dm.isSelectedMixerEditingMode("marquee")){
      this.selectionStarted();
    }

 }

 /**
  * triggers a mode that allows mouse-mouse to be followed by a line.
  * todo; add code that holds the point on scroll
  * @param obj - contains event, id of component who called
  */
 onConnectionStarted(obj: any){

  console.log("ON CXN STARTED", obj)

  if(obj.type == 'stop'){
    this.selecting_connection = false;
    this.tree.unsetOpenConnection();
    this.processConnectionEnd();
    return;
  }

  const valid = this.tree.setOpenConnection(obj.id);
  if(!valid) return;

  this.changeDesignmode('operation');
  this.selecting_connection = true;

  //make sure to unselect anything else that had previously been selected
  const all_drafts = this.tree.getDraftNodes();
  const not_selected = all_drafts.filter(el => el.id !== obj.id);
  not_selected.forEach(node => {
    let comp = <SubdraftComponent>node.component;
    if(comp !== null) comp.selecting_connection = false;
  })



  //const sd: SubdraftComponent = <SubdraftComponent> this.tree.getComponent(obj.id);

  let adj: Point;

  const from = document.getElementById(obj.id+'-out').getBoundingClientRect();
  const container = document.getElementById('scrollable-container').getBoundingClientRect();

  console.log("FROM ", from, container)




  adj = {
    x: from.x - container.x, 
    y: from.y - container.y}


  this.unfreezePaletteObjects();

  this.active_connection = {
    topleft: adj,
    width: this.zs.zoom,
    height: this.zs.zoom
  };

  this.startSnackBar("select an input or click an empty space to stop selecting", null);

 }






 /**
 * adds a connector flag to any subdrafts that we are allowed to connect to from this operation
 */
  // setDraftsConnectable(op_id: number){
  //   const nodes: Array<SubdraftComponent> = this.tree.getDrafts();
  //   const op: OperationComponent = <OperationComponent> this.tree.getComponent(op_id);
  //   const inputs: Array<number> = this.tree.getInputs(op_id);
  //   if(inputs.length >= op.maxInputs()){
  //     nodes.forEach(el => {
  //       el.unsetConnectable();

  //       //now unset the ones that are already assigned to other ops
  //       const connections: Array<number> = this.tree.getNonCxnOutputs(el.id);
  //       const op_ndx: number = connections.findIndex(id => (id === op_id));
  //       //if it had connections and the connection was not this operation, unset it
  //       if(op_ndx !== -1){
  //         el.setConnectable();
  //       }    
  //     });
  //   }else{

  //     nodes.forEach(el => {

  //       //look upstream to see if this operation is linked in any way to this op
  //       const upstream: Array<number> = this.tree.getUpstreamOperations(el.id);
  //       const ndx: number = upstream.findIndex(i => i === op_id);
  //       if(ndx === -1) el.setConnectable();
  
  //       //now unset the ones that are already assigned to other ops
  //       const connections: Array<number> = this.tree.getOutputs(el.id);
  //       const ops: Array<number> = connections.map(cxn => this.tree.getConnectionOutput(cxn));
  //       const op_ndx: number = ops.findIndex(op => (op === op_id));
  //       //if it had connections and the connection was not this operation, unset it
  //       if(ops.length > 0 && op_ndx === -1){
  //         el.unsetConnectable();
  //       }    
  
  //     });
  //   }

  //   const ops: Array<OperationComponent> = this.tree.getOperations();
  //   ops.forEach(op => {
  //     if(op.id != op_id) op.active_connection = true;
  //   });
   
  //  }

    /**
 * disables selection and pointer events on all
 */
  // unsetDraftsConnectable(){
  //   const nodes: Array<SubdraftComponent> = this.tree.getDrafts();
  //   nodes.forEach(el => {
  //     el.unsetConnectable();
  //   });

  //   const ops: Array<OperationComponent> = this.tree.getOperations();
  //   ops.forEach(op => {
  //     op.active_connection = false;
  //   });

  //  }

/**
 * disables selection and pointer events on all
 */
 freezePaletteObjects(){
  const nodes: Array<any> = this.tree.getComponents();
  nodes.forEach(el => {
    el.disableDrag();
  });

  const notes: Array<any> = this.notes.getComponents();
  notes.forEach(el => {
    el.disableDrag();
  });
 }

 /**
 * unfreezes all palette objects (except connections)
 */
  unfreezePaletteObjects(){
    const nodes: Array<any> = this.tree.getComponents();
    nodes.forEach(el => {
      if(el != null){
        el.enableDrag();
      } 
    });

    const notes: Array<any> = this.notes.getComponents();
    notes.forEach(el => {
      el.enableDrag();
    });
   }
  

   /**
    * this is called when an subdraft updates its show/hide value
    */
   onSubdraftViewChange(id: number){

    this.updateAttachedComponents(id, false);

   }

      /**
    * this is called when an subdraft updates its show/hide value
    */
    onSubdraftNameChange(id: number){

      const outs = this.tree.getNonCxnOutputs(id);
      const to_perform = outs.map(el => this.performAndUpdateDownstream(el));
      return Promise.all(to_perform) 
      .then(el => 
        {
          this.addTimelineState(); 
        })
        .catch(console.error);;

       
    }
    


 /**
   * draws when a user is using the mouse to identify an input to a component
   * @param mouse the absolute position of the mouse on screen
   * @param shift boolean representing if shift is pressed as well 
   */
connectionDragged(mouse: Point, shift: boolean){

  let container = document.getElementById("scrollable-container").getBoundingClientRect();

  //get the mouse position relative to the view frame
  const adj: Point = {x: mouse.x - container.x, y: mouse.y -container.y}
  this.active_connection.width =  (adj.x - this.active_connection.topleft.x);
  this.active_connection.height =  (adj.y - this.active_connection.topleft.y);

  const svg = document.getElementById('scratch_svg');
  svg.style.top = (this.active_connection.topleft.y)+"px";
  svg.style.left = (this.active_connection.topleft.x)+"px"

 
  svg.innerHTML = ' <path d="M 0 0 C 0 50,'
  +(this.active_connection.width)+' '
  +(this.active_connection.height-50)+', '
  +(this.active_connection.width)+' '
  +(this.active_connection.height)
  +'" fill="transparent" stroke="#ff4081"  stroke-dasharray="4 2"  stroke-width="2"/> ' ;

 

}


/**
 * resets the view when a connection event ends
 */
 processConnectionEnd(){
  this.closeSnackBar();
  this.selecting_connection = false;
  const svg = document.getElementById('scratch_svg');
  svg.innerHTML = ' ' ;

  this.changeDesignmode('move');

  if(!this.tree.hasOpenConnection()) return;

  
  const sd: SubdraftComponent = this.tree.getOpenConnection();
  if(sd !== null) sd.connectionEnded();
  this.tree.unsetOpenConnection();
} 


/**
 * calculates the default topleft position for this node based on the width and size of its parent and/or neighbors
 * @param id the id of the component to position
 * @returns a promise for the updated point
 */
calculateInitialLocaiton(id: number) : Point {
  
  let new_tl =  this.viewport.getTopLeft(); 
  

  //if it has a parent, align it to the bottom edge
  if(this.tree.hasParent(id)){

    const parent_id = this.tree.getSubdraftParent(id);
    const opnode = this.tree.getNode(parent_id);
    const topleft = opnode.component.topleft;

    const container: HTMLElement = document.getElementById('scale-'+parent_id);

    //this component was just generated and needs a postion
    if(container == null){
      new_tl = {x: topleft.x, y: topleft.y};


      // //component is not yet initalized on this calculation so we do it manually
      const default_height =  100 * this.zs.zoom/this.default_cell_size;
      new_tl = {x: topleft.x, y: topleft.y+default_height};

    }else{

      const container: HTMLElement = document.getElementById('scale-'+parent_id);
      const parent_height = container.offsetHeight * (this.zs.zoom/this.default_cell_size);  
      new_tl = {x: topleft.x, y: topleft.y + parent_height};
    }

    const outs = this.tree.getNonCxnOutputs(parent_id);
    if(outs.length > 1){
      const this_child = outs.findIndex(el => el === id);
      if(this_child === -1){ console.error("subdraft not found in parent output list")};
      
      const updated_point: Point = outs
      .filter((el, ndx) => (ndx < this_child))
      .reduce((acc, el, ndx) => {
        const el_draft = this.tree.getDraft(el);
         acc.x = acc.x + (warps(el_draft.drawdown) + 2)*this.default_cell_size;
         return acc;
      }, topleft);
      
      new_tl = updated_point;

    }

  }
  return new_tl;
}




/**
 * this calls a function for an operation to perform and then subsequently calls all children 
 * to recalculate. After each calculation, it redraws and or creates any new subdrafts
 * @param op_id 
 * @returns 
 */
performAndUpdateDownstream(op_id:number) : Promise<any>{

  this.tree.getOpNode(op_id).dirty = true;
  this.tree.getDownstreamOperations(op_id).forEach(el => this.tree.getNode(el).dirty = true);

  return this.tree.performGenerationOps([op_id])
  .then(draft_ids => {

    const all_ops = this.tree.getOpNodes();
    all_ops.forEach(op =>{
      let children = this.tree.getNonCxnOutputs(op.id);
      (<OperationComponent> op.component).updateChildren(children);

    })


    const fns = this.tree.getDraftNodes()
      .filter(el => el.component !== null && el.dirty)
      .map(el => (<SubdraftComponent> el.component).draft_rendering.drawDraft((<DraftNode>el).draft));



    //create any new subdrafts nodes
    // const new_drafts = this.tree.getDraftNodes()
    //   .filter(el => el.component === null)
    //   .map(el => {
    //     return this.loadSubDraft(
    //       el.id, 
    //       (<DraftNode>el).draft, 
    //       {
    //         node_id: el.id,
    //         type: el.type,
    //         topleft: this.calculateInitialLocaiton(el.id),
    //       }, null,this.zs.zoom);
    //     });
      

    //    return  Promise.all([Promise.all(fns), Promise.all(new_drafts)]);
        
       
  }).then(el => {
    const loads =[];
    const new_cxns = this.tree.nodes.filter(el => el.type === 'cxn' && el.component === null);   
    new_cxns.forEach(cxn => {
      const from_node:Array<number> = this.tree.getInputs(cxn.id);
      const to_node:Array<number> = this.tree.getOutputs(cxn.id);
      if(from_node.length !== 1 || to_node.length !== 1) Promise.reject("connection has zero or more than one input or output");
     // loads.push(this.loadConnection(cxn.id));
    })

    //update the positions of the connections
    // let all_cxns = this.tree.getConnections();
    // all_cxns.forEach(cxn => {
    //   let to = this.tree.getOutputs(cxn.id);
    //   to.forEach(id => {
    //     cxn.updateToPosition(id, this.zs.zoom)
    //   })
    // })

    return Promise.all(loads);

    }
  );

}

/**
 * when a subdraft is closed, it has no operation to run before updaing downstream, instead it ONLY needs to update the downstream values
 * @param subdraft_id 
 */
updateDownstream(subdraft_id: number) {

  let out = this.tree.getNonCxnOutputs(subdraft_id);
  console.log("out ", out)
  
  out.forEach(op_id => {
    this.tree.getOpNode(op_id).dirty = true;
    this.tree.getDownstreamOperations(op_id).forEach(el => this.tree.getNode(el).dirty = true);  
  })

 
  return this.tree.performGenerationOps(out)
  .then(draft_ids => {

    const fns = this.tree.getDraftNodes()
      .filter(el => el.component !== null && el.dirty)
      .map(el => (<SubdraftComponent> el.component).draft_rendering.drawDraft((<DraftNode>el).draft));



    //create any new subdrafts nodes
    const new_drafts = this.tree.getDraftNodes()
      .filter(el => el.component === null)
      .map(el => {
        //console.log("loading new subdraft", (<DraftNode>el).draft);
        return this.loadSubDraft(
          el.id, 
          (<DraftNode>el).draft, 
          {
            node_id: el.id,
            type: el.type,
            topleft: this.calculateInitialLocaiton(el.id),
          }, null,this.zs.zoom);
        });
      

        return  Promise.all([Promise.all(fns), Promise.all(new_drafts)]);
        
       
  }).then(el => {
    const loads =[];
    const new_cxns = this.tree.nodes.filter(el => el.type === 'cxn' && el.component === null);   
    new_cxns.forEach(cxn => {
      const from_node:Array<number> = this.tree.getInputs(cxn.id);
      const to_node:Array<number> = this.tree.getOutputs(cxn.id);
      if(from_node.length !== 1 || to_node.length !== 1) Promise.reject("connection has zero or more than one input or output");
      loads.push(this.loadConnection(cxn.id));
    })

    return Promise.all(loads);

    }
  );

}

 
/**
 * when an inlet is pressed on an operation, highlight all things contributed to this inlet
 * @param op_id 
 * @param inlet_id 
 * @param ndx_in_inlets - if there aremultiple inputs at a single inlet, give the number in that list
 */
highlightPathToInlet(op_id: number, inlet_id: number, ndx_in_inlets: number){

const cxns = this.tree.getInputsAtNdx(op_id, inlet_id);
const upstream_ops = this.tree.getUpstreamOperations(cxns[ndx_in_inlets].tn.node.id); 
const upstream_drafts = this.tree.getUpstreamDrafts(cxns[ndx_in_inlets].tn.node.id); 

// const upstream_ops = cxns.reduce((acc, val)=>{
//    const ids = this.tree.getUpstreamOperations(val.tn.node.id);
//    return acc.concat(ids);
//  }, []); 

// const upstream_drafts = cxns.reduce((acc, val)=>{
//   const ids = this.tree.getUpstreamDrafts(val.tn.node.id);
//   return acc.concat(ids);
// }, []); 

const upstream_cxn = upstream_drafts.reduce((acc, draft)=>{
  return acc.concat(this.tree.getOutputs(draft));
}, []); 



//  const upstream_drafts = this.tree.getUpstreamDrafts(op_id);
const op_children = this.tree.getNonCxnOutputs(op_id);

 const all_ops = this.tree.getOpNodes();
 all_ops.forEach(op => {
  if(upstream_ops.find(el => el === op.id) === undefined){
    if(op.id !== op_id){
      const div = document.getElementById("scale-"+op.id);
      if(div !== null) div.style.opacity = ".2";
    } 
  }
 })

 const all_drafts = this.tree.getDraftNodes();
 all_drafts.forEach(draft => {
  if(upstream_drafts.find(el => el === draft.id) === undefined){
    if(op_children.find(del => del === draft.id) === undefined){
      const div = document.getElementById("scale-"+draft.id);
      if(div !== null) div.style.opacity = ".2";
    } 
  }
 })

 const all_cxns = this.tree.getConnections();
 all_cxns.forEach(cxn => {
  if(upstream_cxn.find(el => el === cxn.id) === undefined){
    const div = document.getElementById("scale-"+cxn.id);
    if(div !== null) div.style.opacity = ".2";
  }else{
    cxn.show_path_text = true;
    cxn.drawConnection(this.zs.zoom);
  }
 })

}

resetOpacity(){
  const ops = this.tree.getOpNodes();
  ops.forEach(op => {
    const div = document.getElementById("scale-"+op.id);
    if(div !== null) div.style.opacity = "1"
  });

  const drafts = this.tree.getDraftNodes();
  drafts.forEach(draft => {
    const div = document.getElementById("scale-"+draft.id);
    if(div !== null) div.style.opacity = "1"
  });

  const cxns = this.tree.getConnections();
  cxns.forEach(cxn => {
    const div = document.getElementById("scale-"+cxn.id);
    if(div !== null)  div.style.opacity = "1"
    cxn.show_path_text = false;
    cxn.drawConnection(this.zs.zoom);

  });

  
}



/**
 * called from an operation or inlet to allow for the inlighting of all upstream operations and drafts
 * @param obj 
 */
updateVisibility(obj: any){
  {

    this.resetOpacity();
    if(obj.show == true){

      //unset any no longer selected inlets
      const ops:Array<OpNode> = this.tree.getOpNodes();
      const not_selected = ops.filter(el => el.id !== obj.id);


      not_selected.forEach((op, ndx) => {
        const inlets = op.inlets.map((val, ndx)=> ndx);
        (<OperationComponent>op.component).resetVisibliity(inlets);
      })

      let selected = ops.filter(el => el.id == obj.id);
      if(selected.length > 0){
        const inlets = selected[0].inlets.map((val, ndx)=> ndx).filter(el => el !== obj.ndx);
        (<OperationComponent>selected[0].component).resetVisibliity(inlets);
      }


      this.highlightPathToInlet(obj.id, obj.ndx, obj.ndx_in_inlets);


    }else{
      this.visible_op = -1;
      this.visible_op_inlet = -1;
    }

  } 
}

/**
 * called from an operation or inlet to allow for the inlighting of all upstream operations and drafts
 * @param obj 
 */
inletLoaded(obj: any){
  //redraw the inlet
  // let opid = obj.opid;
  // let ndx = obj.ndx;

  // const opnode = this.tree.getOpNode(opid);
  // const cxns = this.tree.getInputsAtNdx(opnode.id, ndx);
  // // console.log("CXNS ", cxns);
  // cxns.forEach(io => {
  //   const cxn = <ConnectionComponent> this.tree.getComponent(io.tn.node.id);
  //   // console.log("ATTEMPTING TO UPDATE TO POSITION ")
  //   cxn.updateToPosition(opnode.id, this.zs.zoom)
  // })
}

/**
 * called from an operation or inlet to allow for the highlighting of all upstream operations and drafts
 * @param obj 
 */
opCompLoaded(obj: any){
  //redraw the inlet
  // let opid = obj.id;
  // const cxns = this.tree.getInputsWithNdx(opid);


}




/**
 * emitted from operation when it receives a hit on its connection button, the id refers to the operation id
 */
connectionMade(obj: any){


  if(!this.tree.hasOpenConnection()) return;


  //this is defined in the order that the line was drawn
  const op:OperationComponent = <OperationComponent>this.tree.getComponent(obj.id);
  const sd: number = this.tree.getOpenConnectionId();
  
  this.createConnection(sd, obj.id, obj.ndx);
  
  this.performAndUpdateDownstream(obj.id).then(el => {
    this.addTimelineState();
  });

  this.processConnectionEnd();

}

pasteConnection(from: number, to: number, inlet: number){

  this.createConnection(from, to, inlet);

  this.performAndUpdateDownstream(to).then(el => {
    this.addTimelineState();
  });

}

/**
 * Called when a connection is explicitly deleted
*/
 removeConnection(obj: {id: number}){

  let to = this.tree.getConnectionOutput(obj.id)

  const to_delete = this.tree.removeConnectionNodeById(obj.id);  
  to_delete.forEach(node => this.removeFromViewContainer(node.ref));

 
 // if(to_delete.length > 0) console.log("Error: Removing Connection triggered other deletions");

   this.processConnectionEnd();
  
   if(this.tree.getType(to)==="op"){
     this.performAndUpdateDownstream(to);
   }
  
  this.addTimelineState();


}

 

 selectionStarted(){

  this.selection.start = this.last;
  this.selection.active = true;
 }

 panStarted(mouse_pos: Point){
  console.log("PAN STARTED")
  this.last_point = mouse_pos;
  this.freezePaletteObjects();

 }

 /**
 * brings the base canvas to view and begins to render the
 * @param mouse the absolute position of the mouse on screen
 */
// shapeStarted(mouse: Point){

//   const rel:Point = {
//     x: mouse.x - this.viewport.getTopLeft().x,
//     y: mouse.y - this.viewport.getTopLeft().y
//   }
  
//   this.shape_bounds = {
//     topleft: rel,
//     width: this.zs.zoom,
//     height: this.zs.zoom
//   };


//   this.shape_vtxs = [];
//   this.canvas_zndx = this.layers.createLayer(); //bring this canvas forward
//   this.cx.fillStyle = "#ff4081";
//   this.cx.fillRect( this.shape_bounds.topleft.x, this.shape_bounds.topleft.y, this.shape_bounds.width,this.shape_bounds.height);
  
//   if(this.dm.isSelected('free', 'shapes')){
//     this.startSnackBar("CTRL+Click to end drawing", this.shape_bounds);
//   }else{
//     this.startSnackBar("Press SHIFT while dragging to constrain shape", this.shape_bounds);
//   }
 

// }

  /**
   * resizes and redraws the shape between the the current mouse and where the shape started
   * @param mouse the absolute position of the mouse on screen
   */
// shapeDragged(mouse: Point, shift: boolean){

//   const rel:Point = {
//     x: mouse.x - this.viewport.getTopLeft().x,
//     y: mouse.y - this.viewport.getTopLeft().y
//   }

//   this.shape_bounds.width =  (rel.x - this.shape_bounds.topleft.x);
//   this.shape_bounds.height =  (rel.y - this.shape_bounds.topleft.y);

//   if(shift){
//     const max: number = Math.max(this.shape_bounds.width, this.shape_bounds.height);
    
//     //allow lines to snap to coords
//     if(this.dm.isSelected('line', 'shapes')){
//         if(Math.abs(this.shape_bounds.width) < Math.abs(this.shape_bounds.height/2)){
//           this.shape_bounds.height = max;
//           this.shape_bounds.width = this.zs.zoom;
//         }else if(Math.abs(this.shape_bounds.height) < Math.abs(this.shape_bounds.width/2)){
//           this.shape_bounds.width = max;
//           this.shape_bounds.height = this.zs.zoom;
//         }else{
//           this.shape_bounds.width = max;
//           this.shape_bounds.height = max;  
//         }
        
//     }else{
//       this.shape_bounds.width = max;
//       this.shape_bounds.height = max;    
  
//     }
//   }

//   this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
//   this.cx.beginPath();
//   this.cx.fillStyle = "#ff4081";
//   this.cx.strokeStyle = "#ff4081";
//   this.cx.setLineDash([]);
//   this.cx.lineWidth = this.zs.zoom;

//   if(this.dm.isSelected('line', 'shapes')){
//     this.cx.moveTo(this.shape_bounds.topleft.x+this.zs.zoom, this.shape_bounds.topleft.y+this.zs.zoom);
//     this.cx.lineTo(this.shape_bounds.topleft.x + this.shape_bounds.width, this.shape_bounds.topleft.y + this.shape_bounds.height);
//     this.cx.stroke();
//   }else if(this.dm.isSelected('fill_circle','shapes')){
//     this.shape_bounds.width = Math.abs(this.shape_bounds.width);
//     this.shape_bounds.height = Math.abs(this.shape_bounds.height);
//     this.cx.ellipse(this.shape_bounds.topleft.x, this.shape_bounds.topleft.y, this.shape_bounds.width, this.shape_bounds.height, 2 * Math.PI, 0,  this.shape_bounds.height/2);
//     this.cx.fill();
//   }else if(this.dm.isSelected('stroke_circle','shapes')){
//     this.cx.ellipse(this.shape_bounds.topleft.x, this.shape_bounds.topleft.y, this.shape_bounds.width, this.shape_bounds.height, 2 * Math.PI, 0,  this.shape_bounds.height/2);
//     this.cx.stroke();
//   }else if(this.dm.isSelected('fill_rect','shapes')){
//     this.cx.fillRect(this.shape_bounds.topleft.x, this.shape_bounds.topleft.y,this.shape_bounds.width,this.shape_bounds.height);
  
//   }else if(this.dm.isSelected('stroke_rect','shapes')){
//     this.cx.strokeRect(this.shape_bounds.topleft.x + this.zs.zoom, this.shape_bounds.topleft.y+ this.zs.zoom,this.shape_bounds.width-this.zs.zoom,this.shape_bounds.height-this.zs.zoom);

//   }else{

//     if(this.shape_vtxs.length > 1){
//       this.cx.moveTo(this.shape_vtxs[0].x, this.shape_vtxs[0].y);

//       for(let i = 1; i < this.shape_vtxs.length; i++){
//         this.cx.lineTo(this.shape_vtxs[i].x, this.shape_vtxs[i].y);
//         //this.cx.moveTo(this.shape_vtxs[i].x, this.shape_vtxs[i].y);
//       }

//     }else{
//       this.cx.moveTo(this.shape_bounds.topleft.x, this.shape_bounds.topleft.y);
//     }

//     this.cx.lineTo(this.shape_bounds.topleft.x + this.shape_bounds.width, this.shape_bounds.topleft.y + this.shape_bounds.height);
//     this.cx.stroke();
//     this.cx.fill();
    
//   }

// }


/**
 * clears the scratchpad for the new drawing event
 */
// drawStarted(){


//   this.canvas_zndx = this.layers.createLayer(); //bring this canvas forward
  
//   this.scratch_pad = [];
//   for(let i = 0; i < this.canvas.height; i+=this.zs.zoom ){
//       const row = [];
//       for(let j = 0; j< this.canvas.width; j+=this.zs.zoom ){
//           row.push(createCell(null));
//       }
//     this.scratch_pad.push(row);
//     }

//     this.startSnackBar("Drag to Draw", null);
//   }



  /**
   * update the viewport when the window is resized
   * @param event 
   */
  @HostListener('window:resize', ['$event'])
    onResize(event) {

      this.viewport.setWidth(event.target.innerWidth);
      this.viewport.setHeight(event.target.innerHeight);

    }


 /**
  * handles actions to take when the mouse is down inside of the palette
  * @param event the mousedown event
  */
  @HostListener('mousedown', ['$event'])
    private onStart(event) {

      if(this.selecting_connection == true){
        this.processConnectionEnd();
      }

      if(this.needs_init){
      //this is a hack to update the screen posiitons because not all inforamtion is ready when onload and onview init completes
        let ops = this.tree.getOpNodes();
        ops.forEach(op => {
          this.opCompLoaded(op);
  
          // let drafts = this.tree.getDraftOutputs(op.id);
          // drafts.forEach((draft, ndx) => {
          //   let draftcomp = <SubdraftComponent> this.tree.getComponent(draft);
          //   draftcomp.updatePositionFromParent(<OperationComponent>op.component, ndx)
          // })
  
          }
        );
        this.needs_init = false;
      }

      const ctrl: boolean = event.ctrlKey;
      const mouse:Point = {x: this.viewport.getTopLeft().x + event.clientX, y:this.viewport.getTopLeft().y+event.clientY};
      const ndx:any = utilInstance.resolveCoordsToNdx(mouse, this.zs.zoom);

      //use this to snap the mouse to the nearest coord
      mouse.x = ndx.j * this.zs.zoom;
      mouse.y = ndx.i * this.zs.zoom;

      
      this.last = ndx;
      this.selection.start = this.last;
      this.removeSubscription();    
      
     

      if(this.dm.isSelectedMixerEditingMode("marquee")){
          this.selectionStarted();
          this.moveSubscription = 
          fromEvent(event.target, 'mousemove').subscribe(e => this.onDrag(e)); 
    
      // }else if(this.dm.isSelected("draw",'design_modes')){
      //   this.moveSubscription = 
      //   fromEvent(event.target, 'mousemove').subscribe(e => this.onDrag(e)); 
  
      //     this.drawStarted();    
      //     this.setCell(ndx);
      //     this.drawCell(ndx); 
      // }else if(this.dm.isSelected("shape",'design_modes')){
      //   this.moveSubscription = 
      //   fromEvent(event.target, 'mousemove').subscribe(e => this.onDrag(e)); 
  

      //   if(this.dm.isSelected('free','shapes')){
      //     if(ctrl){
      //       this.processShapeEnd().then(el => {
      //         this.changeDesignmode('move');
      //         this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      //       });
      //     }else{
      //       if(this.shape_vtxs.length == 0) this.shapeStarted(mouse);
      //       this.shape_vtxs.push(mouse);
      //     }
            
          
      //   }else{
      //     this.shapeStarted(mouse);
      //   }
      // }else if(this.dm.isSelected("operation",'design_modes')){
        // this.processConnectionEnd();
        // this.changeDesignmode('move');
      }else if(this.dm.isSelectedMixerEditingMode("move")){

       if(event.shiftKey) return;
        this.multiselect.clearSelections();

      }else if(this.dm.isSelectedMixerEditingMode("pan")){

        this.panStarted({x: event.clientX, y: event.clientY});
        this.moveSubscription = 
        fromEvent(event.target, 'mousemove').subscribe(e => this.onDrag(e)); 

      }
  }


  @HostListener('mousemove', ['$event'])
  private onMove(event) {





    const shift: boolean = event.shiftKey;
    const mouse:Point = {x: this.viewport.getTopLeft().x + event.clientX, y:this.viewport.getTopLeft().y+event.clientY};
    const ndx:any = utilInstance.resolveCoordsToNdx(mouse, this.zs.zoom);
    mouse.x = ndx.j * this.zs.zoom;
    mouse.y = ndx.i *this.zs.zoom;

    if(this.selecting_connection){
      this.connectionDragged(mouse, shift);
    }
  }
  
 /**
  * called when the operation input is selected and used to draw
   * @param event the event object
   */
  mouseSelectingDraft(event: any, id: number){

    const shift: boolean = event.shiftKey;
    const mouse: Point = {x: this.viewport.getTopLeft().x + event.clientX, y:this.viewport.getTopLeft().y+event.clientY};
    const ndx:Interlacement = utilInstance.resolveCoordsToNdx(mouse, this.zs.zoom);
    //use this to snap the mouse to the nearest coord
    mouse.x = ndx.j * this.zs.zoom;
    mouse.y = ndx.i * this.zs.zoom;

    if(utilInstance.isSameNdx(this.last, ndx)) return;

    // if(this.dm.getDesignMode("operation",'design_modes').selected){

     
    
    // }
    
    this.last = ndx;
  }

  /**
   * called form the subscription created on start, checks the index of the location and returns null if its the same
   * @param event the event object
   */
  onDrag(event){


    const shift: boolean = event.shiftKey;
    const mouse: Point = {x: this.viewport.getTopLeft().x + event.clientX, y:this.viewport.getTopLeft().y+event.clientY};
    const ndx:Interlacement = utilInstance.resolveCoordsToNdx(mouse, this.zs.zoom);

    //use this to snap the mouse to the nearest coord
    mouse.x = ndx.j *this.zs.zoom;
    mouse.y = ndx.i * this.zs.zoom;

    if(utilInstance.isSameNdx(this.last, ndx)) return;

    if(this.dm.isSelectedMixerEditingMode("marquee")){
     this.drawSelection(ndx);
     const bounds:Bounds = this.getSelectionBounds(this.selection.start,  this.last);    
     this.selection.setPositionAndSize(bounds);
    }else if(this.dm.isSelectedMixerEditingMode("pan")){
      
      const diff = {
        x:  (this.last_point.x-event.clientX), 
        y: (this.last_point.y-event.clientY)}

      this.handlePan(diff);

    }
    
    // }else if(this.dm.getDesignMode("draw", 'design_modes').selected){
    //   this.setCell(ndx);
    //   this.drawCell(ndx);
    // }else if(this.dm.getDesignMode("shape",'design_modes').selected){
    //   this.shapeDragged(mouse, shift);
    // }
    
    this.last = ndx;
    this.last_point = {x: event.clientX, y: event.clientY};
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
    
      const mouse: Point = {x: this.viewport.getTopLeft().x + event.clientX, y:this.viewport.getTopLeft().y+event.clientY};
      const ndx:Interlacement = utilInstance.resolveCoordsToNdx(mouse, this.zs.zoom);
      //use this to snap the mouse to the nearest coord
      mouse.x = ndx.j * this.zs.zoom;
      mouse.y = ndx.i * this.zs.zoom;

      this.removeSubscription();   

      if(this.dm.isSelectedMixerEditingMode("marquee")){
        if(this.selection.active) this.processSelection();
        this.closeSnackBar();
        this.changeDesignmode('move');
        this.unfreezePaletteObjects();
      }else if(this.dm.isSelectedMixerEditingMode('pan')){
        const div:HTMLElement = document.getElementById('scrollable-container');
        this.viewport.set(div.offsetParent.scrollLeft, div.offsetParent.scrollTop,  div.offsetParent.clientWidth,  div.offsetParent.clientHeight);

      }


      // }else if(this.dm.isSelected("draw",'design_modes')){
       
      //   this.processDrawingEnd().then(el => {
      //     this.closeSnackBar();
      //     this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      //     this.changeDesignmode('move');
      //     this.scratch_pad = undefined;
      //   }).catch(console.error);
      



      // }else if(this.dm.isSelected("shape",'design_modes')){
      //   if(!this.dm.isSelected('free','shapes')){
          
      //     this.processShapeEnd().then(el => {
      //       this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      //       this.changeDesignmode('move');
           
      //    });
      //   }
          
      // }

      //unset vars that would have been created on press
      this.last = undefined;
      this.last_point = undefined;
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
    
    
    this.createSubDraft(initDraftWithParams({wefts: bounds.height/this.zs.zoom, warps: bounds.width/this.zs.zoom}), -1)
    .then(sc => {
      sc.setPosition(bounds.topleft);
      //const isect:Array<SubdraftComponent> = this.getIntersectingSubdrafts(sc);
      const isect = [];
      if(isect.length === 0){
        this.addTimelineState();
        return;
      } 

       //get a draft that reflects only the poitns in the selection view
      // const new_draft: Draft = this.getCombinedDraft(bounds, sc, isect);
      // this.tree.setDraftOnly(sc.id, new_draft)
    

    // isect.forEach(el => {
    //   const ibound = utilInstance.getIntersectionBounds(sc, el);

    //   if(el.isSameBoundsAs(ibound)){
    //      console.log("Component had same Bounds as Intersection, Consumed");
    //      this.removeSubdraft(el.id);
    //   }

    // });
    })
    .catch(console.error);
   
    
    
   

  }


  /**
   * this function will update any components that should move when the compoment passed by obj moves
   * moves all compoments returned from tree.getNodesToUpdate(). All changes to what updates should be 
   * handled by getNodesToUpdateOnMove
   * @param obj 
   */
  updateAttachedComponents(id: number, follow: boolean){

    //start by moving the original object than ripple out;
    const moving : any = this.tree.getComponent(id);

    this.tree.getInputs(id).forEach(cxn => {
       const comp: ConnectionComponent = <ConnectionComponent>this.tree.getComponent(cxn);
       comp.updateToPosition(id, this.zs.zoom);
    });

    this.tree.getOutputs(id).forEach(cxn => {
      const comp: ConnectionComponent = <ConnectionComponent>this.tree.getComponent(cxn);
      if(comp !== null) comp.updateFromPosition(id, this.zs.zoom);
   });

   if(!follow) return;

   const outs: Array<number> = this.tree.getNonCxnOutputs(id);

   //if this an operation with one child, move the child. 
   if(this.tree.getType(moving.id) === "op" ){

      outs.forEach((out, ndx) => {
        const out_comp = <SubdraftComponent> this.tree.getComponent(out);
       // if(this.tree.getType(out_comp.id) === 'draft') out_comp.updatePositionFromParent(moving, ndx);
        this.updateAttachedComponents(out_comp.id, false);
      })

    
    }

    const ins = this.tree.getNonCxnInputs(id);
    //if this is a draft with a parent, move the parent as well 
    if(this.tree.getType(moving.id) === "draft" && !this.tree.isSibling(moving.id)){
      ins.forEach(input => {
        const in_comp: OperationComponent = <OperationComponent> this.tree.getComponent(input);
       // in_comp.updatePositionFromChild(moving);
        this.updateAttachedComponents(in_comp.id, false);
      });
    }
      
   
  }


  /**
   * emitted from a subdraft when an internal action has changeded its value 
   * checks for a child subdraft, recomputes, redraws. 
   * @param obj with attribute id describing the subdraft that called this
   * @returns 
   */
  onSubdraftAction(obj: any){

    if(obj === null) return;

    const outputs = this.tree.getNonCxnOutputs(obj.id);
    const fns = outputs.map(out => this.performAndUpdateDownstream(out));
    Promise.all(fns).then(el => {
      this.addTimelineState();
      this.changeDesignmode('move')
    })



  }

  /**
   * emitted from an operation when its param has changed. This is automatically called on load 
   * which is annoying because it recomputes everything!
   * checks for a child subdraft, recomputes, redraws. 
   * @param obj with attribute id describing the operation that called this
   * @returns 
   */
   async operationParamChanged(obj: any){

    if(obj === null) return;

    return this.tree.sweepInlets(obj.id, obj.prior_inlet_vals)
      .then(viewRefs => {
        viewRefs.forEach(el => {
          this.removeFromViewContainer(el)
        });
        return this.performAndUpdateDownstream(obj.id)
      } )
      .then(el => {
        let children = this.tree.getNonCxnOutputs(obj.id);
        if(children.length > 0) this.revealDraftDetails(children[0]);
        return this.tree.sweepOutlets(obj.id)
      })
      .then(viewRefs => {
        viewRefs.forEach(el => {
          this.removeFromViewContainer(el)
        });
        this.addTimelineState();
      })
      .catch(console.error);
   
    

  }

  paletteClicked(){
  }

/**
 * called from an operation component when it is dragged
 * @param obj (id, point of toplleft)
 */
  operationMoved(obj: any){
    if(obj === null) return;
  
    this.updateAttachedComponents(obj.id, true);
    this.moveAllSelections(obj.id);


  }

  /**
 * called from an operation component when it is done moving 
 * this allows us to not write postioin continuously, but just once on end
 * @param obj (id, point of toplleft)
 */
   operationMoveEnded(obj: any){
    if(obj === null) return;

    this.updateSelectionPositions(obj.id);

    this.addTimelineState();

  }

  updateSelectionPositions(moving_id: number){
    const selections = this.multiselect.getSelections();
    selections.forEach(sel => {
      if(this.tree.getType(sel) != 'cxn' && sel !== moving_id){
        const comp = this.tree.getComponent(sel);
        this.multiselect.setPosition(sel, comp.topleft)
      }

     
    })

  }

  /**
   * this is called when a multi-selected block of items is moved. 
   * Sometimes its called if you paste one set of items to a new space, in which case the nodes do
   * not yet exist. 
   * @param moving_id 
   * @returns 
   */
  moveAllSelections(moving_id: number){
    const selections = this.multiselect.getSelections();
    if(selections.length == 0) return;

    const rel_pos = this.multiselect.getRelativePosition();
    const cur_pos = this.tree.getComponent(moving_id).topleft;
    const diff:Point = {x: cur_pos.x - rel_pos.x, y: cur_pos.y - rel_pos.y};

    selections.forEach(sel => {
      if(this.tree.getNode(sel) == null) return;

      if(this.tree.getType(sel) == 'op' && sel !== moving_id){
        const comp = this.tree.getComponent(sel);
        comp.topleft = this.multiselect.getNewPosition(sel, diff);
        this.updateAttachedComponents(sel, true);
      }
      if(this.tree.getType(sel)=='draft' && sel !== moving_id){
        const comp = <SubdraftComponent> this.tree.getComponent(sel);
        if(comp.parent_id == -1) comp.setPosition( this.multiselect.getNewPosition(sel, diff));
      }
    });
  }




  /**
   * called when subdraft component says its moving
   * @param obj the subdraft that called this
   * @returns 
   */
  subdraftMoved(obj: any){

      console.log("Subdraft moved")
      if(obj === null) return;
  
      //get the reference to the draft that's moving
      const moving = <SubdraftComponent> this.tree.getComponent(obj.id);
      
      if(moving === null) return; 

      this.moveAllSelections(obj.id);
      this.updateAttachedComponents(moving.id, true);

    }


   /**
    * checks if this subdraft has been dropped onto of another and merges them accordingly 
    * @param obj 
    * @returns 
    */
  subdraftDropped(obj: any){

    this.closeSnackBar();

    if(obj === null) return;
    this.updateSelectionPositions(obj.id);

    this.addTimelineState();
    this.tree.unsetPreview();
  
    //get the reference to the draft that's moving
    const moving = this.tree.getComponent(obj.id);
    const interlacement = utilInstance.resolvePointToAbsoluteNdx(moving.topleft, this.zs.zoom);
    this.viewport.updatePoint(moving.id, interlacement);
      


  }


  getSelectionBounds(c1: any, c2: any): Bounds{
      let bottomright = {x: 0, y:0};
      let bounds:Bounds = {
        topleft:{x: 0, y:0},
        width: 0,
        height: 0
      }
      if(c1.i < c2.i){
        bounds.topleft.y = c1.i * this.zs.zoom;
        bottomright.y = c2.i * this.zs.zoom;
      }else{
        bounds.topleft.y = c2.i * this.zs.zoom;
        bottomright.y = c1.i * this.zs.zoom;
      }

      if(c1.j < c2.j){
        bounds.topleft.x = c1.j * this.zs.zoom;
        bottomright.x = c2.j * this.zs.zoom;
      }else{
        bounds.topleft.x = c1.j * this.zs.zoom;
        bottomright.x = c2.j * this.zs.zoom;
      }

      bounds.width = bottomright.x - bounds.topleft.x;
      bounds.height = bottomright.y - bounds.topleft.y;

      return bounds;
  }




      /**
       * TODO: Update this to get bounds and print all items, not just what's visible
       * @param obj 
       * @returns 
       */
  // getPrintableCanvas(obj): HTMLCanvasElement{

  //   this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  //   const drafts: Array<SubdraftComponent> = this.tree.getDrafts();
  //   drafts.forEach(sd => {
  //     sd.drawForPrint(this.canvas, this.cx, this.zs.zoom);
  //   });

  //   const ops: Array<OperationComponent> = this.tree.getOperations();
  //   ops.forEach(op => {
  //     op.drawForPrint(this.canvas, this.cx, this.zs.zoom);
  //   });

  //   const cxns: Array<ConnectionComponent> = this.tree.getConnections();
  //   cxns.forEach(cxn => {
  //     cxn.drawForPrint(this.canvas, this.cx, this.zs.zoom);
  //   });

  //   // this.note_components.forEach(note =>{
  //   //   note.drawForPrint(this.canvas, this.cx, this.scale);
  //   // })

  //   return this.canvas;

  // }



  // redrawOpenModals(){
  //   const comps = this.tree.getDrafts();
  //   comps.forEach(sd => {
  //     if(sd.modal !== undefined && sd.modal.componentInstance !== null){
  //       sd.modal.componentInstance.redraw();
  //     }
  //   })
  // }
    
  redrawAllSubdrafts(){
      const comps = this.tree.getDrafts();
      comps.forEach(sd => {
        sd.redrawExistingDraft();
      })
    }
  }