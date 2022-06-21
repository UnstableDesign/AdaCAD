import { Component, ElementRef, OnInit, OnDestroy, HostListener, ViewChild, ChangeDetectionStrategy, Input } from '@angular/core';
import {enableProdMode} from '@angular/core';

import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/overlay';
import { Render } from '../core/model/render';
import { MatDialog } from "@angular/material/dialog";
import {Subject} from 'rxjs';
import { FileService, LoadResponse } from '../core/provider/file.service';
import * as _ from 'lodash';
import { DraftviewerComponent } from '../core/draftviewer/draftviewer.component';
import {DesignmodesService} from '../core/provider/designmodes.service'
import { SidebarComponent } from '../core/sidebar/sidebar.component';
import { MaterialsService } from '../core/provider/materials.service';
import { SystemsService } from '../core/provider/systems.service';
import { Cell } from '../core/model/cell';
import { getLoomUtilByType } from '../core/model/looms';
import { WorkspaceService } from '../core/provider/workspace.service';
import { generateDrawdownWithPattern, deleteDrawdownCol, deleteDrawdownRow, insertDrawdownCol, insertDrawdownRow, loadDraftFromFile, warps, wefts, generateMappingFromPattern, insertMappingRow, deleteMappingRow, insertMappingCol, deleteMappingCol } from '../core/model/drafts';
import { Draft, Drawdown, Loom, LoomSettings } from '../core/model/datatypes';
import { computeYarnPaths } from '../core/model/yarnsimulation';

