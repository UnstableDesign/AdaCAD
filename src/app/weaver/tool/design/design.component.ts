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


  selected = 0;


  copy = false;

  constructor(private dialog: MatDialog) { 
  }

  ngOnInit() {

  }

  brushChange(e: any) {
     if (e.target.name) {
      this.brush = e.target.name;
    }

    var obj: any = {};
    obj.name = this.brush;
    this.onBrushChange.emit(obj);
  }

  fillEvent(e, id) {
    var obj: any = {};
    obj.id = id;
    this.onFill.emit(obj);
  }

  copyEvent(e) {
    this.onCopy.emit();
    this.copy = true;
  }

  clearEvent(e) {
    this.onClear.emit();
  }



  pasteEvent(e, type) {
    var obj: any = {};
    obj.type = type;
    this.onPaste.emit(obj);
  }

















}
