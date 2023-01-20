import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { InitModal } from '../../core/modal/init/init.modal';
import { TreeService } from '../../core/provider/tree.service';
import { MixerViewComponent } from '../../mixer/modal/mixerview/mixerview.component';
import { OpsComponent } from '../../mixer/modal/ops/ops.component';
import { InkService } from '../../mixer/provider/ink.service';
import { ActionsComponent } from '../modal/actions/actions.component';
import { BlankdraftModal } from '../modal/blankdraft/blankdraft.modal';
import { LoomModal } from '../modal/loom/loom.modal';
import { MaterialModal } from '../modal/material/material.modal';
import { WeaverViewComponent } from '../modal/weaverview/weaverview.component';
import { Draft, LoomSettings } from '../model/datatypes';
import { DesignmodesService } from '../provider/designmodes.service';
import { MaterialsService } from '../provider/materials.service';
import { StateService } from '../provider/state.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {


  @Input() timeline;
  @Input() render;
  @Input() source;
  @Input() id;

  @Output() onUndo: any = new EventEmitter();
  @Output() onRedo: any = new EventEmitter();
  @Output() onDesignModeChange: any = new EventEmitter();
  @Output() onZoomChange: any = new EventEmitter();
  @Output() onViewChange: any = new EventEmitter();
  @Output() onViewFront: any = new EventEmitter();
  @Output() onShowWarpSystem: any = new EventEmitter();
  @Output() onHideWarpSystem: any = new EventEmitter();
  @Output() onShowWeftSystem: any = new EventEmitter();
  @Output() onHideWeftSystem: any = new EventEmitter();
  @Output() onLocalLoomNeedsRedraw: any = new EventEmitter();
  @Output() onGlobalLoomChange: any = new EventEmitter();
  @Output() onOperationAdded: any = new EventEmitter();
  @Output() onImport: any = new EventEmitter();
  @Output() onViewPortMove: any = new EventEmitter();
  @Output() onUpdateWarpSystems: any = new EventEmitter();
  @Output() onUpdateWeftSystems: any = new EventEmitter();
  @Output() onUpdateWarpShuttles: any = new EventEmitter();
  @Output() onUpdateWeftShuttles: any = new EventEmitter();
  @Output() onMaterialChange: any = new EventEmitter();
  @Output() onNoteCreate: any = new EventEmitter();
  @Output() onMLChange: any = new EventEmitter();
  @Output() onNewDraftCreated: any = new EventEmitter();

  
  draft:Draft;
  loom_settings:LoomSettings;

  //design mode options
  mode_draw: any;

  view: string = 'pattern';
  front: boolean = true;

  view_modal: MatDialogRef<MixerViewComponent, any>;
  op_modal: MatDialogRef<OpsComponent, any>;
  weaver_view_modal: MatDialogRef<WeaverViewComponent, any>;
  actions_modal: MatDialogRef<ActionsComponent, any>;
  materials_modal: MatDialogRef<MaterialModal, any>;
  equipment_modal: MatDialogRef<LoomModal, any>;
  global_loom_modal: MatDialogRef<LoomModal, any>;
  upload_modal: MatDialogRef<InitModal, any>;


  constructor(
    private dm: DesignmodesService, 
    private is:InkService,
    private tree: TreeService,
    private ss: StateService,
    private ms: MaterialsService, 
    private dialog: MatDialog) { 
    this.view = this.dm.getSelectedDesignMode('view_modes').value;

  }

  ngOnInit() {

    this.draft = this.tree.getDraft(this.id);
    this.loom_settings = this.tree.getLoomSettings(this.id);
    
    if(this.source == 'weaver'){
    this.front = this.render.view_front;
    }
  }

  select(){
    var obj: any = {};
     obj.name = "select";
     obj.target = "design_modes";
     this.dm.selectDesignMode(obj.name, obj.target);
     this.onDesignModeChange.emit(obj);
  }

  createNewDraft(){

    const dialogRef = this.dialog.open(BlankdraftModal, {
    });

    dialogRef.afterClosed().subscribe(obj => {
      // if(loadResponse !== undefined) this.onLoadNewFile.emit(loadResponse);
      if(obj !== undefined && obj !== null) this.onNewDraftCreated.emit(obj);
   });
  }


  closeWeaverModals(){
    if(this.materials_modal != undefined && this.materials_modal.componentInstance != null) this.materials_modal.close();
    if(this.equipment_modal != undefined && this.equipment_modal.componentInstance != null) this.equipment_modal.close();
    if(this.actions_modal != undefined && this.actions_modal.componentInstance != null) this.actions_modal.close();
    if(this.weaver_view_modal != undefined && this.weaver_view_modal.componentInstance != null) this.weaver_view_modal.close();
  }

  shapeChange(name:string){
    var obj: any = {};
    obj.name = name;
    obj.target = "shapes";
    console.log('setting shape', name)
    this.dm.selectDesignMode(obj.name, obj.target);
    this.onDesignModeChange.emit(obj);
  }

  drawModeChange(name: string) {
     var obj: any = {};
     obj.name = name;
     obj.target = "draw_modes";
     this.dm.selectDesignMode(obj.name, obj.target);
     this.onDesignModeChange.emit(obj);
  }

  drawWithMaterial(material_id: number){
    console.log("draw with material", material_id)
    var obj: any = {};
    obj.name = 'material';
    obj.target = 'draw_modes';
    obj.id = material_id;

    this.dm.selectDesignMode(obj.name, obj.target);
    const mode = this.dm.getDesignMode(obj.name, obj.target);
    mode.children = [];
    mode.children.push({value: obj.id, viewValue:"", icon:"", children:[], selected:false});
    console.log("children", mode.children);
    this.onDesignModeChange.emit(obj);
  }

  zoomChange(e:any, source: string){
    e.source = source;
    this.onZoomChange.emit(e);
  }



  viewFront(e:any, value:any, source: string){
    e.source = source;
    e.value = !value;
    this.onViewFront.emit(e);
  }

  viewChange(e:any){
    if(e.checked){
      this.onViewChange.emit('visual');
      this.dm.selectDesignMode('visual', 'view_modes');
    } else{
      this.onViewChange.emit('pattern');
      this.dm.selectDesignMode('pattern', 'view_modes');
    }     

  }

    
 visibleButton(id, visible, type) {
  console.log("called", id, visible, type);
  if(type == "weft"){
    if (visible) {
      this.onShowWeftSystem.emit({systemId: id});
    } else {
      this.onHideWeftSystem.emit({systemId: id});
    }
  }else{
    if (visible) {
      this.onShowWarpSystem.emit({systemId: id});
    } else {
      this.onHideWarpSystem.emit({systemId: id});
    }
  }

}

