import { Component, ElementRef, OnInit, OnDestroy, HostListener, ViewChild, ChangeDetectionStrategy, Input } from '@angular/core';
import {enableProdMode} from '@angular/core';

import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/overlay';
import { Render } from '../core/model/render';
import { MatDialog } from "@angular/material/dialog";
import {Subject} from 'rxjs';
import { FileService } from '../core/provider/file.service';
import * as _ from 'lodash';
import { DraftviewerComponent } from '../core/draftviewer/draftviewer.component';
import {DesignmodesService} from '../core/provider/designmodes.service'
import { SidebarComponent } from '../core/sidebar/sidebar.component';
import { MaterialsService } from '../core/provider/materials.service';
import { SystemsService } from '../core/provider/systems.service';
import { Cell } from '../core/model/cell';
import { getLoomUtilByType, isFrame } from '../core/model/looms';
import { WorkspaceService } from '../core/provider/workspace.service';
import { deleteDrawdownCol, deleteDrawdownRow, insertDrawdownCol, insertDrawdownRow, warps, wefts, generateMappingFromPattern, insertMappingRow, deleteMappingRow, insertMappingCol, deleteMappingCol, initDraftWithParams } from '../core/model/drafts';
import { Draft, Drawdown, Loom, LoomSettings } from '../core/model/datatypes';
import { computeYarnPaths } from '../core/model/yarnsimulation';
import { TreeService } from '../mixer/provider/tree.service';

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
  
  @Input() id: number;
  
  
  viewonly: boolean; 
  render: Render;
  /**
  The current selection, as a Pattern 
  **/
  copy: Drawdown;

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
    private ws: WorkspaceService,
    private tree: TreeService) {

    this.scrollingSubscription = this.scroll
          .scrolled()
          .subscribe((data: any) => {
            this.onWindowScroll(data);
    });


    this.copy = [[new Cell(false)]];
    this.dm.selectDesignMode('draw', 'design_modes');
    this.dm.selectDesignMode('toggle', 'draw_modes');

  }

  private onWindowScroll(data: CdkScrollable) {
    const scrollTop:number = data.measureScrollOffset("top");
    const scrollLeft:number = data.measureScrollOffset("left");
    this.weaveRef.reposition(scrollTop, scrollLeft);
  }
  
  ngOnInit(){

    const draft = this.tree.getDraft(this.id);
    this.render = new Render(true, draft, this.ss);
    this.viewonly = this.tree.hasParent(this.id);
    
  }

  ngAfterViewInit() {

    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoom(this.id);


    this.weaveRef.onNewDraftLoaded(draft, loom, loom_settings);

    this.weaveRef.redraw(draft, loom, loom_settings, {
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
    
    const draft = this.tree.getDraft(this.id);

    this.dm.selectDesignMode(value, 'view_modes');
    this.render.setCurrentView(value);

    if(this.render.isYarnBasedView()) computeYarnPaths(draft, this.ms.getShuttles());

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

  // /**
  //  * Tell weave reference to clear selection.
  //  * @extends WeaveComponent
  //  * @param {Event} Delete - clear event from design component.
  //  * @returns {void}
  //  */
  // public onClear(b:boolean) {
    
  //   const pattern: Drawdown = [[new Cell(b)]];

  //   this.draft = initDraftWithParams({warps: warps(this.draft.drawdown), wefts: wefts(this.draft.drawdown), pattern: pattern});

  //   const utils = getLoomUtilByType(this.loom_settings.type);
  //   utils.computeLoomFromDrawdown(this.draft.drawdown, this.ws.selected_origin_option).then(loom => {
  //     this.loom = loom;

  //     if(this.render.isYarnBasedView()) computeYarnPaths(this.draft, this.ms.getShuttles());

  //     this.weaveRef.copyArea();
  
  //     this.weaveRef.redraw({drawdown:true, loom:true});
  //   });
    
   

   // this.timeline.addHistoryState(this.draft);

  //}

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
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    draft.colSystemMapping = generateMappingFromPattern(draft.drawdown, pattern, 'col');
    this.tree.setDraftOnly(this.id, draft);
    this.weaveRef.redraw(draft, loom, loom_settings, {drawdown: true, warp_systems: true});
  }

  public updateWeftSystems(pattern: Array<number>) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    draft.rowSystemMapping =  generateMappingFromPattern(draft.drawdown, pattern, 'row');
    this.tree.setDraftOnly(this.id, draft);
    this.weaveRef.redraw(draft, loom, loom_settings, {drawdown: true, weft_systems: true});
  }

  public updateWarpShuttles(pattern: Array<number>) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    
    draft.colShuttleMapping = generateMappingFromPattern(draft.drawdown, pattern, 'col');
    this.tree.setDraftOnly(this.id, draft);

    this.weaveRef.redraw(draft, loom, loom_settings,{drawdown: true, warp_materials: true});
  }

  public updateWeftShuttles(pattern: Array<number>) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    draft.rowShuttleMapping = generateMappingFromPattern(draft.drawdown, pattern, 'row');
    computeYarnPaths(draft, this.ms.getShuttles());
    this.tree.setDraftOnly(this.id, draft);

    this.weaveRef.redraw(draft, loom, loom_settings,{drawdown: true, weft_materials: true});
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
    
    //this.weaveRef.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});
  }

  public showWarpSystem(e:any) {

   // this.weaveRef.redraw({drawdown: true, loom:true, warp_systems: true, warp_materials:true});
  }  

  public hideWeftSystem(e:any) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    
    this.render.updateVisible(draft);
    
    this.weaveRef.redraw(draft, loom, loom_settings, {drawdown: true, loom:true, weft_systems: true, weft_materials:true});
  }

  public showWeftSystem(e:any) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    
    this.render.updateVisible(draft);

    this.weaveRef.redraw(draft, loom, loom_settings,{drawdown: true, loom:true, weft_systems: true, weft_materials:true});
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
    const loom_settings = this.tree.getLoomSettings(this.id);
    loom_settings.epi = e.epi;
    this.tree.setLoomSettings(this.id, loom_settings);
  }

  public unitChange(e:any){
    const loom_settings = this.tree.getLoomSettings(this.id);
    loom_settings.units = e.units;
    this.tree.setLoomSettings(this.id, loom_settings);

  }


  public loomChange(e:any){
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    //loom_settings.type = e.type;
    //this.tree.setLoomSettings(this.id, loom_settings);

    // const utils = getLoomUtilByType(loom_settings.type);
    // utils.computeLoomFromDrawdown(draft.drawdown, loom_settings, this.ws.selected_origin_option)  
    // .then(loom => {
    //   this.tree.setLoom(this.id, loom);
    //   this.weaveRef.redraw(draft, loom, loom_settings, {loom: true});


    // });

    this.weaveRef.redraw(draft, loom, loom_settings, {loom: true});

  }

  public frameChange(e:any){
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    loom_settings.frames = e.value;
    this.tree.setLoomSettings(this.id, loom_settings);
    this.weaveRef.redraw(draft, loom, loom_settings, {loom: true});
  }

  public treadleChange(e:any){
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    this.tree.setLoomSettings(this.id, loom_settings);
    this.weaveRef.redraw(draft, loom, loom_settings, {loom: true});
  }


  public warpNumChange(e:any) {
    if(e.warps == "") return;

    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);

    if(e.warps > warps(draft.drawdown)){
      var diff = e.warps - warps(draft.drawdown);
      
      for(var i = 0; i < diff; i++){  
        draft.drawdown = insertDrawdownCol(draft.drawdown, i, null);
        draft.colShuttleMapping = insertMappingCol(draft.colShuttleMapping, i, 0);
        draft.colSystemMapping = insertMappingCol(draft.colSystemMapping, i, 0);  
      }
    }else{
      var diff = warps(draft.drawdown) - e.warps;
      for(var i = 0; i < diff; i++){  
        draft.drawdown = deleteDrawdownCol(draft.drawdown, warps(draft.drawdown)-1);
        draft.rowSystemMapping = deleteMappingCol(draft.rowSystemMapping, warps(draft.drawdown)-1);
        draft.rowShuttleMapping = deleteMappingCol(draft.rowShuttleMapping, warps(draft.drawdown)-1);
      }

    }

    this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
    .then(loom => {
      if(this.render.isYarnBasedView()) computeYarnPaths(draft, this.ms.getShuttles());
      this.weaveRef.redraw(draft, loom, loom_settings,{drawdown: true, loom: true, warp_systems: true, warp_materials:true});
  
    });

  
  }

  public weftNumChange(e:any) {
  
    if(e.wefts === "" || e.wefts =="null") return;
    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);


    if(e.wefts > wefts(draft.drawdown)){
      var diff = e.wefts - wefts(draft.drawdown);
      
      for(var i = 0; i < diff; i++){  
        draft.drawdown = insertDrawdownRow(draft.drawdown, wefts(draft.drawdown)+1, null)
        draft.rowShuttleMapping = insertMappingRow(draft.rowShuttleMapping, wefts(draft.drawdown)+1, 0);
        draft.rowSystemMapping = insertMappingRow(draft.rowSystemMapping, wefts(draft.drawdown)+1, 0);
      }
    }else{
      var diff = wefts(draft.drawdown) - e.wefts;
      for(var i = 0; i < diff; i++){  
        draft.drawdown = deleteDrawdownRow(draft.drawdown, wefts(draft.drawdown)-1);
        draft.rowShuttleMapping = deleteMappingRow(draft.rowShuttleMapping, wefts(draft.drawdown)-1);
        draft.rowSystemMapping = deleteMappingRow(draft.rowSystemMapping, wefts(draft.drawdown)-1);
      }

    }

    this.tree.setDraftAndRecomputeLoom(this.id, draft,loom_settings)
    .then(loom => {
      this.render.updateVisible(draft);
  
      if(this.render.isYarnBasedView()) computeYarnPaths(draft, this.ms.getShuttles());
  
      this.weaveRef.redraw(draft, loom, loom_settings, {drawdown: true, loom: true, weft_systems: true, weft_materials:true});
  
    });


   

  }


  public updateSelection(e:any){
    this.copy = e;
  }


  /**
   * This is called when an action occures that chagnes the loom within the loom modal
   */
  onLoomChange(){

    

    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);

    this.render.updateVisible(draft);

    if(this.render.isYarnBasedView()) computeYarnPaths(draft, this.ms.getShuttles());

    this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
    .then(loom => {
      this.tree.setLoom(this.id, loom);
      this.weaveRef.loom_settings = loom_settings;
      this.weaveRef.isFrame = isFrame(loom_settings);
      this.weaveRef.redraw(draft, loom, loom_settings, {drawdown: true, loom: true, weft_systems: true, weft_materials:true,warp_systems: true, warp_materials:true});
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
