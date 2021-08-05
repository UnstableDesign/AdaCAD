import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';



@Component({
  selector: 'app-weaverdesign',
  templateUrl: './weaverdesign.component.html',
  styleUrls: ['./weaverdesign.component.scss']
})


export class WeaverDesignComponent implements OnInit {
  @Input()  collapsed;
  @Input()  design_mode;
  @Input()  design_modes;
  @Input()  design_actions;
  @Input()  view_mode;
  @Input()  materials;
  @Input()  patterns;
  @Input()  selection;
  @Output() onDesignModeChange: any = new EventEmitter();
  @Output() onFill: any = new EventEmitter();
  @Output() onPaste: any = new EventEmitter();
  @Output() onCopy: any = new EventEmitter();
  @Output() onClear: any = new EventEmitter();
  @Output() onPatternChange: any = new EventEmitter();
  @Output() onCreatePattern: any = new EventEmitter();
  @Output() onRemovePattern: any = new EventEmitter();

  selected_mode:string;
  selected = 0;

  constructor(private dialog: MatDialog) { 
  }

  ngOnInit() {
    this.selected_mode = this.design_modes.name;

  }


  // toggleChange(e: any) {
  //   // if(e.checked) this.brush = "select";
  //   // else{
  //   //   this.brush = "point";
  //   // }

  //   // var obj: any = {};
  //   // obj.name = this.brush;
  //   // this.onBrushChange.emit(obj);
  // }

  select(){
    var obj: any = {};
    this.selected_mode = "select";
     obj.name = "select";
     this.onDesignModeChange.emit(obj);
  }

  designModeChange(name: string) {

    console.log("mode change", name);
    this.selected_mode = 'draw';
     var obj: any = {};
     obj.name = name;
     this.onDesignModeChange.emit(obj);
  }

  drawWithMaterial(material_id: number){
    this.selected_mode = 'material';
    var obj: any = {};
    obj.name = this.selected_mode;
    obj.id = material_id;
    this.onDesignModeChange.emit(obj);
  }

  designActionChange(e){
    console.log("design action", e.target.name);

    switch(e.target.name){
      case 'up': this.clearEvent(true);
      break;

      case 'down': this.clearEvent(false);
      break;

      case 'copy': this.copyEvent(e);
      break;

      case 'paste': this.pasteEvent(e, 'original');
      break;

      case 'toggle': this.pasteEvent(e, 'invert');
      break;

      case 'flip_x': this.pasteEvent(e, 'mirrorX');
      break;

      case 'flip_y': this.pasteEvent(e, 'mirrorY');
      break;

      case 'shift_left': this.pasteEvent(e, 'shiftLeft');
      break;

      case 'shift_up': this.pasteEvent(e, 'shiftUp');
      break;

    }
  }

  fillEvent(id) {
    var obj: any = {};
    obj.id = id;
    this.onFill.emit(obj);
  }

  copyEvent(e) {
    this.onCopy.emit();
  }

  clearEvent(b:boolean) {
    this.onClear.emit(b);
  }

  pasteEvent(e, type) {
    var obj: any = {};
    obj.type = type;
    this.onPaste.emit(obj);
  }


  updatePatterns(obj: any){
    this.onPatternChange.emit(obj);
  }

  removePattern(pattern) {
    this.onRemovePattern.emit(pattern);
  }


  createPattern(obj){
    this.onCreatePattern.emit(obj);
  }




















}
