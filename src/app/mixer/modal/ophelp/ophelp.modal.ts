import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DynamicOperation } from '../../../core/model/datatypes';
import { OperationDescriptionsService } from '../../../core/provider/operation-descriptions.service';
import { OperationService } from '../../../core/provider/operation.service';

@Component({
  selector: 'app-ophelp',
  templateUrl: './ophelp.modal.html',
  styleUrls: ['./ophelp.modal.scss']
})
export class OpHelpModal implements OnInit {
  
  
  name: string;
  is_dynamic_op: boolean;
  params: Array<any>;
  dynamic_type: string ="";
  dynamic_param_id: number = 0;
  dynamic_param_name: string = '';
  displayname: string = "";
  op_description: string = "";
  op_application: string = "";
  param_descriptions: Array<string>;
  dynamic_description: string = "";
  youtube: string = "";

  constructor(private op_desc:OperationDescriptionsService, private dialogRef: MatDialogRef<OpHelpModal>,
             @Inject(MAT_DIALOG_DATA) public data: any, private ops:OperationService) { 
        
        const op = this.ops.getOp(data.op.name);
        this.name = data.op.name;
        this.op_description = this.op_desc.getOpDescription(this.name);
        this.op_application = this.op_desc.getOpApplication(this.name);
        this.displayname = this.op_desc.getDisplayName(this.name);
        this.dynamic_description = this.op_desc.getDyanmicText();
        this.is_dynamic_op = this.ops.isDynamic(this.name);
        this.youtube = this.op_desc.getYoutube(this.name);
        if(this.youtube !== undefined) this.youtube = "https://www.youtube.com/embed/"+this.youtube;
     
        this.params = op.params;
        this.param_descriptions = op.params.map(el => this.op_desc.getParamDescription(el.name));
        this.param_descriptions = this.param_descriptions.map((dx, ndx) => (dx === undefined) ? this.params[ndx].dx : dx);

        if(this.is_dynamic_op){
          this.dynamic_type = (<DynamicOperation> op).dynamic_param_type;
          this.dynamic_param_id =(<DynamicOperation> op).dynamic_param_id;
          this.dynamic_param_name = this.params[this.dynamic_param_id].name;
        }
        


    }

  
  ngOnInit() {
  }

  close() {
    this.dialogRef.close();
  }

}