//disables some angular checking mechanisms
// enableProdMode();



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
  @ViewChild(DraftviewerComponent, {static: true}) weaveRef;
  @ViewChild(SidebarComponent, {static: true}) sidebar;
  
  @Input()  draft: Draft; 
  @Input()  viewonly: boolean; 
  @Input() loom: Loom;
  @Input() loom_settings: LoomSettings;


 /**
   * The weave Render object.
   * @property {Render}
   */
  render: Render;


  /**
  The current selection, as a Pattern 
  **/
  copy: Drawdown;

  /**
   * a place to store the drafts returned from emma's ml code
   */
  generated_drafts: Array<Draft> = [];


  /**
  * Boolean reepresenting if generative ML mode is on or off
  * @property {boolean}
  * */
  generativeMode = false;
   
  /**
  * String holding collection name for generative ML
  */
  collection: string = "";


  /**
  * Number of warps for drafts of collection selected 
  */
  warpSize: number;

  /**
  * Number of wefts for drafts of collection selected 
  */
  weftSize: number;

  selected;

  collapsed: boolean = false;

  private unsubscribe$ = new Subject();

  dims:any;

  draftelement:any;

  scrollingSubscription: any;

  /// ANGULAR FUNCTIONS
  /**
   * @constructor
   * ps - pattern service (variable name is initials). Subscribes to the patterns and used
   * to get and update stitches.
   * dialog - Anglar Material dialog module. Used to control the popup modals.
   */
  constructor(
    private dialog: MatDialog, 
    private fs: FileService,
    private dm: DesignmodesService,
    public scroll: ScrollDispatcher,
    private ms: MaterialsService,
    private ss: SystemsService,
    private ws: WorkspaceService) {

    this.scrollingSubscription = this.scroll
          .scrolled()
          .subscribe((data: any) => {
            this.onWindowScroll(data);
    });


    this.copy = generateDrawdownWithPattern([[new Cell(false)]], 2, 2);
    this.dm.selectDesignMode('draw', 'design_modes');
    this.dm.selectDesignMode('toggle', 'draw_modes');

  }

  private onWindowScroll(data: CdkScrollable) {
    const scrollTop:number = data.measureScrollOffset("top");
    const scrollLeft:number = data.measureScrollOffset("left");
    this.weaveRef.reposition(scrollTop, scrollLeft);
  }



  // loadNewFile(result: LoadResponse){

  //   console.log("loading new file", result);
  //   const data = result.data;
  //   if(data.drafts.length > 0){
  //     this.draft = loadDraftFromFile(data.drafts[0], data.version);
  //   }else{
  //     console.log("ERROR, there were not drafts associated with this file");
  //   }

  //   if(data.looms.length > 0){
  //     this.loom.copy(data.looms[0]);
  //   }else{
  //     console.log("WARNING, there were no looms associated with this file");
  //     this.loom.clearAllData(this.draft.warps, this.draft.wefts, this.loom.type);
     
  //     const utils = getLoomUtilByType(this.loom.type);
  //     utils.computeLoomFromDrawdown(this.draft, this.ws.selected_origin_option).then(loom => {
  //       this.loom = loom;
  //       const success: boolean = this.loom.overloadDraft(this.draft);
  //       if(!success) console.log("ERROR, could not attach loom to draft of different size");
  //     });
  

     
  //   }


  //   this.draft.computeYarnPaths(this.ms.getShuttles());
  //   //this.ss.addHistoryState(this.draft);
    
  //   this.render.updateVisible(this.draft);
    

  //   this.weaveRef.onNewDraftLoaded();


  //   this.weaveRef.redraw({
  //     drawdown: true, 
  //     loom:true, 
  //     warp_systems: true, 
  //     weft_systems: true, 
  //     warp_materials: true,
  //     weft_materials:true
  //   });

  //   this.weaveRef.rescale(this.render.getZoom());

  // }
  
  ngOnInit(){

    this.render = new Render(true, this.draft, this.ss);
    //this.timeline.addHistoryState(this.draft);  
    
  }

  ngAfterViewInit() {


    this.weaveRef.onNewDraftLoaded();

    this.weaveRef.redraw({
      drawdown: true, 
      loom:true, 
      warp_systems: true, 
      weft_systems: true, 
      warp_materials: true,
      weft_materials:true
    });

  
    
  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  undo() {
    // let d: Draft = this.timeline.restorePreviousHistoryState();
    // if(d === undefined || d === null) return;

    // this.draft.reload(d);    
    // this.weaveRef.onNewDraftLoaded();
    // this.weaveRef.redraw({
    //   drawdown: true, 
    //   loom:true, 
    //   warp_systems: true, 
    //   weft_systems: true, 
    //   warp_materials: true,
    //   weft_materials:true
    // });

  }

  redo() {
    // let d: Draft = this.timeline.restoreNextHistoryState();

    // if(d === undefined || d === null) return;


    // this.draft.reload(d);    
    // this.weaveRef.onNewDraftLoaded();
    // this.weaveRef.redraw({
    //   drawdown: true, 
    //   loom:true, 
    //   warp_systems: true, 
    //   weft_systems: true, 
    //   warp_materials: true,
    //   weft_materials:true
    // });

  }


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
  }


  /**
   * Sets selected area to clear
   * @extends WeaveComponent
   * @param {Event} delete key pressed
   * @returns {void}
   */

  @HostListener('window:keydown.e', ['$event'])
  private keyEventErase(e) {

    this.dm.selectDesignMode('down','draw_modes');
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
    this.dm.selectDesignMode('up','draw_modes');
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
    this.dm.selectDesignMode('select','design_modes');
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

    this.dm.selectDesignMode('toggle','draw_modes');
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
    this.weaveRef.onPaste({});
  }


  public closeAllModals(){
    this.sidebar.closeWeaverModals();
  }

  /**
   * Updates the canvas based on the weave view.
   * @extends WeaveComponent
   * @param {Event} e - view change event from design component.
   * @returns {void}
   */
  public viewChange(value: any) {
    
    this.dm.selectDesignMode(value, 'view_modes');
    this.render.setCurrentView(value);

    if(this.render.isYarnBasedView()) computeYarnPaths(this.draft, this.ms.getShuttles());

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
  public designModeChange(e:any) {


    this.weaveRef.unsetSelection();

  }

  
  /**
   * Tell the weave directive to fill selection with pattern.
   * @extends WeaveComponent
   * @param {Event} e - fill event from design component.
   * @returns {void}
   */
  // public onFill(e) {
    
  //   let p:Pattern = this.patterns[e.id];
    
  //   this.draft.fillArea(this.weaveRef.selection, p, 'original', this.render.visibleRows, this.loom);

  //   const utils = getLoomUtilByType(this.loom.type);
  //   utils.computeLoomFromDrawdown(this.draft, this.ws.selected_origin_option).then(loom => {
      
  //     this.loom = loom;

  //     if(this.render.isYarnBasedView()) this.draft.computeYarnPaths(this.ms.getShuttles());
    
  //     this.weaveRef.copyArea();
  
  //     this.weaveRef.redraw({drawdown:true, loom:true});
  //   });


    

    //this.timeline.addHistoryState(this.draft);
    
 //}

  /**
   * Tell weave reference to clear selection.
   * @extends WeaveComponent
   * @param {Event} Delete - clear event from design component.
   * @returns {void}
   */
  public onClear(b:boolean) {
    
    const d: Drawdown = [[new Cell(b)]];

    this.draft.drawdown = generateDrawdownWithPattern(d, warps(this.draft.drawdown), wefts(this.draft.drawdown));

    const utils = getLoomUtilByType(this.loom_settings.type);
    utils.computeLoomFromDrawdown(this.draft.drawdown, this.ws.selected_origin_option).then(loom => {
      this.loom = loom;

      if(this.render.isYarnBasedView()) computeYarnPaths(this.draft, this.ms.getShuttles());

      this.weaveRef.copyArea();
  
      this.weaveRef.redraw({drawdown:true, loom:true});
    });
    
   

   // this.timeline.addHistoryState(this.draft);

  }

  public onScroll(){
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
   */
   public materialChange() {
    this.weaveRef.redraw({drawdown: true, warp_materials:true,  weft_materials:true});
    //this.timeline.addHistoryState(this.draft);
  }





  /**
   * Inserts an empty row on system, system
   */
  public shuttleColorChange() {
    this.weaveRef.redraw({drawdown: true, warp_materials:true,  weft_materials:true});
   // this.timeline.addHistoryState(this.draft);
  }

  public updateWarpSystems(pattern: Array<number>) {
    this.draft.colSystemMapping = generateMappingFromPattern(this.draft.drawdown, pattern, 'col');
    this.weaveRef.redraw({drawdown: true, warp_systems: true});
  }

  public updateWeftSystems(pattern: Array<number>) {
    this.draft.rowSystemMapping =  generateMappingFromPattern(this.draft.drawdown, pattern, 'row');
    this.weaveRef.redraw({drawdown: true, weft_systems: true});
  }

  public updateWarpShuttles(pattern: Array<number>) {
    this.draft.colShuttleMapping = generateMappingFromPattern(this.draft.drawdown, pattern, 'col');
    this.weaveRef.redraw({drawdown: true, warp_materials: true});
  }

  public updateWeftShuttles(pattern: Array<number>) {
    this.draft.rowShuttleMapping = generateMappingFromPattern(this.draft.drawdown, pattern, 'row');
    computeYarnPaths(this.draft, this.ms.getShuttles());
    this.weaveRef.redraw({drawdown: true, weft_materials: true});
  }


  public createShuttle(e: any) {
    this.ms.addShuttle(e.shuttle); 
  }

  // public createWarpSystem(e: any) {
  //   this.draft.addWarpSystem(e.system);
  // }

  // public createWeftSystem(e: any) {
  //   this.draft.addWarpSystem(e.system);
  // }

  public hideWarpSystem(e:any) {
    
    this.weaveRef.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});
  }

  public showWarpSystem(e:any) {

    this.weaveRef.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});
  }  

  public hideWeftSystem(e:any) {
   
    this.render.updateVisible(this.draft);
    
    this.weaveRef.redraw({drawdown: true, loom:true, weft_systems: true, weft_materials:true});
  }

  public showWeftSystem(e:any) {

    this.render.updateVisible(this.draft);

    this.weaveRef.redraw({drawdown: true, loom:true, weft_systems: true, weft_materials:true});
  }


  public notesChanged(e:any) {

  //   console.log(e);
  //  this.draft.notes = e;
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
    this.loom_settings.epi = e.epi;
  }

  public unitChange(e:any){
    this.loom_settings.units = e.units;
  }


  public loomChange(e:any){
    
    this.loom_settings.type = e.type;
    const utils = getLoomUtilByType(this.loom_settings.type);
    utils.computeLoomFromDrawdown(this.draft.drawdown, this.ws.selected_origin_option)  
    .then(loom => {this.loom = loom});
    this.weaveRef.redraw({loom: true});

  }

  public frameChange(e:any){
    this.loom_settings.frames = e.value;
    this.weaveRef.redraw({loom: true});
  }

  public treadleChange(e:any){
    this.loom_settings.treadles = e.value;
    this.weaveRef.redraw({loom: true});
  }


  public warpNumChange(e:any) {
    if(e.warps == "") return;

    if(e.warps > warps(this.draft.drawdown)){
      var diff = e.warps - warps(this.draft.drawdown);
      
      for(var i = 0; i < diff; i++){  
        this.draft.drawdown = insertDrawdownCol(this.draft.drawdown, i, null);
        this.draft.colShuttleMapping = insertMappingCol(this.draft.colShuttleMapping, i, 0);
        this.draft.colSystemMapping = insertMappingCol(this.draft.colSystemMapping, i, 0);  
      }
    }else{
      var diff = warps(this.draft.drawdown) - e.warps;
      for(var i = 0; i < diff; i++){  
        this.draft.drawdown = deleteDrawdownCol(this.draft.drawdown, warps(this.draft.drawdown)-1);
        this.draft.rowSystemMapping = deleteMappingCol(this.draft.rowSystemMapping, warps(this.draft.drawdown)-1);
        this.draft.rowShuttleMapping = deleteMappingCol(this.draft.rowShuttleMapping, warps(this.draft.drawdown)-1);
      }

    }

    const utils = getLoomUtilByType(this.loom_settings.type);
    utils.computeLoomFromDrawdown(this.draft.drawdown, this.ws.selected_origin_option)
    .then(loom => {this.loom = loom});

   // this.timeline.addHistoryState(this.draft);

    if(this.render.isYarnBasedView()) computeYarnPaths(this.draft, this.ms.getShuttles());

    this.weaveRef.redraw({drawdown: true, loom: true, warp_systems: true, warp_materials:true});

  }

  public weftNumChange(e:any) {
  
    if(e.wefts === "" || e.wefts =="null") return;


    if(e.wefts > wefts(this.draft.drawdown)){
      var diff = e.wefts - wefts(this.draft.drawdown);
      
      for(var i = 0; i < diff; i++){  
        this.draft.drawdown = insertDrawdownRow(this.draft.drawdown, wefts(this.draft.drawdown)+1, null)
        this.draft.rowShuttleMapping = insertMappingRow(this.draft.rowShuttleMapping, wefts(this.draft.drawdown)+1, 0);
        this.draft.rowSystemMapping = insertMappingRow(this.draft.rowSystemMapping, wefts(this.draft.drawdown)+1, 0);
      }
    }else{
      var diff = wefts(this.draft.drawdown) - e.wefts;
      for(var i = 0; i < diff; i++){  
        this.draft.drawdown = deleteDrawdownRow(this.draft.drawdown, wefts(this.draft.drawdown)-1);
        this.draft.rowShuttleMapping = deleteMappingRow(this.draft.rowShuttleMapping, wefts(this.draft.drawdown)-1);
        this.draft.rowSystemMapping = deleteMappingRow(this.draft.rowSystemMapping, wefts(this.draft.drawdown)-1);
      }

    }

    const utils = getLoomUtilByType(this.loom_settings.type);
    utils.computeLoomFromDrawdown(this.draft.drawdown, this.ws.selected_origin_option)
    .then(loom => {this.loom = loom});


    this.render.updateVisible(this.draft);

    //this.timeline.addHistoryState(this.draft);

    if(this.render.isYarnBasedView()) computeYarnPaths(this.draft, this.ms.getShuttles());

    this.weaveRef.redraw({drawdown: true, loom: true, weft_systems: true, weft_materials:true});


  }


  public updateSelection(e:any){
    this.copy = e;
  }


  /**
   * called when a change that affects the view has taken place in the loom modal
   */
  onLoomChange(){

      this.render.updateVisible(this.draft);

    //  this.timeline.addHistoryState(this.draft);

     if(this.render.isYarnBasedView()) computeYarnPaths(this.draft, this.ms.getShuttles());

    const utils = getLoomUtilByType(this.loom_settings.type);
    utils.computeLoomFromDrawdown(this.draft.drawdown, this.ws.selected_origin_option).then(loom => {
      this.loom = loom;
      this.weaveRef.redraw({drawdown: true, loom: true, weft_systems: true, weft_materials:true,warp_systems: true, warp_materials:true});
    });
    

  }


  public renderChange(e: any){
     
     if(e.source === "slider"){
        this.render.setZoom(e.value);
        this.weaveRef.rescale(this.render.getZoom());

     } 

     if(e.source === "in"){
        this.render.zoomIn();

     } 

     if(e.source === "out"){
        this.render.zoomOut();

     } 
     if(e.source === "front"){
        this.render.setFront(!e.checked);
        this.weaveRef.flip();
        this.weaveRef.redraw({drawdown:true});
     }      
  }

  public toggleCollapsed(){
    this.collapsed = !this.collapsed;
  }


 /**
   *
   * tranfers on save from header to draft viewer
   */
  public onSave(e: any) {

    this.weaveRef.onSave(e);

  }



}
