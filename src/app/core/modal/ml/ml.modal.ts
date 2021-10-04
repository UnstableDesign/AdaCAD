import { Component, OnInit, Inject, EventEmitter, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";





@Component({
  selector: 'app-ml',
  templateUrl: './ml.modal.html',
  styleUrls: ['./ml.modal.scss']
})
export class MlModal implements OnInit {

  @Output() onChange: any = new EventEmitter();

  constructor(private dialogRef: MatDialogRef<MlModal>,
             @Inject(MAT_DIALOG_DATA) private data: any) { }

  ngOnInit() {
  }

  close() {
    this.dialogRef.close();
  }

}
