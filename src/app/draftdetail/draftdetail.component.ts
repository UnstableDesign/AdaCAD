import { Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';

import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/overlay';
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Subject } from 'rxjs';
import { Draft, Drawdown, Loom, LoomSettings, Cell, DraftNode } from '../core/model/datatypes';
import { copyDraft, createDraft, generateMappingFromPattern, getDraftName } from '../core/model/drafts';
import { copyLoom, getLoomUtilByType, isFrame } from '../core/model/looms';
import { RenderService } from './provider/render.service';
import { DesignmodesService } from '../core/provider/designmodes.service';
import { FileService } from '../core/provider/file.service';
import { MaterialsService } from '../core/provider/materials.service';
import { SystemsService } from '../core/provider/systems.service';
import { TreeService } from '../core/provider/tree.service';
import { WorkspaceService } from '../core/provider/workspace.service';
import { SubdraftComponent } from '../mixer/palette/subdraft/subdraft.component';
import { DraftviewerComponent } from './draftviewer/draftviewer.component';
import { createCell } from '../core/model/cell';
import utilInstance from '../core/model/util';
import { ActionsComponent } from './actions/actions.component';
import { NgForm } from '@angular/forms';
import { defaults } from '../core/model/defaults';
import { ZoomService } from '../mixer/provider/zoom.service';
import { StateService } from '../core/provider/state.service';



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
  // @ViewChild(SimulationComponent, {static: true}) simRef;
  

  @Output() closeDrawer: any = new EventEmitter();
  @Output() saveChanges: any = new EventEmitter();
  @Output() updateSimulation: any = new EventEmitter();
  @Output() updateMixer: any = new EventEmitter();
  @Output() createNewDraftOnMixer: any = new EventEmitter();

  @Input('hasFocus') hasFocus; 

  id: number = -1;  


  actions_modal: MatDialogRef<ActionsComponent, any>;


  /**
  The current selection, as a Pattern 
  **/
  copy: Drawdown;

  // draft: Draft;

  // loom: Loom;

  // loom_settings: LoomSettings;

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

  width: number = 10;

  epi: number = 10;
  units: string = 'cm';
  type: string = 'jacquard';

  


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
    public ms: MaterialsService,
    private ss: SystemsService,
    private state: StateService,
    private ws: WorkspaceService,
    private tree: TreeService,
    public render: RenderService,
    private zs: ZoomService) {

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

    this.epi = defaults.epi;
    this.units =defaults.units;
    this.type = defaults.loom_type;


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


  //when the drawdown is updated see if it has a parent and if a new draft needs to be created. 
  detailDraftEdited(id:number){


    this.addTimelineState();

    //if it has a parent and it does not yet have a view ref. 
    if(this.tree.hasParent(id)){

      //reset this id back to what it was before
      //create a new draft of the edited draft. 
 //   //set up a clone of this draft if it has a parent, so that major changes can spawn a new draft to be created

      const newid = this.tree.createNode('draft', null, null);
      let d = this.tree.getDraft(id);
      const copied_draft= copyDraft(d);

      copied_draft.id =newid;
      this.id = newid;
      this.weaveRef.id = newid;

      //copy over the loom settings
      const old_loom_settings:LoomSettings = this.tree.getLoomSettings(id);
      const loom_settings = {
        type: old_loom_settings.type,
        epi: old_loom_settings.epi,
        units: old_loom_settings.units,
        frames: old_loom_settings.frames,
        treadles: old_loom_settings.treadles
      }

      this.tree.setLoomSettings(this.id, loom_settings)

      let loom = this.tree.getLoom(id);
      const loom_fns = [];

      if(loom === null){
        let loom_util = getLoomUtilByType(loom_settings.type);
        loom_fns.push( loom_util.computeLoomFromDrawdown(copied_draft.drawdown, loom_settings, this.ws.selected_origin_option))
      }else{
        loom = copyLoom(this.tree.getLoom(id));
        this.tree.setLoom(this.id, loom);
      }


      return Promise.all(loom_fns)
      .then(loom => {

        if(loom.length > 0){
          let new_loom = copyLoom(loom[0]);
          this.tree.setLoom(this.id, new_loom)
        }

        let new_loom = this.tree.getLoom(this.id);
        return  this.tree.loadDraftData({prev_id: -1, cur_id: this.id}, copied_draft, new_loom, loom_settings, false)
      }).then(d => {
        //update the mixer 
        this.tree.setSubdraftParent(this.id, -1)
        this.createNewDraftOnMixer.emit({original_id: id, new_id: newid});
        return Promise.resolve(null)

        })
        .catch(err => {console.error(err)})
    }



    


  }


  /**
   * loads a new draft into the detail viewer
   * when a draft is loaded, it is loaded as is. 
   * if someone goes to edit the draft...but it has a parent, then a new draft is created and pushed to the mixer. 
   * @param id 
   */
  loadDraft(id: number) : Promise<any> {



    if(id == -1) return;
    
    //reset the dirty value every time the window is open
    this.weaveRef.is_dirty = false;

   // if(!this.tree.hasParent(id)){

      this.id = id;
      this.clone_id = -1;
      const draft = this.tree.getDraft(id);
      this.draftname = getDraftName(draft)
      this.render.loadNewDraft(draft);
      this.weaveRef.onNewDraftLoaded(id);
      //return this.simRef.loadNewDraft(this.draft, this.loom_settings);
      return Promise.resolve(null);
    
    // }else{

    //   //set up a clone of this draft if it has a parent, so that major changes can spawn a new draft to be created

    //   this.clone_id  = id;
    //   const newid = this.tree.createNode('draft', null, null);

    //   let d = this.tree.getDraft(id);
      
    //   const draft= copyDraft(d);
    //   this.draftname = getDraftName(draft)

    //   draft.id =newid;
    //   this.id = newid;

    //   //copy over the loom settings
    //   const old_loom_settings:LoomSettings = this.tree.getLoomSettings(id);
    //   const loom_settings = {
    //     type: old_loom_settings.type,
    //     epi: old_loom_settings.epi,
    //     units: old_loom_settings.units,
    //     frames: old_loom_settings.frames,
    //     treadles: old_loom_settings.treadles
    //   }

    //   this.tree.setLoomSettings(this.id, loom_settings)

    //   let loom = this.tree.getLoom(id);
    //   const loom_fns = [];

    //   if(loom === null){
    //     let loom_util = getLoomUtilByType(loom_settings.type);
    //     loom_fns.push( loom_util.computeLoomFromDrawdown(draft.drawdown, loom_settings, this.ws.selected_origin_option))
    //   }else{
    //     loom = copyLoom(this.tree.getLoom(id));
    //     this.tree.setLoom(this.id, loom);
    //   }


    //   return Promise.all(loom_fns)
    //   .then(loom => {

    //     if(loom.length > 0){
    //       let new_loom = copyLoom(loom[0]);
    //       this.tree.setLoom(this.id, new_loom)
    //     }

    //     let new_loom = this.tree.getLoom(this.id);
    //     return  this.tree.loadDraftData({prev_id: -1, cur_id: this.id}, draft, new_loom, loom_settings, false)
    //   }).then(d => {


    //     this.render.loadNewDraft(draft);
    //     this.weaveRef.onNewDraftLoaded(this.id);
    //     return Promise.resolve(null)

    //     })
    //     .catch(err => {console.error(err)})
    // }
   
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  //  this.simRef.endSimulation();

  }



  public onCloseDrawer(){
    this.weaveRef.unsetSelection();
   // this.simRef.unsetSelection();
    this.closeDrawer.emit({id: this.id, clone_id: this.clone_id, dirty: this.weaveRef.is_dirty});
  }


  /**
   * this is emitted from the detail viewer to indicate that something changed on the draft while it was in detail view. 
   * if this is a generated draft, it now needs to be cloned on window close. If not, an update on the draft chain needs to be called for the original draft
   * @param obj {id: the draft id}
   */
  public designModeChange(e:any) {
   // this.simRef.unsetSelection();
    this.weaveRef.unsetSelection();
  }

  public drawdownUpdated(){

  //  this.simRef.setDirty();
    this.redrawSimulation();
    this.addTimelineState();
    
  }  

  addTimelineState(){


   this.fs.saver.ada(
      'mixer', 
      true,
      this.zs.zoom)
      .then(so => {
        this.state.addMixerHistoryState(so);
      });
  }


  public loomSettingsUpdated(){
    this.saveChanges.emit();
   // this.simRef.setDirty();
    this.redrawSimulation();

  }


  public materialChange() {
   // this.simRef.redrawCurrentSim();
  }
  
  



  
  public redrawSimulation(){
    let draft = this.tree.getDraft(this.id);
    let loom_settings = this.tree.getLoomSettings(this.id);

    //if(!this.viewer_expanded)
    // this.simRef.updateSimulation(draft, loom_settings);
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
   // if(e.id !== undefined) this.simRef.updateSelection(e.start, e.end);
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
  //this.simRef.changeLayerThreshold(this.layer_threshold)
}

warpThresholdChange(){
  console.log("this.warp threshold", this.warp_threshold);
 // this.simRef.changeWarpThreshold(this.warp_threshold)
}

// layerSpacingChange(e: any){
//   console.log("layer spacing change ", this.layer_spacing, e);
//   this.simRef.changeLayerSpacing(this.layer_spacing)
// }



//SIDEBAR SUPPORT: 

drawModeChange(name: string) {
  var obj: any = {};
  obj.name = name;
  obj.target = "draw_modes";
  this.weaveRef.unsetSelection();
}

openActions(){
  if(this.actions_modal != undefined && this.actions_modal.componentInstance != null) return;
 
   this.actions_modal  =  this.dialog.open(ActionsComponent,
     {disableClose: true,
       maxWidth:350, 
       hasBackdrop: false,
       data: {id: this.id}});
 
 
        this.actions_modal.componentInstance.onUpdateWarpShuttles.subscribe(event => { if(this.id !== -1) this.weaveRef.updateWarpShuttles(event)});
        this.actions_modal.componentInstance.onUpdateWarpSystems.subscribe(event => { if(this.id !== -1) this.weaveRef.updateWarpSystems(event)});
        this.actions_modal.componentInstance.onUpdateWeftShuttles.subscribe(event => { if(this.id !== -1) this.weaveRef.updateWeftShuttles(event)});
        this.actions_modal.componentInstance.onUpdateWeftSystems.subscribe(event => { if(this.id !== -1) this.weaveRef.updateWeftSystems(event)});
 

 }

 select(){
  var obj: any = {};
   obj.name = "select";
   obj.target = "design_modes";
   this.dm.selectDesignMode(obj.name, obj.target);
   //this.weaveRef.designModeChange(obj);
}

 


swapEditingStyleClicked(){
  if(this.id == -1) return;

  const loom_type = this.tree.getLoomSettings(this.id);

  if(loom_type.type !== 'jacquard'){
    if(this.dm.getSelectedDesignMode('drawdown_editing_style').value === 'drawdown'){
      this.dm.selectDesignMode('loom', 'drawdown_editing_style')
    }else{
      this.dm.selectDesignMode('drawdown', 'drawdown_editing_style')
    }
    this.weaveRef.unsetSelection();
  }

}

viewChange(e:any){
  console.log("ON VIEW CHANGE ", e)
  if(e.checked){
    this.weaveRef.viewChange('visual');
    this.dm.selectDesignMode('visual', 'view_modes');
  } else{
    this.weaveRef.viewChange('pattern');
    this.dm.selectDesignMode('pattern', 'view_modes');
  }     

}


zoomChange(e:any, source: string){
  e.source = source;
  this.weaveRef.renderChange(e);
}


zoomIn(){
  this.weaveRef.renderChange({source: 'in', val: -1});
}


zoomOut(){
  this.weaveRef.renderChange({source: 'out', val: -1});
}



epiChange(f: NgForm) {

  if(this.id == -1) return;

  const loom_settings = this.tree.getLoomSettings(this.id);

  if(!f.value.epi){
    f.value.epi = 1;
    loom_settings.epi = f.value.epi;
    this.tree.setLoomSettings(this.id, loom_settings);
  } 
  
  //this.loom.overloadEpi(f.value.epi);
  this.ws.epi = f.value.epi;

  this.width = (loom_settings.units =='cm') ? f.value.warps / loom_settings.epi * 10 : f.value.warps / loom_settings.epi;
  f.value.width = this.width;
  
  this.loomSettingsUpdated();
  this.materialChange();


  }










}
