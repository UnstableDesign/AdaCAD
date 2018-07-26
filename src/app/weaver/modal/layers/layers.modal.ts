import { Component, OnInit, Inject } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import { FormGroup, FormControl, Validators, FormBuilder }  from '@angular/forms';
import { Layer } from '../../../core/model/layer';

export interface DialogData {
  animal: string;
  name: string;
}

@Component({
  selector: 'app-layers-modal',
  templateUrl: './layers.modal.html',
  styleUrls: ['./layers.modal.scss']
})
export class LayersModal {

  // layer = {
  //   name: 'Layer 0',
  //   id: 0,
  //   thickness: 0,
  //   color: '#000000',
  //   type: 'regular',
  // }

  types = ['regular', 'conductive', 'thermo'];

  constructor(
      private dialogRef: MatDialogRef<LayersModal>,
      @Inject(MAT_DIALOG_DATA) private layer: Layer) {

      if (!layer) {
        layer = new Layer();
      }

  }

  onNoClick(): void {
    this.dialogRef.close(this.layer);
  }

  close() {
    this.onNoClick();
  }

  save() {
    this.onNoClick();
  }

}
