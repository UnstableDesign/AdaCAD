import { Injectable, ViewRef } from '@angular/core';
import { NoteComponent } from '../../mixer/palette/note/note.component';
import { Interlacement, Note } from '../model/datatypes';




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

  createNote(i: Interlacement, component: NoteComponent, ref: ViewRef, note: Note) : number{
    let gennote: Note = null;
    if(note == null){
     gennote = {
        id: this.notes.length,
        interlacement: i,
        text: "",
        ref: ref,
        color: "#FFFF00",
        component: component,
        imageurl: null,
        width: 200, 
        height: 200
      }
    }else{
      gennote = {
        id: note.id,
        interlacement: i,
        text: note.text,
        ref: ref,
        color: (note.color !== undefined) ? note.color : "#FFFF00",
        component: component,
        imageurl: (note.imageurl !== undefined) ? note.imageurl : null,
        width: (note.width !== undefined) ? note.width : 200,
        height: (note.height !== undefined) ? note.height : 200,
      }
    }

    this.notes.push(gennote);
    return gennote.id;
  
  }

  createBlankNode(i: Interlacement) : Note{
    const note: Note = {
      id: this.notes.length,
      interlacement: i,
      text: "",
      color: "#FFFF00",
      ref: null,
      component: null,
      imageurl: null,
      width: 200,
      height: 200
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
      color: note.color,
      interlacement: note.interlacement,
      imageurl: note.imageurl,
      width: note.width,
      height: note.height
    }
    });
  }

  // /** called on load new file as well as undo, redo  */
  // reloadNotes(ns: Array<any>) : Array<Note>{

  //   console.log("LOADING NOTES", ns);
  //   ns.forEach(newnote => {
  //     const found = this.notes.find(el => el.id === newnote.id);
  //     if(found !== undefined){
  //       found.text = newnote.text;
  //       found.interlacement= newnote.interlacement;
  //       found.ref= (newnote.ref === undefined) ? null : newnote.ref;
  //       found.component= (newnote.component === undefined) ? null : newnote.component
  //     }else{
  //       this.notes.push({
  //         id: newnote.id,
  //         text: newnote.text,
  //         interlacement: newnote.interlacement,
  //         ref: (newnote.ref === undefined) ? null : newnote.ref,
  //         component: (newnote.component === undefined) ? null : newnote.component
  //       })
  //     }
  //   });

  //   this.notes = this.notes.filter(el => ns.find(nsel => nsel.id === el.id) !== undefined);

  //   return ns;
  // }

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

  setColor(id: number, color: string){
    let note = this.get(id);
    note.color = color;
  } 


}
