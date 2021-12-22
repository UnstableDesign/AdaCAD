import { Injectable } from '@angular/core';
import { Draft } from '../model/draft';
import { System } from '../model/system';

@Injectable({
  providedIn: 'root'
})

/**
 * stores global information about the number of warp systems in use. 
 */
export class SystemsService {

  weft_systems: Array<System> = [new System()];
  warp_systems: Array<System> = [new System()];

  constructor() { }

  addWeftSystem(system) {
    system.setID(this.weft_systems.length);
    system.setVisible(true);
    this.weft_systems.push(system);
  }

  addWarpSystem(system) {
    system.setID(this.warp_systems.length);
    system.setVisible(true);
    this.warp_systems.push(system);
  }


  weftSystemIsVisible(id: number){
    return this.weft_systems[id].isVisible();
  }

  warpSystemIsVisible(id: number){
    return this.warp_systems[id].isVisible();
  }

  /**
   * checks if we should move to the next system id or create a new empty system.
   * @returns the id of the created or empty system to add to
  */
   getNextWarpSystem(ndx: number, draft: Draft): number{

    var system_id = draft.colSystemMapping[ndx];

    //are any other rows assigned to this system or is this the first
    const count: number = draft.colSystemMapping.reduce((acc,val) => {
      if(val === system_id){
        acc = acc + 1;
      } 
      return acc;
    }, 0);


    //this is the only one assigned
    if(count === 1){
      return 0; // return the starting index
    }else{
      //you need the next id
      system_id ++;

      if(system_id < this.warp_systems.length){
        return system_id;
      }else if(system_id === this.warp_systems.length){
        this.addWarpSystem(new System());
        return system_id;
      }else{
        return 0;
      }
    }

  }

  /**
   * checks if we should move to the next system id or create a new empty system.
   * @returns the id of the created or empty system to add to
  */
   getNextWeftSystem(ndx: number, draft: Draft): number{

    var system_id = draft.rowSystemMapping[ndx];

    //are any other rows assigned to this system or is this the first
    const count: number = draft.rowSystemMapping.reduce((acc,val) => {
      if(val === system_id){
        acc = acc + 1;
      } 
      return acc;
    }, 0);


    //this is the only one assigned
    if(count === 1){
      return 0; // return the starting index
    }else{
      //you need the next id
      system_id ++;

      if(system_id < this.weft_systems.length){
        return system_id;
      }else if(system_id === this.weft_systems.length){
        this.addWeftSystem(new System());
        return system_id;
      }else{
        return 0;
      }
    }

  }

  getWeftSystemCode(id: number) : string {
    var system = this.weft_systems[id];
    return String.fromCharCode(97 + system.id);
  }

  getWarpSystemCode(id: number) {

    var system = this.warp_systems[id];
   return  String.fromCharCode(97 + system.id);
 }


  

  

}
