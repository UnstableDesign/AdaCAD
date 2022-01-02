import { Injectable } from '@angular/core';
import { Draft } from '../model/draft';
import {cloneDeep, now} from 'lodash';
import { traceUntilFirst } from '@angular/fire/performance';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'mathjs';
import {getDatabase, ref as fbref, set as fbset, onValue} from '@angular/fire/database'
import { authInstanceFactory } from '@angular/fire/auth/auth.module';
import { AuthService } from './auth.service';
/**
 * stores a state within the undo/redo timeline
 * weaver uses draft, mixer uses ada
 */
 interface HistoryState {
  draft: Draft;
  ada: string;
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
    const starCountRef = fbref(db, 'users/alovelace');
    onValue(starCountRef, (snapshot) => {
      const data = snapshot.val();
      console.log("data in", data);
    });

    this.active_id = 0;
    this.timeline = [];
    this.undo_disabled = true;
    this.redo_disabled = true;

  }

  printValue(value: any){
    console.log("printing", value);
  }

  public writeUserData(cur_state: any) {

    console.log("with uid", this.auth.uid);
    if(this.auth.uid === undefined) return;

    console.log("writing", cur_state);
    const db = getDatabase();
    fbset(fbref(db, 'users/' + this.auth.uid), {
      timestamp: Date.now(),
      ada: cur_state
    });
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
      draft: cloneDeep(draft),
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

    this.logState(draft);

  }

/**
 * used in mixer - adds an ada file to the history state
 * @param ada 
 */
  public addMixerHistoryState(ada:any):void{
    console.log("adding history");

    var state = {
      draft: null,
      ada: cloneDeep(ada),
    }

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

    console.log('restoring state', this.active_id);
    if(this.active_id == 0) this.redo_disabled = true;

    return this.timeline[this.active_id].draft;
    

  }

/**
 * called on redo in mixer
 * @returns returns the ada file to reload
 */  
public restoreNextMixerHistoryState(): string{

    if(this.active_id == 0) return; 

  	this.active_id--;

    console.log('restoring state', this.active_id);
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

     console.log("restoring state ", this.active_id);
     this.redo_disabled = false;
     return this.timeline[this.active_id].draft;
      
  }

    /**
   * called on undo in mixer
   * @returns returns the draft to load
   */
     public restorePreviousMixerHistoryState():string{

      this.active_id++;
 
       //you've hit the end of available states to restore
      if(this.active_id >= this.timeline.length){
         this.active_id--;
         this.undo_disabled = true;
         return null; 
      } 
 
      console.log("restoring state ", this.active_id);
      this.redo_disabled = false;
      return this.timeline[this.active_id].ada;
       
   }

   /**
    * writes the current draft to local storage for reloading if somehoow the page closes
    * this is not being used at the moment
    * @param draft 
    * @returns 
    */
  public logState(draft: Draft){

  //this just lags on big drafts
  if(draft.warps*draft.wefts > 10000) return;

  var timestamp = Math.floor(Date.now() / 1000);
  var theJSON = JSON.stringify(draft);
  if(theJSON.length < 5000000) localStorage.setItem("draft", theJSON);
   
 }


}



