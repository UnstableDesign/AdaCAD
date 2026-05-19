import { Component, EventEmitter, inject, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CdkDrag, CdkDragEnd, CdkDragHandle, CdkDragMove, CdkDragStart, Point } from '@angular/cdk/drag-drop';
import { Draft, Interlacement, LoomSettings, wefts, warps, isUp } from 'adacad-drafting-lib';
import { Subscription } from 'rxjs';
import { DraftNode, DraftStateMove, FunctionNode } from '../../../core/model/datatypes';
import { StateService } from '../../../core/provider/state.service';
import { TreeService } from '../../../core/provider/tree.service';
import { ViewerService } from '../../../core/provider/viewer.service';
import { WorkspaceService } from '../../..//core/provider/workspace.service';
import { ZoomService } from '../../../core/provider/zoom.service';
import { LayersService } from '../../provider/layers.service';
import { MultiselectService } from '../../provider/multiselect.service';
import { ViewportService } from '../../provider/viewport.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-function',
  imports: [CdkDrag, CdkDragHandle, MatButtonModule],
  templateUrl: './function.component.html',
  styleUrl: './function.component.scss',
})
export class FunctionComponent {
  private layer = inject(LayersService);
  tree = inject(TreeService);
  private viewport = inject(ViewportService);
  ws = inject(WorkspaceService);
  private multiselect = inject(MultiselectService);
  private vs = inject(ViewerService);
  zs = inject(ZoomService);
  private ss = inject(StateService);


  @Input() id: number;
  @Input() scale: number;
  @Input() value: number;


  @Output() onFunctionMove = new EventEmitter<any>();
  @Output() onFunctionDrop = new EventEmitter<any>();
  @Output() onFunctionStart = new EventEmitter<any>();
  @Output() onDeleteCalled = new EventEmitter<any>();
  @Output() onDuplicateCalled = new EventEmitter<any>();
  @Output() onConnectionMade = new EventEmitter<any>();
  @Output() onConnectionRemoved = new EventEmitter<any>();
  @Output() onDesignAction = new EventEmitter<any>();
  @Output() onConnectionStarted: any = new EventEmitter<any>();
  @Output() onRedrawOutboundConnections = new EventEmitter<any>();



  isNew: boolean = false;
  fn: FunctionNode;
  private topleft: Point = { x: 0, y: 0 };


  parent_id: number = -1;

  /**
  * flag to tell if this is in a mode where it is looking foor a connectino
  */
  selecting_connection: boolean = false;


  counter: number = 0; // keeps track of how frequently to call the move functions

  counter_limit: number = 50;  //this sets the threshold for move calls, lower number == more calls

  moving: boolean = false;

  disable_drag: boolean = false;

  is_preview: boolean = false;

  zndx = 0;

  has_active_connection: boolean = false;

  set_connectable: boolean = false;

  outlet_connected: boolean = false;

  // draft_visible: boolean = true;


  offset: Point = null;

  previous_topleft: Point = { x: 0, y: 0 };

  multiSelectListChangeSubscription: Subscription;
  multiSelectMoveElementsSubscription: Subscription;

  wasDragged: boolean = false;

  constructor() {
    const layer = this.layer;
    this.zndx = layer.createLayer();
  }


  ngOnInit() {

    this.parent_id = this.tree.getFunctionParent(this.id);
    const tl: Point = this.viewport.getTopRight();
    const tl_offset = { x: tl.x, y: tl.y };

    if (this.topleft.x === 0 && this.topleft.y === 0) this.setPosition(tl_offset);


    this.fn = <FunctionNode>this.tree.getNode(this.id);

  }



  ngAfterViewInit() {



    this.setPosition(this.topleft, false);

    this.multiSelectListChangeSubscription = this.multiselect.multiSelectListChange$.subscribe(list => {
      let func_container = document.getElementById('scale-' + this.id);
      if (func_container == null) return;
      if (list.includes(this.id)) {
        func_container.classList.add('multiselected');
        if (this.multiSelectMoveElementsSubscription) this.multiSelectMoveElementsSubscription.unsubscribe();

        let ms_item = this.multiselect.selected.find(el => el.id == this.id);
        if (ms_item !== undefined) {
          this.multiSelectMoveElementsSubscription = ms_item.positionUpdate.subscribe(pos => {
            this.setPosition(pos, true);
          });
        }

      } else {
        func_container.classList.remove('multiselected');
        if (this.multiSelectMoveElementsSubscription) this.multiSelectMoveElementsSubscription.unsubscribe();
      }
    });


  }

