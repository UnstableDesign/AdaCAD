import { Injectable } from '@angular/core';
import { ShuttlesModal } from '../modal/shuttles/shuttles.modal';
import { Shuttle } from '../model/shuttle';

@Injectable({
  providedIn: 'root'
})
export class MaterialsService {


  materials: Array<Shuttle> = [];


  constructor() { 

    this.materials = [
      new Shuttle({id: 0, name: 'shuttle 0', insert: true, visible: true, color: "#333333", thickness: 100, type: 0, notes: ""}), 
      new Shuttle({id: 1, name: 'shuttle 1', insert: true, visible: true, color: "#ffffff", thickness: 100, type: 0, notes: ""}), 
      new Shuttle({id: 2, name: 'conductive', insert: true, visible: true, color: "#ff4081", thickness: 100, type: 1, notes: ""})];
  }

  overloadShuttles(shuttles: Array<Shuttle>){
    this.materials = [];
    shuttles.forEach(shuttle => {
      this.materials.push(new Shuttle(shuttle))
    });
  }

  /**
   * adds a set of shuttles from a file import
   * @param shuttles 
   * @returns the offset of the new ids to the old ones
   */
  addShuttles(shuttles: Array<Shuttle>) : number{
    
    const offset: number = this.materials.length;

    shuttles.forEach(shuttle => {
      this.materials.push(new Shuttle(shuttle))
    });

      //assign them unique ids
    this.materials.forEach((el, ndx) => {
        el.setID(ndx);
    } );

    return offset;
  }

  getColor(index: number,) {

    const s: Shuttle = this.getShuttle(index);
    return s.color;
  }



  addShuttle(s: Shuttle){
    this.materials.push(s);
  }

  getShuttle(id: number) : Shuttle{
    const ndx: number = this.materials.findIndex(el => el.id === id);
    if(ndx != -1) return this.materials[ndx];
    return null;
  }

  getShuttles() : Array<Shuttle>{
    return this.materials;
  }

}
