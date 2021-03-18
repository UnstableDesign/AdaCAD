import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ShuttlesModal } from '../../modal/shuttles/shuttles.modal';
import { Shuttle } from '../../../core/model/shuttle';


@Component({
  selector: 'app-warpsystems',
  templateUrl: './warpsystems.component.html',
  styleUrls: ['./warpsystems.component.scss']
})
export class WarpsystemsComponent implements OnInit {
	
	@Input() warps; 
	@Input() warp_systems;
	@Output() onCreateWarpSystem: any = new EventEmitter();



  constructor(private dialog: MatDialog) { }

  ngOnInit() {
  }


  openDialog(shuttle) {
    var create = false;

    if (!shuttle) {
      shuttle = new Shuttle();
      create = true;
    }

    const dialogRef = this.dialog.open(ShuttlesModal, 
      {data: { shuttle: shuttle, warps: this.warps, type: "warp"}, width: '650px' });

    dialogRef.afterClosed().subscribe(result => {

        if (!create) {
          this.warp_systems[result.id] = result;
        } else {
          this.onCreateWarpSystem.emit({shuttle: result});
        }
    });
  }



  

}