  ngOnDestroy() {
    if (this.multiSelectListChangeSubscription) this.multiSelectListChangeSubscription.unsubscribe();
    if (this.multiSelectMoveElementsSubscription) this.multiSelectMoveElementsSubscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {


    //if scale is changed, automatically call the function to rescale
    if (changes['scale']) {
      //this.rescale().catch(e => { /* handle error silently */ })
    }

  }







  /**selects this subdraft only, resetting connections as though no other subdrafts are selected */
  selectFunctionOnly() {

    let allConnections = this.tree.getConnectionNodes();
    let upstreamConnections = this.tree.getUpstreamConnections(this.id);
    let downstreamConnections = this.tree.getDownstreamConnections(this.id);

    allConnections.forEach(el => {
      if (upstreamConnections.includes(el.id)) {
        el.upstreamOfSelected.next(true);
      } else {
        el.upstreamOfSelected.next(false);
      }

      if (downstreamConnections.includes(el.id)) {
        el.downstreamOfSelected.next(true);
      } else {
        el.downstreamOfSelected.next(false);
      }
    });


  }

  /**just strictly adds connectsion, but does not remove any */
  selectFunctionMulti() {
    let upstreamConnections = this.tree.getUpstreamConnections(this.id);
    let downstreamConnections = this.tree.getDownstreamConnections(this.id);

    upstreamConnections.map(el => this.tree.getConnectionNode(el)).forEach(el => {
      if (el !== null) {

        el.upstreamOfSelected.next(true);
      }
    });
    downstreamConnections.map(el => this.tree.getConnectionNode(el)).forEach(el => {
      if (el !== null) {
        el.downstreamOfSelected.next(true);
      }
    });
  }


  /**
   * the tree is likely to converge as we dravel down so there is a chance that removing 
   * this subdrafts children will inadventantly remove a different selected subdrafts downstrea. 
   * As such, we unselect this and then add back any other multiselected element children
   */
  unselectFunction() {
    let upstreamConnections = this.tree.getUpstreamConnections(this.id);
    let downstreamConnections = this.tree.getDownstreamConnections(this.id);

    upstreamConnections.map(el => this.tree.getConnectionNode(el)).forEach(el => {
      if (el !== null) {

        el.upstreamOfSelected.next(false);
      }
    });
    downstreamConnections.map(el => this.tree.getConnectionNode(el)).forEach(el => {
      if (el !== null) {
        el.downstreamOfSelected.next(false);
      }
    });

    this.multiselect.getSelections().forEach(el => {
      if (el !== this.id) {
        this.selectFunctionMulti();
      }
    });
  }


  toggleMultiSelection(e: any, type: string = 'click') {

    if (this.wasDragged) return;
    // this.onFocus.emit(this.id);
    //this.updateConnectionStyling(true);
    this.vs.setViewer(this.id);

    if (e.shiftKey == true) {
      this.multiselect.toggleSelection(this.id, this.topleft);
      if (this.multiselect.isSelected(this.id)) {
        this.selectFunctionMulti();
      } else {
        this.unselectFunction();
      }
    } else {
      this.multiselect.clearSelections();
      this.selectFunctionOnly();
    }

  }


  connectionEnded() {
    this.selecting_connection = false;
    this.enableDrag();
  }

  connectionStarted(obj) {
    let event = obj.event;
    let childid = obj.id;

    if (this.selecting_connection == true) {
      this.selecting_connection = false;
      this.onConnectionStarted.emit({
        type: 'stop',
        event: event,
        id: childid
      });
    } else {
      this.selecting_connection = true;

      this.disableDrag();

      this.onConnectionStarted.emit({
        type: 'start',
        event: event,
        id: childid
      });
    }

  }




  /**
   * called on create to position the element on screen
   * @param pos 
   */
  setPosition(pos: Point, emit: boolean = true) {
    console.log("SETTING POSITION ", pos);
    this.topleft = { x: pos.x, y: pos.y };
    if (emit) this.fn.positionChange.next(this.topleft);

    let sd_container = document.getElementById('scale-' + this.id);
    if (sd_container == null) return;
    sd_container.style.transform = 'none'; //negate angulars default positioning mechanism
    sd_container.style.top = this.topleft.y + "px";
    sd_container.style.left = this.topleft.x + "px";
  }

  getPosition(): Point {
    return this.topleft;
  }


  /**
   * gets the next z-ndx to place this in front
   */
  public setAsPreview() {
    this.is_preview = true;
    this.zndx = this.layer.createLayer();
  }



  /**
   * does this subdraft exist at this point?
   * @param p the absolute position of the coordinate (based on the screen)
   * @returns true/false for yes or no
   */
  public hasPoint(p: Point): boolean {
    const size = document.getElementById('scale' + this.id)


    const endPosition = {
      x: this.topleft.x + size.offsetWidth,
      y: this.topleft.y + size.offsetHeight,
    };

    if (p.x < this.topleft.x || p.x > endPosition.x) return false;
    if (p.y < this.topleft.y || p.y > endPosition.y) return false;


    return true;

  }


  /**
   * Takes row/column position in this subdraft and translates it to an absolution position  
   * @param ndx the index
   * @returns the absolute position as nxy
   */
  public resolveNdxToPoint(ndx: Interlacement): Point {

    let y = this.topleft.y + ndx.i * this.scale;
    let x = this.topleft.x + ndx.j * this.scale;
    return { x: x, y: y };

  }

  /**
   * Takes an absolute coordinate and translates it to the row/column position Relative to this subdraft
   * @param p the screen coordinate
   * @returns the row and column within the draft (i = row, j=col), returns -1 if out of bounds
   */
  public resolvePointToNdx(p: Point): Interlacement {
    const draft = this.tree.getDraft(this.id);

    let i = Math.floor((p.y - this.topleft.y) / this.scale);
    let j = Math.floor((p.x - this.topleft.x) / this.scale);

    if (i < 0 || i >= wefts(draft.drawdown)) i = -1;
    if (j < 0 || j >= warps(draft.drawdown)) j = -1;

    return { i: i, j: j };

  }




  onDoubleClick() {


  }







  /**
   * gets the position of this elment on the canvas. Dyanic top left might be bigger due to scolling intersection
   * previews. Use static for all calculating of intersections, etc. 
   * @returns 
   */
  getTopleft(): Point {
    return this.topleft;
  }

  /**
 * prevents hits on the operation to register as a palette click, thereby voiding the selection
 * @param e 
 */
  mousedown(e: any) {
    this.isNew = false;
    this.vs.setViewer(this.id);
    e.stopPropagation();
  }








  dragStart($event: CdkDragStart) {
    this.isNew = false;
    this.wasDragged = false;

    if (this.multiselect.isSelected(this.id)) {
      this.multiselect.setRelativePosition(this.topleft);
      this.multiselect.dragStart(this.id);
    }

    this.previous_topleft = { x: this.topleft.x, y: this.topleft.y };

    this.moving = true;
    this.offset = null;
    this.counter = 0;
    //set the relative position of this operation if its the one that's dragging

    this.onFunctionStart.emit({ id: this.id });


  }


  /**
    this function converts the position of the pointer into the platte coordinate space, it also factors in the top left position so that the 
    pointer position remains constant within the subdraft
   * @param $event 
   */
  dragMove($event: CdkDragMove) {

    this.wasDragged = true;
    let parent = document.getElementById('scrollable-container');
    let op_container = document.getElementById('scale-' + this.id);
    let rect_palette = parent.getBoundingClientRect();


    const zoom_factor = 1 / this.zs.getMixerZoom();

    //this gives the position of
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
      // console.log("LEFT WITH SCALE VS, LEFT POINTER ", op_topleft_inscale, scaled_pointer, this.offset);

    }


    this.topleft = {
      x: scaled_pointer.x - this.offset.x,
      y: scaled_pointer.y - this.offset.y

    }

    this.setPosition(this.topleft, true);
    if (this.multiselect.isSelected(this.id)) this.multiselect.dragMove(this.topleft);

    this.onFunctionMove.emit({ id: this.id, point: this.topleft });

  }

