import { Injectable, ViewRef } from '@angular/core';
import { NoteComponent } from '../../mixer/palette/note/note.component';
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


  //id in array should always match note id. 
  notes: Array<Note>;
  


  constructor() { 


    this.notes = [];
  }

  clear(){
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

  /**
   * gets the note associated with a given id. 
   * @param id 
   * @returns the note object or undefined if not found
   */
  get(id: number) : Note {
    return this.notes.find(el => el.id == id);
  }

  delete(id: number){
    this.notes = this.notes.filter(el => el.id != id);
  }


}
