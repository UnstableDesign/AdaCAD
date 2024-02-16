import { Component, Inject, OnInit } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { Bounds } from '../../../core/model/datatypes';


@Component({
  selector: 'app-snackbar',
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.scss']
})
export class SnackbarComponent implements OnInit {

  bounds: Bounds;
  message: string;
  scale: number;

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) { 
    this.bounds = data.bounds;
    this.message = data.message;
    this.scale = data.scale;
  }

  ngOnInit() {
  }

}
