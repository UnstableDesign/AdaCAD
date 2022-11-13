import { Injectable } from '@angular/core';
import { getDatabase, ref as fbref, set as fbset } from '@angular/fire/database';
import { Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Draft, SaveObj } from '../model/datatypes';
import { copyDraft } from '../model/drafts';
import { AuthService } from './auth.service';
/**
 * stores a state within the undo/redo timeline
 * weaver uses draft, mixer uses ada
 */
 interface HistoryState {
  draft: Draft;
  ada: SaveObj;
}

@Injectable({
  providedIn: 'root'
})
export class StateService {

  public readonly testDocValue$: Observable<any>;

  active_id = 0;
  max_size = 10;
  undo_disabled: boolean;
  redo_disabled: boolean;
  timeline: Array<HistoryState>; //new states are always pushed to front of draft
  // private itemDoc: AngularFirestoreDocument<Item>;
  
  constructor(firestore: Firestore, public auth: AuthService) {

    const db = getDatabase();

    this.active_id = 0;
    this.timeline = [];
    this.undo_disabled = true;
    this.redo_disabled = true;

  }

  printValue(value: any){
    console.log("printing", value);
  }


  validateWriteData(cur_state: any) : any {
    return cur_state;
  }

  /**
   * this writes the most current state of the program to the user's entry to the realtime database
   * @param cur_state returned from file saver, constains the JSON string of the file as well as the obj
   * @returns 
   */
  public writeUserData(cur_state: any) {

    if(this.auth.uid === undefined) return;

    cur_state = this.validateWriteData(cur_state)


    const db = getDatabase();
    fbset(fbref(db, 'users/' + this.auth.uid), {
      timestamp: Date.now(),
      ada: cur_state
    }).catch(console.error);
  }


  // update(item: Item) {
  //   // this.itemDoc.update(item);
  // }

  // public writeUserData(userId, name, email, imageUrl) {
  //   const db = getDatabase();
  //   fbset(fbref(db, 'users/' + userId), {
  //     username: name,
  //     email: email,
  //     profile_picture : imageUrl
  //   });
  // }

 
 
/**
 * used in weaver - adds a draft to the history state
 * @param draft 
 */
  public addHistoryState(draft:Draft):void{


    var state = {
      draft: copyDraft(draft),
      ada: null
    }

    //we are looking at the most recent state
    if(this.active_id > 0){


      //erase all states until you get to the active row
      this.timeline.splice(0, this.active_id);
      this.active_id = 0;
      this.redo_disabled = true;

    }

    //add the new element to position 0
    var len = this.timeline.unshift(state);
    if(len > this.max_size) this.timeline.pop();

    if(this.timeline.length > 1) this.undo_disabled = false;


  }

/**
 * used in mixer - adds an ada file to the history state
 * @param ada 
 */
  public addMixerHistoryState(ada:{json: string, file: SaveObj}):void{

    var state = {
      draft: null,
      ada: {
        version: ada.file.version,
        workspace: ada.file.workspace,
        type: ada.file.type,
        nodes: ada.file.nodes.slice(),
        tree: ada.file.tree.slice(),
        draft_nodes: ada.file.draft_nodes.slice(),
        ops: ada.file.ops.slice(),
        notes: ada.file.notes.slice(),
        materials: ada.file.materials.slice(),
        scale: ada.file.scale
      }
    }

    //write this to database, overwritting what was previously there
    this.writeUserData(ada.file);


    //we are looking at the most recent state
    if(this.active_id > 0){


      //erase all states until you get to the active row
      this.timeline.splice(0, this.active_id);
      this.active_id = 0;
      this.redo_disabled = true;

    }

    //add the new element to position 0
    var len = this.timeline.unshift(state);
    if(len > this.max_size) this.timeline.pop();

    if(this.timeline.length > 1) this.undo_disabled = false;

    //this.logState(ada);

  }

  
/**
 * called on redo in weaver
 * @returns returns the draft to reload
 */
  public restoreNextHistoryState(): Draft{

    if(this.active_id == 0) return; 

  	this.active_id--;

    if(this.active_id == 0) this.redo_disabled = true;

    return this.timeline[this.active_id].draft;
    

  }

/**
 * called on redo in mixer
 * @returns returns the ada file to reload
 */  
public restoreNextMixerHistoryState(): SaveObj{

    if(this.active_id == 0) return; 

  	this.active_id--;

    if(this.active_id == 0) this.redo_disabled = true;

    return this.timeline[this.active_id].ada;
    

  }

  /**
   * called on undo in weaver
   * @returns returns the draft to load
   */
   public restorePreviousHistoryState():Draft{

     this.active_id++;

      //you've hit the end of available states to restore
     if(this.active_id >= this.timeline.length){
        this.active_id--;
        this.undo_disabled = true;
        return null; 
     } 

     this.redo_disabled = false;
     return this.timeline[this.active_id].draft;
      
  }

    /**
   * called on undo in mixer
   * @returns returns the draft to load
   */
     public restorePreviousMixerHistoryState():SaveObj{

      this.active_id++;
 
       //you've hit the end of available states to restore
      if(this.active_id >= this.timeline.length){
         this.active_id--;
         this.undo_disabled = true;
         return null; 
      } 
 
      this.redo_disabled = false;
      return this.timeline[this.active_id].ada;
       
   }


}



