import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ShuttlesModal } from '../../modal/shuttles/shuttles.modal';
import { Shuttle } from '../../../core/model/shuttle';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";


@Component({
  selector: 'app-weftsystems',
  templateUrl: './weftsystems.component.html',
  styleUrls: ['./weftsystems.component.scss']
})



export class WeftsystemsComponent implements OnInit {


  @Input() shuttles: any;
  @Input() warps: number;

  @Output() onCreateShuttle: any = new EventEmitter();
  @Output() onShowShuttle: any = new EventEmitter();
  @Output() onHideShuttle: any = new EventEmitter();
  @Output() onColorChange: any = new EventEmitter();


  constructor(private dialog: MatDialog) { }

  ngOnInit() {
  }


   visibleButton(id, visible) {
    if (visible) {
      this.onShowShuttle.emit({shuttleId: id});
    } else {
      this.onHideShuttle.emit({shuttleId: id});
    }
  }

  openDialog(shuttle) {

    var create = false;

    if (!shuttle) {
      shuttle = new Shuttle();
      create = true;
    }

    const dialogRef = this.dialog.open(ShuttlesModal, 
      {data: { shuttle: shuttle, warps: this.warps, type: "weft"}, width: '650px' });

    dialogRef.afterClosed().subscribe(result => {

        if (!create) {
          this.shuttles[result.id] = result;
        } else {
          this.onCreateShuttle.emit({shuttle: result});
        }
    });
  }

  colorChange(e) {
    this.onColorChange.emit();
  }





}
