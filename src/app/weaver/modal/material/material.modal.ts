import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators, FormBuilder }  from '@angular/forms';
import { Shuttle } from '../../../core/model/shuttle';


@Component({
  selector: 'app-material-modal',
  templateUrl: './material.modal.html',
  styleUrls: ['./material.modal.scss']
})


export class MaterialModal{
  shuttle: Shuttle;
  types: any;

  constructor(
      private dialogRef: MatDialogRef<MaterialModal>,
      @Inject(MAT_DIALOG_DATA) public data: any) {

  	  this.shuttle = data.shuttle;
  	  this.types = data.material_types;

  }



  ngOnInit() {
  }



  close() {
    this.dialogRef.close(null);
  }

  save() {
    this.dialogRef.close(this.shuttle);
  }

}
