import { Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';

import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/overlay';
import { MatDialog } from "@angular/material/dialog";
import { Subject } from 'rxjs';
import { Draft, Drawdown, Loom, LoomSettings, Cell } from '../core/model/datatypes';
import { copyDraft, createDraft, generateMappingFromPattern, getDraftName } from '../core/model/drafts';
import { copyLoom, isFrame } from '../core/model/looms';
import { RenderService } from './provider/render.service';
import { DesignmodesService } from '../core/provider/designmodes.service';
import { FileService } from '../core/provider/file.service';
import { MaterialsService } from '../core/provider/materials.service';
import { SystemsService } from '../core/provider/systems.service';
import { TreeService } from '../core/provider/tree.service';
import { WorkspaceService } from '../core/provider/workspace.service';
import { SubdraftComponent } from '../mixer/palette/subdraft/subdraft.component';
import { DraftviewerComponent } from './draftviewer/draftviewer.component';
import { SimulationComponent } from './simulation/simulation.component';
import { createCell } from '../core/model/cell';
import utilInstance from '../core/model/util';



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
  

  @Input()   new_draft_flag$: Subject<any>;
  @Output() closeDrawer: any = new EventEmitter();

  id: number = -1;  


  

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

  draftname: string = "";

  scrollingSubscription: any;

  warp_locked: boolean = false;


  layer_threshold: number = 2;

  warp_threshold: number = 3;

  layer_spacing: number = 10;

  sim_expanded: boolean = false;
  viewer_expanded: boolean = false;

  clone_id: number = -1;


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


    this.copy = [[createCell(false)]];
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
    // if(event.index == 2){
    //   this.crosssection.initScene();
    // }
  }

  expandSimulation(){
    this.sim_expanded = !this.sim_expanded;

    if(this.sim_expanded){
      const dvdiv = document.getElementById('draft-container');
      dvdiv.style.display = 'none';
      const el = document.getElementById('draft_sidebar');
      el.style.display = "none";
    }else{
      const dvdiv = document.getElementById('draft-container');
      dvdiv.style.display = 'flex';
      const el = document.getElementById('draft_sidebar');
      el.style.display = "flex";
    }

  }

  closeDetailView(){
    this.closeDrawer.emit({id: this.id, clone_id: this.clone_id, dirty: this.weaveRef.is_dirty});
  }


  expandViewer(){
    this.viewer_expanded = !this.viewer_expanded;

    if(this.viewer_expanded){
      const dvdiv = document.getElementById('sim_viewer');
      dvdiv.style.display = 'none';
    }else{
      const dvdiv = document.getElementById('sim_viewer');
      dvdiv.style.display = 'flex';
      this.redrawSimulation();

    }

  }


  /**
   * loads a new draft into the detail viewer
   * @param id 
   */
  loadDraft(id: number) : Promise<any> {
      //reset the dirty value every time the window is open
    this.weaveRef.is_dirty = false;

    if(!this.tree.hasParent(id)){
      this.id = id;
      this.clone_id = -1;
      this.draft = this.tree.getDraft(id);
      this.draftname = getDraftName(this.draft)
      this.loom = this.tree.getLoom(id);
      this.loom_settings = this.tree.getLoomSettings(id);
      this.render.loadNewDraft(this.draft);
      this.weaveRef.onNewDraftLoaded(this.draft, this.loom, this.loom_settings);
      // return this.simRef.loadNewDraft(this.draft, this.loom_settings);
    }else{
      this.clone_id  = id;
      const newid = this.tree.createNode('draft', null, null);

      let d = this.tree.getDraft(id);
      this.draft= copyDraft(d);
      this.draftname = getDraftName(this.draft)

      this.draft.id =newid;
      this.id = newid;

      const loom_settings:LoomSettings = this.tree.getLoomSettings(id);
      this.id = this.draft.id;

      this.loom_settings = {
        type: loom_settings.type,
        epi: loom_settings.epi,
        units: loom_settings.units,
        frames: loom_settings.frames,
        treadles: loom_settings.treadles
      }
      this.loom = copyLoom(this.tree.getLoom(id));

      return this.tree.loadDraftData({prev_id: -1, cur_id: this.id}, this.draft, this.loom, this.loom_settings, false)
      .then(d => {

        this.render.loadNewDraft(this.draft);
    
        this.weaveRef.onNewDraftLoaded(this.draft, this.loom, this.loom_settings);
      
        // return this.simRef.loadNewDraft(this.draft, this.loom_settings);

        })
    }
   
  }

  windowClosed(){
    this.draft = null;
    this.id = null;
    this.loom_settings = null;
    this.simRef.endSimulation();
  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.simRef.endSimulation();

  }



  public onCloseDrawer(){
    this.weaveRef.unsetSelection();
    this.simRef.unsetSelection();
    this.closeDrawer.emit({id: this.id, clone_id: this.clone_id, dirty: this.weaveRef.is_dirty});
  }


  /**
   * this is emitted from the detail viewer to indicate that something changed on the draft while it was in detail view. 
   * if this is a generated draft, it now needs to be cloned on window close. If not, an update on the draft chain needs to be called for the original draft
   * @param obj {id: the draft id}
   */
  public designModeChange(e:any) {
    this.simRef.unsetSelection();
    this.weaveRef.unsetSelection();
  }

  public drawdownUpdated(){

    this.simRef.setDirty();
    this.redrawSimulation()
  }


  public materialChange() {
    this.simRef.redrawCurrentSim();
  }
  
  



  
  public redrawSimulation(){
    let draft = this.tree.getDraft(this.id);
    let loom_settings = this.tree.getLoomSettings(this.id);

    if(!this.viewer_expanded)
     this.simRef.updateSimulation(draft, loom_settings);
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
    if(!this.weaveRef.hasSelection()) return;
    if(e.copy !== undefined) this.copy = e;
    if(e.id !== undefined) this.simRef.updateSelection(e.start, e.end);
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
