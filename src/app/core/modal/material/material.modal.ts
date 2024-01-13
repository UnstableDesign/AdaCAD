import { Component, OnInit, Inject, EventEmitter, Output, ViewChild, Input } from '@angular/core';
import { DesignmodesService } from '../../provider/designmodes.service';
import { MaterialMap, MaterialsService } from '../../provider/materials.service';
import { TreeService } from '../../../core/provider/tree.service';
import utilInstance from '../../model/util';
import { Draft,DraftNode, Material } from '../../model/datatypes';
import { createMaterial, setMaterialID } from '../../model/material';


@Component({
  selector: 'app-material-modal',
  templateUrl: './material.modal.html',
  styleUrls: ['./material.modal.scss']
})



export class MaterialModal{

  @Output() onMaterialChange: any = new EventEmitter();

  replacements: Array<number> = [];
  types: any;
  newshuttle: Material = createMaterial();
  addmaterial: boolean = false;

  constructor(
      private dm: DesignmodesService,
      public ms: MaterialsService,
      private tree: TreeService) {

      ms.getShuttles().forEach((el, ndx) => {
        this.replacements.push((ndx+1%this.ms.getShuttles().length));
      });

  }



  ngOnInit() {
  }


  /**emitted on any action that would change the current rendering */
  change(){
    this.onMaterialChange.emit();
  }

  addMaterial(){

  }




  /**
   * handles user input of delete event and reads the "replace" value to reassign draft
   * @param index  - the shuttle to delete
   */
  delete(index:number){

    if(this.ms.getShuttles().length == 1) return;

    if(confirm("Are you sure you want to delete this material")) {
    


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

    this.onMaterialChange.emit();
    }
  }

  addNewShuttle(){
    console.log(this.newshuttle);
    setMaterialID(this.newshuttle,this.ms.getShuttles().length);
    this.ms.addShuttle(this.newshuttle);
    this.newshuttle = createMaterial();
  }

  save() {
  }

}
