import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ShuttlesModal } from '../../modal/shuttles/shuttles.modal';
import { Shuttle } from '../../../core/model/shuttle';

@Component({
  selector: 'app-shuttles',
  templateUrl: './shuttles.component.html',
  styleUrls: ['./shuttles.component.scss']
})
export class ShuttlesComponent implements OnInit {
  @Input() shuttles;
  @Input() warps;
  @Output() onColorChange: any = new EventEmitter();
  @Output() onCreateShuttle: any = new EventEmitter();
  @Output() onShowShuttle: any = new EventEmitter();
  @Output() onHideShuttle: any = new EventEmitter();

  selected = 0;

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
      {data: { shuttle: shuttle, warps: this.warps }, width: '650px' });

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


  visibleButton(id, visible) {
    if (visible) {
      this.onShowShuttle.emit({shuttleId: id});
    } else {
      this.onHideShuttle.emit({shuttleId: id});
    }
  }

  handleFile(e: any) {
    console.log(e);
   
  }


}
