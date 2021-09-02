import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MlModal } from '../../../core/modal/ml/ml.modal';
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';
import { Draft } from '../../../core/model/draft';



@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss']
})


export class TabComponent implements OnInit {

  @Input() generated_drafts : Array<Draft>;
  @Output() onGenerativeModeChange: any = new EventEmitter();
  @Output() onDraftSelected: any = new EventEmitter();


  button_color = "#ff4081";


  selected = 0;

 
  collections = []
  collection: any;
  generativeMode = false;

  constructor(private dialog: MatDialog) { 
    this.collection = {name: 'German Drafts'};
    this.collections.push(this.collection);
  }

  ngOnInit() {

  }

  generativeModeEvent(e:any) {
    this.generativeMode = !this.generativeMode;
    this.onGenerativeModeChange.emit(e);
  }

  openMlDialog() {
    const dialogRef = this.dialog.open(MlModal);

  }

  loadGeneratedDraft(id: number){
    console.log('hi'+id);
    //scan through generated_dafts and get the one with this id. 
    const draft: Draft = this.generated_drafts.find(el => el.id == id);

    //emit that draft ot the parent and tell the parent to load it. 
    if(draft != undefined) this.onDraftSelected.emit(draft);


  }
}
