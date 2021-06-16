import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { OperationService } from '../../provider/operation.service';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { InitModal } from '../../../core/modal/init/init.modal';

@Component({
  selector: 'app-flow',
  templateUrl: './flow.component.html',
  styleUrls: ['./flow.component.scss']
})
export class FlowComponent implements OnInit {
  
  @Output() onOperationAdded:any = new EventEmitter();
  @Output() onImport:any = new EventEmitter();

  constructor(private ops: OperationService, private dialog: MatDialog) { }

  ngOnInit() {

  }


  addOp(name: string){
    this.onOperationAdded.emit(name);
  }

  upload(){
    //need to handle this and load the file somehow


    const dialogRef = this.dialog.open(InitModal, {
      data: {source: 'mixer'}
    });

     dialogRef.afterClosed().subscribe(result => {
      if(result !== undefined) this.onImport.emit(result);
      

   });


  }



}
