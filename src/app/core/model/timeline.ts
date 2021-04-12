import { Draft } from './draft';
import {cloneDeep, now} from 'lodash';



interface HistoryState {
  draft: Draft;
}
/**
 * Definition of history state object.
 * @class
 */
export class Timeline {
  active_id = 0;
  max_size = 10;
  undo_disabled: boolean;
  redo_disabled: boolean;
  timeline: Array<HistoryState>; //new states are always pushed to front of draft

  constructor() {
   
  this.active_id = 0;
 	this.timeline = [];
 	this.undo_disabled = true;
 	this.redo_disabled = true;

  }
 

 

  public addHistoryState(draft:Draft):void{

    var state = {
      draft: cloneDeep(draft),
    }

    //we are looking at the most recent state
    if(this.active_id > 0){


      //erase all states until you get to the active row
      this.timeline.splice(0, this.active_id);
      console.log("DELETED FIRST", this.active_id, " elements");
      this.active_id = 0;
      this.redo_disabled = true;

    }

    //add the new element to position 0
    var len = this.timeline.unshift(state);
    if(len > this.max_size) this.timeline.pop();

    if(this.timeline.length > 1) this.undo_disabled = false;

    console.log("ON ADD", this.timeline);

  }

  
  //called on redo
  public restoreNextHistoryState(): Draft{

    if(this.active_id == 0) return; 

  	this.active_id--;

    console.log('restoring state', this.active_id);
    if(this.active_id == 0) this.redo_disabled = true;

    console.log(this.timeline);

    return this.timeline[this.active_id].draft;
    

  }

  //called on undo
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






}


