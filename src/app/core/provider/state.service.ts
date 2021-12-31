import { Injectable } from '@angular/core';
import { Draft } from '../model/draft';
import {cloneDeep, now} from 'lodash';
import { SaveObj } from '../provider/file.service';
import { Observable } from 'rxjs';


/**
 * stores a state within the undo/redo timeline
 * weaver uses draft, mixer uses ada
 */
 interface HistoryState {
  draft: Draft;
  ada: string;
}

export interface Item { name: string; }

@Injectable({
  providedIn: 'root'
})
export class StateService {
  active_id = 0;
  max_size = 10;
  undo_disabled: boolean;
  redo_disabled: boolean;
  timeline: Array<HistoryState>; //new states are always pushed to front of draft
  // private itemDoc: AngularFirestoreDocument<Item>;
  item: Observable<Item>;
  
  constructor(
    // private afs: AngularFirestore
    ) { 
    this.active_id = 0;
    this.timeline = [];
    this.undo_disabled = true;
    this.redo_disabled = true;
    // this.itemDoc = afs.doc<Item>('patterns/1');
    // console.log("this.itemDoc", this.itemDoc)
    // this.item = this.itemDoc.valueChanges(); 
  }

  update(item: Item) {
    // this.itemDoc.update(item);
  }


 
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
  public addMixerHistoryState(ada:string):void{

    var state = {
      draft: null,
      ada: cloneDeep(ada),
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



