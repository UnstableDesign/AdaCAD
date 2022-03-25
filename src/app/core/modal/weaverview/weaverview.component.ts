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


  /**
   * assumes layers
   * hows all weft systems placed upon a given layer
   * @param id 
   */
  showOnly(id){

    //need to look down the warps on this system and look for alternating values
    //if there is an alternating value, then that weft system is part of this. 
    //hilde the other warps
    this.collective_systems.forEach(data => {
      if(data.id === id){
        if(data.warp !== null){
          data.warp.visible = true;
          this.onShowWarpSystem.emit({systemId: data.id});
        }  
      
      }else{
        if(data.warp !== null){
          this.onHideWarpSystem.emit({systemId: data.id});
          data.warp.visible = false;
        }  
       
      }
    });


      //for each system
      this.collective_systems.forEach(cs => {
        const  system_id = cs.id;

        const sys_draft:Array<Array<boolean>> = [];
        this.draft.pattern.forEach((row, i) => {
          if(this.draft.rowSystemMapping[i] !== system_id) return;
          sys_draft.push([]);
          row.forEach((col, j) => {
            if(this.draft.colSystemMapping[j] !== id) return;
              sys_draft[sys_draft.length-1].push(this.draft.pattern[i][j].getHeddle());
          });
        });


        if(sys_draft.length == 0){
          const sys = this.collective_systems.find(el => el.id == system_id);
          if(sys.weft !== null){
            sys.weft.visible = false;
            this.onHideWeftSystem.emit({systemId: sys.id});
          }
        }else{
          //now we have a draft that includes only the layer id and the system id disclosed
          const first_val:boolean = sys_draft[0][0];
          let found: boolean = false; 
          for(let i = 0; i < sys_draft.length && !found; i++){
            const diff = sys_draft[i].find(el => el !== first_val);
            if(diff !== undefined){
              found = true;
              const sys = this.collective_systems.find(el => el.id == system_id);
              if(sys.weft !== null){
              sys.weft.visible = true;
              this.onShowWeftSystem.emit({systemId: sys.id});
              }
            }
          }

          if(!found){
            const sys = this.collective_systems.find(el => el.id == system_id);
            if(sys.weft !== null){
            sys.weft.visible = false;
            this.onHideWeftSystem.emit({systemId: system_id});
            }
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
