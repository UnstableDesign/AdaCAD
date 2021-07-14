import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-finetune',
  templateUrl: './finetune.component.html',
  styleUrls: ['./finetune.component.scss']
})
export class FinetuneComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<FinetuneComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any) { 

  }

  ngOnInit() {
  }

}

