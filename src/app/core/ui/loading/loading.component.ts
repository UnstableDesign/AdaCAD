import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';

@Component({
  selector: 'app-loading',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss'
})
export class LoadingComponent {

  name: string = '';
  data = inject(MAT_DIALOG_DATA);
  dialogRef = inject<MatDialogRef<LoadingComponent>>(MatDialogRef);


  constructor() {
    this.name = this.data.name;
  }

}
