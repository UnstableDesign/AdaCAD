import { Component, ElementRef, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';

import { PatternService } from '../core/provider/pattern.service';
import { WeaveDirective } from '../core/directives/weave.directive';
import { Draft } from '../core/model/draft';
import { Render } from '../core/model/render';
import { Shuttle } from '../core/model/shuttle';
import { Pattern } from '../core/model/pattern';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ConnectionModal } from './modal/connection/connection.modal';
import { InitModal } from './modal/init/init.modal';
import { LabelModal } from './modal/label/label.modal';
import {RedoAction, UndoAction} from '../history/actions';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {getRedoAction, getUndoAction} from '../history/selectors';
import {AppState} from '../ngrx/app.state';
import {select, Store} from '@ngrx/store';
/**
 * Controller of the Weaver component.
 * @class
 */
@Component({
  selector: 'app-weaver',
  templateUrl: './weaver.component.html',
  styleUrls: ['./weaver.component.scss']
})
export class WeaverComponent implements OnInit {
  /**
   * The reference to the weave directive.
   * @property {WeaveDirective}
   */
  @ViewChild(WeaveDirective, {static: false}) weaveRef;
  @ViewChild('bitmapImage', {static: false}) bitmap;

  /**
   * The name of the current selected brush.
   * @property {string}
   */
  brush = 'point';

  /**
   * The name of the variable for showing ONLY the draw-down or the other features
   * @property {boolean}
   */
  // view_frames = true;
  

  /**
   * The weave Draft object.
   * @property {Draft}
   */
  draft: Draft;


 /**
   * The weave Render object.
   * @property {Render}
   */
  render: Render = new Render();



  /**
   * The list of all patterns saved. Provided by pattern service.
   * @property {Array<Pattern>}
   */
  //patterns;

  /**
   * The name of the current view being shown.
   * @property {string}
   */
  view: string = 'pattern';

  selected;

  private unsubscribe$ = new Subject();
  private undoItem;
  private redoItem;


  /// ANGULAR FUNCTIONS
  /**
   * @constructor
   * ps - pattern service (variable name is initials). Subscribes to the patterns and used
   * to get and update stitches.
   * history - undo history service, used to control the state of the woven pattern
   * dialog - Anglar Material dialog module. Used to control the popup modals.
   */
  constructor(private ps: PatternService, private dialog: MatDialog, 
              private store: Store<AppState>) {


    const dialogRef = this.dialog.open(InitModal);

    var default_patterns = [];

    this.ps.getPatterns().subscribe((res) => {
       for(var i in res.body){
          default_patterns.push(res.body[i]);
       }
    }); 


    dialogRef.afterClosed().subscribe(result => {
      this.draft = new Draft(result);
      if (this.draft.patterns === undefined) this.draft.patterns = default_patterns; 
   });

  }





