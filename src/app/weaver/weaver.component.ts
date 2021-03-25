import { Component, ElementRef, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';

import { PatternService } from '../core/provider/pattern.service';
import { WeaveDirective } from '../core/directives/weave.directive';
import { Draft } from '../core/model/draft';
import { Render } from '../core/model/render';
import { Pattern } from '../core/model/pattern';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ConnectionModal } from './modal/connection/connection.modal';
import { InitModal } from './modal/init/init.modal';
import { LabelModal } from './modal/label/label.modal';
//import {RedoAction, UndoAction} from '../history/actions';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
//import {getRedoAction, getUndoAction} from '../history/selectors';
import {AppState} from '../ngrx/app.state';
import {select, Store} from '@ngrx/store';
import {cloneDeep, now} from 'lodash';

/**
 * Controller of the Weaver component.
 * @class
 */


interface LoomTypes {
  value: string;
  viewValue: string;
}

interface MaterialTypes {
  value: number;
  viewValue: string;
}

interface DensityUnits {
  value: string;
  viewValue: string;
}

interface HistoryState {
  draft: Draft;
  is_active: boolean;
}


interface ViewModes {
  value: string;
  viewValue: string;
}




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
  brush = 'invert';

  /**
   * The weave Draft object.
   * @property {Draft}
   */
  draft: Draft;

  timeline: HistoryState[] = [];

 /**
   * The weave Render object.
   * @property {Render}
   */
  render: Render = new Render(false);

 /**
   * The types of looms this version will support.
   * @property {LoomType}
   */
  loomtypes: LoomTypes[] = [
    {value: 'frame', viewValue: 'Shaft'},
    {value: 'jacquard', viewValue: 'Jacquard'}
  ];


  material_types: MaterialTypes[] = [
    {value: 0, viewValue: 'Non-Conductive'},
    {value: 1, viewValue: 'Conductive'},
    {value: 2, viewValue: 'Resistive'}
  ];

  density_units: DensityUnits[] = [
    {value: 'in', viewValue: 'Ends per Inch'},
    {value: 'cm', viewValue: 'Ends per 10cm '}
  ];

  view_modes: ViewModes[] = [
      {value: 'visual', viewValue: 'Visual'},
      {value: 'pattern', viewValue: 'Draft'},
      {value: 'yarn', viewValue: 'Circuit'},
      {value: 'mask', viewValue: 'Masks'}

    ];



  /**
   * The list of all patterns saved. Provided by pattern service.
   * @property {Array<Pattern>}
   */
  //patterns;


  selected;

  private unsubscribe$ = new Subject();
  private undoItem;
  private redoItem;


  collapsed:boolean = false;
  dims:any;

  draftelement:any;

  /// ANGULAR FUNCTIONS
  /**
   * @constructor
   * ps - pattern service (variable name is initials). Subscribes to the patterns and used
   * to get and update stitches.
   * dialog - Anglar Material dialog module. Used to control the popup modals.
   */
  constructor(private ps: PatternService, private dialog: MatDialog, 
              private store: Store<AppState>) {

    this.dims = this.render.getCellDims("base");

    const dialogRef = this.dialog.open(InitModal, {
      data: {loomtypes: this.loomtypes, density_units: this.density_units}
    });

    var default_patterns = [];

    this.ps.getPatterns().subscribe((res) => {
       for(var i in res.body){
          default_patterns.push(res.body[i]);
       }
    }); 


    dialogRef.afterClosed().subscribe(result => {
      
      var is_frame = true;

      this.draft = new Draft(result);


      if(this.draft.loom.type != undefined){
          is_frame = (this.draft.loom.type === 'frame') ? true : false;
          this.render.view_frames = is_frame;
      } 
       

      if (this.draft.patterns === undefined) this.draft.patterns = default_patterns;
      

      // if(is_frame){ 
      //     console.log("recalculatinig draft");
      //     this.draft.recalculateDraft(this.draft.loom.tieup, this.draft.loom.treadling, this.draft.loom.threading);
      //     this.weaveRef.redraw();

      //  }
   });

  }





  ngOnInit() {


    // this.store.pipe(select(getUndoAction), takeUntil(this.unsubscribe$)).subscribe(undoItem => {
    //   this.undoItem = undoItem;
    // });
    // this.store.pipe(select(getRedoAction), takeUntil(this.unsubscribe$)).subscribe(redoItem => {
    //   this.redoItem = redoItem;
    // });
    
  }

  // ngAfterViewInit() {
  //   this.weaveRef.redraw();
  //   this.weaveRef.redrawLoom();
  // }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  undo() {
    this.weaveRef.restorePreviousHistoryState();
  }

  redo() {
    this.weaveRef.restoreNextHistoryState();
  }

  /// EVENTS

