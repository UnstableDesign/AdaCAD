import { Injectable } from '@angular/core';
import { Loom } from '../model/loom';
import utilInstance from '../model/util';

@Injectable({
  providedIn: 'root'
})

/**
 * for each mixer, you can define defaults for the loom
 */
export class GloballoomService {

  min_frames: number = 8; 
  min_treadles: number = 10;
  type: string = 'jacquard';
  show_errors: boolean = true;
  epi: number = 10;
  units: string = 'in';



  constructor() { }





  /**
   * given an array of looms, infers the data from what is most commonly used
   * this assumes that most exports will have common loom data
   * @param looms 
   */
  async inferData(looms: Array<Loom>) : Promise<any> {
    console.log("loading looms", looms)
    if(looms.length === 0) return Promise.resolve("no looms");

    this.min_frames = utilInstance.getMostCommon(
      looms.map(el => el.min_frames)
    );
    console.log("min frames", this.min_frames);

    this.min_treadles = utilInstance.getMostCommon(
      looms.map(el => el.min_treadles)
    );
    console.log("min tread", this.min_treadles);

    this.type = utilInstance.getMostCommon(
      looms.map(el => el.type)
    );
    console.log(" type", this.type);

    this.units = utilInstance.getMostCommon(
      looms.map(el => el.units)
    );
    console.log("units", this.units);

    this.epi = utilInstance.getMostCommon(
      looms.map(el => el.epi)
    );
    console.log("epi", this.epi);

    return "done";
  }

}
