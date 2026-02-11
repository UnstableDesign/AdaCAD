import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
  imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatButton, MatDialogActions, MatDialogClose]
})
export class WelcomeComponent {
  dialogRef = inject<MatDialogRef<WelcomeComponent>>(MatDialogRef);


  loadOlderBeta(version: string) {
    //    window.location.href = "https://adacad-beta-fa4dc.web.app/";
    if (version === 'v3') {
      window.location.href = "https://version3.adacad.org";
    } else if (version === 'v4') {
      window.location.href = "https://version4.adacad.org";
    }
  }


  loadDocs() {
    window.open('https://docs.adacad.org/docs/learn/tutorials/', '_blank');

  }
}
