import { Component, OnInit, Inject, EventEmitter, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators, FormBuilder }  from '@angular/forms';
import { Shuttle } from '../../../core/model/shuttle';
import { Draft } from '../../model/draft';
import { DesignmodesService } from '../../provider/designmodes.service';
import { MaterialsService } from '../../provider/materials.service';
import { ShuttlesModal } from '../shuttles/shuttles.modal';


@Component({
  selector: 'app-material-modal',
  templateUrl: './material.modal.html',
  styleUrls: ['./material.modal.scss']
})



export class MaterialModal{

  @Output() onChange: any = new EventEmitter();


  replacements: Array<number> = [];
  types: any;
  newshuttle: Shuttle = new Shuttle();

  constructor(
      private dm: DesignmodesService,
      private ms: MaterialsService,
      private dialogRef: MatDialogRef<MaterialModal>,
      @Inject(MAT_DIALOG_DATA) public data: {draft:Draft}) {

      ms.getShuttles().forEach((el, ndx) => {
        this.replacements.push((ndx+1%this.ms.getShuttles().length));
      });
  	  this.types = dm.material_types;

  }



  ngOnInit() {
  }


  /**emitted on any action that would change the current rendering */
  change(){
    this.onChange.emit();

  }

  addMaterial(){

  }

  delete(index:number){
    console.log(index);
  }

  addNewShuttle(){
    console.log(this.newshuttle);
    this.newshuttle.setID(this.ms.getShuttles().length);
    this.ms.addShuttle(this.newshuttle);
    this.newshuttle = new Shuttle();
  }

  close() {
    this.dialogRef.close(null);
  }

  save() {
    this.dialogRef.close(null);
  }

}
