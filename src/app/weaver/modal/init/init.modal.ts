import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: 'app-init',
  templateUrl: './init.modal.html',
  styleUrls: ['./init.modal.scss']
})
export class InitModal implements OnInit {

  form: any = {};

  constructor(private dialogRef: MatDialogRef<InitModal>) {
  }

  ngOnInit() {
    this.form.pattern = null;
    this.form.patterns = null;
    this.form.wefts = 30;
    this.form.type = "new";
    this.form.shuttles = null;
  }

  handleFile(e: any) {
    console.log(e);
    if (e.type === "image") this.processImageData(e.data);
    else if (e.type === "ada") this.processDraftData(e.data);
  }

  processImageData(e: any) {
    this.form.warps = e.width;
    this.form.wefts = e.height;
    this.form.type = "new";
    var img = e.data;
    var data = [];

    for (var i=0; i< e.height; i++) {
      data.push([]);
      for (var j=0; j< e.width; j++) {
        var idx = (i * 4 * this.form.warps) + (j * 4);
        var threshold = (img[idx] + img[idx+1] + img[idx+2]);
        var alpha = img[idx + 3];

        if (threshold < 750 && alpha != 0) {
          data[i].push(true);
        } else {
          data[i].push(false);
        }
      }
    }
    this.form.pattern = data;
    // console.log(this.form.pattern);
  }

  processDraftData(e: any) {
    this.form.type = "update";
    this.form.draft = e;

  }

  onNoClick(): void {
    console.log("onNoClick", this.form)
    this.dialogRef.close(this.form);
  }

  save() {
    console.log("Save", this.form)
    this.dialogRef.close(this.form);
  }

}
