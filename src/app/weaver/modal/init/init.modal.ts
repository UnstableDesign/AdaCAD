import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";


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
      {value: 'bmp', viewValue: 'Load a Bitmap (.bmp) File'}
    ];


  //form: any = {};
  selected:string = null;
  valid:boolean = false; 
  draft: any = {};


  constructor(private dialogRef: MatDialogRef<InitModal>) {
  }

  ngOnInit() {


  }

  handleFile(e: any) {
    console.log(e);
    if (e.type === "image") this.processImageData(e.data);
    else if (e.type === "ada") this.processDraftData(e.data);
    this.valid = true;

  }

  processImageData(e: any) {
    this.draft.warps = e.width;
    this.draft.wefts = e.height;
    var img = e.data;
    var data = [];

    for (var i=0; i< e.height; i++) {
      data.push([]);
      for (var j=0; j< e.width; j++) {
        var idx = (i * 4 * this.draft.warps) + (j * 4);
        var threshold = (img[idx] + img[idx+1] + img[idx+2]);
        var alpha = img[idx + 3];

        if (threshold < 750 && alpha != 0) {
          data[i].push(true);
        } else {
          data[i].push(false);
        }
      }
    }
    this.draft.pattern = data;
    // console.log(this.form.pattern);
  }

  processDraftData(e: any) {
   // this.form.type = "update";
    this.draft = e; //this is the data from the upload event

  }

  onNoClick(): void {
    console.log("onNoClick", this.draft);
    //this.dialogRef.close(this.draft);
  }

  save(f) {
    if(this.draft.epi == undefined) this.draft.epi = f.value.epi;
    if(this.draft.warps == undefined) this.draft.warps = f.value.warps; 


    this.dialogRef.close(this.draft);
  }

}
