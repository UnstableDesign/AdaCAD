import { Injectable } from '@angular/core';
import { Draft } from '../model/datatypes';
import { System } from '../model/system';
import utilInstance from '../model/util';

@Injectable({
  providedIn: 'root'
})

/**
 * stores global information about the number of warp systems in use. 
 */
export class SystemsService {

  
  weft_systems: Array<System> = [];
  warp_systems: Array<System> = [];

  constructor() { 

    for(let i = 0; i < 26; i++){
      const weft = new System();
      weft.id = i; 
      weft.name = String.fromCharCode(i+97);
      this.weft_systems.push(weft);

      const warp = new System();
      warp.id = i; 
      warp.name = ""+(i+1);
      this.warp_systems.push(warp);
    }

    this.weft_systems[0].in_use = true;
    this.warp_systems[0].in_use = true;

  }

  reset() {

    this.weft_systems.forEach(el => {
      el.in_use = false;
      el.visible = true;
    })

    this.warp_systems.forEach(el => {
      el.in_use = false;
      el.visible = true;
    })

    this.weft_systems[0].in_use = true;
    this.warp_systems[0].in_use = true;

  }

  getWeftSystem(id: number) : System{
    return this.weft_systems[id];
  }

  getWarpSystem(id: number) : System{
    return this.warp_systems[id];
  }

  getFirstWarpSystem() : System {
    return this.warp_systems[0];
  }

  getFirstWeftSystem() : System {
    return this.weft_systems[0];
  }

  addWeftSystemFromId(id: number) {
    this.weft_systems[id].in_use = true;

  }

  addWarpSystemFromId(id: number) {
    this.warp_systems[id].in_use = true;

  }

  weftSystemIsVisible(id: number){
    return this.weft_systems[id].isVisible();
  }

  warpSystemIsVisible(id: number){
    return this.warp_systems[id].isVisible();
  }

    /**
   * looks for the next in use system after the ndx submitted.
   * @param ndx 
   */
    getNextWarpSystemFrom(ndx: number): number{
      return ndx + 1 ;
      // const in_use = this.warp_systems.filter(el => el.in_use);
      // let use_ndx = in_use.findIndex(el => el.id === ndx);
      // use_ndx++;
  
      // if(use_ndx < in_use.length){
      //   return in_use[use_ndx].id;
      // }else{
      //   //get the last used number an dincrement one
      //   this.warp_systems[use_ndx].in_use = true;
      //   return use_ndx;
      // }

    }
  

  /**
   * looks for the next in use system after the ndx submitted.
   * @param ndx 
   */
  getNextWeftSystemFrom(ndx: number): number{
    return ndx + 1;
    // const in_use = this.weft_systems.filter(el => el.in_use);
    // let use_ndx = in_use.findIndex(el => el.id == ndx);
    // use_ndx++;

    // if(use_ndx < in_use.length){
    //   return in_use[use_ndx].id;
    // }else{
    //   //get the last used number an dincrement one
    //   this.weft_systems[use_ndx].in_use = true;
    //   return use_ndx;
    // }
  }

  /**
   * checks if we should move to the next system id or create a new empty system.
   * @returns the id of the created or empty system to add to
  */
   getNextWarpSystem(ndx: number, draft: Draft): number{

    var system_id = draft.colSystemMapping[ndx];
    // //are any other rows assigned to this system or is this the first
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
      return this.getNextWarpSystemFrom(system_id);
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
      return this.getNextWeftSystemFrom(system_id);
    }

  }

  getWeftSystemCode(id: number) : string {
    var system = this.getWeftSystem(id);
    if(system === undefined) return "err";
    return system.name;
  }

  getWarpSystemCode(id: number) {

    var system = this.getWarpSystem(id);
    if(system === undefined) return "err";
   return  system.name;
 }

 /**
   * takes system maps and makes them all unique by adding a base value to the n+1th map. This helps when interlacing 
   * drafts that have different system mappings, and making sure they are each unique. 
   * This function will also return standard sized arrays = to the maximum sized input
   * @param systems the system mappings to compare
   */
  private makeSystemsUnique(systems: Array<Array<number>>) : Array<Array<number>> {
   

     if(systems.length === 0) return [];


    const max_in_systems: Array<number> = systems.map(el => utilInstance.getArrayMax(el));
   
    let last_max = 0;
    const unique_systems = systems.map((sys, ndx) => {
      if(ndx > 0){
        last_max += (max_in_systems[ndx -1]+1)
        return sys.map(el => el + last_max);
      }else{
        return sys;
      }
    });  

     //standardize teh lengths of all the returned arrays 
     const max_length:number = unique_systems.reduce((acc, el) => {
      const len = el.length;
      if(len > acc) return len;
      else return acc;
    }, 0);


    unique_systems.forEach((sys, ndx) => {
      if(sys.length < max_length){
        for(let i = sys.length; i < max_length; i++){
          sys.push(sys[0]);
        }
      }
    });

    return unique_systems;
  }

  makeWeftSystemsUnique(systems: Array<Array<number>>) : Array<Array<number>> {

    const unique = this.makeSystemsUnique(systems);

    //add any weft systems required
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
