import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss'
})
export class WelcomeComponent {
  constructor(public dialogRef: MatDialogRef<WelcomeComponent>) { 
    
  }

  loadOlderBeta(){
    window.location.href = "https://adacad-beta-fa4dc.web.app/";
  }
}
