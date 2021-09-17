import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Cell } from '../../../core/model/cell';
import * as _ from 'lodash';
import { Pattern } from '../../../core/model/pattern';
import { PatternService } from '../../provider/pattern.service';

@Component({
  selector: 'app-pattern-modal',
  templateUrl: './pattern.modal.html',
  styleUrls: ['./pattern.modal.scss']
})
export class PatternModal implements OnInit {

  /**
   * stores a copy of the submitted pattern, so as not to upddate the original
   */
  patterns: Array<Pattern>;

  constructor(
             private ps:PatternService,
             private dialogRef: MatDialogRef<PatternModal>,
             @Inject(MAT_DIALOG_DATA) public data: Pattern) {

              this.patterns =  ps.getPatterns().map(el => _.cloneDeep(el));


              }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close(this.patterns);
  }

  close() {
    this.dialogRef.close(this.patterns);
  }

  save() {
    this.dialogRef.close(this.patterns);
  }

  updatePatternSize(id: number) {
   


    //initalize a new array of size pattern
    var pattern = this.patterns[id];

    console.log(this.patterns, pattern, id);
    var heddles = [];
    for (var i = 0; i < pattern.height; i++) {
      heddles.push([]);
      for (var j = 0; j < pattern.width; j++) {
        heddles[i][j] = new Cell(false);
        if(i < pattern.pattern.length && j < pattern.pattern[0].length){
          heddles[i][j].setHeddle(pattern.pattern[i][j].getHeddle());
        }
      }
    }


    this.patterns[id].pattern = _.cloneDeep(heddles);
    this.patterns[id].width = pattern.width;
    this.patterns[id].height = pattern.height;
    this.ps.setPattern(id, this.patterns[id]);


  }


}
