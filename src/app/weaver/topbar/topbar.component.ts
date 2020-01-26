import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit {
  
  @Output() onSave: any = new EventEmitter();
  downloadLink: ElementRef;

  constructor() { }

  ngOnInit() {
    @ViewChild('downloadLink') anchor: any;
    this.downloadLink = this.anchor._elementRef;
  }

  public saveClicked(e: any) {
    var obj: any = {
      downloadLink: this.downloadLink,
    }
  	this.onSave.emit(obj);
  }

}
