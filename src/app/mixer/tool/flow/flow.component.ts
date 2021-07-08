import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { OperationService } from '../../provider/operation.service';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { InitModal } from '../../../core/modal/init/init.modal';
import {FormControl} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'app-flow',
  templateUrl: './flow.component.html',
  styleUrls: ['./flow.component.scss']
})
export class FlowComponent implements OnInit {
  
  @Output() onOperationAdded:any = new EventEmitter();
  @Output() onImport:any = new EventEmitter();
  
  opnames:Array<string> = [];
  myControl = new FormControl();
  filteredOptions: Observable<string[]>;
  
  constructor(private ops: OperationService, private dialog: MatDialog) { }

  ngOnInit() {

    this.opnames = this.ops.ops.map(el => el.name);

    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.opnames.filter(option => option.toLowerCase().includes(filterValue));
  }


  addOp(name: string){
    this.onOperationAdded.emit(name);
  }

  addOpFromSearch(event: any){
    console.log("selected", event);
    this.onOperationAdded.emit(event.option.value);
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
