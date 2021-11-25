import { Injectable } from '@angular/core';
import { Draft } from '../model/draft';
import { Loom } from '../model/loom';
import { MaterialsService } from './materials.service';
import { YarnPath, Vertex } from '../model/datatypes';

@Injectable({
  providedIn: 'root'
})
export class FabricssimService {


  warp_map: Array<number>; //the current height of the fabric at each warp
  draft: Draft;
  loom: Loom;

  constructor(materials: MaterialsService) { }


  /**
   * A function that creates a series of line paths representing the position and path of different pics in this draft
   * @param draft - the draft (or subsection of a draft) to draw
   * @param loom - the current loom settings
   * @returns a list of paths to draw
   */
  // generateSimulation(draft: Draft, loom: Loom) : Array<YarnPath>{

    
  //   this.resetWarpMap();

  //   const yarnPaths: Array<YarnPath>  = [];
    
  //   yarnPaths.push(
  //     {
  //       draft_ndx: draft.pattern.length-1,
  //       material_id: draft.rowShuttleMapping[draft.pattern.length-1],
  //       verticies: [{x_pcent:0, y:0}, {x_pcent: 100, y: 0 }]
  //     }
  //   );

  //   this.warp_map = this.warp_map.map(el => el += 100);





  //   return [];
  // }

  /**
   * creates a new warp map of size equal to the number of warps in the input draft
   * sets all starting values to zero
   */
  resetWarpMap(){
    this.warp_map = this.draft.colShuttleMapping.map(el => 0);
  }



  // public redrawYarnSimulation(){

  //   //keep a height map on each warp. 

  //   //starting from bottom up
  //   //set cur_weave_height height to first material height
  //   //compare next row to last row. 
  //   //identify "HARD", "SOFT", and "UNDER" crossings as index points with height based on type of crossing
  //   //draw the line created by the points
  //   //set materal height to the max point
    


  // }



}
