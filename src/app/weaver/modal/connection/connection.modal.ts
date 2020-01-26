import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

export class Point {
  x: number;
  y: number;
}

class Connection {
  start: Point;
  end: Point;
  layerId: number;
}

@Component({
  selector: 'app-connection',
  templateUrl: './connection.modal.html',
  styleUrls: ['./connection.modal.scss']
})
export class ConnectionModal implements OnInit {
  connection: Connection = new Connection();
  layers: any;

  constructor(private dialogRef: MatDialogRef<ConnectionModal>,
             @Inject(MAT_DIALOG_DATA) private data: any) { }

  ngOnInit() {
    this.connection.start = new Point();
    this.connection.end = new Point();
    this.layers = this.data.layers;
  }

  close() {
    this.dialogRef.close();
  }

  save() {
    this.dialogRef.close(this.connection);
  }

}
