import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { DynamicOperation } from '../../../core/model/datatypes';
import { OperationService } from '../../provider/operation.service';

@Component({
  selector: 'app-ophelp',
  templateUrl: './ophelp.modal.html',
  styleUrls: ['./ophelp.modal.scss']
})
export class OpHelpModal implements OnInit {
  
  documenation: any ="";
  name: string;
  is_dynamic_op: boolean;
  params: Array<any>;
  dynamic_type: string ="";
  dynamic_param_id: number = 0;
  dynamic_param_name: string = '';




  constructor(private dialogRef: MatDialogRef<OpHelpModal>,
             @Inject(MAT_DIALOG_DATA) public data: any, private ops:OperationService) { 
        
        const op = this.ops.getOp(data.op.name);
        this.name = data.op.name;
        this.is_dynamic_op = this.ops.isDynamic(this.name);
        this.params = op.params;
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
