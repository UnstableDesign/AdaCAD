import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators, FormBuilder }  from '@angular/forms';
import { Material } from '../../../core/model/material';


@Component({
  selector: 'app-material-modal',
  templateUrl: './material.modal.html',
  styleUrls: ['./material.modal.scss']
})


export class MaterialModal{
  material: Material;
  types: any;

  constructor(
      private dialogRef: MatDialogRef<MaterialModal>,
      @Inject(MAT_DIALOG_DATA) public data: any) {

  	  this.material = data.material;
  	  this.types = data.material_types;

  	  console.log(this.material);
  	  console.log(this.types);
  }



  ngOnInit() {
  }



  close() {
    this.dialogRef.close(null);
  }

  save() {
    this.dialogRef.close(this.material);
  }

}
