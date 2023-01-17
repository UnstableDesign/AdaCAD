import { Component, EventEmitter, OnInit, Optional, Output } from '@angular/core';
import { AuthService } from '../provider/auth.service';
import { Auth, authState, createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, signInAnonymously, signInWithEmailAndPassword, signInWithPopup, signOut, User } from '@angular/fire/auth';
import { K } from '@angular/cdk/keycodes';
import { FilesystemService } from '../provider/filesystem.service';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component';
import { InitModal } from '../modal/init/init.modal';


@Component({
  selector: 'app-filebrowser',
  templateUrl: './filebrowser.component.html',
  styleUrls: ['./filebrowser.component.scss']
})
export class FilebrowserComponent implements OnInit {

  @Output() onLoadNewFile: any = new EventEmitter();
  @Output() onClearScreen: any = new EventEmitter();
  @Output() onSave: any = new EventEmitter();

  
  isLoggedIn = false;

  constructor(
    public files: FilesystemService, 
    public auth: AuthService,
    private dialog: MatDialog) { 

   

  }

  ngOnInit(): void {
    
    
    
  }

  rename(){
    this.files.renameCurrentFile(this.files.current_file_name);
  }

  remove(fileid: number){
    console.log("removing ", fileid)
    this.files.removeFile(fileid);
  }


  public saveAsBmp() {
    var obj: any = {
      type: "bmp"
    }
    console.log(obj);
  	this.onSave.emit(obj);
  }

  public saveAsAda() {
    var obj: any = {
      type: "ada"
    }
    console.log(obj);
    this.onSave.emit(obj);
  }

  public saveAsWif() {
    var obj: any = {
      type: "wif"
    }
    this.onSave.emit(obj);
  }

  public saveAsPrint() {
    var obj: any = {
      type: "jpg"
    }
    this.onSave.emit(obj);
  }


   //need to handle this and load the file somehow
   openNewFileDialog() {


    const dialogRef = this.dialog.open(InitModal, {
      data: {}
    });

    dialogRef.afterClosed().subscribe(loadResponse => {
      if(loadResponse !== undefined) this.onLoadNewFile.emit(loadResponse);

   });
  }



openLoginDialog() {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '600px',
    });
}

onNewWorkspace(){
  this.onClearScreen.emit();
}




  

}
