import { Injectable, inject } from '@angular/core';
import { TreeService } from './tree.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

/**
 * this service manages information about the draft that is currently being shown in the viewer. 
 */
export class ViewerService {
  private tree = inject(TreeService);



  pinned_id: number = -1; //must be an ID corresponding to a draft node
  showing_id: number = -1;//must be an ID corresponding to a draft node
  showing_id_change$ = new Subject<any>(); //broadcasts changes to the current draft intended for viewing
  update_viewer$ = new Subject<any>();


  /**
   * sets a pin on a draft, forcing it to remain in viewer even when other items on the mixer are selected
   * it sets the pinned id, as well as the showing id, to the pinned id value
   * it broadcasts that a change in ID took place
   * @param id 
   */
  setPin(id: number){

    if(this.tree.getType(id) !== "draft"){
      console.error("attempting to set viewer to a non-draft id");
      return;
    } 

    this.pinned_id = id;
    this.showing_id = id;
    this.showing_id_change$.next(this.showing_id);

  }

  getPin() : number {
    return this.pinned_id;
  }

  clearPin() {
    this.pinned_id = -1;
    this.showing_id_change$.next(this.showing_id); //this doesn't really need to be called but it's a hack for the styles to update on unpin


  }

  hasPin() : boolean {
    return this.pinned_id !== -1;
  }


  /**
   * attempts to update the viewer to focus on a given id. If the viewer has a pin, it will not update. 
   * Otherwise, it will set the viewing id to the value of id and broadcasts to the viewer that a change has been made
   * @param id 
   */
  setViewer(id: number){
    if(this.tree.getType(id) !== "draft"){
      console.error("attempting to set viewer to a non-draft id");
      return;
    } 

    if(!this.hasPin() && this.showing_id !== id){
      this.showing_id = id;
      this.showing_id_change$.next(this.showing_id);

    }
  }

  getViewer() : number {
    return this.showing_id;
  }

  hasViewer() : boolean {
    return (this.showing_id !== -1);
  }

  clearViewer() {
    this.showing_id = -1;
  }

  /**
   * this is called from the palette when a delete command has been emitted. 
   * it checks to see if any of the deleted values are currently on display in the viewer
   * and updates the viewer accordingly
   * @param id 
   */
  checkOnDelete(id: number){
    if(this.showing_id == id){
      this.clearViewer();
      this.showing_id_change$.next(this.showing_id);
    } 
    if(this.pinned_id == id) this.clearPin();

  }


  /**
   * called from the palette or from the editor when a draft has been changed and should be redrawn. 
   */
  updateViewer(){
    this.update_viewer$.next(this.showing_id);

  }

}
