import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: 'app-init',
  templateUrl: './init.modal.html',
  styleUrls: ['./init.modal.scss']
})
export class InitModal implements OnInit {

  form: any = {};

  constructor(private dialogRef: MatDialogRef<InitModal>) {

  }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close(this.form);
  }

  save() {
    this.onNoClick();
  }

}
