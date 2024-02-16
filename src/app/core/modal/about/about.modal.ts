import { Component, OnInit, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from "@angular/material/legacy-dialog";
import { VersionService } from '../../provider/version.service';


@Component({
  selector: 'app-about',
  templateUrl: './about.modal.html',
  styleUrls: ['./about.modal.scss']
})
export class AboutModal implements OnInit {

  version: string;

  constructor(private vs: VersionService, private dialogRef: MatDialogRef<AboutModal>,
             @Inject(MAT_DIALOG_DATA) private data: any) { 
               this.version = vs.currentVersion();
             }

  ngOnInit() {
  }

  close() {
    this.dialogRef.close();
  }

}
