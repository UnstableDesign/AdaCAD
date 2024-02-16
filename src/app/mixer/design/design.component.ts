import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BlankdraftModal } from '../../core/modal/blankdraft/blankdraft.modal';
import { MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { InitModal } from '../../core/modal/init/init.modal';
import { OpsComponent } from '../modal/ops/ops.component';
import { StateService } from '../../core/provider/state.service';
import { OperationService } from '../../core/provider/operation.service';
import { OperationDescriptionsService } from '../../core/provider/operation-descriptions.service';
import { OperationClassification } from '../../core/model/datatypes';
import { LoadfileComponent } from '../../core/modal/loadfile/loadfile.component';

@Component({
  selector: 'app-design',
  templateUrl: './design.component.html',
  styleUrls: ['./design.component.scss']
})
export class DesignComponent {
  @Output() onUndo: any = new EventEmitter();
  @Output() onRedo: any = new EventEmitter();
  @Output() onNewDraftCreated: any = new EventEmitter();
  @Output() onOperationAdded: any = new EventEmitter();
  @Output() onImport: any = new EventEmitter();
  @Output() onNoteCreate: any = new EventEmitter();
  @Output() onLoadDrafts: any = new EventEmitter();

  upload_modal: MatDialogRef<InitModal, any>;
  op_modal: MatDialogRef<OpsComponent, any>;
  classifications: Array<OperationClassification>;


  constructor(
    public ops: OperationService, 
    public op_desc: OperationDescriptionsService, 
    public ss: StateService, 
    private dialog: MatDialog){

      const allops = this.ops.ops.concat(this.ops.dynamic_ops);
      this.classifications = this.op_desc.getOpClassifications();

  }


  openBitmaps() {


    const dialogRef = this.dialog.open(LoadfileComponent, {
      data: {
        multiple: true,
        accepts: '.jpg,.bmp,.png',
        type: 'bitmap_collection',
        title: 'Select Bitmap Files to Convert to Drafts'
      }
    });

    dialogRef.afterClosed().subscribe(drafts => {
      if(drafts !== undefined){
        this.onLoadDrafts.emit(drafts);

      } 
      
   });
  }



  createNewDraft(){

    const dialogRef = this.dialog.open(BlankdraftModal, {
    });

    dialogRef.afterClosed().subscribe(obj => {
      // if(loadResponse !== undefined) this.onLoadNewFile.emit(loadResponse);
      if(obj !== undefined && obj !== null) this.onNewDraftCreated.emit(obj);
   });
  }




openOps(){

  if(this.op_modal != undefined && this.op_modal.componentInstance != null) return;
  
  this.op_modal =  this.dialog.open(OpsComponent,
    {disableClose: true,
      hasBackdrop: false});


      this.op_modal.componentInstance.onOperationAdded.subscribe(event => { this.onOperationAdded.emit(event)});
      this.op_modal.componentInstance.onImport.subscribe(event => { this.onImport.emit(event)});

  
      this.op_modal.afterClosed().subscribe(result => {
        //this.onLoomChange.emit();
       // dialogRef.componentInstance.onChange.removeSubscription();
    });
}

addOperation(name: string){
  this.onOperationAdded.emit(name)
}

addNote(){
  this.onNoteCreate.emit();
}

undoClicked(e:any) {
  this.onUndo.emit();
}

redoClicked(e:any) {
  this.onRedo.emit();
}

}