/**
   * Call zoom in on Shift+p.
   * @extends WeaveComponent
   * @param {Event} shift+p
   * @returns {void}
   */
  @HostListener('window:keydown.Shift.p', ['$event'])
  private keyEventZoomIn(e) {
    console.log("zoom in");
    this.render.zoomIn();
    this.redraw();
    this.weaveRef.unsetSelection();


  }
/**
   * Call zoom out on Shift+o.
   * @extends WeaveComponent
   * @param {Event} shift+o
   * @returns {void}
   */
  @HostListener('window:keydown.Shift.o', ['$event'])
  private keyEventZoomOut(e) {
    console.log("zoom out");
    this.render.zoomOut();
    this.redraw();
    this.weaveRef.unsetSelection();
  }

  /**
   * Sets selected area to clear
   * @extends WeaveComponent
   * @param {Event} delete key pressed
   * @returns {void}
   */
  @HostListener('window:keydown.Backspace', ['$event'])
  private keyEventClear(e) { 
    //this.onClear()
  }

  /**
   * Sets selected area to clear
   * @extends WeaveComponent
   * @param {Event} delete key pressed
   * @returns {void}
   */

  @HostListener('window:keydown.e', ['$event'])
  private keyEventErase(e) {
    this.brush = 'erase';
    this.weaveRef.unsetSelection();

  }

  /**
   * Sets brush to point on key control + d.
   * @extends WeaveComponent
   * @param {Event} e - Press Control + d
   * @returns {void}
   */
  @HostListener('window:keydown.d', ['$event'])
  private keyEventPoint(e) {
    this.brush = 'point';
    this.weaveRef.unsetSelection();

  }

  /**
   * Sets brush to select on key control + s
   * @extends WeaveComponent
   * @param {Event} e - Press Control + s
   * @returns {void}
   */
  @HostListener('window:keydown.s', ['$event'])
  private keyEventSelect(e) {
    this.brush = 'select';
  }

  /**
   * Sets key control to invert on control + x
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  @HostListener('window:keydown.x', ['$event'])
  private keyEventInvert(e) {
    this.brush = 'invert';
    this.weaveRef.unsetSelection();

  }

  /**
   * Sets key to copy 
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  @HostListener('window:keydown.c', ['$event'])
  private keyEventCopy(e) {
    this.brush = 'copy';
    //this.weaveRef.copyArea();
    
  }

    /**
   * Sets key to copy 
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  @HostListener('window:keydown.p', ['$event'])
  private keyEventPaste(e) {
    var p = this.weaveRef.copy;
    this.weaveRef.fillArea(this.weaveRef.selection, p, 'original');
  }

  /**
   * Updates the canvas based on the weave view.
   * @extends WeaveComponent
   * @param {Event} e - view change event from design component.
   * @returns {void}
   */
  public viewChange(value: any) {
    this.render.setCurrentView(value);
    this.weaveRef.redraw();
  }

  /**
   * Change the name of the brush to reflect selected brush.
   * @extends WeaveComponent
   * @param {Event} e - brush change event from design component.
   * @returns {void}
   */
  public onBrushChange(e:any) {
    this.brush = e.name;
    //this.weaveRef.unsetSelection();

  }

  /**
   * Tell the weave directive to fill selection with pattern.
   * @extends WeaveComponent
   * @param {Event} e - fill event from design component.
   * @returns {void}
   */
  public onFill(e) {
    var p = this.draft.patterns[e.id].pattern;
    this.weaveRef.fillArea(this.weaveRef.selection, p, 'original');
  }

  /**
   * Tell weave reference to clear selection.
   * @extends WeaveComponent
   * @param {Event} Delte - clear event from design component.
   * @returns {void}
   */
  public onClear(b:boolean) {
    this.weaveRef.fillArea(this.weaveRef.selection, [[b]], 'original')
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
    this.weaveRef.maskArea(p);
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
    this.weaveRef.selection.setExplicit();
    //this.weaveRef.copyArea();
  }

  /**
   *
   *
   */
  public onSave(e: any) {

    e.bitmap = this.bitmap;
    if (e.type === "bmp") this.weaveRef.saveBMP("weave_draft", e);
    else if (e.type === "ada") this.weaveRef.saveADA("weave_draft", e);
    else if (e.type === "wif") this.weaveRef.saveWIF("weave_draft", e);
    
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
  public insertRow(i, shuttle, system) {
    this.draft.insertRow(i, shuttle, system);
    //this.draft.updateConnections(i, 1);
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom();
    console.log('send emit - insert');
    //this.onAddRow.emit();
  }

  public cloneRow(i, c, shuttle, system) {
    this.draft.cloneRow(i, c, shuttle, system);
   // this.draft.updateConnections(i, 1);
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom();

    console.log('send emit - clone');
    //this.onAddRow.emit();
  }

  public deleteRow(i) {
    this.draft.deleteRow(i);
   // this.draft.updateConnections(i, -1);
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
  public insertCol(i, shuttle,system) {
    this.draft.insertCol(i, shuttle,system);
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom();
  }

  public cloneCol(i, shuttle,system) {
    console.log(i, shuttle);
    this.draft.cloneCol(i, shuttle,system);
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom();
  }


  public deleteCol(i) {
    this.draft.deleteCol(i);
    //this.draft.updateConnections(i, -1);
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom();

  }

  public updatePatterns(e: any) {
    // this.patterns = e.patterns;
    // this.draft.patterns = this.patterns;
    this.draft.patterns = e.patterns;

  }

  // public createMaterial(e: any) {
  //   this.draft.addMaterial(e.material); 
  //   this.weaveRef.redraw();
  // }

  public createShuttle(e: any) {
    this.draft.addShuttle(e.shuttle); 
    this.weaveRef.redraw();
  }

  public createWarpSystem(e: any) {
    this.draft.addWarpSystem(e.system);
    this.weaveRef.redraw();
  }

  public createWeftSystem(e: any) {
    this.draft.addWarpSystem(e.system);
    this.weaveRef.redraw();
  }

  public hideWarpSystem(e:any) {
   // this.draft.updateVisible();
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom();
  }

  public showWarpSystem(e:any) {
  //  this.draft.updateVisible();
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom();
  }  

  public hideWeftSystem(e:any) {
    this.draft.updateVisible();
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom();
  }

  public showWeftSystem(e:any) {
    this.draft.updateVisible();
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom();
  }
  // public hideShuttle(e:any) {
  //   this.draft.updateVisible();
  //   this.weaveRef.redraw();
  //   this.weaveRef.redrawLoom();
  // }

  // public showShuttle(e:any) {
  //   this.draft.updateVisible();
  //   this.weaveRef.redraw();
  //   this.weaveRef.redrawLoom();
  // }

  public epiChange(e:any){
    this.draft.epi = e.epi;
    this.draft.recomputeWidth();

  }

  public unitChange(e:any){
    this.draft.units = e.units;
    this.draft.recomputeWidth();    

  }

  public thicknessChange(e:any){
    this.weaveRef.redraw();
    this.weaveRef.redrawLoom();

  }


  public loomChange(e:any){
    
    this.draft.loom.type = e.loomtype;
    if(this.draft.loom.type == 'jacquard'){
      this.render.view_frames = false;
    }else{
      this.render.view_frames = true;
      this.weaveRef.recomputeLoom();
    }
    this.weaveRef.redraw();

  }

  public frameChange(e:any){
    this.draft.loom.setMinFrames(e.value);
    this.weaveRef.redrawLoom();
  }

  public treadleChange(e:any){
    this.draft.loom.setMinTreadles(e.value);
    this.weaveRef.redrawLoom();
  }


  public warpNumChange(e:any) {
    if(e.warps == "") return;

    if(e.warps > this.draft.warps){
      var diff = e.warps - this.draft.warps;
      
      for(var i = 0; i < diff; i++){  
        this.insertCol(this.draft.warps, 0, 0);
      }
    }else{
      var diff = this.draft.warps - e.warps;
      for(var i = 0; i < diff; i++){  
        this.deleteCol(this.draft.warps-1);
      }

    }

    this.draft.recomputeWidth();

  }

    public weftNumChange(e:any) {
    if(e.wefts === "" || e.wefts =="null") return;

    console.log("passed check");

    if(e.wefts > this.draft.wefts){
      var diff = e.wefts - this.draft.wefts;
      
      for(var i = 0; i < diff; i++){  
        this.insertRow(e.wefts+i, 0, 0);
      }
    }else{
      var diff = this.draft.wefts - e.wefts;
      for(var i = 0; i < diff; i++){  
        this.deleteRow(this.draft.wefts-1);
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
    this.weaveRef.unsetSelection();

    if(this.render.view_frames && this.draft.loom.type == "frame"){
      this.weaveRef.recomputeLoom();

    }
  }


  public toggleCollapsed(){
    this.collapsed = !this.collapsed;
  }

  public styleViewFrames(ctx){
    var dims = this.render.getCellDims("base");
    if(this.render.view_frames) return {'top.px': ctx.offsetTop  - 2*(dims.h), 'left.px': ctx.offsetLeft +  (this.draft.warps + this.draft.loom.num_treadles+3) * dims.w};
    return {'top.px': ctx.offsetTop  - 2*(dims.h), 'left.px': ctx.offsetLeft +  (this.draft.warps + 2) *dims.w};
  }

  public styleThreading(){
    return  {'top.px': 120, 'left.px':50};
  }

  public styleTieUps(ctx){
    var dims = this.render.getCellDims("base");
  //  var frames = this.draft.threading.threading.length;
    return  {'top.px':ctx.offsetTop, 'left.px': ctx.offsetLeft + (this.draft.warps+2)*dims.w};
  }

  public styleDrawdown(ctx){
    var dims = this.render.getCellDims("base");
    if(this.render.view_frames) return  {'top.px': ctx.offsetTop + (this.draft.loom.num_frames+1)*dims.h, 'left.px': ctx.offsetLeft - dims.w, 'width': (this.draft.warps+2) * dims.w, 'height':(this.draft.wefts+2) * dims.h};
    else return  {'top.px': ctx.offsetTop, 'left.px': ctx.offsetLeft - dims.w, 'width': (this.draft.warps+2) * dims.w, 'height':(this.draft.wefts+2) * dims.h}
  }

  public styleTreadling(ctx){
    var dims = this.render.getCellDims("base");
    return {'top.px': ctx.offsetTop + (this.draft.loom.num_frames+2)*dims.h, 'left.px': ctx.offsetLeft + (this.draft.warps+2)*dims.w}
  }

  public styleWeftMaterials(ctx){
    var dims = this.render.getCellDims("base");
     if(this.render.view_frames) return {'top.px': ctx.offsetTop + (this.draft.loom.num_frames+2)*dims.h, 'left.px': ctx.offsetLeft +  (this.draft.warps + this.draft.loom.num_treadles+4) * dims.w};
     else  return {'top.px': ctx.offsetTop + dims.h, 'left.px': ctx.offsetLeft +  (this.draft.warps+3)* dims.w};
  }

  public styleWeftSystems(ctx){
    var dims = this.render.getCellDims("base");
     if(this.render.view_frames) return {'top.px': ctx.offsetTop + (this.draft.loom.num_frames+2)*dims.h, 'left.px': ctx.offsetLeft +  (this.draft.warps + this.draft.loom.num_treadles+3) * dims.w};
     else  return {'top.px': ctx.offsetTop+dims.h, 'left.px': ctx.offsetLeft +  (this.draft.warps+2)* dims.w};
  }

  public styleWeftSystemsText(ctx){
    var dims = this.render.getCellDims("base");
     if(this.render.view_frames) return {'top.px': ctx.offsetTop + (this.draft.loom.num_frames+2)*dims.h, 'left.px': ctx.offsetLeft +  (this.draft.warps + this.draft.loom.num_treadles+6) * dims.w};
     else  return {'top.px': ctx.offsetTop+dims.h, 'left.px': ctx.offsetLeft +  (this.draft.warps+5)* dims.w};  
  }



  public styleColButtons(ctx){
     var dims = this.render.getCellDims("base");
    if(this.render.view_frames)    return {'top.px': ctx.offsetTop - 8*dims.h, 'left.px': ctx.offsetLeft};
    else  return {'top.px': ctx.offsetTop - 8*dims.h, 'left.px': ctx.offsetLeft};
   
  }


  public styleSingleColButton(i){
    var dims = this.render.getCellDims("base");
    var zoom = this.render.getZoom();
    return {'left.px':i*dims.w, 'width.px':dims.w, 'font-size.em':zoom/100}

  }


  public styleRowButtons(ctx){
    var dims = this.render.getCellDims("base");
    if(this.render.view_frames) return {'top.px': ctx.offsetTop + (this.draft.loom.num_frames+2)*dims.h, 'left.px': ctx.offsetLeft +  (this.draft.warps + this.draft.loom.num_treadles+7) * dims.w};
     else  return {'top.px': ctx.offsetTop + dims.h, 'left.px': ctx.offsetLeft +  (this.draft.warps+6)* dims.w};
  }

  public styleSingleRowButton(i){
    var dims = this.render.getCellDims("base");
    var zoom = this.render.getZoom();
    return {'top.px':i*dims.h, 'height.px':dims.h, 'font-size.em':zoom/100}

  }


// public getButtonRowHeight(ctx){
//      var dims = this.render.getCellDims("base");
//      return dims.h;
//   }


  public getTransform(j){
      var dims = this.render.getCellDims("base");
      return "translate("+(this.draft.warps-j)*dims.w+", 0) rotate(-45)"
  }


  public styleWarpSystems(ctx){
    var dims = this.render.getCellDims("base");
    if(this.render.view_frames)    return {'top.px': ctx.offsetTop - 2*dims.h, 'left.px': ctx.offsetLeft};
    else  return {'top.px': ctx.offsetTop - 2*dims.h, 'left.px': ctx.offsetLeft};
  }  

  public styleWarpMaterials(ctx){
    var dims = this.render.getCellDims("base");
    if(this.render.view_frames)    return {'top.px': ctx.offsetTop - 3*dims.h, 'left.px': ctx.offsetLeft};
    else  return {'top.px': ctx.offsetTop - 3*dims.h, 'left.px': ctx.offsetLeft};
  }  

  public styleWarpSystemsText(ctx){
    var dims = this.render.getCellDims("base");
    if(this.render.view_frames)    return {'top.px': ctx.offsetTop - 3.5*dims.h, 'left.px': ctx.offsetLeft};
    else  return {'top.px': ctx.offsetTop - 3.5*dims.h, 'left.px': ctx.offsetLeft};
  }
 
  public styleWeftSystemsRow(j){
        var dims = this.render.getCellDims("base");
        return (j*dims.h + dims.h/4) ;

  }

  public styleWarpRow(j){
        var dims = this.render.getCellDims("base");
        return (j*dims.w) ;

  }

  public renderChange(e: any){
     console.log('render change', e);

     
     if(e.source === "slider") this.render.setZoom(e.value);
     if(e.source === "in") this.render.zoomIn();
     if(e.source === "out") this.render.zoomOut();
     if(e.source === "front") this.render.setFront(e.checked);
     
     this.redraw();
     this.weaveRef.unsetSelection();

  }


}
