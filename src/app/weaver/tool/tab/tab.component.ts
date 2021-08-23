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

  clusters: any = [];
  
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
        this.clusters = value;
        var centroids = [];
        var clusters = [];
        this.clusters.forEach(element => {
          centroids.push(element.centroid);
          clusters.push(element.cluster);
        });
        var obj: any = {};
        obj.centroids = centroids;
        obj.clusters = clusters;
        console.log('this.collection.name;', this.collection.name);
        obj.collection = this.collection.name;
        this.onGenerativeModeChange.emit(obj);

      })
    }
  }
 
  // generativeModeEvent(e:any) {
  //   this.generativeMode = !this.generativeMode;
  //   this.onGenerativeModeChange.emit(e);
  // }


}
