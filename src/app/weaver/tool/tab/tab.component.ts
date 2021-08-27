import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';
import { ChangeDetectorRef } from '@angular/core';
import { CollectionService } from '../../../core/provider/collection.service';



@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss']
})


export class TabComponent implements OnInit {
  @Input()  collapsed;
  @Input() collections;
  @Input() collection;
  @Output() onCollectionNamesChange: any = new EventEmitter();
  @Output() onGenerativeModeChange: any = new EventEmitter();


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

}
