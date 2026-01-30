import { Component, OnInit, Input, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { DesignmodesService } from '../../provider/designmodes.service';
import { HttpClient } from '@angular/common/http';
import {AuthService} from '../../provider/auth.service'
import {FileService} from '../../provider/file.service'
import { getAnalytics, logEvent } from "@angular/fire/analytics";
import { BlankdraftModal } from '../blankdraft/blankdraft.modal';

interface StartOptions {
  value: string;
  viewValue: string;
  mixeronly: boolean;
}


@Component({
    selector: 'app-init',
    templateUrl: './init.modal.html',
    styleUrls: ['./init.modal.scss'],
    standalone: false
})




export class InitModal implements OnInit {


  @ViewChild(BlankdraftModal, {static: true}) blankdraft;


  opts: StartOptions[] = [
      {value: 'example', viewValue: 'Browse Examples', mixeronly: true},
      {value: 'ada', viewValue: 'Open an AdaCAD (.ada) File from you Computer', mixeronly: true},
     // {value: 'bmp', viewValue: 'Two Color Image (.bmp, .jpg, .png) File', mixeronly: false},
      // {value: 'wif', viewValue: 'WIF (.wif) File', mixeronly: false},   
      {value: 'blank', viewValue: 'Open an Empty Workspace', mixeronly: false},
      {value: 'new', viewValue: 'Create a Blank Draft', mixeronly: false}
    ];

  import_opts: StartOptions[] = [];

  //form: any = {};
  selected:string = null;
  valid:boolean = false; 
  mixer_envt: any; 
  source: string; 
  // result: LoadResponse;

  new_draft: boolean = false;


  constructor(
    private fls: FileService,
    private auth: AuthService,
    private dm: DesignmodesService, 
    private http: HttpClient,
    private dialogRef: MatDialogRef<InitModal>, 
    @Inject(MAT_DIALOG_DATA) private data: any) {
      this.source = data.source;
      this.import_opts = this.opts.filter(el => !el.mixeronly)

  }

  ngOnInit() {
    if(this.data.source === "newdraft") this.new_draft = true;
  }


  selectionMade(selection: any){
    if(selection === 'blank') this.dialogRef.close({
      data: null,
      status: -1
    });
  }



 

  close(): void {
    this.dialogRef.close(null);
  }

 
  onNoClick(): void {
    this.dialogRef.close(null);
  }

  // newDraftCreated(f) {

  //   console.log("SAVE CALLED", f)

  //   return this.fls.loader.form(f)
  //       .then(
  //         res => this.dialogRef.close(res)
  //       );
  // }




}
