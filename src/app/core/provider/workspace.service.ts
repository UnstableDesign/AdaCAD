import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

/**
 * store any global workspace settings here
 */
export class WorkspaceService {

  origin_topright: boolean = true;
  use_colors_on_mixer: boolean = true;
  

  constructor() { }
}
