import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-image',
    templateUrl: './image.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./image.component.scss']
})
export class ImageComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
