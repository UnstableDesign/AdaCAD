import { Component, OnInit, Output, EventEmitter, Inject } from '@angular/core';
import { OperationService, DynamicOperation, OpInput } from '../../provider/operation.service';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {FormControl} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'app-ops',
  templateUrl: './ops.component.html',
  styleUrls: ['./ops.component.scss']
})
export class OpsComponent implements OnInit {
  
  @Output() onOperationAdded:any = new EventEmitter();
  @Output() onImport:any = new EventEmitter();
  
  opnames:Array<string> = [];
  myControl = new FormControl();
  filteredOptions: Observable<string[]>;
  
  constructor(public ops: OperationService, private dialog: MatDialog,
    private dialogRef: MatDialogRef<OpsComponent>,
             @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {

    const allops = this.ops.ops.concat(this.ops.dynamic_ops);
    this.opnames = allops.map(el => el.name);

    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.opnames.filter(option => option.toLowerCase().includes(filterValue));
  }

  close() {
    this.dialogRef.close(null);
  }



  addOp(name: string){
      this.onOperationAdded.emit(name);  
  }

  addOpFromSearch(event: any){
    this.onOperationAdded.emit(event.option.value);
  }




}
