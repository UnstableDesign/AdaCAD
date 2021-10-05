import { Component, OnInit, Inject, EventEmitter, Output, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Draft } from '../../model/draft';
import { CollectionService } from '../../provider/collection.service';





@Component({
  selector: 'app-ml',
  templateUrl: './ml.modal.html',
  styleUrls: ['./ml.modal.scss']
})
export class MlModal implements OnInit {

  @Output() onChange: any = new EventEmitter();
  

  constructor(private dialogRef: MatDialogRef<MlModal>,
             @Inject(MAT_DIALOG_DATA) private data: any) {
  }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }


  close() {
    this.dialogRef.close();
  }

}
