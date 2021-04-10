import { Draft } from './draft';
import {cloneDeep, now} from 'lodash';



interface HistoryState {
  draft: Draft;
  is_active: boolean;
}
/**
 * Definition of history state object.
 * @class
 */
export class Timeline {
  active_id = 0;
  timeline: Array<HistoryState>;

  constructor() {
   
    this.active_id = 0;
 	this.timeline = [];
   }
 

 public getLength() : number {
 	return this.timeline.length;
 }


  public getActiveTimelineId(): number{
      return this.active_id;
  }
 

  public addHistoryState(draft:Draft):void{
    console.log('add history state');

    var active_id = this.getActiveTimelineId();

    console.log("active id", active_id);

    var state = {
      draft: cloneDeep(draft),
      is_active: false
    }

    //we are lookkiing at the most recent state
    if(active_id == 0){

      //set prev to false
      this.timeline[0].is_active = false;
      state.is_active = true;

    }else{

      //erase all states until you get to the active row
      this.timeline.splice(0, active_id);
      if(this.timeline.length > 0) this.timeline[0].is_active = false;
      state.is_active = true;

    }

    //add the new element to position 0
    var len = this.timeline.unshift(state);
    if(len > 10) this.timeline.pop();

    console.log("timeline", this.timeline);
  }

  

  public restoreNextHistoryState(): Draft{


      var active_id = this.getActiveTimelineId();

      if(active_id-1 >= 0){
        console.log('restoring state', active_id-1);

        this.timeline[active_id].is_active = false;
        this.timeline[active_id-1].is_active = true;
        return this.timeline[active_id-1].draft;
      }

      return null;

  }

   public restorePreviousHistoryState():Draft{

     console.log("restore state");
    
      var active_id = this.getActiveTimelineId();

      if(active_id+1 < this.timeline.length){
        this.timeline[active_id].is_active = false;
        this.timeline[active_id+1].is_active = true;
        return this.timeline[active_id+1].draft;
      }

      return null;

  }






}


