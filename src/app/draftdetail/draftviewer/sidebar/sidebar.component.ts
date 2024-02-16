import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { BlankdraftModal } from '../../../core/modal/blankdraft/blankdraft.modal';
import { Draft, LoomSettings } from '../../../core/model/datatypes';
import { DesignmodesService } from '../../../core/provider/designmodes.service';
import { MaterialsService } from '../../../core/provider/materials.service';
import { TreeService } from '../../../core/provider/tree.service';
import { InkService } from '../../../mixer/provider/ink.service';
import { ActionsComponent } from '../../actions/actions.component';
import { RenderService } from '../../provider/render.service';


@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})


export class SidebarComponent implements OnInit {


  @Input() timeline;
  @Input() id;
  @Input() expanded;

  @Output() onUndo: any = new EventEmitter();
  @Output() onRedo: any = new EventEmitter();
  @Output() onDesignModeChange: any = new EventEmitter();
  @Output() onZoomChange: any = new EventEmitter();
  @Output() onViewChange: any = new EventEmitter();
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
  @Output() closeDrawer: any = new EventEmitter();
  @Output() onExpand: any = new EventEmitter();

  
  draft:Draft;
  loom_settings:LoomSettings;

  //design mode options
  mode_draw: any;

  view: string = 'pattern';
  front: boolean = true;

  actions_modal: MatDialogRef<ActionsComponent, any>;


  constructor(
    public dm: DesignmodesService, 
    private is:InkService,
    private tree: TreeService,
    public ms: MaterialsService, 
    private dialog: MatDialog,
    public render : RenderService) { 
    this.view = this.dm.getSelectedDesignMode('view_modes').value;

  }

  ngOnInit() {

    this.draft = this.tree.getDraft(this.id);
    this.loom_settings = this.tree.getLoomSettings(this.id);
    this.front = this.render.view_front;

  }

  expand(){
    this.onExpand.emit();
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


  zoomIn(){
    this.onZoomChange.emit({source: 'in', val: -1});
  }


  zoomOut(){
    this.onZoomChange.emit({source: 'out', val: -1});
  }

  // viewFront(e:any, value:any, source: string){
  //   e.source = source;
  //   e.value = !value;
  //   this.onViewFront.emit(e);
  // }

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











// openWeaverView(){
//   if(this.weaver_view_modal != undefined && this.weaver_view_modal.componentInstance != null) return;

//   this.weaver_view_modal  =  this.dialog.open(WeaverViewComponent,
//     {disableClose: true,
//       maxWidth:350, 
//       hasBackdrop: false,
//       data: {
//         render: this.render,
//         draft: this.draft}});

     
//        this.weaver_view_modal.componentInstance.onZoomChange.subscribe(event => { this.onZoomChange.emit(event)});
//        this.weaver_view_modal.componentInstance.onViewChange.subscribe(event => { this.onViewChange.emit(event)});
//        this.weaver_view_modal.componentInstance.onViewFront.subscribe(event => { this.onViewFront.emit(event)});
//        this.weaver_view_modal.componentInstance.onShowWarpSystem.subscribe(event => { this.onShowWarpSystem.emit(event)});
//        this.weaver_view_modal.componentInstance.onHideWarpSystem.subscribe(event => { this.onHideWarpSystem.emit(event)});
//        this.weaver_view_modal.componentInstance.onShowWeftSystem.subscribe(event => { this.onShowWeftSystem.emit(event)});
//        this.weaver_view_modal.componentInstance.onHideWeftSystem.subscribe(event => { this.onHideWeftSystem.emit(event)});

  
//       this.weaver_view_modal.afterClosed().subscribe(result => {
//         //this.onLoomChange.emit();
//        // dialogRef.componentInstance.onChange.removeSubscription();
//     });
// }


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


  addNote(){
    this.onNoteCreate.emit();
  }

}
