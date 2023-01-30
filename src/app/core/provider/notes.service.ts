import { Injectable, ViewRef } from '@angular/core';
import { NoteComponent } from '../../mixer/palette/note/note.component';
import { Interlacement } from '../model/datatypes';


export interface Note{
  id: number,
  interlacement: Interlacement; 
  text: string;
  ref: ViewRef;
  component: NoteComponent   
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
      text: "",
      ref: null,
      component: null
    }

    this.notes.push(note);
    return note;
  
  }

  getComponents() : Array<NoteComponent> {
    return this.notes.map(el => el.component);
  }

  getRefs() : Array<ViewRef> {
    return this.notes.map(el => el.ref);
  }

  exportForSaving(): Array<any>{
    return this.notes.map(note => {
      return {
      id: note.id, 
      text: note.text,
      interlacement: note.interlacement
    }
    });
  }

  resetNotes(){
    this.notes = [];
  }

  /** called on load file  */
  reloadNotes(ns: Array<any>) : Array<Note>{

    this.notes = [];
    ns.forEach(note => {
      this.notes.push({
        id: note.id,
        text: note.text,
        interlacement: note.interlacement,
        ref: (note.ref === undefined) ? null : note.ref,
        component: (note.component === undefined) ? null : note.component
      })
    })



    if(typeof(ns) == "string") return;
    this.notes = ns;
    return ns;
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
