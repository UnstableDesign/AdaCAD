import { Component, OnInit, Inject } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";

import { Pattern } from '../../../core/model/pattern';

@Component({
  selector: 'app-pattern-modal',
  templateUrl: './pattern.modal.html',
  styleUrls: ['./pattern.modal.scss']
})
export class PatternModal implements OnInit {

  constructor(private dialogRef: MatDialogRef<PatternModal>,
             @Inject(MAT_DIALOG_DATA) public pattern: Pattern) { }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close(this.pattern);
  }

  close() {
    this.onNoClick();
  }

  save() {
    this.onNoClick();
  }

  updatePatternSize(e) {
    var pattern = [];
    var h = this.pattern.pattern.length;
    for (var i = 0; i < this.pattern.height; i++) {
      pattern.push([]);
      for (var j = 0; j < this.pattern.width; j++) {
        pattern[i].push(false);
      }
    }

    for (var i = 0; i < this.pattern.pattern.length; i++) {
      for (var j = 0; j < this.pattern.pattern[i].length; j++) {
        pattern[i][j] = this.pattern.pattern[i][j];
      }
    }

    this.pattern.pattern = pattern;
  }

  updatePatternWidth(e) {
    var w = this.pattern.pattern[0].length;
    for (var i = 0; i < this.pattern.height; i++) {
      for (var j = w; j < this.pattern.width; j++) {
        this.pattern.pattern[i].push(false);
      }
    }
  }

}
