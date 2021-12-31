import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { LoginComponent } from '../login/login.component';
import { AboutModal } from '../modal/about/about.modal';
import { InitModal } from '../modal/init/init.modal';
import { AuthService } from '../provider/auth.service';

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

  collapsed: boolean = false;

  constructor(private dialog: MatDialog, public auth: AuthService) { }

  ngOnInit(){
  }

  ngAfterViewInit() {

  }

  public saveAsBmp() {
    var obj: any = {
      name: this.filename,
      type: "bmp"
    }
    console.log(obj);
  	this.onSave.emit(obj);
  }

  public saveAsAda() {
    var obj: any = {
      name: this.filename,
      type: "ada"
    }
    console.log(obj);
    this.onSave.emit(obj);
  }

  public saveAsWif() {
    var obj: any = {
      name: this.filename,
      type: "wif"
    }
    this.onSave.emit(obj);
  }

  public saveAsPrint() {
    var obj: any = {
      name: this.filename,
      type: "jpg"
    }
    this.onSave.emit(obj);
  }

  undoClicked() {
    this.onUndo.emit();
  }

  redoClicked() {
    this.onRedo.emit();
  }

  openAboutDialog() {
    const dialogRef = this.dialog.open(AboutModal);

  }
  openLoginDialog() {
      const dialogRef = this.dialog.open(LoginComponent);
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
