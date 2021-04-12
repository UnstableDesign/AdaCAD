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
  undo_disabled: boolean;
  redo_disabled: boolean;
  timeline: Array<HistoryState>;

  constructor() {
   
  this.active_id = 0;
 	this.timeline = [];
 	this.undo_disabled = true;
 	this.redo_disabled = true;
  }
 

 

  public addHistoryState(draft:Draft):void{
    console.log('add history state');

    var state = {
      draft: cloneDeep(draft),
    }

    //we are lookkiing at the most recent state
    if(this.active_id == 0){

    }else{

      //erase all states until you get to the active row
      this.timeline.splice(0, this.active_id);
      this.active_id = 0;

    }

    //add the new element to position 0
    var len = this.timeline.unshift(state);
    if(len > 10) this.timeline.pop();

    console.log("timeline", this.timeline);

  }

  

  public restoreNextHistoryState(): Draft{

  	  this.active_id--;

      if(this.active_id-1 >= 0){
        console.log('restoring state', this.active_id-1);

        return this.timeline[this.active_id-1].draft;
      }

      return null;

  }

   public restorePreviousHistoryState():Draft{

     console.log("restore state");
    

      if(this.active_id+1 < this.timeline.length){
        return this.timeline[this.active_id+1].draft;
      }

      return null;

  }






}


