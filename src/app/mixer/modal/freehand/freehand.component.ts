import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { OpHelpModal } from '../ophelp/ophelp.modal';

@Component({
  selector: 'app-freehand',
  templateUrl: './freehand.component.html',
  styleUrls: ['./freehand.component.scss']
})
export class FreehandComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<FreehandComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any) { 

  }

  ngOnInit() {
  }

}
