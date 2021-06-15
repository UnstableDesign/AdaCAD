import { RepositionScrollStrategy } from '@angular/cdk/overlay';
import { Component, OnInit, Input, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Draft } from '../../model/draft';
import { Loom } from '../../model/loom';
import { FileService, LoadResponse, FileObj } from '../../provider/file.service';


interface StartOptions {
  value: string;
  viewValue: string;
}


@Component({
  selector: 'app-init',
  templateUrl: './init.modal.html',
  styleUrls: ['./init.modal.scss']
})




export class InitModal implements OnInit {


  opts: StartOptions[] = [
      {value: 'new', viewValue: 'Begin New Draft'},
      {value: 'ada', viewValue: 'Load an AdaCAD (.ada) File'},
      {value: 'bmp', viewValue: 'Load a Bitmap (.bmp) File'},
      {value: 'wif', viewValue: 'Load a WIF (.wif) File'}   
    ];

  //form: any = {};
  selected:string = null;
  loomtype:string = null;
  valid:boolean = false; 
  mixer_envt: any; 
  loomtypes: any;
  source: string; 
  density_units: any;
  result: LoadResponse;
  error: string;


  constructor(private dialogRef: MatDialogRef<InitModal>, 
    @Inject(MAT_DIALOG_DATA) private data: any, private fls: FileService) {
      console.log(data);
      this.result  = null;
      this.loomtypes = data.loomtypes;
      this.density_units = data.density_units;
      this.source = data.source;
      this.error = "";
  }

  ngOnInit() {

  }

  /**
   * this is called on upload of a file from any location
   * @param e 
   */
  handleFile(e: any) {

    let res: LoadResponse = null;

    switch(e.type){
      case 'image': 
        res = this.fls.loader.bmp(e.data);
      break; 

      case 'wif':
        res = this.fls.loader.wif(e.data);
      break;

      case 'ada':
        res = this.fls.loader.ada(e.data);
      break;
    }

    if(res == null) return;

    if(this.source !== 'mixer_envt' && res.data.drafts.length > 1) {
      //open draft selection operation
      this.error = "it looks like you are opening a file created with the mixer in our weaver tool. Select one draft to work with"
    }

    this.valid = res.status === 0;
    this.result = res;
  
  }



 
  onNoClick(): void {
    this.dialogRef.close(this.result);
  }


/**
 * called when the init form is complete 
 *  */

  save(f) {

    let d: Draft = null;
    //only add this data if a draft has not yet been processed
    if(this.result === null || this.result.data.drafts.length == 0){
     
      this.result = this.fls.loader.form(f);
    }


    this.dialogRef.close(this.result);
  }



}
