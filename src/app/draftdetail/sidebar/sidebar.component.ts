import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { defaults } from '../../core/model/defaults';
import { BlankdraftModal } from '../../core/modal/blankdraft/blankdraft.modal';
import { Draft, LoomSettings } from '../../core/model/datatypes';
import { DesignmodesService } from '../../core/provider/designmodes.service';
import { MaterialsService } from '../../core/provider/materials.service';
import { TreeService } from '../../core/provider/tree.service';
import { InkService } from '../../mixer/provider/ink.service';
import { ActionsComponent } from '../actions/actions.component';
import { RenderService } from '../provider/render.service';


@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})


export class SidebarComponent implements OnInit {


  @Input() timeline;
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
  @Output() onViewPortMove: any = new EventEmitter();
  @Output() onUpdateWarpSystems: any = new EventEmitter();
  @Output() onUpdateWeftSystems: any = new EventEmitter();
  @Output() onUpdateWarpShuttles: any = new EventEmitter();
  @Output() onUpdateWeftShuttles: any = new EventEmitter();
  @Output() onMaterialChange: any = new EventEmitter();
  @Output() closeDrawer: any = new EventEmitter();
  @Output() swapEditingStyle: any = new EventEmitter();

  
  draft:Draft;
  loom_settings:LoomSettings;

  //design mode options
  mode_draw: any;

  view: string = 'pattern';
  front: boolean = true;
  type: string = 'jacquard';

  actions_modal: MatDialogRef<ActionsComponent, any>;
  active_id: number = -1;

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

    this.type  = defaults.loom_type;
    this.front = this.render.view_front;

  }




  drawModeChange(name: string) {
     var obj: any = {};
     obj.name = name;
     obj.target = "draw_modes";
     this.dm.selectDesignMode(obj.name, obj.target);
     this.onDesignModeChange.emit(obj);
  }

  drawWithMaterial(material_id: number){
    var obj: any = {};
    obj.name = 'material';
    obj.target = 'draw_modes';
    obj.id = material_id;

    this.dm.selectDesignMode(obj.name, obj.target);
    const mode = this.dm.getDesignMode(obj.name, obj.target);
    mode.children = [];
    mode.children.push({value: obj.id, viewValue:"", icon:"", children:[], selected:false});
    this.onDesignModeChange.emit(obj);
  }


  // viewFront(e:any, value:any, source: string){
  //   e.source = source;
  //   e.value = !value;
  //   this.onViewFront.emit(e);
  // }

 

    
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



}
