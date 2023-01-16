import { Component, OnInit, Optional } from '@angular/core';
import { AuthService } from '../provider/auth.service';
import { Auth, authState, createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, signInAnonymously, signInWithEmailAndPassword, signInWithPopup, signOut, User } from '@angular/fire/auth';
import { K } from '@angular/cdk/keycodes';
import { FilesystemService } from '../provider/filesystem.service';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component';

@Component({
  selector: 'app-filebrowser',
  templateUrl: './filebrowser.component.html',
  styleUrls: ['./filebrowser.component.scss']
})
export class FilebrowserComponent implements OnInit {

  
  isLoggedIn = false;

  constructor(
    public files: FilesystemService, 
    public auth: AuthService,
    private dialog: MatDialog) { 

   

  }

  ngOnInit(): void {
    
    
    
  }

  openLoginDialog() {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '600px',
    });
}




  

}
