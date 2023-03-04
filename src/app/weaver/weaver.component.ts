import { Component, HostListener, Input, OnInit, ViewChild } from '@angular/core';

import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/overlay';
import { MatDialog } from "@angular/material/dialog";
import { Subject } from 'rxjs';
import { DraftviewerComponent } from '../core/draftviewer/draftviewer.component';
import { Cell } from '../core/model/cell';
import { DesignMode, Draft, Drawdown, Loom, LoomSettings, LoomUtil } from '../core/model/datatypes';
import { deleteDrawdownCol, deleteDrawdownRow, deleteMappingCol, deleteMappingRow, generateMappingFromPattern, insertDrawdownCol, insertDrawdownRow, insertMappingCol, insertMappingRow, warps, wefts } from '../core/model/drafts';
import { generateDirectTieup, getLoomUtilByType, isFrame } from '../core/model/looms';
import { Render } from '../core/model/render';
import { computeYarnPaths } from '../core/model/yarnsimulation';
import { DesignmodesService } from '../core/provider/designmodes.service';
import { FileService } from '../core/provider/file.service';
import { MaterialsService } from '../core/provider/materials.service';
import { SystemsService } from '../core/provider/systems.service';
import { TreeService } from '../core/provider/tree.service';
import { WorkspaceService } from '../core/provider/workspace.service';
import { SidebarComponent } from '../core/sidebar/sidebar.component';
import { SubdraftComponent } from '../mixer/palette/subdraft/subdraft.component';
import { NgForm } from '@angular/forms';



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
  
  id: number = -1;  
  
  viewonly: boolean; 

  render: Render;
  /**
  The current selection, as a Pattern 
  **/
  copy: Drawdown;

  draft: Draft;

  loom: Loom;

  loom_settings: LoomSettings;

  selected;

  collapsed: boolean = false;

  private unsubscribe$ = new Subject();

  dims:any;

  draftelement:any;

  scrollingSubscription: any;


  warps: number = -1;

  wefts: number = -1;

  treadles: number = 1;

  frames: number = 1;

  width: number = 1;

  warp_locked: boolean = false;

  loomtypes:Array<DesignMode>  = [];

  density_units: Array<DesignMode> = [];

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
    public dm: DesignmodesService,
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

    this.loomtypes = dm.getOptionSet('loom_types');
    this.density_units = dm.getOptionSet('density_units');


  }

  private onWindowScroll(data: CdkScrollable) {
    const scrollTop:number = data.measureScrollOffset("top");
    const scrollLeft:number = data.measureScrollOffset("left");
    this.weaveRef.reposition(scrollTop, scrollLeft);
  }
  
  ngOnInit(){
    this.render = new Render(true, this.ss);


  }

  ngAfterViewInit() {

    

  
    
  }



  loadDraft(id: number){
    this.id = id;
    this.draft = this.tree.getDraft(id);
    this.viewonly = this.tree.hasParent(id);
    this.loom = this.tree.getLoom(id);
    this.loom_settings = this.tree.getLoomSettings(id);
    this.render.loadNewDraft(this.draft);
    this.warps = warps(this.draft.drawdown);
    this.wefts = wefts(this.draft.drawdown);
    this.width = warps(this.draft.drawdown) / this.loom_settings.epi;
    if(this.loom_settings.units = 'cm') this.width *= 10;
    this.weaveRef.onNewDraftLoaded(this.draft, this.loom, this.loom_settings);

    this.weaveRef.redraw(this.draft, this.loom, this.loom_settings, {
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
    const loom = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getDraft(this.id);

    this.dm.selectDesignMode(value, 'view_modes');
    this.render.setCurrentView(value);

    if(this.render.isYarnBasedView()) computeYarnPaths(draft, this.ms.getShuttles());

    this.weaveRef.redraw(draft, loom, loom_settings,  {
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
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    this.weaveRef.redraw(draft, loom, loom_settings, {drawdown: true, warp_materials:true,  weft_materials:true});
    //this.timeline.addHistoryState(this.draft);
  }





  /**
   * Inserts an empty row on system, system
   */
  public shuttleColorChange() {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    this.weaveRef.redraw(draft, loom, loom_settings, {drawdown: true, warp_materials:true,  weft_materials:true});
   // this.timeline.addHistoryState(this.draft);
  }

  public updateWarpSystems(pattern: Array<number>) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    draft.colSystemMapping = generateMappingFromPattern(draft.drawdown, pattern, 'col', this.ws.selected_origin_option);
    this.tree.setDraftOnly(this.id, draft);
    this.weaveRef.redraw(draft, loom, loom_settings, {drawdown: true, warp_systems: true});
  }

  public updateWeftSystems(pattern: Array<number>) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    draft.rowSystemMapping =  generateMappingFromPattern(draft.drawdown, pattern, 'row', this.ws.selected_origin_option);
    this.tree.setDraftOnly(this.id, draft);
    this.weaveRef.redraw(draft, loom, loom_settings, {drawdown: true, weft_systems: true});
  }

  public updateWarpShuttles(pattern: Array<number>) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    
    draft.colShuttleMapping = generateMappingFromPattern(draft.drawdown, pattern, 'col', this.ws.selected_origin_option);
    this.tree.setDraftOnly(this.id, draft);

    this.weaveRef.redraw(draft, loom, loom_settings,{drawdown: true, warp_materials: true});
  }

  public updateWeftShuttles(pattern: Array<number>) {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    draft.rowShuttleMapping = generateMappingFromPattern(draft.drawdown, pattern, 'row', this.ws.selected_origin_option);
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


  public redrawLoomAndDraft(){

    const draft = this.tree.getDraft(this.id)
    const loom = this.tree.getLoom(this.id)
    const loom_settings = this.tree.getLoomSettings(this.id);
    this.render.updateVisible(draft);

    const is_frame = isFrame(loom_settings);
    if(is_frame){
      this.weaveRef.isFrame = true;
    }else{
      this.weaveRef.isFrame = false;
    }
    this.weaveRef.colShuttleMapping = draft.colShuttleMapping.slice();
    this.weaveRef.rowShuttleMapping = draft.rowShuttleMapping.slice();
    this.weaveRef.redraw(draft, loom, loom_settings,{drawdown: true, loom:true, warp_systems: true, warp_materials: true, weft_systems: true, weft_materials:true});
  }

  /**
   * when a change happens to the defaults for looms, we must update all looms on screen
   */

  public globalLoomChange(e: any){

    const dn = this.tree.getDraftNodes();
    dn.forEach(node => {
      const draft = this.tree.getDraft(node.id)
      const loom = this.tree.getLoom(node.id)
      const loom_settings = this.tree.getLoomSettings(node.id);
      (<SubdraftComponent> node.component).drawDraft(draft);
      if(node.id == this.id){
        this.weaveRef.redraw(draft, loom, loom_settings, {
          drawdown: true, 
          loom:true, 
          warp_systems: true, 
          weft_systems: true, 
          warp_materials: true,
          weft_materials:true
        });
      } 

    });


  }


  updateMinTreadles(f: NgForm){
    //validate the input
    const loom_settings = this.tree.getLoomSettings(this.id);
    const loom = this.tree.getLoom(this.id);
    const draft = this.tree.getDraft(this.id);

    if(!f.value.treadles){
      f.value.treadles = 2; 
      this.treadles = f.value.treadles;
    } 

    f.value.treadles = Math.ceil(f.value.treadles);
   

      loom_settings.treadles = f.value.treadles;

      if(loom_settings.type == 'direct'){
        this.frames = f.value.treadles;
        this.treadles = f.value.treadles;
        loom_settings.frames = this.frames;
        loom_settings.treadles = this.treadles;
        loom.tieup = generateDirectTieup(f.value.treadles);
        this.tree.setLoom(this.id, loom);

      }

      this.tree.setLoomSettings(this.id, loom_settings);
      this.weaveRef.redraw(draft, loom, loom_settings, {
        loom:true, 
      });
    

  }

  updateMinFrames(f: NgForm){
    const loom_settings = this.tree.getLoomSettings(this.id);
    const loom = this.tree.getLoom(this.id);
    const draft = this.tree.getDraft(this.id);

    if(!f.value.frames){
      f.value.frames = 2; 
      this.frames = f.value.frames;

    }
     

    f.value.frames = Math.ceil(f.value.frames);
    

      loom_settings.frames = f.value.frames;

      if(loom_settings.type == 'direct'){
        this.frames = f.value.frames;
        this.treadles = f.value.frames;
        loom_settings.frames = this.frames;
        loom_settings.treadles = this.treadles;
        loom.tieup = generateDirectTieup(f.value.frames);
        this.tree.setLoom(this.id, loom);
      }

      this.tree.setLoomSettings(this.id, loom_settings);      
      this.weaveRef.redraw(draft, loom, loom_settings, {
        loom:true, 
      });
    
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


  // public warpNumChange(e:any) {
  //   if(e.warps == "") return;

  //   const draft = this.tree.getDraft(this.id);
  //   const loom_settings = this.tree.getLoomSettings(this.id);

  //   if(e.warps > warps(draft.drawdown)){
  //     var diff = e.warps - warps(draft.drawdown);
      
  //     for(var i = 0; i < diff; i++){  
  //       draft.drawdown = insertDrawdownCol(draft.drawdown, i, null);
  //       draft.colShuttleMapping = insertMappingCol(draft.colShuttleMapping, i, 0);
  //       draft.colSystemMapping = insertMappingCol(draft.colSystemMapping, i, 0);  
  //     }
  //   }else{
  //     var diff = warps(draft.drawdown) - e.warps;
  //     for(var i = 0; i < diff; i++){  
  //       draft.drawdown = deleteDrawdownCol(draft.drawdown, warps(draft.drawdown)-1);
  //       draft.rowSystemMapping = deleteMappingCol(draft.rowSystemMapping, warps(draft.drawdown)-1);
  //       draft.rowShuttleMapping = deleteMappingCol(draft.rowShuttleMapping, warps(draft.drawdown)-1);
  //     }

  //   }

  //   this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
  //   .then(loom => {
  //     if(this.render.isYarnBasedView()) computeYarnPaths(draft, this.ms.getShuttles());
  //     this.weaveRef.redraw(draft, loom, loom_settings,{drawdown: true, loom: true, warp_systems: true, warp_materials:true});
  
  //   });

  
  // }

  // public weftNumChange(e:any) {
  
  //   if(e.wefts === "" || e.wefts =="null") return;
  //   const draft = this.tree.getDraft(this.id);
  //   const loom_settings = this.tree.getLoomSettings(this.id);


  //   if(e.wefts > wefts(draft.drawdown)){
  //     var diff = e.wefts - wefts(draft.drawdown);
      
  //     for(var i = 0; i < diff; i++){  
  //       draft.drawdown = insertDrawdownRow(draft.drawdown, wefts(draft.drawdown)+1, null)
  //       draft.rowShuttleMapping = insertMappingRow(draft.rowShuttleMapping, wefts(draft.drawdown)+1, 0);
  //       draft.rowSystemMapping = insertMappingRow(draft.rowSystemMapping, wefts(draft.drawdown)+1, 0);
  //     }
  //   }else{
  //     var diff = wefts(draft.drawdown) - e.wefts;
  //     for(var i = 0; i < diff; i++){  
  //       draft.drawdown = deleteDrawdownRow(draft.drawdown, wefts(draft.drawdown)-1);
  //       draft.rowShuttleMapping = deleteMappingRow(draft.rowShuttleMapping, wefts(draft.drawdown)-1);
  //       draft.rowSystemMapping = deleteMappingRow(draft.rowSystemMapping, wefts(draft.drawdown)-1);
  //     }

  //   }

  //   this.tree.setDraftAndRecomputeLoom(this.id, draft,loom_settings)
  //   .then(loom => {
  //     this.render.updateVisible(draft);
  
  //     if(this.render.isYarnBasedView()) computeYarnPaths(draft, this.ms.getShuttles());
  
  //     this.weaveRef.redraw(draft, loom, loom_settings, {drawdown: true, loom: true, weft_systems: true, weft_materials:true});
  
  //   });


   

  // }


  public updateSelection(e:any){
    this.copy = e;
  }




  public renderChange(e: any){

    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
     
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
        this.weaveRef.redraw(draft, loom, loom_settings, {drawdown:true});
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


   //HELPER FUNCTIONS TO AID VARIABLES CALLED FROM HTML





swapEditingStyle(){
  if(this.dm.getSelectedDesignMode('drawdown_editing_style').value === 'drawdown'){
    this.dm.selectDesignMode('loom', 'drawdown_editing_style')
  }else{
    this.dm.selectDesignMode('drawdown', 'drawdown_editing_style')
  }

}


loomChange(e:any){
  const draft = this.tree.getDraft(this.id);
  const loom = this.tree.getLoom(this.id);
  const loom_settings = this.tree.getLoomSettings(this.id);

  let utils:LoomUtil = null;

    const new_settings:LoomSettings = {
      type: e.value.loomtype,
      epi: loom_settings.epi,
      units: loom_settings.units,
      frames: loom_settings.frames,
      treadles: loom_settings.treadles
    }

    if(loom_settings.type == 'direct'){
      new_settings.frames = Math.max(loom_settings.treadles, loom_settings.frames);
      new_settings.treadles = Math.max(loom_settings.treadles, loom_settings.frames);
      this.treadles = Math.max(loom_settings.treadles, loom_settings.frames);
      this.frames = Math.max(loom_settings.treadles, loom_settings.frames);

    }

    //if we are changing from null or jacquard to a frame type loom 
    if((loom_settings.type === null || loom_settings.type === 'jacquard')){
     //from jacquard to frame

      utils = getLoomUtilByType(new_settings.type);
      utils.computeLoomFromDrawdown(draft.drawdown, loom_settings, this.ws.selected_origin_option)
      .then(loom => {
        this.tree.setLoom(this.id, loom);
        this.weaveRef.redraw(draft, loom, loom_settings, {loom: true});
      });
    }else if(isFrame(loom_settings) && new_settings.type == 'jacquard'){
    //from a frame loom to jacquard

     utils = getLoomUtilByType(new_settings.type);
     utils.computeDrawdownFromLoom(loom,this.ws.selected_origin_option)
      .then(drawdown => {
        draft.drawdown = drawdown;
        this.tree.setDraftOnly(this.id, draft);
        this.weaveRef.redraw(draft, loom, loom_settings, {loom: true});

      });
    
    }else if(isFrame(loom_settings) && isFrame(new_settings)){
      //from one frame loom to another
      const utils = getLoomUtilByType(new_settings.type);
      if(this.dm.getSelectedDesignMode('drawdown_editing_style').value == 'drawdown'){
        utils.computeLoomFromDrawdown(draft.drawdown, loom_settings, this.ws.selected_origin_option)
        .then(loom => {
          this.tree.setLoom(this.id, loom);
          this.weaveRef.redraw(draft, loom, loom_settings, {loom: true});

        })
      }else{
        utils.recomputeLoomFromThreadingAndDrawdown(loom,new_settings, draft.drawdown, this.ws.selected_origin_option)
        .then(loom => {
          this.tree.setLoom(this.id, loom);
          this.weaveRef.redraw(draft, loom, loom_settings, {loom: true});
        });

      }


    }

    
    if (loom_settings.type === 'jacquard') this.dm.selectDesignMode('drawdown', 'drawdown_editing_style')
    else this.dm.selectDesignMode('loom', 'drawdown_editing_style');

    this.tree.setLoomSettings(this.id, new_settings);



  } 


public unitChange(e:any){
  const draft = this.tree.getDraft(this.id);
  const loom = this.tree.getLoom(this.id);
  const loom_settings = this.tree.getLoomSettings(this.id);
  loom_settings.units = e.value.units;
  this.tree.setLoomSettings(this.id, loom_settings);
  this.weaveRef.redraw(draft, loom, loom_settings, {loom: true});

}



/**
 * recomputes warps and epi if the width of the loom is changed
 * @param f 
 */
widthChange(f: NgForm) {
  const draft = this.tree.getDraft(this.id);
  const loom = this.tree.getLoom(this.id);
  const loom_settings = this.tree.getLoomSettings(this.id);

  if(!f.value.width){
    f.value.width = 1;
    this.width = f.value.width;
  } 

  if(this.warp_locked){
    var new_epi = (loom_settings.units == "in") ? f.value.warps / f.value.width : (10 * f.value.warps / f.value.width);   
    loom_settings.epi = new_epi;
    f.value.epi = new_epi;
    this.tree.setLoomSettings(this.id, loom_settings);
    this.weaveRef.redraw(draft, loom, loom_settings, {loom: true});
  }else{
    var new_warps = (loom_settings.units === "in") 
    ? Math.ceil(f.value.width * f.value.epi) : 
    Math.ceil((10 * f.value.warps / f.value.width));

    this.warpNumChange({warps: new_warps});
  }
}

public warpNumChange(e:any) {

  if(e.warps == "") return;

  const draft = this.tree.getDraft(this.id);
  let loom = this.tree.getLoom(this.id);
  const loom_settings = this.tree.getLoomSettings(this.id);


  if(e.warps > warps(draft.drawdown)){
    var diff = e.warps -  warps(draft.drawdown);
    for(var i = 0; i < diff; i++){  

      let ndx = warps(draft.drawdown);
      const utils = getLoomUtilByType(loom_settings.type);
      loom = utils.insertIntoThreading(loom, ndx, -1);

      draft.drawdown = insertDrawdownCol(draft.drawdown,ndx, null);
      draft.colShuttleMapping = insertMappingCol(draft.colShuttleMapping,ndx, 0);
      draft.colSystemMapping = insertMappingCol(draft.colSystemMapping,ndx, 0);
      
    }
  }else{

    var diff = warps(draft.drawdown) - e.warps;
    for(var i = 0; i < diff; i++){  
      let ndx = warps(draft.drawdown)-1;

      const utils = getLoomUtilByType(loom_settings.type);
      loom = utils.deleteFromThreading(loom, ndx);
      draft.drawdown = deleteDrawdownCol(draft.drawdown, ndx);
      draft.colShuttleMapping = deleteMappingCol(draft.colShuttleMapping,ndx);
      draft.colSystemMapping = deleteMappingCol(draft.colSystemMapping,ndx);

    }

  }

  if(this.dm.getSelectedDesignMode('drawdown_editing_style').value == 'drawdown'){
    this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
    .then(loom => {
        this.weaveRef.redraw(draft, loom, loom_settings, {
          drawdown: true, 
          loom:true, 
          warp_systems: true, 
          warp_materials: true,
        });
      })

  }else{
    this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
    .then(draft => {
      this.weaveRef.redraw(draft, loom, loom_settings, {
        drawdown: true, 
        loom:true, 
        warp_systems: true, 
        warp_materials: true,
      });
      })

  }


}


warpChange(f: NgForm) {

  const loom_settings = this.tree.getLoomSettings(this.id);

  if(!f.value.warps){
   f.value.warps = 2;
   this.warps = f.value.warps;
  }
  this.warpNumChange({warps: f.value.warps})
  this.width = (loom_settings.units =='cm') ? f.value.warps / loom_settings.epi * 10 : f.value.warps / loom_settings.epi;
  f.value.width = this.width;

}

weftChange(f: NgForm) {
  if(!f.value.wefts){
    f.value.wefts = 2;
    this.wefts = 2;
  } 
  this.weftNumChange({wefts: f.value.wefts})

}

public weftNumChange(e:any) {

  if(e.wefts === "" || e.wefts =="null") return;


  const draft = this.tree.getDraft(this.id);
  let loom = this.tree.getLoom(this.id);
  const loom_settings = this.tree.getLoomSettings(this.id);


  if(e.wefts > wefts(draft.drawdown)){
    var diff = e.wefts - wefts(draft.drawdown);

    for(var i = 0; i < diff; i++){  
      let ndx = wefts(draft.drawdown);

      draft.drawdown = insertDrawdownRow(draft.drawdown,ndx, null);
      draft.rowShuttleMapping = insertMappingRow(draft.rowShuttleMapping,  ndx, 1)
      draft.rowSystemMapping = insertMappingRow(draft.rowSystemMapping,  ndx, 0)
      const utils = getLoomUtilByType(loom_settings.type);
      loom = utils.insertIntoTreadling(loom, ndx, []);
    }
  }else{
    var diff = wefts(draft.drawdown) - e.wefts;
    for(var i = 0; i < diff; i++){  
      let ndx = wefts(draft.drawdown)-1;
      draft.drawdown = deleteDrawdownRow(draft.drawdown, ndx);
      draft.rowShuttleMapping = deleteMappingRow(draft.rowShuttleMapping, ndx)
      draft.rowSystemMapping = deleteMappingRow(draft.rowSystemMapping,  ndx)
      const utils = getLoomUtilByType(loom_settings.type);
      loom =  utils.deleteFromTreadling(loom, ndx);
    }
  }

  if(this.dm.getSelectedDesignMode('drawdown_editing_style').value == 'drawdown'){

    this.tree.setDraftAndRecomputeLoom(this.id, draft, loom_settings)
    .then(loom => {
      this.weaveRef.redraw(draft, loom, loom_settings, {
        drawdown: true, 
        loom:true, 
        weft_systems: true, 
        weft_materials: true,
      });
    })
  }else{
    this.tree.setLoomAndRecomputeDrawdown(this.id, loom, loom_settings)
    .then(draft => {
      this.weaveRef.redraw(draft, loom, loom_settings, {
        drawdown: true, 
        loom:true, 
        weft_systems: true, 
        weft_materials: true,
      });    })
  }
 
}




epiChange(f: NgForm) {

  const loom_settings = this.tree.getLoomSettings(this.id);

  if(!f.value.epi){
    f.value.epi = 1;
    loom_settings.epi = f.value.epi;
    this.tree.setLoomSettings(this.id, loom_settings);
  } 
  
  //this.loom.overloadEpi(f.value.epi);
  this.ws.epi = f.value.epi;

    if(this.warp_locked){
      //change the width
      this.width = (loom_settings.units =='cm') ? f.value.warps / loom_settings.epi * 10 : f.value.warps / loom_settings.epi;
      f.value.width = this.width;
      
    }else{
      var new_warps = (loom_settings.units === "in") 
      ? Math.ceil(f.value.width * f.value.epi) : 
      Math.ceil((10 * f.value.warps / f.value.width));
      f.value.warps = new_warps;
      this.warps = new_warps;
      this.warpNumChange({warps: new_warps});
    }
  

  }



}
