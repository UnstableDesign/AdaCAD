import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { util } from '@tensorflow/tfjs';
import { Draft } from '../../../core/model/draft';
import { Render } from '../../../core/model/render';
import { System } from '../../model/system';
import utilInstance from '../../model/util';
import { DesignmodesService } from '../../provider/designmodes.service';
import { SystemsService } from '../../provider/systems.service';

@Component({
  selector: 'app-weaverview',
  templateUrl: './weaverview.component.html',
  styleUrls: ['./weaverview.component.scss']
})
export class WeaverViewComponent implements OnInit {
  
  // zoom:number;
  // @Input() view;
  // @Input() front;
  // @Input() view_modes;

  render:Render;
  draft: Draft;
  front: boolean = true;

  weft_systems: Array<System>;
  warp_systems: Array<System>;
  collective_systems: Array<{id: number, weft: System, warp: System}> = [];

  @Output() onViewChange: any = new EventEmitter();
  @Output() onViewFront: any = new EventEmitter();
  @Output() onZoomChange: any = new EventEmitter();
  @Output() onShowWarpSystem: any = new EventEmitter();
  @Output() onHideWarpSystem: any = new EventEmitter();
  @Output() onShowWeftSystem: any = new EventEmitter();
  @Output() onHideWeftSystem: any = new EventEmitter();


 constructor(
   public ss: SystemsService,
   private dm: DesignmodesService, 
   private dialog: MatDialog,
  private dialogRef: MatDialogRef<WeaverViewComponent>,
           @Inject(MAT_DIALOG_DATA) public data: any) { 

            this.render = data.render;
            this.draft = data.draft;

            console.log("unique rows", utilInstance.filterToUniqueValues(this.draft.rowSystemMapping))

            this.weft_systems = utilInstance.filterToUniqueValues(this.draft.rowSystemMapping).map(el => this.ss.getWeftSystem(el));
            this.warp_systems = utilInstance.filterToUniqueValues(this.draft.colSystemMapping).map(el => this.ss.getWarpSystem(el));;
            
            this.weft_systems.forEach(system => {
              this.collective_systems.push({id: system.id, weft: system, warp: null});
            })

            this.warp_systems.forEach(system => {
              const ndx = this.collective_systems.findIndex(el => el.id === system.id);
              if(ndx !== -1) this.collective_systems[ndx].warp = system;
              else this.collective_systems.push({id: system.id, weft: null, warp: system});
            })



  }
 
  ngOnInit() {
  }

  close(){
    this.dialogRef.close(null);
  }

  viewChange(e:any){
    console.log(e);
    if(e.checked)  this.onViewChange.emit('visual');
    else     this.onViewChange.emit('pattern');

  }

  zoomChange(e:any, source: string){
    e.source = source;
    this.onZoomChange.emit(e);
  }

  toggleCrossingView(){
    this.onViewChange.emit('crossing');
  }

  viewFront(e:any, value:any, source: string){
    e.source = source;
    e.value = !value;
    this.onViewFront.emit(e);
  }

  showOnly(id){
    
    this.collective_systems.forEach(data => {
      if(data.id === id){
        if(data.warp !== null){
          data.warp.visible = true;
          this.onShowWarpSystem.emit({systemId: data.id});
        }  
        if(data.weft !== null){
          data.weft.visible = true;
          this.onShowWeftSystem.emit({systemId: data.id});
        }  
      }else{
        if(data.warp !== null){
          this.onHideWarpSystem.emit({systemId: data.id});
          data.warp.visible = false;
        }  
        if(data.weft !== null){
          data.weft.visible = false;
          this.onHideWeftSystem.emit({systemId: data.id});
        }  
      }
    });

  }
  
 visibleButton(id, visible, type) {
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


}
