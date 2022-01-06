import { RepositionScrollStrategy } from '@angular/cdk/overlay';
import { Component, OnInit, Input, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Draft } from '../../model/draft';
import { Loom } from '../../model/loom';
import { DesignmodesService } from '../../provider/designmodes.service';
import { FileService, LoadResponse, FileObj } from '../../provider/file.service';
import { HttpClient } from '@angular/common/http';


interface StartOptions {
  value: string;
  viewValue: string;
  mixeronly: boolean;
}


@Component({
  selector: 'app-init',
  templateUrl: './init.modal.html',
  styleUrls: ['./init.modal.scss']
})




export class InitModal implements OnInit {


  opts: StartOptions[] = [
      {value: 'example', viewValue: 'Load an Example', mixeronly: true},
      {value: 'ada', viewValue: 'AdaCAD (.ada) File', mixeronly: true},
      {value: 'bmp', viewValue: 'Two Color Image (.bmp, .jpg, .png) File', mixeronly: false},
      // {value: 'jpg', viewValue: 'Image (.jpg) File', mixeronly: false},
      // {value: 'wif', viewValue: 'WIF (.wif) File', mixeronly: false},   
      {value: 'new', viewValue: 'Empty Draft', mixeronly: false}

    ];

  import_opts: StartOptions[] = [];

  //form: any = {};
  selected:string = null;
  loomtype:string = null;
  valid:boolean = false; 
  mixer_envt: any; 
  source: string; 
  density_units: any;
  // result: LoadResponse;
  error: string;


  constructor(
    private dm: DesignmodesService, 
    private http: HttpClient,
    private dialogRef: MatDialogRef<InitModal>, 
    @Inject(MAT_DIALOG_DATA) private data: any, private fls: FileService) {
      this.source = data.source;
      this.error = "";
      this.import_opts = this.opts.filter(el => !el.mixeronly)

  }

  ngOnInit() {

  }

  /**
   * this is called on upload of a file from any location
   * @param e 
   */
  async handleFile(e: any) : Promise<any>{

    console.log("handle file", e);

    switch(e.type){
      case 'image': 
      return this.fls.loader.bmp(e.name, e.data).then(
        res => this.dialogRef.close(res)
      );
      case 'wif': 
        return this.fls.loader.wif(e.name, e.data)
        .then(
          res => this.dialogRef.close(res)
        );
      
      case 'ada': 
        return this.fls.loader.ada(e.name, e.data)
        .then(
          res => this.dialogRef.close(res)
        );
        

    }
  
  }

  loadExample(filename: string){
    console.log("loading example: ", filename);
    this.http.get('assets/examples/'+filename+".ada", {observe: 'response'}).subscribe((res) => {

      console.log("res", res);

      return this.fls.loader.ada(filename, res.body)
        .then(
          res => this.dialogRef.close(res)
        );
    }); 
  }



 
  onNoClick(): void {
    this.dialogRef.close(null);
  }


/**
 * called when the init form is complete 
 *  */

  save(f) {

    return this.fls.loader.form(f)
        .then(
          res => this.dialogRef.close(res)
        );
  }



}
