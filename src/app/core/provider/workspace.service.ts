import { Injectable } from '@angular/core';
import { Loom, LoomSettings } from '../model/datatypes';
import utilInstance from '../model/util';

@Injectable({
  providedIn: 'root'
})

/**
 * store any global workspace settings here:
 * Sync these with firebase so they are remembered across user sessions
 */
export class WorkspaceService {



  min_frames: number = 8; 
  min_treadles: number = 10;
  type: string = 'jacquard'; //'rigid', 'direct', 'frame', 'jacquard'
  show_errors: boolean = true;
  epi: number = 10;
  units: 'in' | 'cm' = 'in';

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
  async inferData(loom_settings: Array<LoomSettings>) : Promise<any> {
    if(loom_settings.length === 0) return Promise.resolve("no looms");

    //filter out null or undefined looms
    loom_settings = loom_settings.filter(el => !(el === undefined || el === null)); 


    this.min_frames = utilInstance.getMostCommon(
      loom_settings.map(el => el.frames)
    );
    this.min_treadles = utilInstance.getMostCommon(
      loom_settings.map(el => el.treadles)
    );
    this.type = utilInstance.getMostCommon(
      loom_settings.map(el => el.type)
    );
    this.units = utilInstance.getMostCommon(
      loom_settings.map(el => el.units)
    );

    this.epi = utilInstance.getMostCommon(
      loom_settings.map(el => el.epi)
    );

    return "done";
  }

  exportWorkspace() : any{
    return {
      frames: this.min_frames, 
      treadles: this.min_treadles,
      type: this.type,
      show_errors: this.show_errors,
      epi: this.epi,
      units: this.units,
      show_materials: this.show_materials,
      black_cell_up: this.black_cell_up,
      number_threading: this.number_threading,
      selected_origin_option: this.selected_origin_option
    }
  }

}
