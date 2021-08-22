import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators, FormBuilder }  from '@angular/forms';
import { Shuttle } from '../../../core/model/shuttle';
import { Draft } from '../../model/draft';
import { DesignmodesService } from '../../provider/designmodes.service';


@Component({
  selector: 'app-material-modal',
  templateUrl: './material.modal.html',
  styleUrls: ['./material.modal.scss']
})


export class MaterialModal{
  shuttles: Array<Shuttle>;
  types: any;

  constructor(
      private dm: DesignmodesService,
      private dialogRef: MatDialogRef<MaterialModal>,
      @Inject(MAT_DIALOG_DATA) public data: {draft:Draft, material_types: any}) {

      this.shuttles = data.draft.shuttles;
  	  this.types = dm.material_types;

  }



  ngOnInit() {
  }



  close() {
    this.dialogRef.close(null);
  }

  save() {
    this.dialogRef.close(null);
  }

}
