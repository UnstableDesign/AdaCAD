import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-mixerinit',
  templateUrl: './mixerinit.component.html',
  styleUrls: ['./mixerinit.component.scss']
})
export class MixerInitComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<MixerInitComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any) { 

  }

  ngOnInit() {
  }

}

