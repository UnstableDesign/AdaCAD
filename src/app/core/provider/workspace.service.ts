import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

/**
 * store any global workspace settings here:
 * Sync these with firebase so they are remembered across user sessions
 */
export class WorkspaceService {

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

  
}
