import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ShuttlesModal } from '../../modal/shuttles/shuttles.modal';
import { System } from '../../../core/model/system';


@Component({
  selector: 'app-warpsystems',
  templateUrl: './warpsystems.component.html',
  styleUrls: ['./warpsystems.component.scss']
})
export class WarpsystemsComponent implements OnInit {
	
	@Input() systems;
	@Output() onCreateWarpSystem: any = new EventEmitter();
  @Output() onShowWarpSystem: any = new EventEmitter();
  @Output() onHideWarpSystem: any = new EventEmitter();



  constructor(private dialog: MatDialog) { }

  ngOnInit() {
  }


  // openDialog(type, system) {
  //   var create = false;

  //   if (!system) {
  //     system = new System();
  //     create = true;
  //   }

  //   const dialogRef = this.dialog.open(ShuttlesModal, 
  //     {data: { system: system, type: "warp"}, width: '650px' });

  //   dialogRef.afterClosed().subscribe(result => {

  //       if (!create) {
  //         this.systems[result.id] = result;
  //       } else {
  //         this.onCreateWarpSystem.emit({system: result});
  //       }
  //   });
  // }

  visibleButton(id, visible) {
    if (visible) {
      this.onShowWarpSystem.emit({systemId: id});
    } else {
      this.onHideWarpSystem.emit({systemId: id});
    }
  }




  

}
