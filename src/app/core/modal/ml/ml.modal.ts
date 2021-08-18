import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";





@Component({
  selector: 'app-about',
  templateUrl: './about.modal.html',
  styleUrls: ['./about.modal.scss']
})
export class AboutModal implements OnInit {


  constructor(private dialogRef: MatDialogRef<AboutModal>,
             @Inject(MAT_DIALOG_DATA) private data: any) { }

  ngOnInit() {
  }

  close() {
    this.dialogRef.close();
  }

}
