import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';

import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/overlay';
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Subject } from 'rxjs';
import { createCell } from '../core/model/cell';
import { Draft, Drawdown, Loom, LoomSettings } from '../core/model/datatypes';
import { defaults, draft_pencil } from '../core/model/defaults';
import { copyDraft, getDraftName, warps, wefts } from '../core/model/drafts';
import { copyLoom, getLoomUtilByType, isFrame } from '../core/model/looms';
import { DesignmodesService } from '../core/provider/designmodes.service';
import { FileService } from '../core/provider/file.service';
import { MaterialsService } from '../core/provider/materials.service';
import { StateService } from '../core/provider/state.service';
import { SystemsService } from '../core/provider/systems.service';
import { TreeService } from '../core/provider/tree.service';
import { WorkspaceService } from '../core/provider/workspace.service';
import { ZoomService } from '../core/provider/zoom.service';
import { RepeatsComponent } from './repeats/repeats.component';
import { DraftComponent } from './draft/draft.component';
import { RenderService } from './provider/render.service';
import { MaterialModal } from '../core/modal/material/material.modal';



@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {
 
  /**
   * The reference to the weave directive.
   * @property {WeaveDirective}
   */
  @ViewChild(DraftComponent, {static: true}) weaveRef;
  

  @Output() closeDrawer: any = new EventEmitter();
  @Output() saveChanges: any = new EventEmitter();
  @Output() redrawViewer: any = new EventEmitter();
  @Output() updateMixer: any = new EventEmitter();
  @Output() createNewDraftOnMixer: any = new EventEmitter();
  @Output() onFocusView: any = new EventEmitter();
  @Output() onCollapseView: any = new EventEmitter();


  id: number = -1;  

  actions_modal: MatDialogRef<RepeatsComponent, any>;

  copy: Drawdown;

  selected;

  collapsed: boolean = false;

  dims:any;

  draftelement:any;

  draftname: string = "";

  scrollingSubscription: any;

  warp_locked: boolean = false;


  layer_threshold: number = 2;

  warp_threshold: number = 3;

  layer_spacing: number = 10;

  viewer_expanded: boolean = false;

  clone_id: number = -1;

  width: number = 10;

  epi: number = 10;
  units: string = 'cm';
  type: string = 'jacquard';
  draw_modes: any = [];
  selected_material_id: any = -1;

  current_view = 'draft';


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

    // this.scrollingSubscription = this.scroll
    //       .scrolled()
    //       .subscribe((data: any) => {
    //         this.onWindowScroll(data);
    // });


    this.copy = [[createCell(false)]];
    this.draw_modes = draft_pencil;
  }

  // private onWindowScroll(data: CdkScrollable) {
  //   const scrollTop:number = data.measureScrollOffset("top");
  //   const scrollLeft:number = data.measureScrollOffset("left");
  //   this.weaveRef.reposition(scrollTop, scrollLeft);
  // }
  
  ngOnInit(){

    this.epi = defaults.epi;
    this.units =defaults.units;
    this.type = defaults.loom_type;



  }

  ngAfterViewInit() {



  
  }





  clearAll(){
    console.log("Clearing Detail Viewer ");
    this.id == -1;
    this.weaveRef.id == -1;
    this.weaveRef.clearAll();
  }


  expandViewer(){
    this.viewer_expanded = !this.viewer_expanded;
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

  centerView(){
    if(this.id !== -1){
      
      const loom_settings = this.tree.getLoomSettings(this.id);
      const draft = this.tree.getDraft(this.id);
      const loom = this.tree.getLoom(this.id);
      this.weaveRef.computeAndSetScale(draft, loom, loom_settings);
      
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


      this.id = id;
      this.clone_id = -1;
      const draft = this.tree.getDraft(id);
      const loom_settings = this.tree.getLoomSettings(id);
      this.type = loom_settings.type;

      if(this.type == 'jacquard' && this.dm.cur_draft_edit_source == 'loom'){
        this.dm.selectDraftEditSource('draft');
      }

      this.draftname = getDraftName(draft)
      this.render.loadNewDraft(draft);
      this.weaveRef.onNewDraftLoaded(id);
      return Promise.resolve(null);
    
   
  }

  ngOnDestroy(): void {

  //  this.simRef.endSimulation();

  }



  public onCloseDrawer(){
    this.weaveRef.unsetSelection();
   // this.simRef.unsetSelection();
    this.closeDrawer.emit({id: this.id, clone_id: this.clone_id, dirty: this.weaveRef.is_dirty});
  }


  public designModeChange(e:any) {
   // this.simRef.unsetSelection();
    console.log("Selecting mode ", e)
    this.weaveRef.unsetSelection();

  }

  public drawdownUpdated(){


    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);


    this.weaveRef.render.loadNewDraft(draft);
    this.weaveRef.redraw(draft, loom, loom_settings, {
      drawdown: true, 
      loom:true, 
      warp_systems: true, 
      weft_systems: true, 
      warp_materials: true,
      weft_materials:true
    });

    this.redrawViewer.emit();
    this.addTimelineState();
    
  }  

  
  addTimelineState(){

   this.fs.saver.ada()
      .then(so => {
        this.state.addMixerHistoryState(so);
      });
  }


  public loomSettingsUpdated(){

    if(this.id == -1) return;

    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    this.weaveRef.redrawLoom(draft, loom, loom_settings );
    this.weaveRef.isFrame = isFrame(loom_settings);
    this.saveChanges.emit();
    this.redrawSimulation();

  }


  public materialChange() {
   
    this.redrawViewer.emit();

  }

  unsetSelection(){
      this.weaveRef.unsetSelection();
  }
  
  

  public redrawSimulation(){

    this.redrawViewer.emit();

  }

  focusUIView(){
    this.onFocusView.emit();
  }

  collapseUIView(){
    this.onCollapseView.emit();
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

  // public globalLoomChange(e: any){

  //   const dn = this.tree.getDraftNodes();
  //   dn.forEach(node => {
  //     const draft = this.tree.getDraft(node.id)
  //     const loom = this.tree.getLoom(node.id)
  //     const loom_settings = this.tree.getLoomSettings(node.id);
  //     (<SubdraftComponent> node.component).draft_rendering.drawDraft(draft);
  //     if(node.id == this.id){
  //       this.weaveRef.redraw(draft, loom, loom_settings, {
  //         drawdown: true, 
  //         loom:true, 
  //         warp_systems: true, 
  //         weft_systems: true, 
  //         warp_materials: true,
  //         weft_materials:true
  //       });
  //     } 

  //   });


  // }

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
  this.dm.selectDraftEditingMode('draw');
  this.dm.selectPencil(name);
  this.weaveRef.unsetSelection();
}

openActions(){
  if(this.actions_modal != undefined && this.actions_modal.componentInstance != null) return;
 
   this.actions_modal  =  this.dialog.open(RepeatsComponent,
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
   this.dm.selectDraftEditingMode('select');
   //this.weaveRef.designModeChange(obj);
}

openMaterials() {

const material_modal = this.dialog.open(MaterialModal, {data: {}});
material_modal.componentInstance.onMaterialChange.subscribe(event => {
  console.log("MATERIAL CHANGED");
  //redraw all

});
}

 


viewChange(name:any){
    this.current_view = name;
    this.weaveRef.viewChange(name);

}

renderChange(){
  this.weaveRef.renderChange();
}



drawWithMaterial(material_id: number){
  this.dm.selectDraftEditingMode('draw');
  this.dm.selectPencil('material');
  this.selected_material_id = material_id;
  this.weaveRef.selected_material_id = material_id;
}


swapEditingStyleClicked(){
  if(this.id == -1) return;

  if(this.type !== 'jacquard'){
    if(this.dm.isSelectedDraftEditSource('drawdown')){
      this.dm.selectDraftEditSource('loom');
    }else{
      this.dm.selectDraftEditSource('drawdown')
    }
  }else{

  }

}




}
