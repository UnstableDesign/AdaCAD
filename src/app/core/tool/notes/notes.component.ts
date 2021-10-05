import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent implements OnInit {


  @Input() notes;
  @Output() onChange: any = new EventEmitter();


  constructor() { }

  ngOnInit() {
  }


  notesValueChanged(){
  	console.log("notes", this.notes);
  	this.onChange.emit(this.notes);

  }

}
