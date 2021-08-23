import { Component, Input, Output, OnInit,EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material';
import { InkService } from '../../../mixer/provider/ink.service';
import { LoomModal } from '../../modal/loom/loom.modal';
import { MaterialModal } from '../../modal/material/material.modal';
import { PatternModal } from '../../modal/pattern/pattern.modal';
import { System } from '../../model/system';
import { DesignmodesService } from '../../provider/designmodes.service';

@Component({
  selector: 'app-quicktools',
  templateUrl: './quicktools.component.html',
  styleUrls: ['./quicktools.component.scss']
})
export class QuicktoolsComponent implements OnInit {

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


  //design mode options
  mode_draw: any;


  weft_systems: Array<System>;
  warp_systems: Array<System>;

  view: string = 'pattern';
  front: boolean = true;


  constructor(private dm: DesignmodesService, private is:InkService , private dialog: MatDialog) { 
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
    mode.children.push({value: obj.id, viewValue:"", icon:"", children:[], selected:false});
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
  this.dialog.open(MaterialModal, {data: {draft: this.draft}});
}

openPatternsModal(){
  this.dialog.open(PatternModal,
    {disableClose: true,
      maxWidth:350, 
      hasBackdrop: false,
      data: {}});

}

openLoomModal(){

  const dialogRef =  this.dialog.open(LoomModal,
    {disableClose: true,
      maxWidth:350, 
      hasBackdrop: false,
      data: {loom: this.loom, draft:this.draft}});


      dialogRef.componentInstance.onChange.subscribe(event => { this.onLoomChange.emit();});

  
      dialogRef.afterClosed().subscribe(result => {
        this.onLoomChange.emit();
       // dialogRef.componentInstance.onChange.removeSubscription();
    });
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

}
