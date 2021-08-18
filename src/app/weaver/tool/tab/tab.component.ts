import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';
import { Console } from 'console';



@Component({
    selector: 'app-tab',
    templateUrl: './tab.component.html',
    styleUrls: ['./tab.component.scss']
  })
  
  
  export class TabComponent implements OnInit {
  @Input()  collapsed;
  @Input()  design_mode;
  @Input()  design_modes;
  @Input()  design_actions;
  @Input()  view_mode;
  @Input()  materials;
  @Input()  patterns;
  @Input()  selection;
  @Input() collection;
  @Input() collections = [];
  constructor(private dialog: MatDialog) { 
    this.collection = {name: 'German Drafts'};
    this.collections.push(this.collection);
  }

  openAboutDialog() {
    const dialogRef = this.dialog.open(MlModal);
    
  
  }

  openNewFileDialog() {

  }

  openMlModal(event: any){
    console.log("I have been clicked!", event)


  }
    ngOnInit() {

    }
  }

   
