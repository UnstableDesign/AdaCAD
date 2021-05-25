import { Component, OnInit, Inject } from '@angular/core';
import {MAT_SNACK_BAR_DATA} from '@angular/material/snack-bar';
import { Draft } from '../../../core/model/draft';
import { SelectionComponent } from '../selection/selection.component';
import { SubdraftComponent} from '../subdraft/subdraft.component'

@Component({
  selector: 'app-snackbar',
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.scss']
})
export class SnackbarComponent implements OnInit {

  subdraft: SubdraftComponent|SelectionComponent;

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: SubdraftComponent|SelectionComponent) { 
    this.subdraft = data;
  }

  ngOnInit() {
  }

}
