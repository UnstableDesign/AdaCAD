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
  @Input() patterns;
  @Output() onChange: any = new EventEmitter();
  @Output() onCreatePattern: any = new EventEmitter();
  @Output() onRemovePattern: any = new EventEmitter();
  constructor(private dialog: MatDialog) { 
  }

  ngOnInit() {

  }

  openDialog(pattern) {
    console.log("open dialog")
    var create = false;

    if (!pattern) {
      pattern = new Pattern();
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
      this.onChange.emit(obj);
    });
  }

  print(e) {
    console.log(e);
  }

  updateFavorite(p) {

    this.patterns[p].favorite = !this.patterns[p].favorite;

    var obj:any = {};
    obj.patterns = _.cloneDeep(this.patterns);

    this.onChange.emit(obj);
  }


  removePattern(pattern) {
    console.log("remove pattern", pattern);
    this.onRemovePattern.emit({pattern: pattern});
  }

}



