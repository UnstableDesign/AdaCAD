import { Injectable, inject } from '@angular/core';
import { Draft } from 'adacad-drafting-lib';
import { Subject } from 'rxjs';
import { DraftExistenceChange, DraftStateEvent, OpStateEvent, OpStateMove, SaveObj, StateAction, StateChangeEvent } from '../model/datatypes';
import { TreeService } from './tree.service';

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
  private tree = inject(TreeService);
  // public readonly testDocValue$: Observable<any>;


  active_id = 0;
  max_size = 10;
  last_saved_time: string = "";
  undo_disabled: boolean;
  redo_disabled: boolean;
  timeline: Array<HistoryState>; //new states are always pushed to front of draft
  currently_opened_file_id: number;
  history: Array<StateChangeEvent> = [];


  // Draft undo event streams

  private draftMoveUndoSubject = new Subject<StateAction>();
  draftMoveUndo$ = this.draftMoveUndoSubject.asObservable();

  private draftValueChangeUndoSubject = new Subject<StateAction>();
  draftValueChangeUndo$ = this.draftValueChangeUndoSubject.asObservable();

  private draftLoomChangeUndoSubject = new Subject<StateAction>();
  draftLoomChangeUndo$ = this.draftLoomChangeUndoSubject.asObservable();

  private draftLoomSettingsChangeUndoSubject = new Subject<StateAction>();
  draftLoomSettingsChangeUndo$ = this.draftLoomSettingsChangeUndoSubject.asObservable();

  private draftNameChangeUndoSubject = new Subject<StateAction>();
  draftNameChangeUndo$ = this.draftNameChangeUndoSubject.asObservable();

  private draftCreatedUndoSubject = new Subject<StateAction>();
  draftCreatedUndo$ = this.draftCreatedUndoSubject.asObservable();

  private draftRemovedUndoSubject = new Subject<StateAction>();
  draftRemovedUndo$ = this.draftRemovedUndoSubject.asObservable();

  // Operation undo event streams
  private opMoveUndoSubject = new Subject<StateAction>();
  opMoveUndo$ = this.opMoveUndoSubject.asObservable();

  private opParamChangeUndoSubject = new Subject<StateAction>();
  opParamChangeUndo$ = this.opParamChangeUndoSubject.asObservable();

  private opLocalZoomUndoSubject = new Subject<StateAction>();
  opLocalZoomUndo$ = this.opLocalZoomUndoSubject.asObservable();

  private opCreatedUndoSubject = new Subject<StateAction>();
  opCreatedUndo$ = this.opCreatedUndoSubject.asObservable();

  private opRemovedUndoSubject = new Subject<StateAction>();
  opRemovedUndo$ = this.opRemovedUndoSubject.asObservable();


  constructor() {


    this.active_id = 0;
    this.timeline = [];
    this.undo_disabled = true;
    this.redo_disabled = true;

  }



  clearTimeline() {
    this.active_id = 0;
    this.undo_disabled = true;
    this.redo_disabled = true;
    this.timeline = [];

  }


  printValue(value: any) {
    console.log("printing", value);
  }


  validateWriteData(cur_state: any): any {
    return cur_state;
  }


  public getFileSize(name: string, obj: any): number {
    const str = JSON.stringify(obj);
    const size = new Blob([str]).size;
    console.log(name + " is ", size);
    return size;

  }

  public hasTimeline() {
    if (this.timeline.length > 0) return true;
    return false;
  }

  public addStateChange(change: StateChangeEvent) {

    this.history.push(change);
    console.log("HISTORY IS ", this.history)
  }


  private handleDraftUndo(change: DraftStateEvent) {
    switch (change.type) {
      case 'MOVE':
        this.draftMoveUndoSubject.next(<unknown>change as StateAction);
        break;
      case 'VALUE_CHANGE':
        this.draftValueChangeUndoSubject.next(<unknown>change as StateAction);
        break;
      case 'LOOM_CHANGE':
        this.draftLoomChangeUndoSubject.next(<unknown>change as StateAction);
        break;
      case 'LOOM_SETTINGS_CHANGE':
        this.draftLoomSettingsChangeUndoSubject.next(<unknown>change as StateAction);
        break;
      case 'NAME_CHANGE':
        this.draftNameChangeUndoSubject.next(<unknown>change as StateAction);
        break;
      case 'CREATED':
        this.draftCreatedUndoSubject.next({ type: 'REMOVE', node: (<DraftExistenceChange>change).node });
        break;
      case 'REMOVED':
        this.draftRemovedUndoSubject.next({ type: 'CREATE', node: (<DraftExistenceChange>change).node });
        break;
    }
  }

  private handleOpUndo(change: OpStateEvent) {
    switch (change.type) {
      case 'MOVE':
        this.opMoveUndoSubject.next(<unknown>change as StateAction);
        break;
      case 'PARAM_CHANGE':
        this.opParamChangeUndoSubject.next({ type: 'CHANGE', point: (<OpStateMove>change).before });
        break;
      case 'LOCAL_ZOOM':
        this.opLocalZoomUndoSubject.next(<unknown>change as StateAction);
        break;
      case 'CREATED':
        this.opCreatedUndoSubject.next(<unknown>change as StateAction);
        break;
      case 'REMOVED':
        this.opRemovedUndoSubject.next(<unknown>change as StateAction);
        break;
    }
  }


  private handleUndo(change: StateChangeEvent) {
    console.log("UNDO CALLED with", change)
    switch (change.originator) {

      case 'OP':
        this.handleOpUndo(<OpStateEvent>change);
      case 'DRAFT':
        this.handleDraftUndo(<DraftStateEvent>change);
      case 'CONNECTION':
      case 'WORKSPACE':
      case 'NOTE':
      case 'MATERIALS':


    }

  }


  public undo() {


    const last = this.history.pop();
    if (last) this.handleUndo(last);

  }


  /**
   * compares the current state with state being reloaded to look for the diff. 
   * @param a one state
   * @param b another state
   * @returns a list of updates to make 
   */
  public compareState(a: SaveObj, b: SaveObj) {



  }




  /**
   * change this to store only the diff
   * @param ada 
   */
  public writeStateToTimeline(ada: any) {


    var state = {
      draft: null,
      ada: {
        version: ada.file.version,
        workspace: ada.file.workspace,
        zoom: ada.file.zoom,
        type: ada.file.type,
        nodes: ada.file.nodes.slice(),
        tree: ada.file.tree.slice(),
        draft_nodes: ada.file.draft_nodes.slice(),
        ops: ada.file.ops.slice(),
        notes: ada.file.notes.slice(),
        materials: ada.file.materials.slice(),
        indexed_image_data: ada.file.indexed_image_data.slice()
      }
    }
    if (this.active_id > 0) {

      this.timeline.splice(0, this.active_id);
      this.active_id = 0;
      this.redo_disabled = true;

    }

    //add the new element to position 0
    var len = this.timeline.unshift(state);
    if (len > this.max_size) this.timeline.pop();
    if (this.timeline.length > 1) this.undo_disabled = false;

  }


  /**
   * called on redo in mixer
   * @returns returns the ada file to reload
   */
  public restoreNextMixerHistoryState(): SaveObj {

    if (this.active_id == 0) return;

    this.active_id--;

    if (this.active_id == 0) this.redo_disabled = true;

    return this.timeline[this.active_id].ada;


  }


  /**
 * called on undo in mixer
 * @returns returns the draft to load
 */
  public restorePreviousMixerHistoryState(): SaveObj {

    this.active_id++;

    //you've hit the end of available states to restore
    if (this.active_id >= this.timeline.length) {
      this.active_id--;
      this.undo_disabled = true;
      return null;
    }

    this.redo_disabled = false;
    return this.timeline[this.active_id].ada;

  }


}