  ngOnInit() {


    this.store.pipe(select(getUndoAction), takeUntil(this.unsubscribe$)).subscribe(undoItem => {
      this.undoItem = undoItem;
    });
    this.store.pipe(select(getRedoAction), takeUntil(this.unsubscribe$)).subscribe(redoItem => {
      this.redoItem = redoItem;
    });
    
    
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  undo() {
    this.store.dispatch(new UndoAction());
    this.weaveRef.onUndoRedo();
  }

  redo() {
    this.store.dispatch(new RedoAction());
    this.weaveRef.onUndoRedo();
  }

  /// EVENTS
  /**
   * Sets brush to erase on key control + e.
   * @extends WeaveComponent
   * @param {Event} e - Press Control + e
   * @returns {void}
   */
  @HostListener('window:keydown.Control.e', ['$event'])
  private keyEventErase(e) {
    this.brush = 'erase';
  }

  /**
   * Sets brush to point on key control + d.
   * @extends WeaveComponent
   * @param {Event} e - Press Control + d
   * @returns {void}
   */
  @HostListener('window:keydown.Control.d', ['$event'])
  private keyEventPoint(e) {
    this.brush = 'point';
  }

  /**
   * Sets brush to select on key control + s
   * @extends WeaveComponent
   * @param {Event} e - Press Control + s
   * @returns {void}
   */
  @HostListener('window:keydown.Control.s', ['$event'])
  private keyEventSelect(e) {
    this.brush = 'select';
  }

  /**
   * Sets key control to invert on control + x
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  @HostListener('window:keydown.Control.x', ['$event'])
  private keyEventInvert(e) {
    this.brush = 'invert';
  }

  /**
   * Updates the canvas based on the weave view.
   * @extends WeaveComponent
   * @param {Event} e - view change event from design component.
   * @returns {void}
   */
  public viewChange(value: any) {
    console.log("view change", value);
    this.view = value;

    switch (this.view) {
      case 'visual':
        this.weaveRef.simulate();
        break;
      case 'yarn':
        this.weaveRef.functional();
        break;
      default:
        this.weaveRef.redraw();
        break;
    }
  }

  /**
   * Change the name of the brush to reflect selected brush.
   * @extends WeaveComponent
   * @param {Event} e - brush change event from design component.
   * @returns {void}
   */
  public onBrushChange(e:any) {
    this.brush = e.name;
  }

  /**
   * Tell the weave directive to fill selection with pattern.
   * @extends WeaveComponent
   * @param {Event} e - fill event from design component.
   * @returns {void}
   */
  public onFill(e) {
    var p = this.draft.patterns[e.id].pattern;
    console.log("fill", p)
    this.weaveRef.fillArea(this.weaveRef.selection, p, 'original');
  }

  /**
   * Tell weave reference to clear selection.
   * @extends WeaveComponent
   * @param {Event} e - clear event from design component.
   * @returns {void}
   */
  public onClear() {
    this.weaveRef.fillArea(this.weaveRef.selection, [[null]], 'original')
  }

  /**
   * Weave reference masks pattern over selected area.
   * @extends WeaveComponent
   * @param {Event} e - mask event from design component.
   * @returns {void}
   */
  public onMask(e) {
    console.log(e);
    var p = this.draft.patterns[e.id].pattern;
    this.weaveRef.fillArea(this.weaveRef.selection, p, 'mask');
  }

  /**
   * Tells weave reference to paste copied pattern.
   * @extends WeaveComponent
   * @param {Event} e - paste event from design component.
   * @returns {void}
   */
  public onPaste(e) {
    var p = this.weaveRef.copy;
    var type = e.type;
    this.weaveRef.fillArea(this.weaveRef.selection, p, type);
  }

  /**
   * Creates the copied pattern within the weave reference
   * @extends WeaveComponent
   * @param {Event} e - copy event from design component.
   * @returns {void}
   */
  public onCopy() {
    this.weaveRef.copyArea();
  }

  /**
   *
   *
   */
  public onSave(e: any) {

    e.bitmap = this.bitmap;
    if (e.type === "bmp") this.weaveRef.saveBMP("weave_draft", e);
    else if (e.type === "ada") this.weaveRef.saveADA("weave_draft", e);
    
  }

  /**
   * Open the connection modal.
   * @extends WeaveComponent
   * @returns {void}
   */
  public openConnectionDialog() {

    const dialogRef = this.dialog.open(ConnectionModal, {data: {shuttles: this.draft.shuttles}});

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.draft.connections.push(result);
      }
    });
  }


  /**
   * Open the label modal.
   * @extends WeaveComponent
   * @returns {void}
   */
  public openLabelDialog() {

    const dialogRef = this.dialog.open(LabelModal);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result);
      }
    });
  }



  /// PUBLIC FUNCTIONS
  /**
   * 
   * @extends WeaveComponent
   * @returns {void}
   */
  public print(e) {
    console.log(e);
  }

  /**
   * In
   * @extends WeaveComponent
   * @returns {void}
   */
  public insertRow(i, shuttle) {
    this.draft.insertRow(i, shuttle);
    this.draft.updateConnections(i, 1);
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom();
    console.log('send emit - insert');
    //this.onAddRow.emit();
  }

  public cloneRow(i, c, shuttle) {
    this.draft.cloneRow(i, c, shuttle);
    this.draft.updateConnections(i, 1);
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom();

    console.log('send emit - clone');
    //this.onAddRow.emit();
  }

  public deleteRow(i) {
    this.draft.deleteRow(i);
    this.draft.updateConnections(i, -1);
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom();

   console.log('send emit - delete');

    //this.onAddRow.emit();

  }

    /**
   * In
   * @extends WeaveComponent
   * @returns {void}
   */
  public insertCol(i, shuttle) {
    this.draft.insertCol();
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom();
  }


  public deleteCol(i) {
    this.draft.deleteCol(i);
    this.draft.updateConnections(i, -1);
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom();

  }

  public updatePatterns(e: any) {
    // this.patterns = e.patterns;
    // this.draft.patterns = this.patterns;
    this.draft.patterns = e.patterns;

  }

  public createShuttle(e: any) {
    this.draft.addShuttle(e.shuttle);
    if (e.shuttle.image) {
    this.weaveRef.redraw();
    }
  }

  public createWarpSystem(e: any) {
    this.draft.addWarpSystem(e.shuttle);
    if (e.shuttle.image) {
    this.weaveRef.redraw();
    }
  }


  public hideShuttle(e:any) {
    this.draft.updateVisible();
    this.weaveRef.redraw();
  }

  public showShuttle(e:any) {
    this.draft.updateVisible();
    this.weaveRef.redraw();
  }

  public epiChange(e:any){
    this.draft.epi = e.epi;

  }


  public warpNumChange(e:any) {
    if(e.warps == "") return;

    if(e.warps > this.draft.warps){
      var diff = e.warps - this.draft.warps;
      
      for(var i = 0; i < diff; i++){  
        this.insertCol(this.draft.warps, 0);
      }
    }else{
      var diff = this.draft.warps - e.warps;
      for(var i = 0; i < diff; i++){  
        this.deleteCol(this.draft.warps-1);
      }

    }

  }

  public createPattern(e: any) {
    // e.pattern.id = this.patterns.length;
    // this.patterns.push(e.pattern);
    // this.draft.patterns = this.patterns;
    e.pattern.id = this.draft.patterns.length;
    this.draft.patterns.push(e.pattern);
  }


