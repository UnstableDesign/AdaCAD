import { Component, OnInit, Optional } from '@angular/core';
import { AuthService } from '../provider/auth.service';
import { Auth, authState, createUserWithEmailAndPassword, GoogleAuthProvider, signInAnonymously, signInWithEmailAndPassword, signInWithPopup, signOut, User } from '@angular/fire/auth';
import { K } from '@angular/cdk/keycodes';
import { FilesystemService } from '../provider/filesystem.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-filebrowser',
  templateUrl: './filebrowser.component.html',
  styleUrls: ['./filebrowser.component.scss']
})
export class FilebrowserComponent implements OnInit {

  
  constructor(public files: FilesystemService, private auth: AuthService) { 

   

  }

  ngOnInit(): void {
    
     

   
    
  }



  

}
