import { Component, EventEmitter, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { OperationClassification } from '../../core/model/datatypes';
import { OperationDescriptionsService } from '../../core/provider/operation-descriptions.service';
import { OperationService } from '../../core/provider/operation.service';
import { ViewEncapsulation } from '@angular/core';
import {MatAutocompleteModule} from '@angular/material/autocomplete';

@Component({
  selector: 'app-quickop',
  templateUrl: './quickop.component.html',
  styleUrls: ['./quickop.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class QuickopComponent {

  @Output() onOperationAdded:any = new EventEmitter();


  opnames:Array<string> = [];
  displaynames:Array<string> = [];
  myControl = new UntypedFormControl();
  filteredOptions: Observable<string[]>;
  searchOnly: boolean = false;
  classifications: Array<OperationClassification>;
  
  
  constructor(
    public ops: OperationService, 
    public op_desc: OperationDescriptionsService ) { }


  ngOnInit(){
    const allops = this.ops.ops.concat(this.ops.dynamic_ops).filter(el => this.op_desc.hasDisplayName(el.name));
    this.classifications = this.op_desc.getOpClassifications();
    this.opnames = allops.map(el => el.name)  
    this.displaynames = allops.map(el => this.op_desc.getDisplayName(el.name));
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );

  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.displaynames.filter(option => option.toLowerCase().includes(filterValue));
  }

  addOpFromSearch(event: any){
    //need to convert display name toname here
    const ndx = this.displaynames.findIndex(el => el === event.option.value);
    if(ndx !== -1){
      this.onOperationAdded.emit(this.opnames[ndx]);
    }
  }

}
