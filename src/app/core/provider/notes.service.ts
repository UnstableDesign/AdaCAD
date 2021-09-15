import { Injectable } from '@angular/core';
import { Bounds, Interlacement } from '../model/datatypes';


export interface Note{
  id: number,
  interlacement: Interlacement; 
  text: string;
 }

@Injectable({
  providedIn: 'root'
})
export class NotesService {


  notes: Array<Note>;
  


  constructor() { 

    this.notes = [];
  }

  createBlankNode(i: Interlacement) : Note{
    const note: Note = {
      id: this.notes.length,
      interlacement: i,
      text: "" 
    }

    this.notes.push(note);
    return note;
  
  }

  exportForSaving(): Array<Note>{
    return this.notes;
  }

  resetNotes(){
    this.notes = [];
  }

  /** called on load file  */
  reloadNotes(ns: Array<Note>){

    this.notes = [];

    if(typeof(ns) == "string") return;
    this.notes = ns;
  }

  get(id: number) : Note {
    return this.notes[id];
  }
}
