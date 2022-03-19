import { Component, OnInit, Input, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { DesignmodesService } from '../../provider/designmodes.service';
import { HttpClient } from '@angular/common/http';
import {getDatabase, ref as fbref, get as fbget, child} from '@angular/fire/database'
import {AuthService} from '../../provider/auth.service'
import {FileService} from '../../provider/file.service'
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
      // {value: 'wif', viewValue: 'WIF (.wif) File', mixeronly: false},   
      {value: 'new', viewValue: 'Empty Draft', mixeronly: false}

    ];

  import_opts: StartOptions[] = [];

  //form: any = {};
  selected:string = null;
  valid:boolean = false; 
  mixer_envt: any; 
  source: string; 
  // result: LoadResponse;
  error: string;


  constructor(
    private fls: FileService,
    private dm: DesignmodesService, 
    private http: HttpClient,
    private dialogRef: MatDialogRef<InitModal>, 
    @Inject(MAT_DIALOG_DATA) private data: any) {
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

  selectionMade(selection: any){

  }

  loadExample(filename: string){
    console.log("loading example: ", filename);
    this.http.get('assets/examples/'+filename+".ada", {observe: 'response'}).subscribe((res) => {

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
