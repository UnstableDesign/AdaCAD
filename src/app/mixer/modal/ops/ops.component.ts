import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { OperationClassification } from '../../../core/model/datatypes';
import { OperationDescriptionsService } from '../../../core/provider/operation-descriptions.service';
import { OperationService } from '../../../core/provider/operation.service';
import { DomSanitizer } from '@angular/platform-browser';

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
  myControl = new UntypedFormControl();
  filteredOptions: Observable<string[]>;
  searchOnly: boolean = false;
  classifications: Array<OperationClassification>;
  
  desc: string = "";
  app: string = "";
  name: string = "";
  youtube: string = "";
  url: any;
  
  constructor(
    public ops: OperationService, 
    public op_desc: OperationDescriptionsService, 
    private sanatizer: DomSanitizer,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<OpsComponent>,
             @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {

    const allops = this.ops.ops.concat(this.ops.dynamic_ops);
    this.classifications = this.op_desc.getOpClassifications();
    this.opnames = allops.map(el => el.name);
    this.displaynames = allops.map(el => this.op_desc.getDisplayName(el.name));

    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );

    if(this.data.searchOnly !== undefined){
      this.searchOnly = true;
    }
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.displaynames.filter(option => option.toLowerCase().includes(filterValue));
  }

  close() {
    this.dialogRef.close(null);
  }

  showDesc(obj){
    this.name = this.op_desc.getDisplayName(obj);
    this.desc = this.op_desc.getOpDescription(obj);
    this.app = this.op_desc.getOpApplication(obj);
    this.youtube = this.op_desc.getOpYoutube(obj);
    this.url = this.createYoutubeEmbedLink(this.youtube)
    
  }

  showCatDesc(obj){
    this.name = "category: "+obj;
    this.desc = this.op_desc.getCatDescription(obj);
    this.app = "";
  }

  createYoutubeEmbedLink(embedcode: string){
   const prefix = "https://www.youtube.com/embed/";
   if(embedcode === "") return "";
   const url = this.sanatizer.bypassSecurityTrustResourceUrl(prefix+embedcode);
    console.log(this.url);
    return url

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
    if(this.searchOnly){
      this.close();
    }


  }




}