  //The drag event has handled the on screen view, but internally, we need to track the top left of the element for saving and loading. 
  dragEnd($event: any) {

    //CATCH THE CASE WHERE THIS IS DROPPED OUTSIDE OF SELECTABLE AREA

    let op_container = document.getElementById('scale-' + this.id);


    this.topleft = {
      x: (op_container.offsetLeft < 0) ? 0 : this.topleft.x,
      y: (op_container.offsetTop < 0) ? 0 : this.topleft.y,

    }

    this.setPosition(this.topleft, true);



    this.moving = false;
    this.counter = 0;
    this.multiselect.setRelativePosition(this.topleft);
    this.onFunctionDrop.emit({ id: this.id });

    if (this.multiselect.moving_id == this.id) {
      this.multiselect.dragEnd();
    } else {
      // const change: DraftStateMove = {
      //   originator: 'DRAFT',
      //   type: 'MOVE',
      //   id: this.id,
      //   before: this.previous_topleft,
      //   after: this.topleft
      // }

      // this.ss.addStateChange(change);
    }

    setTimeout(() => {
      this.wasDragged = false;
    }, 0);


  }


  disableDrag() {
    this.disable_drag = true;
  }

  enableDrag() {
    this.disable_drag = false;
  }

  // showhide(){
  //   let vis = this.tree.getDraftVisible(this.id);
  //   this.tree.setDraftVisiblity(this.id, !vis);
  //  // this.draft_visible = !this.draft_visible;
  //   this.onSubdraftViewChange.emit(this.id);
  // }

  connectionClicked(id: number) {
    this.has_active_connection = true;
    // if(this.active_connection_order === 0){
    //   this.onConnectionMade.emit(id);
    // }else{
    //   this.onConnectionRemoved.emit(id);
    // }


  }

  resetConnections() {
    this.has_active_connection = false;
  }

  delete(id: number) {
    if (id !== this.id) console.error("In delete - draft id's don't match");
    this.onDeleteCalled.emit(id);
  }



}
