import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { rest } from 'lodash';
import { Loom } from '../../../core/model/loom';


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
    else if (e.type === "wif") this.processWifData(e.data);
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

  processWifData(e: any) {
    var stringWithoutMetadata = this.getSubstringAfter("CONTENTS", e);
    this.draft.warps = this.getInt("Threads",this.getSubstringAfter("[WARP]",stringWithoutMetadata));
    this.draft.wefts = this.getInt("Threads",this.getSubstringAfter("[WEFT]",stringWithoutMetadata));
    var data = [];

    for (var i = 0; i< this.draft.warps; i++) {
      data.push([]);
      for (var j = 0; j < this.draft.wefts; j++) {
        data[i].push(false);
      }
    }
    this.draft.pattern = data;
    this.draft.loom = new Loom(this.draft.wefts, this.draft.warps, this.getInt("Shafts", e),this.getInt("Treadles", e));

    if (this.getBool("TREADLING", stringWithoutMetadata)) {
      var treadling = this.getTreadling(stringWithoutMetadata);
      this.draft.loom.treadling = treadling;
    }
    if (this.getBool("THREADING", stringWithoutMetadata)) {
      var threading = this.getThreading(stringWithoutMetadata);
      this.draft.loom.threading = threading;
    }
    if (this.getBool("TIEUP", e)) {
      var tieups = this.getTieups(stringWithoutMetadata);
      this.draft.loom.tieup = tieups;

    }
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

  getInt(val, e) {
    var index = e.search(val);
    if (index != -1) {
      var substring = e.substring(index, e.length);
      var endOfLineChar = '\n';
      var endIndex = substring.indexOf(endOfLineChar);
      if (endIndex!= -1) {
        return +(substring.substring(val.length+1,endIndex)); //string is converted to int with unary + operator
      } else {
        return -1;
      }
    } else {
      return -1;
    }
  }

  getBool(val, e) {
    var index = e.search(val);
    if (index != -1) {
      var substring = e.substring(index, e.length);
      var endOfLineChar = '\n';
      var endIndex = substring.indexOf(endOfLineChar);
      if (endIndex!= -1) {
        if (substring.substring(val.length+1,endIndex) === "yes") {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  getSubstringAfter(val, e){
    var index = e.search(val);
    if( index != -1 ){
      return e.substring(index+val.length);
    } else {
      return e;
    }
  }

  getTreadling(e) {
    var treadling = [];
    var treadles = this.getInt("Treadles", e);

    for (var i=0; i  < this.draft.wefts; i++) {
      treadling.push(-1);
    }

    var indexOfLabel = e.search("TREADLING]");
    var startIndex = indexOfLabel + "TREADLING]".length+1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar)+startIndex;
    var line = e.substring(startIndex, endIndex);

    while(line.match(/[0-9]*=[0-9]*/) != null) {
      var weft = +(line.match(/[0-9]*/));
      var treadle = +(line.match(/=[0-9]*/)[0].substring(1));
      treadling[weft-1] = treadle-1;
      startIndex = endIndex+1;
      endIndex = e.substring(startIndex).indexOf(endOfLineChar)+startIndex;
      line = e.substring(startIndex,endIndex);
    }

    return treadling;
  }

  getThreading(e) {
    var threading = [];
    var frames = this.getInt("Shafts", e);

    for (var i = 0; i < this.draft.warps; i++) {
      threading.push(-1);
    }

    var indexOfLabel = e.search("THREADING]");
    var startIndex = indexOfLabel + "THREADING]".length+1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar)+startIndex;
    var line = e.substring(startIndex, endIndex);

    while (line.match(/[0-9]*=[0-9]*/) != null) {
      var warp = +(line.match(/[0-9]*/));
      var frame = +(line.match(/=[0-9]*/)[0].substring(1));
      threading[this.draft.warps-warp] = frames-frame;
      startIndex = endIndex+1;
      endIndex = e.substring(startIndex).indexOf(endOfLineChar)+startIndex;
      line = e.substring(startIndex,endIndex);
    }

    return threading;
  }

  getTieups(e){
    var tieups = [];
    var frames = this.getInt("Shafts", e);
    var treadles = this.getInt("Treadles", e);

    for (var i = 0; i < frames; i++) {
      tieups.push([]);
      for (var j = 0; j < treadles; j++) {
        tieups[i].push(false);
      }
    }

    var indexOfLabel = e.search("TIEUP]");
    var startIndex = indexOfLabel + "TIEUP]".length+1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar)+startIndex;
    var line = e.substring(startIndex, endIndex);

    while (line.match(/[0-9]*=[0-9]*/) != null) {
      var treadle = +(line.match(/[0-9]*/));
      var firstFrame = +(line.match(/=[0-9]*/)[0].substring(1));
      tieups[frames-firstFrame][treadle-1] = true;
      var restOfFrames = line.match(/,[0-9]/g);
      if(restOfFrames != null) {
        for (var i = 0; i < restOfFrames.length; i++) {
          var currentFrame = +(restOfFrames[i].substring(1));
          tieups[frames-currentFrame][treadle-1] = true;
        }
      }
      startIndex = endIndex+1;
      endIndex = e.substring(startIndex).indexOf(endOfLineChar)+startIndex;
      line = e.substring(startIndex,endIndex);
    }

    return tieups;
  }
}
