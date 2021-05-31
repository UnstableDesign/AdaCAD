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
  @Output() onReInit: any = new EventEmitter();

  @Input() drawer;
  @Input() filename;
  @Input() timeline;
  @Input() undoItem;
  @Input() redoItem;
  @Input() draftelement;
  @Input() loomtypes;
  @Input() density_units;
  
  @ViewChild('bmpLink', {static: true}) bmpLink: any;
  @ViewChild('adaLink', {static: true}) adaLink: any;
  @ViewChild('wifLink', {static: true}) wifLink: any;
  @ViewChild('printLink', {static: true}) printLink: any;

  downloadBmp: ElementRef;
  downloadAda: ElementRef;
  downloadWif: ElementRef;
  downloadPrint: ElementRef;


  constructor(private dialog: MatDialog) { }


  ngOnInit() {
    this.downloadBmp = this.bmpLink._elementRef;
    this.downloadAda = this.adaLink._elementRef;
    this.downloadWif = this.wifLink._elementRef;
    this.downloadPrint = this.printLink._elementRef;
  }

  public saveAsBmp(e: any) {
    var obj: any = {
      name: this.filename,
      downloadLink: this.downloadBmp,
      type: "bmp"
    }
    console.log(obj);
  	this.onSave.emit(obj);
  }

  public saveAsAda(e: any) {
    var obj: any = {
      name: this.filename,
      downloadLink: this.downloadAda,
      type: "ada"
    }
    console.log(obj);
    this.onSave.emit(obj);
  }

  public saveAsWif(e: any) {
    var obj: any = {
      name: this.filename,
      downloadLink: this.downloadWif,
      type: "wif"
    }
    console.log(obj);
    this.onSave.emit(obj);
  }

  public saveAsPrint(e: any) {
    var obj: any = {
      name: this.filename,
      downloadLink: this.downloadPrint,
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
      data: {loomtypes: this.loomtypes, density_units: this.density_units}
    });

     dialogRef.afterClosed().subscribe(result => {
      
      if(result !== undefined) this.onReInit.emit(result);
      

   });

  }



}
