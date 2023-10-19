import { Injectable } from '@angular/core';
import { getAuth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Draft, SaveObj } from '../model/datatypes';
import { copyDraft } from '../model/drafts';
import { FilesystemService } from './filesystem.service';
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
  last_saved_time: string = "";
  undo_disabled: boolean;
  redo_disabled: boolean;
  timeline: Array<HistoryState>; //new states are always pushed to front of draft
  // private itemDoc: AngularFirestoreDocument<Item>;
  
  constructor(private files: FilesystemService) {


    this.active_id = 0;
    this.timeline = [];


  }

  clearTimeline(){
    this.active_id = 0;
    this.undo_disabled = true;
    this.redo_disabled = true;
    this.timeline = [];

  }


  printValue(value: any){
    console.log("printing", value);
  }


  validateWriteData(cur_state: any) : any {
    return cur_state;
  }

 

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

    console.log("STATE", state)
  

    //write this to database, overwritting what was previously there
    //this.files.writeUserData(ada.file);

    const auth = getAuth();
    const user = auth.currentUser;

    if(user !== null){
      this.files.writeFileData(user.uid, this.files.current_file_id, ada.file)
    } 

  if(user !== null){
    this.files.writeFileData(user.uid, this.files.current_file_id, ada.file)
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
 * used in mixer - adds an ada file to the history state
 * @param ada 
 */
  // public addMixerHistoryState(ada:{json: string, file: SaveObj}):void{

  //   var state = {
  //     draft: null,
  //     ada: cloneDeep(ada.file),
  //   }

  //   //write this to database, overwritting what was previously there
  //   this.writeUserData(ada.file);


  //   //we are looking at the most recent state
  //   if(this.active_id > 0){


  //     //erase all states until you get to the active row
  //     this.timeline.splice(0, this.active_id);
  //     this.active_id = 0;
  //     this.redo_disabled = true;

  //   }

  //   //add the new element to position 0
  //   var len = this.timeline.unshift(state);
  //   if(len > this.max_size) this.timeline.pop();

  //   if(this.timeline.length > 1) this.undo_disabled = false;

  //   //this.logState(ada);

  // }

  
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



