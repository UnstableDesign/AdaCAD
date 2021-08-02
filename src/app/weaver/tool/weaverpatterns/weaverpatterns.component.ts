import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { PatternModal } from '../../../core/modal/pattern/pattern.modal';
import * as _ from 'lodash';

@Component({
  selector: 'app-weaverpatterns',
  templateUrl: './weaverpatterns.component.html',
  styleUrls: ['./weaverpatterns.component.scss']
})
export class WeaverPatternsComponent implements OnInit {
  

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

    if (!pattern) {
      pattern = this.selection;
      // if(this.selection !== undefined) pattern.setPattern(this.selection);
      console.log(pattern);
    }

    const dialogRef = this.dialog.open(PatternModal, 
      {data: pattern });

    dialogRef.afterClosed().subscribe(result => {
      
      console.log("clsoed resultl", result);

      if(result !== null && result !== undefined){

        if(result.id == -1){
          result.id = this.patterns.length;
          this.patterns.push(result);

        }else{
          this.patterns[result.id] = result;
        }


      }
      
    //   if (!create) {
    //     console.log(result);
    //     this.patterns[result.id] = result;
    //   } else {
    //     this.onCreatePattern.emit({pattern: result});
    //   }

    //   var obj: any = {};
    //   obj.patterns = _.cloneDeep(this.patterns);
    //   this.onPatternChange.emit(obj);
     });
  }

  print(e) {
    console.log(e);
  }

  fill(id){
    this.onFill.emit(id);

  }




}



