import { Component, OnInit } from '@angular/core';
import { AuthService } from '../provider/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  uid: string;

  constructor(private authService: AuthService) { 

    console.log("getting name", authService.getUid())
    this.uid = authService.getUid();

  }

  ngOnInit() {



  }


  signOut() {
    this.authService.logout();
  }

}
