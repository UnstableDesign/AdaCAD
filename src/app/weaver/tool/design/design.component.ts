import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';



@Component({
  selector: 'app-design',
  templateUrl: './design.component.html',
  styleUrls: ['./design.component.scss']
})


export class DesignComponent implements OnInit {
  @Input() collapsed;
  @Input() brush;
  @Input() favorites;
  @Output() onBrushChange: any = new EventEmitter();
  @Output() onFill: any = new EventEmitter();
  @Output() onPaste: any = new EventEmitter();
  @Output() onCopy: any = new EventEmitter();
  @Output() onClear: any = new EventEmitter();
  @Input()  patterns;
  @Input()  selection;
  @Output() onPatternChange: any = new EventEmitter();
  @Output() onCreatePattern: any = new EventEmitter();
  @Output() onRemovePattern: any = new EventEmitter();
  @Output() onChange: any = new EventEmitter();

  

  selected = 0;

  constructor(private dialog: MatDialog) { 
  }

  ngOnInit() {

  }


  toggleChange(e: any) {
    if(e.checked) this.brush = "select";
    else{
      this.brush = "point";
    }

    var obj: any = {};
    obj.name = this.brush;
    this.onBrushChange.emit(obj);
  }

  brushChange(e: any) {

    console.log(e.target.name);



     if(this.brush !== "select" || e.target.name == "copy"){

        if (e.target.name) {
          this.brush = e.target.name;
        }

        var obj: any = {};
        obj.name = this.brush;
        this.onBrushChange.emit(obj);
     }else{

      if(e.target.name == "point") this.clearEvent(true);
      else if(e.target.name == "erase") this.clearEvent(false);
      else if(e.target.name == "invert") this.pasteEvent(e, 'invert');
     }
  }

  fillEvent(e, id) {
    var obj: any = {};
    obj.id = id;
    this.onFill.emit(obj);
  }

  // copyEvent(e) {
  //   this.onCopy.emit();
  // }

  clearEvent(b:boolean) {
    this.onClear.emit(b);
  }

  pasteEvent(e, type) {
    var obj: any = {};
    obj.type = type;
    this.onPaste.emit(obj);
  }

















}
