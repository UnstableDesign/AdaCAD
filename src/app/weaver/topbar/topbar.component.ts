import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit {
  
  @Output() onSave: any = new EventEmitter();
  @Output() onUndo: any = new EventEmitter();
  @Output() onRedo: any = new EventEmitter();

  @Input() undoItem;
  @Input() redoItem;

  @ViewChild('downloadLink', {static: true}) anchor: any;
  downloadLink: ElementRef;

  constructor() { }

  ngOnInit() {
    this.downloadLink = this.anchor._elementRef;
  }

  public saveClicked(e: any) {
    var obj: any = {
      downloadLink: this.downloadLink,
    }
  	this.onSave.emit(obj);
  }

  undoClicked(e:any) {
    this.onUndo.emit();
  }

  redoClicked(e:any) {
    this.onRedo.emit();
  }

}
