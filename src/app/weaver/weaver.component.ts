import { Component, ElementRef, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';
import {enableProdMode} from '@angular/core';

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


//disables some angular checking mechanisms
//enableProdMode();


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

interface ToolModes{
  value: string; 
  viewValue: string;
}

interface DesignActions{
  value: string;
  viewValue: string;
  icon: string;
}

interface DesignModes{
  value: string;
  viewValue: string;
  icon: string;
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



  design_modes: DesignModes[]=[
    {value: 'toggle', viewValue: 'Toggle Heddle', icon: "fas fa-adjust"},
    {value: 'up', viewValue: 'Set Heddle Up', icon: "fas fa-square"},
    {value: 'down', viewValue: 'Set Heddle Down', icon: "far fa-square"}
  ];

  
  //operations you can perform on a selection 
  design_actions: DesignActions[] = [
    {value: 'toggle', viewValue: 'Invert Region', icon: "fas fa-adjust"},
    {value: 'up', viewValue: 'Set Region Heddles Up', icon: "fas fa-square"},
    {value: 'down', viewValue: 'Set Region Heddles Down', icon: "far fa-square"},
    {value: 'flip_x', viewValue: 'Horizontal Flip', icon: "fas fa-arrows-alt-h"},
    {value: 'flip_y', viewValue: 'Vertical Flip', icon: "fas fa-arrows-alt-v"},
    {value: 'shift_right', viewValue: 'Shift 1 Warp Right', icon: "fas fa-arrow-right"},
    {value: 'shift_up', viewValue: 'Shift 1 Pic Up', icon: "fas fa-arrow-up"},
    {value: 'copy', viewValue: 'Copy Selected Region', icon: "fa fa-clone"},
    {value: 'paste', viewValue: 'Paste Copyed Pattern to Selected Region', icon: "fa fa-paste"}
  ];

  /**
   * The name of the current selected brush.
   * @property {string}
   */
  design_mode = {
    name:'toggle',
    id: -1
  }

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

  default_patterns:any;
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

    //initialize with a draft so that we can load some things faster. 
    this.draft = new Draft({});
    this.default_patterns = [];


    this.ps.getPatterns().subscribe((res) => {
       for(var i in res.body){
          this.default_patterns.push(res.body[i]);
       }
    }); 

    this.render.view_frames = (this.draft.loom.type === 'frame') ? true : false;     
    if (this.draft.patterns === undefined) this.draft.patterns = this.default_patterns;
    

  }



  reInit(result){

    this.draft.reload(result);

    this.render.view_frames = (this.draft.loom.type === 'frame') ? true : false;     

    if (this.draft.patterns === undefined) this.draft.patterns = this.default_patterns;
    

    this.weaveRef.onNewDraftLoaded();


    this.weaveRef.redraw({
      drawdown: true, 
      loom:true, 
      warp_systems: true, 
      weft_systems: true, 
      warp_materials: true,
      weft_materials:true
    });

    this.weaveRef.rescale();
  
  }
  
  ngOnInit(){

  }

  ngAfterViewInit() {

  
    const dialogRef = this.dialog.open(InitModal, {
      data: {loomtypes: this.loomtypes, density_units: this.density_units}
    });


    dialogRef.afterClosed().subscribe(result => {
      if(result !== undefined) this.reInit(result);
   });


   

    this.weaveRef.onNewDraftLoaded();


    this.weaveRef.redraw({
      drawdown: true, 
      loom:true, 
      warp_systems: true, 
      weft_systems: true, 
      warp_materials: true,
      weft_materials:true
    });

    this.weaveRef.rescale();
  
    console.log("rendered ", this.draft);




    // this.store.pipe(select(getUndoAction), takeUntil(this.unsubscribe$)).subscribe(undoItem => {
    //   this.undoItem = undoItem;
    // });
    // this.store.pipe(select(getRedoAction), takeUntil(this.unsubscribe$)).subscribe(redoItem => {
    //   this.redoItem = redoItem;
    // });


    
  }


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
    this.weaveRef.rescale();


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
    this.weaveRef.rescale();
  }


  /**
   * Sets selected area to clear
   * @extends WeaveComponent
   * @param {Event} delete key pressed
   * @returns {void}
   */

  @HostListener('window:keydown.e', ['$event'])
  private keyEventErase(e) {
    this.design_mode = {
      name: 'down',
      id: -1
    };
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
    this.design_mode = {
      name: 'up',
      id: -1};
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
    this.design_mode = {
      name: 'select',
      id: -1};
    this.weaveRef.unsetSelection();

  }

  /**
   * Sets key control to invert on control + x
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  @HostListener('window:keydown.x', ['$event'])
  private keyEventInvert(e) {
    this.design_mode = {
      name: 'toggle',
      id: -1
    };
    this.weaveRef.unsetSelection();

  }

  /**
   * Sets key to copy 
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  // @HostListener('window:keydown.c', ['$event'])
  // private keyEventCopy(e) {
  //   this.onCopy();  
  // }

    /**
   * Sets key to copy 
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  @HostListener('window:keydown.p', ['$event'])
  private keyEventPaste(e) {
    this.onPaste({});
  }

  /**
   * Updates the canvas based on the weave view.
   * @extends WeaveComponent
   * @param {Event} e - view change event from design component.
   * @returns {void}
   */
  public viewChange(value: any) {
    
    this.render.setCurrentView(value);

    if(this.render.isYarnBasedView()) this.draft.computeYarnPaths();

    this.weaveRef.redraw({
      drawdown: true
    });
  }

  /**
   * Change the name of the brush to reflect selected brush.
   * @extends WeaveComponent
   * @param {Event} e - brush change event from design component.
   * @returns {void}
   */
  public onDesignModeChange(e:any) {

    this.design_mode = {
      name: e.name,
      id: e.id
    }

    console.log("design mode", this.design_mode.name, this.design_mode.id);
    this.weaveRef.unsetSelection();

  }

  /**
   * Tell the weave directive to fill selection with pattern.
   * @extends WeaveComponent
   * @param {Event} e - fill event from design component.
   * @returns {void}
   */
  public onFill(e) {
    
    var p = this.draft.patterns[e.id].pattern;
    
    this.draft.fillArea(this.weaveRef.selection, p, 'original');

    if(this.render.showingFrames()) this.draft.recomputeLoom();

    if(this.render.isYarnBasedView()) this.draft.computeYarnPaths();
    
    this.weaveRef.redraw({drawdown:true, loom:true})
    
  }

  /**
   * Tell weave reference to clear selection.
   * @extends WeaveComponent
   * @param {Event} Delte - clear event from design component.
   * @returns {void}
   */
  public onClear(b:boolean) {
    
    this.draft.fillArea(this.weaveRef.selection, [[b]], 'original')

    if(this.render.isYarnBasedView()) this.draft.computeYarnPaths();

    this.weaveRef.redraw({drawdown:true, loom:true});
  }

  /**
   * Weave reference masks pattern over selected area.
   * @extends WeaveComponent
   * @param {Event} e - mask event from design component.
   * @returns {void}
   */
  public onMask(e) {
    // console.log(e);
    // var p = this.draft.patterns[e.id].pattern;
    // this.weaveRef.maskArea(p);
    // this.redraw();
  }

  /**
   * Tells weave reference to paste copied pattern.
   * @extends WeaveComponent
   * @param {Event} e - paste event from design component.
   * @returns {void}
   */
  public onPaste(e) {

    var p = this.weaveRef.copy;


    var type;

    if(e.type === undefined) type = "original";
    else type =  e.type;

    this.draft.fillArea(this.weaveRef.selection, p, type);
    
    if(this.render.isYarnBasedView()) this.draft.computeYarnPaths();

    this.weaveRef.redraw({drawdown:true, loom:true, weft_materials: true, warp_materials:true, weft_systems:true, warp_systems:true});
  }

  /**
   * Creates the copied pattern within the weave reference
   * @extends WeaveComponent
   * @param {Event} e - copy event from design component.
   * @returns {void}
   */
  public onCopy() {
    this.design_mode = {
      name: 'copy',
      id: -1
    };
  }

  /**
   *
   *
   */
  public onSave(e: any) {

    e.bitmap = this.bitmap;
    console.log(e);

    if (e.type === "bmp") this.weaveRef.saveBMP(e.name, e);
    else if (e.type === "ada") this.weaveRef.saveADA(e.name, e);
    else if (e.type === "wif") this.weaveRef.saveWIF(e.name, e);
    else if (e.type === "jpg") this.weaveRef.savePrintableDraft(e.name, e);
    
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
   * Inserts an empty row on system, system
   */
  public shuttleColorChange() {
    this.weaveRef.redraw({drawdown: true, warp_materials:true,  weft_materials:true});
  }

  /**
   * Inserts an empty row on system, system
   */
  public insertRow(i, shuttle, system) {

    this.draft.insertRow(i, shuttle, system);
    //this.draft.updateConnections(i, 1);
    
    this.weaveRef.redraw({drawdown: true, loom:true, weft_systems: true, weft_materials:true});
  }

  public cloneRow(i, c, shuttle, system) {
    this.draft.cloneRow(i, c, shuttle, system);
   // this.draft.updateConnections(i, 1);

    this.weaveRef.redraw({drawdown: true, loom:true, weft_systems: true, weft_materials:true});

  }

  public deleteRow(i) {
    this.draft.deleteRow(i);
   // this.draft.updateConnections(i, -1);
    this.weaveRef.redraw({drawdown: true, loom:true, weft_systems: true, weft_materials:true});

    //this.onAddRow.emit();
  }

    /**
   * In
   * @extends WeaveComponent
   * @returns {void}
   */
  public insertCol(i, shuttle,system) {
    this.draft.insertCol(i, shuttle,system);
    this.weaveRef.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});

  }

  public cloneCol(i, shuttle,system) {
    console.log(i, shuttle);
    this.draft.cloneCol(i, shuttle,system);
    this.weaveRef.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});

  }


  public deleteCol(i) {
    this.draft.deleteCol(i);
    //this.draft.updateConnections(i, -1);
    this.weaveRef.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});


  }

  public updatePatterns(e: any) {
    // this.patterns = e.patterns;
    // this.draft.patterns = this.patterns;
    this.draft.patterns = e.patterns;

  }

  public updateWarpSystems(pattern: Array<number>) {
    console.log("update warp sys", pattern);
    this.draft.updateWarpSystemsFromPattern(pattern);
    this.weaveRef.redraw({drawdown: true, warp_systems: true});

  }

  public updateWeftSystems(pattern: Array<number>) {
    console.log("update weft sys", pattern);

    this.draft.updateWeftSystemsFromPattern(pattern);
    this.weaveRef.redraw({drawdown: true, weft_systems: true});

  }

  public updateWarpShuttles(pattern: Array<number>) {
    console.log("update warp shut", pattern);

    this.draft.updateWarpShuttlesFromPattern(pattern);
    this.weaveRef.redraw({drawdown: true, warp_materials: true});

  }

  public updateWeftShuttles(pattern: Array<number>) {
    console.log("update weft shutf", pattern);

    this.draft.updateWeftShuttlesFromPattern(pattern);
    this.draft.computeYarnPaths();
    this.weaveRef.redraw({drawdown: true, weft_materials: true});

  }

  // public createMaterial(e: any) {
  //   this.draft.addMaterial(e.material); 
  //   this.weaveRef.redraw();
  // }

  public createShuttle(e: any) {
    this.draft.addShuttle(e.shuttle); 
  }

  public createWarpSystem(e: any) {
    this.draft.addWarpSystem(e.system);
  }

  public createWeftSystem(e: any) {
    this.draft.addWarpSystem(e.system);
  }

  public hideWarpSystem(e:any) {
    
    this.weaveRef.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});
  }

  public showWarpSystem(e:any) {

    this.weaveRef.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});
  }  

  public hideWeftSystem(e:any) {
   
    this.draft.updateVisible();
    
    this.weaveRef.redraw({drawdown: true, loom:true, weft_systems: true, weft_materials:true});
  }

  public showWeftSystem(e:any) {

    this.draft.updateVisible();

    this.weaveRef.redraw({drawdown: true, loom:true, weft_systems: true, weft_materials:true});
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

    if(this.render.isYarnBasedView()) this.weaveRef.redraw({drawdown: true});
  }


  public loomChange(e:any){
    
    this.draft.loom.type = e.loomtype;

    if(this.draft.loom.type == 'jacquard'){
      this.render.view_frames = false;
    }else{
      this.render.view_frames = true;
      this.weaveRef.recomputeLoom();
    }
    
    this.weaveRef.redraw({loom: true});

  }

  public frameChange(e:any){
    this.draft.loom.setMinFrames(e.value);
    this.weaveRef.redraw({loom: true});
  }

  public treadleChange(e:any){
    this.draft.loom.setMinTreadles(e.value);
    this.weaveRef.redraw({loom: true});
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

    if(this.render.isYarnBasedView()) this.draft.computeYarnPaths();

    this.weaveRef.redraw({drawdown: true, loom: true, warp_systems: true, warp_materials:true});

  }

  public weftNumChange(e:any) {
  
    if(e.wefts === "" || e.wefts =="null") return;

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

    if(this.render.isYarnBasedView()) this.draft.computeYarnPaths();

    this.weaveRef.redraw({drawdown: true, loom: true, warp_systems: true, warp_materials:true});


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



  public toggleViewFrames(){

    this.render.toggleViewFrames();

    if(this.render.view_frames && this.draft.loom.type == "frame"){
      this.weaveRef.recomputeLoom();
    }

    this.weaveRef.redraw({loom:true});
   
  }

  public renderChange(e: any){
     
     if(e.source === "slider"){
        this.render.setZoom(e.value);
        this.weaveRef.rescale();

     } 

     if(e.source === "in"){
        this.render.zoomIn();
        this.weaveRef.rescale();

     } 

     if(e.source === "out"){
        this.render.zoomOut();
        this.weaveRef.rescale();

     } 
     if(e.source === "front"){
        this.render.setFront(e.checked);
        this.weaveRef.redraw({drawdown:true});
     }      
  }

  public toggleCollapsed(){
    this.collapsed = !this.collapsed;
  }

  public styleViewFrames(ctx){
    var dims = this.render.getInterpolationDims("base");
    if(this.render.view_frames) return {'top.px': ctx.offsetTop  - 2*(dims.h), 'left.px': ctx.offsetLeft +  (this.draft.warps + this.draft.loom.num_treadles+3) * dims.w};
    return {'top.px': ctx.offsetTop  - 2*(dims.h), 'left.px': ctx.offsetLeft +  (this.draft.warps + 2) *dims.w};
  }

  public styleThreading(){
    return  {'top.px': 120, 'left.px':50};
  }

  public styleSelection(ctx){
    return  {'top.px':ctx.offsetTop, 'left.px': ctx.offsetLeft};
  }


  public styleTieUps(ctx){
    var dims = this.render.getInterpolationDims("base");
    return  {'top.px':ctx.offsetTop, 'left.px': ctx.offsetLeft+this.draft.warps*dims.w};
  }

  public styleDrawdown(ctx){
    var dims = this.render.getInterpolationDims("base");
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
    var dims = this.render.getInterpolationDims("base");
     if(this.render.view_frames) return {'top.px': ctx.offsetTop + (this.draft.loom.num_frames+2)*dims.h, 'left.px': ctx.offsetLeft +  (this.draft.warps + this.draft.loom.num_treadles+7) * dims.w};
     else  return {'top.px': ctx.offsetTop+dims.h*2, 'left.px': ctx.offsetLeft +  (this.draft.warps+7)* dims.w};  
  }

  public styleColButtons(ctx){
     var dims = this.render.getInterpolationDims("base");
    if(this.render.view_frames)    return {'top.px': ctx.offsetTop - 7*dims.h, 'left.px': ctx.offsetLeft};
    else  return {'top.px': ctx.offsetTop - 7*dims.h, 'left.px': ctx.offsetLeft};
   
  }


  public styleSingleColButton(i){
    var dims = this.render.getInterpolationDims("base");
    var zoom = this.render.getZoom();
    return {'left.px':i*dims.w, 'width.px':dims.w, 'font-size.em':zoom/100}

  }


  //this styles the container that contains all the row buttons
  public styleRowButtons(ctx){


    var dims = this.render.getInterpolationDims("base");
    if(this.render.view_frames) return {'top.px': ctx.offsetTop + (this.draft.loom.num_frames+2)*dims.h, 'left.px': ctx.offsetLeft +  (this.draft.warps + this.draft.loom.num_treadles+7) * dims.w};
     else  return {'top.px': ctx.offsetTop + dims.h, 'left.px': ctx.offsetLeft +  (this.draft.warps+6)* dims.w};
  }

  public styleSingleRowButton(i){
    var zoom = this.render.getZoom();
    var dims = this.render.getInterpolationDims("base");
    return {'top.px':(i*dims.h), 'font-size.em':zoom/100};

    // var dims = this.render.getInterpolationDims("base");
    // var zoom = this.render.getZoom();
    // return {'top.px':i*dims.h, 'height.px':dims.h, 'font-size.em':zoom/100}

  }


// public getButtonRowHeight(ctx){
//      var dims = this.render.getCellDims("base");
//      return dims.h;
//   }

  public getTransform(j){
      var dims = this.render.getInterpolationDims("base");
      return "translate("+(this.draft.warps-j)*dims.w+", 0) rotate(-45)"
  }

  public getWarpSystemTransform(j){
      var dims = this.render.getInterpolationDims("base");
      let top = dims.h*2 + dims.h/4;
      let left = j*dims.w + dims.w/4;
      return "translate("+left+", "+top+")";
  }

  public getSelectorFontSize(j){
      var zoom = this.render.getZoom()/50;
      return zoom+"em";
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
    var dims = this.render.getInterpolationDims("base");
    if(this.render.view_frames)    return {'top.px': ctx.offsetTop - 3.5*dims.h, 'left.px': ctx.offsetLeft};
    else  return {'top.px': ctx.offsetTop - 3.5*dims.h, 'left.px': ctx.offsetLeft};
  }
 
  public styleWeftSystemsRow(j){
        var dims = this.render.getInterpolationDims("base");
        return (j*dims.h + dims.h/4) ;

  }

  public getWeftSystemTransform(j){
      var dims = this.render.getInterpolationDims("base");
      let left = -(dims.w*3 - dims.w/4);
      let top = j*dims.h + 3*dims.h/4;
      return "translate("+left+", "+top+")";
  }


  public styleWarpRow(j){
        var dims = this.render.getInterpolationDims("base");
        return (j*dims.w);
  }



}
