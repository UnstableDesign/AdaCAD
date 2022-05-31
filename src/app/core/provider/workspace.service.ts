import { Injectable } from '@angular/core';
import { Loom } from '../model/loom';
import utilInstance from '../model/util';

@Injectable({
  providedIn: 'root'
})

/**
 * store any global workspace settings here:
 * Sync these with firebase so they are remembered across user sessions
 */
export class WorkspaceService {



  private loom_option_list: Array<{value: string, view: string}> = 
  [
    {value: 'jacquard', view: 'jacquard'},
    {value: 'frame', view: 'frame/treadle'},
    {value: 'direct', view: 'direct tie'},
  ];


  min_frames: number = 8; 
  min_treadles: number = 10;
  type: string = 'jacquard'; //'rigid', 'direct', 'frame', 'jacquard'
  show_errors: boolean = true;
  epi: number = 10;
  units: string = 'in';
  
  show_materials: boolean = true;
  black_cell_up: boolean = true;
  number_threading: boolean = false;


  

  /**
   * when looking at the draft viewer, where should the (0, 0) point of the drawdown sit. 
   * 0 top right, 1 bottom right, 2 bottom left, 3 top left
   */
  selected_origin_option: number = 0;

  private origin_option_list: Array<{value: number, view: string}> = 
  [
    {value: 0, view: 'top right'},
    {value: 1, view: 'bottom right'},
    {value: 2, view: 'bottom left'},
    {value: 3, view: 'top left'},
  ];

  /**
   * show materials in mixer previews. If false, will default entirely to black and white
   */
  use_colors_on_mixer: boolean = true;

  

  constructor() { }

  getOriginOptions(){
    return this.origin_option_list;
  }

  isFrame() : boolean{
    if(this.type === 'frame') return true;
    return false;
  }


  /**
   * given an array of looms, infers the data from what is most commonly used
   * this assumes that most exports will have common loom data
   * @param looms 
   */
  async inferData(looms: Array<Loom>) : Promise<any> {
    console.log("loading looms", looms)
    if(looms.length === 0) return Promise.resolve("no looms");

    //filter out null or undefined looms
    looms = looms.filter(el => !(el === undefined || el === null)); 


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