openMaterialsModal(){

  if(this.materials_modal != undefined && this.materials_modal.componentInstance != null) return;

  this.materials_modal =  this.dialog.open(MaterialModal,
    {disableClose: true,
      maxWidth:350, 
      hasBackdrop: false,
      data: {draft:this.draft}});


      this.materials_modal.componentInstance.onChange.subscribe(event => { this.onMaterialChange.emit();});

  
      this.materials_modal.afterClosed().subscribe(result => {
        this.onMaterialChange.emit();
    });


}


  upload(){
    //need to handle this and load the file somehow
    if(this.upload_modal != undefined && this.upload_modal.componentInstance != null) return;


    this.upload_modal = this.dialog.open(InitModal, {
      data: {source: 'import'}
    });

    this.upload_modal.afterClosed().subscribe(result => {
      if(result !== undefined) this.onImport.emit(result);
      

   });


  }


openLoomModal(){

  if(this.equipment_modal != undefined && this.equipment_modal.componentInstance != null) return;


  this.equipment_modal =   this.dialog.open(LoomModal,
    {disableClose: true,
      maxWidth:350, 
      hasBackdrop: false,
      data: {id: this.id, type: "local"}});


      this.equipment_modal.componentInstance.localLoomNeedsRedraw.subscribe(event => { 
        this.onLocalLoomNeedsRedraw.emit();
      });

  
    //   this.equipment_modal.afterClosed().subscribe(result => {
    //     this.onLoomChange.emit();
    //    // dialogRef.componentInstance.onChange.removeSubscription();
    // });
}


/***
 * In this instance, the sidebar is opened from the mixer and reports events back to the mixer exclusively
 * needs a way to trigger re-draw of any open detail views
 */
