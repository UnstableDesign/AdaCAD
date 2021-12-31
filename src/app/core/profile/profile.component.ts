import { Component, OnInit } from '@angular/core';
import { AuthService } from '../provider/auth.service';
import { AngularFireStorage } from '@angular/fire/storage';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  uid: string;

  constructor(private authService: AuthService, db: AngularFireStorage) { 

    console.log("getting name", authService.getUid())
    this.uid = authService.getUid();

  }

  ngOnInit() {



  }


  signOut() {
    this.authService.logout();
  }

}