//should this just hide the pattern or fully remove it, could create problems with undo/redo
   public removePattern(e: any) {
    this.draft.patterns = this.draft.patterns.filter(pattern => pattern !== e.pattern);
  }


  public redraw() {
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom()
  }

  public toggleViewFrames(){
    this.render.toggleViewFrames();
  }

  public styleViewFrames(ctx){
    var dims = this.render.getCellDims("base");
    if(this.render.view_frames) return {'top.px': ctx.offsetTop  - 2*(dims.h), 'left.px': ctx.offsetLeft +  (this.draft.warps + this.draft.loom.num_treadles+2) * dims.w};
    return {'top.px': ctx.offsetTop  - 2*(dims.h), 'left.px': ctx.offsetLeft +  (this.draft.warps + 1) *dims.w};
  }

  public styleThreading(){
    return  {'top.px': 75, 'left.px':50};
  }

  public styleTieUps(ctx){
    var dims = this.render.getCellDims("base");
  //  var frames = this.draft.threading.threading.length;
    return  {'top.px':ctx.offsetTop, 'left.px': ctx.offsetLeft + (this.draft.warps+1)*dims.w};
  }

  public styleDrawdown(ctx){
    var dims = this.render.getCellDims("base");
    if(this.render.view_frames) return  {'top.px': ctx.offsetTop + (this.draft.loom.num_frames+1)*dims.h, 'left.px': ctx.offsetLeft, 'width': this.draft.warps * dims.w, 'height':this.draft.wefts * dims.h};
    else return  {'top.px': ctx.offsetTop, 'left.px': ctx.offsetLeft, 'width': this.draft.warps * dims.w, 'height':this.draft.wefts * dims.h}
  }

  public styleTreadling(ctx){
    var dims = this.render.getCellDims("base");
    return {'top.px': ctx.offsetTop + (this.draft.loom.num_frames+1)*dims.h, 'left.px': ctx.offsetLeft + (this.draft.warps+1)*dims.w}
  }

  public styleWeftShuttles(ctx){
    var dims = this.render.getCellDims("base");
     if(this.render.view_frames) return {'top.px': ctx.offsetTop + (this.draft.loom.num_frames+1)*dims.h, 'left.px': ctx.offsetLeft +  (this.draft.warps + this.draft.loom.num_treadles+2) * dims.w};
     else  return {'top.px': ctx.offsetTop, 'left.px': ctx.offsetLeft +  (this.draft.warps+1)* dims.w};
  }

  public styleWeftShuttleText(ctx){
    var dims = this.render.getCellDims("base");
     if(this.render.view_frames) return {'top.px': ctx.offsetTop + (this.draft.loom.num_frames)*dims.h, 'left.px': ctx.offsetLeft +  (this.draft.warps + this.draft.loom.num_treadles+2) * dims.w};
     else  return {'top.px': ctx.offsetTop + (this.draft.loom.num_frames)*dims.h, 'left.px': ctx.offsetLeft +  (this.draft.warps+1)* dims.w};
  }


  public styleRowButtons(ctx){
     var dims = this.render.getCellDims("base");
    if(this.render.view_frames) return {'top.px': ctx.offsetTop + (this.draft.loom.num_frames+1)*dims.h, 'left.px': ctx.offsetLeft +  (this.draft.warps + this.draft.loom.num_treadles+4) * dims.w};
     else  return {'top.px': ctx.offsetTop, 'left.px': ctx.offsetLeft +  (this.draft.warps+3)* dims.w};
  }



  public styleWarpSystems(ctx){
    var dims = this.render.getCellDims("base");
    if(this.render.view_frames)    return {'top.px': ctx.offsetTop - 2*dims.h, 'left.px': ctx.offsetLeft};
    else  return {'top.px': ctx.offsetTop - 2*dims.h, 'left.px': ctx.offsetLeft};
  }
 
  public styleShuttleRow(j){
        var dims = this.render.getCellDims("base");
        return (j*dims.h + dims.h/4) ;

  }

  public renderChange(value: any){
     this.render.setZoom(value);
     this.redraw();
  }

}
