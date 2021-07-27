import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Cell } from '../../../core/model/cell';
import * as _ from 'lodash';
import { Pattern } from '../../../core/model/pattern';

@Component({
  selector: 'app-pattern-modal',
  templateUrl: './pattern.modal.html',
  styleUrls: ['./pattern.modal.scss']
})
export class PatternModal implements OnInit {

  /**
   * stores a copy of the submitted pattern, so as not to upddate the original
   */
  pattern: Pattern;

  constructor(private dialogRef: MatDialogRef<PatternModal>,
             @Inject(MAT_DIALOG_DATA) public data: Pattern) {

                
              this.pattern = _.cloneDeep(data);


              }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close(this.pattern);
  }

  close() {
    this.dialogRef.close(null);
  }

  save() {
    this.dialogRef.close(this.pattern);
  }

  updatePatternSize(e) {
   

    //initalize a new array of size pattern
    var pattern = [];
    for (var i = 0; i < this.pattern.height; i++) {
      pattern.push([]);
      for (var j = 0; j < this.pattern.width; j++) {
        pattern[i][j] = new Cell(false);
        if(i < this.pattern.pattern.length && j < this.pattern.pattern[0].length){
            pattern[i][j].setHeddle(this.pattern.pattern[i][j].getHeddle());
        }
      }
    }

    // for (var i = 0; i < this.pattern.pattern.length; i++) {
    //   for (var j = 0; j < this.pattern.pattern[i].length; j++) {
       
       
    //     pattern[i][j].setHeddle(this.pattern.pattern[i][j].getHeddle());
    //   }
    // }

    this.pattern.pattern = _.cloneDeep(pattern);
    this.pattern.width = this.pattern.width;
    this.pattern.height = this.pattern.height;

    console.log(this.pattern);

  }


}
