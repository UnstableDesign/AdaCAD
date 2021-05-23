import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators, FormBuilder }  from '@angular/forms';
import { Shuttle } from '../../../core/model/shuttle';

import * as g from 'g.js';

@Component({
  selector: 'app-shuttles-modal',
  templateUrl: './shuttles.modal.html',
  styleUrls: ['./shuttles.modal.scss']
})
export class ShuttlesModal {
  shuttle: Shuttle;
  warps: number;
  type: string;


  constructor(
      private dialogRef: MatDialogRef<ShuttlesModal>,
      @Inject(MAT_DIALOG_DATA) public data: any) {

     console.log("in constructor", data);

      this.type = (data.type).charAt(0).toUpperCase() + (data.type).slice(1);
      if (!data.shuttle) {
        this.shuttle = new Shuttle();
      } else {
        this.shuttle = data.shuttle;
      }

      this.warps = data.warps;

  }

  // processData(e: any) {
  //   var img = e.data;
  //   var data = [];

  //   for (var i=0; i< e.height; i++) {
  //     data.push([]);
  //     for (var j=0; j< e.width; j++) {
  //       var idx = (i * 4 * this.warps) + (j * 4);
  //       var threshold = (img[idx] + img[idx+1] + img[idx+2]);
  //       var alpha = img[idx + 3];

  //       if (threshold < 750 && alpha != 0) {
  //         data[i].push(true);
  //       } else {
  //         data[i].push(false);
  //       }
  //     }
  //   }
    
  //   this.shuttle.image = data;
  //   console.log(data);
  // }

  close() {
    this.dialogRef.close(null);
  }

  save() {
    this.dialogRef.close(this.shuttle);
  }

}
