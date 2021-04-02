import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ShuttlesModal } from '../../modal/shuttles/shuttles.modal';
import { System } from '../../../core/model/system';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";


@Component({
  selector: 'app-systems',
  templateUrl: './systems.component.html',
  styleUrls: ['./systems.component.scss']
})



export class SystemsComponent implements OnInit {


  @Input() systems: any;
  @Input() warps: number;

  @Output() onCreateWeftSystem: any = new EventEmitter();
  @Output() onShowWeftSystem: any = new EventEmitter();
  @Output() onHideWeftSystem: any = new EventEmitter();


  constructor(private dialog: MatDialog) { }

  ngOnInit() {
  }


  visibleButton(id, visible) {
    if (visible) {
      this.onShowWeftSystem.emit({systemId: id});
    } else {
      this.onHideWeftSystem.emit({systemId: id});
    }
  }

  openDialog(type, system) {

    var create = false;

    if (!system) {
      system = new System();
      create = true;
    }

    const dialogRef = this.dialog.open(ShuttlesModal, 
      {data: { system: system, warps: this.warps, type: "weft"}, width: '650px' });

    dialogRef.afterClosed().subscribe(result => {

        if (!create) {
          this.systems[result.id] = result;
        } else {
          this.onCreateWeftSystem.emit({system: result});
        }
    });
  }

}
