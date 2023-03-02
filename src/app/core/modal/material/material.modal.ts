import { Component, OnInit, Inject, EventEmitter, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Shuttle } from '../../../core/model/shuttle';
import { DesignmodesService } from '../../provider/designmodes.service';
import { MaterialMap, MaterialsService } from '../../provider/materials.service';
import { TreeService } from '../../../core/provider/tree.service';
import utilInstance from '../../model/util';
import { Draft,DraftNode } from '../../model/datatypes';


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
  addmaterial: boolean = false;

  constructor(
      private dm: DesignmodesService,
      public ms: MaterialsService,
      private tree: TreeService) {

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



  /**
   * handles user input of delete event and reads the "replace" value to reassign draft
   * @param index  - the shuttle to delete
   */
  delete(index:number){

    //never delete all of the shuttles
    if(this.ms.getShuttles().length == 1) return;

    const map: Array<MaterialMap> = this.ms.deleteShuttle(index);
    const dn: Array<DraftNode> = this.tree.getDraftNodes();
    
    
    dn.forEach(dn =>{
      dn.draft.rowShuttleMapping = utilInstance.updateMaterialIds( dn.draft.rowShuttleMapping, map, this.replacements[index]);
      dn.draft.colShuttleMapping = utilInstance.updateMaterialIds( dn.draft.colShuttleMapping, map, this.replacements[index]);

    });

    //remove this from replacements
    this.replacements = this.replacements.filter((el, ndx) => ndx != index);
    //map remaning replacement values to valid indices 
    this.replacements = this.replacements.map(el => (el%this.ms.getShuttles().length));

    this.onChange.emit();
  }

  addNewShuttle(){
    console.log(this.newshuttle);
    this.newshuttle.setID(this.ms.getShuttles().length);
    this.ms.addShuttle(this.newshuttle);
    this.newshuttle = new Shuttle();
  }

  // close() {
  //   this.dialogRef.close(null);
  // }

  // save() {
  //   this.dialogRef.close(null);
  // }

}