openGlobalLoomModal(){

  if(this.global_loom_modal != undefined && this.global_loom_modal.componentInstance != null) return;


  this.global_loom_modal =   this.dialog.open(LoomModal,
    {disableClose: true,
      maxWidth:600, 
      hasBackdrop: false,
      data: {id: this.id, type: "global"}});

      this.global_loom_modal.componentInstance.onGlobalLoomChange.subscribe(event => { 
        this.onGlobalLoomChange.emit();
      });

      

    //   this.global_loom_modal.afterClosed().subscribe(result => {
    //     this.onGlobalLoomChange.emit();
    // });
}


openOps(){

  if(this.op_modal != undefined && this.op_modal.componentInstance != null) return;
  
  this.op_modal =  this.dialog.open(OpsComponent,
    {disableClose: true,
      hasBackdrop: false,
      data: {id: this.id}});


      this.op_modal.componentInstance.onOperationAdded.subscribe(event => { this.onOperationAdded.emit(event)});
      this.op_modal.componentInstance.onImport.subscribe(event => { this.onImport.emit(event)});

  
      this.op_modal.afterClosed().subscribe(result => {
        //this.onLoomChange.emit();
       // dialogRef.componentInstance.onChange.removeSubscription();
    });
}

addOperation(name: string){
  this.onOperationAdded.emit(name)
}

openWeaverView(){
  if(this.weaver_view_modal != undefined && this.weaver_view_modal.componentInstance != null) return;

  this.weaver_view_modal  =  this.dialog.open(WeaverViewComponent,
    {disableClose: true,
      maxWidth:350, 
      hasBackdrop: false,
      data: {
        render: this.render,
        draft: this.draft}});

     
       this.weaver_view_modal.componentInstance.onZoomChange.subscribe(event => { this.onZoomChange.emit(event)});
       this.weaver_view_modal.componentInstance.onViewChange.subscribe(event => { this.onViewChange.emit(event)});
       this.weaver_view_modal.componentInstance.onViewFront.subscribe(event => { this.onViewFront.emit(event)});
       this.weaver_view_modal.componentInstance.onShowWarpSystem.subscribe(event => { this.onShowWarpSystem.emit(event)});
       this.weaver_view_modal.componentInstance.onHideWarpSystem.subscribe(event => { this.onHideWarpSystem.emit(event)});
       this.weaver_view_modal.componentInstance.onShowWeftSystem.subscribe(event => { this.onShowWeftSystem.emit(event)});
       this.weaver_view_modal.componentInstance.onHideWeftSystem.subscribe(event => { this.onHideWeftSystem.emit(event)});

  
      this.weaver_view_modal.afterClosed().subscribe(result => {
        //this.onLoomChange.emit();
       // dialogRef.componentInstance.onChange.removeSubscription();
    });
}


openActions(){
 if(this.actions_modal != undefined && this.actions_modal.componentInstance != null) return;

  this.actions_modal  =  this.dialog.open(ActionsComponent,
    {disableClose: true,
      maxWidth:350, 
      hasBackdrop: false,
      data: {id: this.id}});


       this.actions_modal.componentInstance.onUpdateWarpShuttles.subscribe(event => { this.onUpdateWarpShuttles.emit(event)});
       this.actions_modal.componentInstance.onUpdateWarpSystems.subscribe(event => { this.onUpdateWarpSystems.emit(event)});
       this.actions_modal.componentInstance.onUpdateWeftShuttles.subscribe(event => { this.onUpdateWeftShuttles.emit(event)});
       this.actions_modal.componentInstance.onUpdateWeftSystems.subscribe(event => { this.onUpdateWeftSystems.emit(event)});

  
    //   this.view_modal.afterClosed().subscribe(result => {
    //     //this.onLoomChange.emit();
    //    // dialogRef.componentInstance.onChange.removeSubscription();
    // });
}

  


  undoClicked(e:any) {
    this.onUndo.emit();
  }

  redoClicked(e:any) {
    this.onRedo.emit();
  }

  inkChanged(value:string){
    console.log("changing to", value);
    this.is.select(value);
    //this.onInkChange.emit(e.target.name);
  }


  designModeChange(name: string) {
    console.log("design mode change", name);
    this.dm.selectDesignMode(name, 'design_modes');
    this.onDesignModeChange.emit(name);
  }

  updateViewPort(data: any){

    if(this.view_modal != undefined && this.view_modal.componentInstance != null){
      this.view_modal.componentInstance.updateViewPort(data);
    }
  }

  addNote(){
    this.onNoteCreate.emit();
  }

}
