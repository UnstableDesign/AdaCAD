import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { compositionDependencies } from 'mathjs';
import { DesignMode, Draft, Loom, LoomSettings } from '../../model/datatypes';
import { initDraft, initDraftWithParams } from '../../model/drafts';
import utilInstance from '../../model/util';
import { DesignmodesService } from '../../provider/designmodes.service';
import { FileService } from '../../provider/file.service';

@Component({
  selector: 'app-blankdraft',
  templateUrl: './blankdraft.modal.html',
  styleUrls: ['./blankdraft.modal.scss']
})
export class BlankdraftModal implements OnInit {

  loom_types: Array<DesignMode>  = [];
  units: Array<DesignMode>  = [];
  selected_unit:"in" | "cm" = "in";
  loomtype: string = 'jacquard';
  epi: number = 30;
  valid:boolean = false; 
  wefts: number;
  warps: number;
  frame_num: number = 8;
  treadle_num: number = 10;
  
  
  @Output() onNewDraftCreated = new EventEmitter <any>(); 



  constructor(
    private fls: FileService,
    private dm: DesignmodesService, 
    private dialogRef: MatDialogRef<BlankdraftModal>, 
    @Inject(MAT_DIALOG_DATA) private data: any) {
     
      this.loom_types = this.dm.getOptionSet('loom_types');
      this.units = this.dm.getOptionSet('density_units');

  }

  ngOnInit() {
  }

  close(): void {
    console.log("CLOSE")

     this.createDraftAndClose();
  }

 
  onNoClick(): void {
    console.log("NO CLICK")
     this.createDraftAndClose();

  }

  createDraftAndClose(){
    const draft: Draft = initDraftWithParams({wefts: this.wefts, warps: this.warps});
    let loom: Loom = null;

    if(this.loomtype !== 'jacquard'){
      loom = {
        id: utilInstance.generateId(8),
        threading: [],
        treadling: [],
        tieup: []
      }
    }
 

    const loom_settings: LoomSettings = {
      treadles: this.treadle_num,
      frames: this.frame_num,
      type: this.loomtype,
      epi: this.epi,
      units: this.selected_unit

    } 

    console.log("CREATED", draft, loom, loom_settings)
    this.dialogRef.close({draft, loom, loom_settings});

  }

  /**
 * called when the init form is complete 
 *  */

   save(f) {

    console.log("SAVE CALLED")
    //if the INIT form parent is listening, it gets the entire form
    this.onNewDraftCreated.emit(f);

    //Otherwise, the dialog ref will just return the new draft to add to the palette
    this.createDraftAndClose();


  }




}
