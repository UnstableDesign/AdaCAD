import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MlModal } from '../../../core/modal/ml/ml.modal';
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';
import { ChangeDetectorRef } from '@angular/core';
import { Draft } from '../../../core/model/draft';
import { CollectionService } from '../../../core/provider/collection.service';



@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss']
})


export class TabComponent implements OnInit {

  @Input() generated_drafts : Array<Draft>;
  @Output() onGenerativeModeChange: any = new EventEmitter();
  @Output() onDraftSelected: any = new EventEmitter();
  @Output() onCollectionNamesChange: any = new EventEmitter();
  @Input() collection;
  @Input() collections;
  @Input()  collapsed;


  button_color = "#ff4081";


  selected = 0;

  generativeMode = false;

  collectionsData: any = [];
  
  centroids: any = [];


  constructor(private ref: ChangeDetectorRef, private dialog: MatDialog, private collectionSrvc: CollectionService) { 
    this.collections = [];
    this.collection = {name: ""};
    collectionSrvc.getCollectionNames().then((value) => {
      this.collections = value;
      this.collection = this.collections[0];
    })
  }

  ngOnInit() {

  }

  generativeModeChange() {
    this.generativeMode = !this.generativeMode;
    if (this.generativeMode) {
      var allLowerCollectionName = this.collection.name.charAt(0).toLowerCase() + this.collection.name.slice(1)
      this.collectionSrvc.getCollection(allLowerCollectionName).then((value) => {
        this.collectionsData = value;
        var obj: any = {};
        obj.collection = this.collection.name;
        obj.warpSize = this.collectionsData.warpSize;
        obj.weftSize = this.collectionsData.weftSize;
        this.onGenerativeModeChange.emit(obj);

      })
    }
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
