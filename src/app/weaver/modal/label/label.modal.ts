import { Component, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: 'app-label',
  templateUrl: './label.modal.html',
  styleUrls: ['./label.modal.scss']
})
export class LabelModal implements OnInit {

  label: any;
  constructor(private dialogRef: MatDialogRef<LabelModal>,) { }

  ngOnInit() {
    this.label = {
      category: null,
      type: null,
      num: null,
      row: null
    }
  }

  close() {
    this.dialogRef.close(null);
  }

  save() {
    this.dialogRef.close(this.label);
  }

}
