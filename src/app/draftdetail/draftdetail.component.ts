import { Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';

import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/overlay';
import { MatDialog } from "@angular/material/dialog";
import { Subject } from 'rxjs';
import { Cell } from '../core/model/cell';
import { Draft, Drawdown, Loom, LoomSettings } from '../core/model/datatypes';
import { generateMappingFromPattern } from '../core/model/drafts';
import { isFrame } from '../core/model/looms';
import { RenderService } from './provider/render.service';
import { computeYarnPaths } from '../core/model/yarnsimulation';
import { DesignmodesService } from '../core/provider/designmodes.service';
import { FileService } from '../core/provider/file.service';
import { MaterialsService } from '../core/provider/materials.service';
import { SystemsService } from '../core/provider/systems.service';
import { TreeService } from '../core/provider/tree.service';
import { WorkspaceService } from '../core/provider/workspace.service';
import { SubdraftComponent } from '../mixer/palette/subdraft/subdraft.component';
import { DraftviewerComponent } from './draftviewer/draftviewer.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { CrosssectionComponent } from './crosssection/crosssection.component';
import { SimulationComponent } from './simulation/simulation.component';



@Component({
  selector: 'app-draftdetail',
  templateUrl: './draftdetail.component.html',
  styleUrls: ['./draftdetail.component.scss']
})
export class DraftDetailComponent implements OnInit {
 
  /**
   * The reference to the weave directive.
   * @property {WeaveDirective}
   */
  @ViewChild(DraftviewerComponent, {static: true}) weaveRef;
  @ViewChild(SimulationComponent, {static: true}) simRef;
  @ViewChild(SidebarComponent, {static: true}) sidebar;
  @ViewChild(CrosssectionComponent, {static: false}) crosssection: CrosssectionComponent;
  

  @Output() closeDrawer: any = new EventEmitter();

  id: number = -1;  
  
  viewonly: boolean; 

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

  warp_locked: boolean = false;


  layer_threshold: number = 2;

  warp_threshold: number = 3;

  layer_spacing: number = 10;

  sim_expanded: boolean = false;
  viewer_expanded: boolean = false;



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
    private tree: TreeService,
    public render: RenderService) {

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


  }

  ngAfterViewInit() {

    

  
    
  }


  tabChange(event: any){
    if(event.index == 2){
      this.crosssection.initScene();
    }
  }

  expandSimulation(){
    this.sim_expanded = !this.sim_expanded;

    if(this.sim_expanded){
      const sbdiv = document.getElementById('sidebar');
      sbdiv.style.display = 'none';
      const dvdiv = document.getElementById('draft_viewer');
      dvdiv.style.display = 'none';
    }else{
      const sbdiv = document.getElementById('sidebar');
      sbdiv.style.display = 'flex';
      const dvdiv = document.getElementById('draft_viewer');
      dvdiv.style.display = 'flex';
    }

  }

  expandViewer(){
    this.viewer_expanded = !this.viewer_expanded;

    if(this.viewer_expanded){
      const dvdiv = document.getElementById('simulation_container');
      dvdiv.style.display = 'none';
    }else{
      const dvdiv = document.getElementById('simulation_container');
      dvdiv.style.display = 'flex';
    }

  }


  loadDraft(id: number){
    this.id = id;
    this.draft = this.tree.getDraft(id);
    this.loom_settings = this.tree.getLoomSettings(id);
    this.viewonly = this.tree.hasParent(id);
    this.loom = this.tree.getLoom(id);
    this.render.loadNewDraft(this.draft);
    this.weaveRef.onNewDraftLoaded(this.draft, this.loom, this.loom_settings);
    this.simRef.drawSimulation(this.draft, this.loom_settings);
  }

  windowClosed(){
    this.simRef.endSimulation();
  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.simRef.endSimulation();

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

  public onCloseDrawer(){
    console.log("CLOSE")
    this.closeDrawer.emit();
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

  public redrawSimulation(e: any){
    let draft = this.tree.getDraft(this.id);
    let loom_settings = this.tree.getLoomSettings(this.id);
    this.simRef.updateSimulation(draft, loom_settings);
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






  public updateSelection(e:any){
    if(e.copy !== undefined) this.copy = e;
    if(e.id !== undefined) this.crosssection.updateSelection(this.tree.getDraft(e.id), e.start, e.end);
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




layerThresholdChange(){
  console.log("layer threshold", this.layer_threshold);
  this.simRef.changeLayerThreshold(this.layer_threshold)
}

warpThresholdChange(){
  console.log("this.warp threshold", this.warp_threshold);
  this.simRef.changeWarpThreshold(this.warp_threshold)
}

// layerSpacingChange(e: any){
//   console.log("layer spacing change ", this.layer_spacing, e);
//   this.simRef.changeLayerSpacing(this.layer_spacing)
// }








}
