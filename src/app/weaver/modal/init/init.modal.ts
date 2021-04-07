import { Component, OnInit, Input, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { color } from 'd3';
import { rest } from 'lodash';
import { Loom } from '../../../core/model/loom';
import { Shuttle } from "../../../core/model/shuttle";


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


  // opts: StartOptions[] = [
  //     {value: 'new', viewValue: 'Begin New Draft'},
  //     {value: 'ada', viewValue: 'Load an AdaCAD (.ada) File'},
  //     {value: 'bmp', viewValue: 'Load a Bitmap (.bmp) File'},
  //     {value: 'wif', viewValue: 'Load a WIF (.wif) File'}
  //   ];
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
  draft: any = {};
  loomtypes: any;
  density_units: any;


  constructor(private dialogRef: MatDialogRef<InitModal>, 
    @Inject(MAT_DIALOG_DATA) private data: any) {
      console.log(data);
      this.loomtypes = data.loomtypes;
      this.density_units = data.density_units;
  }

  ngOnInit() {

  }

  handleFile(e: any) {

    if (e.type === "image") this.processImageData(e);
    else if (e.type === "ada") this.processDraftData(e);
    else if (e.type === "wif") this.processWifData(e);
    this.valid = true;

  }

  processImageData(obj: any) {

    let e = obj.data;

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

    this.draft.name = obj.name;
    this.draft.pattern = data;
  }

  processDraftData(obj: any) {

   // this.form.type = "update";
    this.draft = obj.data; //this is the data from the upload event
    this.draft.name = obj.name;
  }

  processWifData(obj: any) {
    let e = obj.data;

    var stringWithoutMetadata = this.getSubstringAfter("CONTENTS", e);
    this.draft.warps = this.getInt("Threads",this.getSubstringAfter("WARP]",stringWithoutMetadata));
    this.draft.wefts = this.getInt("Threads",this.getSubstringAfter("WEFT]",stringWithoutMetadata));
    var data = [];

    for (var i = 0; i < this.draft.wefts; i++) {
      data.push([]);
      for (var j = 0; j < this.draft.warps; j++) {
        data[i].push(false);
      }
    }
    this.draft.pattern = data;
    this.draft.name = obj.name;

    //LD comment - this might be causing a problem as the draft object is in charge of constructing the loom
    //I think its better to have draft declare it because that way it will work with adaCAD uploads 
    //what you can do instead is make a draft.loom = {} and and add relevant feilds to that, then they will be fed into the constructor
    this.draft.loom = new Loom('frame', this.draft.wefts, this.draft.warps, this.getInt("Shafts", e),this.getInt("Treadles", e));

    if (this.getBool("TREADLING", stringWithoutMetadata)) {
      var treadling = this.getTreadling(stringWithoutMetadata);
      this.draft.loom.treadling = treadling;
      this.draft.visibleRows = [];
      for (var i = 0; i < this.draft.wefts; i++) {
        this.draft.visibleRows.push(i);
      }
    }
    if (this.getBool("THREADING", stringWithoutMetadata)) {
      var threading = this.getThreading(stringWithoutMetadata);
      this.draft.loom.threading = threading;
    }
    if (this.getBool("TIEUP", e)) {
      var tieups = this.getTieups(stringWithoutMetadata);
      this.draft.loom.tieup = tieups;

    }
    if (this.getBool("COLOR TABLE",e)) {
      if (this.getString("Form", e) === "RGB") {
        var color_table = this.getColorTable(e);
        var rowToShuttleMapping = this.getRowToShuttleMapping(e);
        var colToShuttleMapping = this.getColToShuttleMapping(e);
        var shuttles = color_table;
        var warp_systems = color_table;
        this.draft.shuttles = shuttles;
        this.draft.warp_systems = warp_systems;
        this.draft.rowShuttleMapping = rowToShuttleMapping;
        this.draft.colShuttleMapping = colToShuttleMapping;
      }
    }
  }

  onNoClick(): void {
    console.log("onNoClick", this.draft);
    //this.dialogRef.close(this.draft);
  }


  //this might come in with data processed from the init form, 
  save(f) {

    console.log(this.draft);

    var warps = 20;
    if(f.value.warps !== undefined) warps = f.value.warps;
    if(this.draft.warps !== undefined) warps = this.draft.warps;


    var wefts = 20;
    if(f.value.wefts !== undefined) wefts = f.value.wefts;
    if(this.draft.wefts !== undefined) wefts = this.draft.wefts;
    //set default values
    
    var loomtype = "jacquard";
    if(f.value.loomtype !== undefined || f.value.loomtype) loomtype = f.value.loomtype;


   // var loomtype = (f.value.loomtype === undefined || !f.value.loomtype) ? "frame" : f.value.loomtype;
    var frame_num = (f.value.frame_num === undefined) ? 2 : f.value.frame_num;
    var treadle_num = (f.value.treadle_num === undefined) ? 2 : f.value.treadle_num;
    
    var epi = (f.value.epi === undefined) ? 10 : f.value.epi;
    var units = (f.value.units === undefined || ! f.value.units) ? "in" : f.value.units;

    this.draft.warps = warps;
    this.draft.wefts = wefts;

    
    if(this.draft.render === undefined){
      this.draft.render = {};
      if(loomtype === "frame") this.draft.render.view_frames = true;
      else this.draft.render.view_frames = false;
    }

    if(this.draft.loom === undefined){

      this.draft.loom = {};
      this.draft.loom.type = loomtype;
      this.draft.loom.min_frames = frame_num;
      this.draft.loom.num_frames = frame_num;
      this.draft.loom.min_treadles = treadle_num;
      this.draft.loom.num_treadles = treadle_num;
    }   
   
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

  getString(val, e) {
    var index = e.search(val);
    if (index != -1) {
      var substring = e.substring(index, e.length);
      var endOfLineChar = '\n';
      var endIndex = substring.indexOf(endOfLineChar);
      if (endIndex != -1) {
        return substring.substring(val.length+1, endIndex);
      } else {
        return "";
      }
    } else {
      return "";
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
      threading[this.draft.warps - warp] = frame-1;
      startIndex = endIndex+1;
      endIndex = e.substring(startIndex).indexOf(endOfLineChar)+startIndex;
      line = e.substring(startIndex,endIndex);
    }

    return threading;
  }

  getTieups(e) {
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
      tieups[firstFrame-1][treadle-1] = true;
      var restOfFrames = line.match(/,[0-9]/g);
      if(restOfFrames != null) {
        for (var i = 0; i < restOfFrames.length; i++) {
          var currentFrame = +(restOfFrames[i].substring(1));
          tieups[currentFrame-1][treadle-1] = true;
        }
      }
      startIndex = endIndex+1;
      endIndex = e.substring(startIndex).indexOf(endOfLineChar)+startIndex;
      line = e.substring(startIndex,endIndex);
    }
    
    // var color = "=220,20,60";

    // var colorR = color.match(/=[0-9]*/);
    // var colorsGB = color.match(/,[0-9]*/g);
  
    // var colorRNum = +(colorR[0].substring(1,));
    // var colorGNum = +(colorsGB[0].substring(1,));
    // var colorBNum = +(colorsGB[1].substring(1,));

    // var hex = "0x";
    // hex += colorRNum.toString(16);
    // hex += colorGNum.toString(16);
    // hex += colorBNum.toString(16);


      
    return tieups;
  }

  //can likely simplify this as it is mostlyy like the function above but with different variable names for the respective applications
  getColorTable(e) {
    var color_table = [];
    var originalShuttle = new Shuttle();
    originalShuttle.setColor("#3d3d3d");
    color_table.push(originalShuttle);

    var indexOfLabel = e.search("COLOR TABLE]");
    var startIndex = indexOfLabel + "COLOR TABLE]".length+1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar)+startIndex;
    var line = e.substring(startIndex, endIndex);

    while (line.match(/[0-9]*=[0-9]*,[0-9]*,[0-9]*/) != null) {
      // var index = +(line.match(/[0-9]*/));
      var redNum = +(line.match(/=[0-9]*/)[0].substring(1));
      var greenAndBlue = line.match(/,[0-9]*/g);
      var greenNum = +(greenAndBlue[0].substring(1));
      var blueNum = +(greenAndBlue[1].substring(1));

      var hex = "#";
      var hexr = redNum.toString(16);
      if(hexr.length ==1 ){
        hex += "0"+hexr;
      } else {
        hex += hexr;
      }
      var hexg= greenNum.toString(16);
      if(hexg.length ==1 ){
        hex += "0"+hexg;
      } else {
        hex += hexg;
      }
      var hexb= blueNum.toString(16);
      if(hexb.length ==1 ){
        hex += "0"+hexb;
      } else {
        hex += hexb;
      }

      var shuttle = new Shuttle();
      shuttle.setColor(hex);

      color_table.push(shuttle);

      startIndex = endIndex+1;
      endIndex = e.substring(startIndex).indexOf(endOfLineChar)+startIndex;
      line = e.substring(startIndex,endIndex);
    }
    return color_table;
  }

  getColToShuttleMapping(e) {
    var colToShuttleMapping = [];

    for (var i = 0; i < this.draft.warps; i++) {
      colToShuttleMapping.push(0);
    }

    var indexOfLabel = e.search("WARP COLORS]");
    var startIndex = indexOfLabel + "WARP COLORS]".length+1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar)+startIndex;
    var line = e.substring(startIndex, endIndex);

    while (line.match(/[0-9]*=[0-9]*/) != null) {
      var warp = +(line.match(/[0-9]*/));
      var color = +(line.match(/=[0-9]*/)[0].substring(1));
      colToShuttleMapping[warp-1] = color;
      startIndex = endIndex+1;
      endIndex = e.substring(startIndex).indexOf(endOfLineChar)+startIndex;
      line = e.substring(startIndex,endIndex);
    }

    return colToShuttleMapping;
  }

  getRowToShuttleMapping(e) {
    var rowToShuttleMapping = [];

    for (var i = 0; i < this.draft.wefts; i++) {
      rowToShuttleMapping.push(0);
    }

    var indexOfLabel = e.search("WEFT COLORS]");
    var startIndex = indexOfLabel + "WEFT COLORS]".length+1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar)+startIndex;
    var line = e.substring(startIndex, endIndex);

    while (line.match(/[0-9]*=[0-9]*/) != null) {
      var weft = +(line.match(/[0-9]*/));
      var color = +(line.match(/=[0-9]*/)[0].substring(1));
      rowToShuttleMapping[weft-1] = color;
      startIndex = endIndex+1;
      endIndex = e.substring(startIndex).indexOf(endOfLineChar)+startIndex;
      line = e.substring(startIndex,endIndex);
    }

    return rowToShuttleMapping;
  }
}
