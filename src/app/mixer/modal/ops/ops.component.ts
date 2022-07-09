import { Component, OnInit, Output, EventEmitter, Inject } from '@angular/core';
import { OperationService } from '../../provider/operation.service';
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
  displaynames:Array<string> = [];
  myControl = new FormControl();
  filteredOptions: Observable<string[]>;
  
  constructor(public ops: OperationService, private dialog: MatDialog,
    private dialogRef: MatDialogRef<OpsComponent>,
             @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {

    const allops = this.ops.ops.concat(this.ops.dynamic_ops);
    this.opnames = allops.map(el => el.name);
    this.displaynames = allops.map(el => el.displayname);

    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.displaynames.filter(option => option.toLowerCase().includes(filterValue));
  }

  close() {
    this.dialogRef.close(null);
  }



  addOp(name: string){
      this.onOperationAdded.emit(name);  
  }

  addOpFromSearch(event: any){
    //need to convert display name toname here
    const ndx = this.displaynames.findIndex(el => el === event.option.value);
    if(ndx !== -1){
      this.onOperationAdded.emit(this.opnames[ndx]);
    }


  }




}
