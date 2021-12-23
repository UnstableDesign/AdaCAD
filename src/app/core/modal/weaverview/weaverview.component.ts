import { D } from '@angular/cdk/keycodes';
import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Draft } from '../../../core/model/draft';
import { Render } from '../../../core/model/render';
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

  @Output() onViewChange: any = new EventEmitter();
  @Output() onViewFront: any = new EventEmitter();
  @Output() onZoomChange: any = new EventEmitter();
  @Output() onShowWarpSystem: any = new EventEmitter();
  @Output() onHideWarpSystem: any = new EventEmitter();
  @Output() onShowWeftSystem: any = new EventEmitter();
  @Output() onHideWeftSystem: any = new EventEmitter();


 constructor(
   private ss: SystemsService,
   private dm: DesignmodesService, 
   private dialog: MatDialog,
  private dialogRef: MatDialogRef<WeaverViewComponent>,
           @Inject(MAT_DIALOG_DATA) public data: any) { 

            this.render = data.render;
            this.draft = data.draft;
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
