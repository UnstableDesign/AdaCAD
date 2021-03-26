import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { PatternModal } from '../../modal/pattern/pattern.modal';
import { Pattern } from '../../../core/model/pattern';
import { PatternService } from '../../../core/provider/pattern.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-patterns',
  templateUrl: './patterns.component.html',
  styleUrls: ['./patterns.component.scss']
})
export class PatternsComponent implements OnInit {
  
  all_patterns;

  @Input()  patterns;
  @Input()  selection;
  @Output() onPatternChange: any = new EventEmitter();
  @Output() onCreatePattern: any = new EventEmitter();
  @Output() onRemovePattern: any = new EventEmitter();
  @Output() onFill: any = new EventEmitter();


  
  constructor(private dialog: MatDialog) { 
  }

  ngOnInit() {

  }

  updateFavorite(p) {

    this.patterns[p].favorite = !this.patterns[p].favorite;

    var obj:any = {};
    obj.patterns = _.cloneDeep(this.patterns);

     if(this.selection !== undefined) this.onFill.emit(p);
    this.onPatternChange.emit(obj);
  }


  removePattern(pattern) {
    this.onRemovePattern.emit({pattern: pattern});
  }

  openPatternDialog(pattern) {
    console.log("open dialog", this.selection);
    var create = false;

    if (!pattern) {
      pattern = new Pattern();
      if(this.selection !== undefined) pattern.setPattern(this.selection);

      console.log(pattern);

      create = true;
    }

    const dialogRef = this.dialog.open(PatternModal, 
      {data: pattern });

    dialogRef.afterClosed().subscribe(result => {
      if (!create) {
        this.patterns[result.id] = result;
      } else {
        this.onCreatePattern.emit({pattern: result});
      }

      var obj: any = {};
      obj.patterns = _.cloneDeep(this.patterns);
      this.onPatternChange.emit(obj);
    });
  }

  print(e) {
    console.log(e);
  }


}



