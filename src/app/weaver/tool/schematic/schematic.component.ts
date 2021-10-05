import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ConnectionModal } from '../../modal/connection/connection.modal';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";


@Component({
  selector: 'app-schematic',
  templateUrl: './schematic.component.html',
  styleUrls: ['./schematic.component.scss']
})
export class SchematicComponent implements OnInit {

  @Output() onConnectionCreate: any = new EventEmitter();
  @Output() onLabelCreate: any = new EventEmitter();



  constructor(private dialog: MatDialog) { }

  ngOnInit() {
  }

  openConnectionDialog() {

    this.onConnectionCreate.emit();
  }

  openLabelDialog() {

    this.onLabelCreate.emit();
  }


}
