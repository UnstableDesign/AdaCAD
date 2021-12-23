import { I } from '@angular/cdk/keycodes';
import { Injectable } from '@angular/core';
import { Draft } from '../model/draft';
import { System } from '../model/system';
import utilInstance from '../model/util';

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

  getWeftSystem(id: number) : System{
    return this.weft_systems.find(el => el.id === id);
  }

  getWarpSystem(id: number) : System{
    return this.warp_systems.find(el => el.id === id);
  }

  addWeftSystemFromId(id: number) {
    const system = new System();
    system.setID(id);
    system.setVisible(true);
    this.weft_systems.push(system);
  }

  addWarpSystemFromId(id: number) {
    const system = new System();
    system.setID(id);
    system.setVisible(true);
    this.warp_systems.push(system);
  }


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
    var system = this.getWeftSystem(id);
    if(system === undefined) return "err";
    return String.fromCharCode(97 + system.id);
  }

  getWarpSystemCode(id: number) {

    var system = this.getWarpSystem(id);
    if(system === undefined) return "err";
   return  String.fromCharCode(97 + system.id);
 }

 /**
   * takes system maps and makes them all unique by adding a base value to the n+1th map. This helps when interlacing 
   * drafts that have different system mappings, and making sure they are each unique.
   * @param systems the system mappings to compare
   */
  private makeSystemsUnique(systems: Array<Array<number>>) : Array<Array<number>> {
   
    if(systems.length === 0) return [];

    const max_in_systems: Array<number> = systems.map(el => utilInstance.getArrayMax(el));
    let max_total: number = utilInstance.getArrayMax(max_in_systems);
   
    let last_max = 0;
    const unique_systems = systems.map((sys, ndx) => {
      if(ndx > 0){
        last_max += (max_in_systems[ndx -1]+1)
        return sys.map(el => el + last_max);
      }else{
        return sys;
      }
    });  

    return unique_systems;
  }

  makeWeftSystemsUnique(systems: Array<Array<number>>) : Array<Array<number>> {

    const unique = this.makeSystemsUnique(systems);

    unique.forEach(system => {
      system.forEach(el => {
        if(this.getWeftSystem(el) === undefined) this.addWeftSystemFromId(el);
      })
    })

    return unique;
  }

  makeWarpSystemsUnique(systems: Array<Array<number>>) : Array<Array<number>> {

    const unique = this.makeSystemsUnique(systems);

    unique.forEach(system => {
      system.forEach(el => {
        if(this.getWarpSystem(el) === undefined) this.addWarpSystemFromId(el);
      })
    })

    return unique;
  }

}
