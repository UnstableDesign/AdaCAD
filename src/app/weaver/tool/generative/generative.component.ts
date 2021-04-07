import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
    selector: 'app-generative',
    templateUrl: './generative.component.html',
    styleUrls: ['./generative.component.scss']
  })

export class GenerativeComponent implements OnInit {
    @Output() onGenerativeModeChange: any = new EventEmitter();

    //Temporary data structures until db access
    collections = []
    collection: any;
    mode = false;

    constructor() {
        this.collection = {name: 'German Drafts'};
        this.collections.push(this.collection);
    }

    ngOnInit() {
    }

    modeEvent(e:any) {
        this.mode = !this.mode;
        this.onGenerativeModeChange.emit(e);
    }
}