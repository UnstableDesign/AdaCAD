import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { AboutModal } from '../modal/about/about.modal';
import { InitModal } from '../modal/init/init.modal';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})



export class TopbarComponent implements OnInit {
  
  @Output() onSave: any = new EventEmitter();
  @Output() onUndo: any = new EventEmitter();
  @Output() onRedo: any = new EventEmitter();
  @Output() onAboutCreate: any = new EventEmitter();
  @Output() onLoadNewFile: any = new EventEmitter();

  @Input() drawer;
  @Input() filename;
  @Input() timeline;
  @Input() undoItem;
  @Input() redoItem;
  @Input() draftelement;
  @Input() loomtypes;
  @Input() density_units;
  @Input() source; 

  constructor(private dialog: MatDialog) { }

  ngOnInit(){
  }

  ngAfterViewInit() {

  }

  public saveAsBmp(e: any) {
    var obj: any = {
      name: this.filename,
      type: "bmp"
    }
    console.log(obj);
  	this.onSave.emit(obj);
  }

  public saveAsAda(e: any) {
    var obj: any = {
      name: this.filename,
      type: "ada"
    }
    console.log(obj);
    this.onSave.emit(obj);
  }

  public saveAsWif(e: any) {
    var obj: any = {
      name: this.filename,
      type: "wif"
    }
    this.onSave.emit(obj);
  }

  public saveAsPrint(e: any) {
    var obj: any = {
      name: this.filename,
      type: "jpg"
    }
    this.onSave.emit(obj);
  }

  undoClicked(e:any) {
    this.onUndo.emit();
  }

  redoClicked(e:any) {
    this.onRedo.emit();
  }

  openAboutDialog() {
    const dialogRef = this.dialog.open(AboutModal);

  }

  //need to handle this and load the file somehow
  openNewFileDialog() {


    const dialogRef = this.dialog.open(InitModal, {
      data: {loomtypes: this.loomtypes, density_units: this.density_units, source: this.source}
    });

    dialogRef.afterClosed().subscribe(loadResponse => {
      if(loadResponse !== undefined) this.onLoadNewFile.emit(loadResponse);

   });

  }



}
