import { Component, Input, Output, OnInit,EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { WeaverViewComponent } from '../modal/weaverview/weaverview.component';
import { MixerViewComponent } from '../../mixer/modal/mixerview/mixerview.component';
import { OpsComponent } from '../../mixer/modal/ops/ops.component';
import { InkService } from '../../mixer/provider/ink.service';
import { LoomModal } from '../modal/loom/loom.modal';
import { MaterialModal } from '../modal/material/material.modal';
import { PatternModal } from '../modal/pattern/pattern.modal';
import { System } from '../model/system';
import { DesignmodesService } from '../provider/designmodes.service';
import { ActionsComponent } from '../modal/actions/actions.component';
import { InitModal } from '../../core/modal/init/init.modal';
import { MaterialsService } from '../provider/materials.service';
import { MlModal } from '../modal/ml/ml.modal';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  @Input() draft;
  @Input() loom;
  @Input() timeline;
  @Input() render;
  @Input() source;

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
  @Output() onLoomChange: any = new EventEmitter();
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


  
  //design mode options
  mode_draw: any;


  weft_systems: Array<System>;
  warp_systems: Array<System>;

  view: string = 'pattern';
  front: boolean = true;

  view_modal: MatDialogRef<MixerViewComponent, any>;
  op_modal: MatDialogRef<OpsComponent, any>;
  weaver_view_modal: MatDialogRef<WeaverViewComponent, any>;
  actions_modal: MatDialogRef<ActionsComponent, any>;
  materials_modal: MatDialogRef<MaterialModal, any>;
  patterns_modal: MatDialogRef<PatternModal, any>;
  equipment_modal: MatDialogRef<LoomModal, any>;
  upload_modal: MatDialogRef<InitModal, any>;
  ml_modal: MatDialogRef<MlModal, any>;


  constructor(
    private dm: DesignmodesService, 
    private is:InkService ,
    private ms: MaterialsService, 
    private dialog: MatDialog) { 
    this.view = this.dm.getSelectedDesignMode('view_modes').value;

  }

  ngOnInit() {
    
    if(this.source == 'weaver'){
    this.front = this.render.view_front;
    this.weft_systems = this.draft.weft_systems;
    this.warp_systems = this.draft.warp_systems;
    }
  }

  select(){
    var obj: any = {};
     obj.name = "select";
     obj.target = "design_modes";
     this.dm.selectDesignMode(obj.name, obj.target);
     this.onDesignModeChange.emit(obj);
  }

  engageMLMode() {
    if(this.ml_modal != undefined && this.ml_modal.componentInstance != null) return;
    console.log('engaged ML mode');

    this.ml_modal =  this.dialog.open(MlModal,
      {
        maxWidth:350, 
        hasBackdrop: false,
        data: {draft:this.draft}});
  
  
        this.ml_modal.componentInstance.onChange.subscribe(event => { this.onMLChange.emit();});
  
    
      //   this.materials_modal.afterClosed().subscribe(result => {
      //     this.onMLChange.emit();
      // });

  }

  closeWeaverModals(){
    if(this.materials_modal != undefined && this.materials_modal.componentInstance != null) this.materials_modal.close();
    if(this.equipment_modal != undefined && this.equipment_modal.componentInstance != null) this.equipment_modal.close();
    if(this.patterns_modal != undefined && this.patterns_modal.componentInstance != null) this.patterns_modal.close();
    if(this.actions_modal != undefined && this.actions_modal.componentInstance != null) this.actions_modal.close();
    if(this.weaver_view_modal != undefined && this.weaver_view_modal.componentInstance != null) this.weaver_view_modal.close();
    if(this.ml_modal != undefined && this.ml_modal.componentInstance != null) this.ml_modal.close();
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

openPatternsModal(){

  if(this.patterns_modal != undefined && this.patterns_modal.componentInstance != null) return;

  this.patterns_modal =  this.dialog.open(PatternModal,
    {disableClose: true,
      maxWidth:350, 
      hasBackdrop: false,
      data: {}});

}

openLoomModal(){

  if(this.equipment_modal != undefined && this.equipment_modal.componentInstance != null) return;


  this.equipment_modal =   this.dialog.open(LoomModal,
    {disableClose: true,
      maxWidth:350, 
      hasBackdrop: false,
      data: {loom: this.loom, draft:this.draft}});


      this.equipment_modal.componentInstance.onChange.subscribe(event => { this.onLoomChange.emit();});

  
      this.equipment_modal.afterClosed().subscribe(result => {
        this.onLoomChange.emit();
       // dialogRef.componentInstance.onChange.removeSubscription();
    });
}


openOps(){

  if(this.op_modal != undefined && this.op_modal.componentInstance != null) return;
  
  this.op_modal =  this.dialog.open(OpsComponent,
    {disableClose: true,
      maxWidth:350, 
      hasBackdrop: false,
      data: {loom: this.loom, draft:this.draft}});


      this.op_modal.componentInstance.onOperationAdded.subscribe(event => { this.onOperationAdded.emit(event)});
      this.op_modal.componentInstance.onImport.subscribe(event => { this.onImport.emit(event)});

  
      this.op_modal.afterClosed().subscribe(result => {
        //this.onLoomChange.emit();
       // dialogRef.componentInstance.onChange.removeSubscription();
    });
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

openMixerView(){
  if(this.view_modal != undefined && this.view_modal.componentInstance != null) return;

  this.view_modal  =  this.dialog.open(MixerViewComponent,
    {disableClose: true,
      maxWidth:350, 
      hasBackdrop: false,
      data: {zoom: 5, default_cell_size: 5}});


       this.view_modal.componentInstance.onViewPortMove.subscribe(event => { this.onViewPortMove.emit(event)});
       this.view_modal.componentInstance.onZoomChange.subscribe(event => { this.onZoomChange.emit(event)});

  
      this.view_modal.afterClosed().subscribe(result => {
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
      data: {draft: this.draft}});


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
