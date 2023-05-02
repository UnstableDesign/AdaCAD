
import { create } from "domain";
import { max } from "mathjs";
import { MaterialsService } from "../provider/materials.service";
import { Cell } from "./cell";
import {  Draft, Drawdown, LayerMaps, SimulationVars, TopologyVtx, VertexMaps, WarpInterlacementTuple, WarpRange, WarpWeftLayerCount, WeftInterlacementTuple, YarnCell, YarnFloat, YarnSim, YarnVertex } from "./datatypes";
import { getCol, warps, wefts } from "./drafts";
import { Shuttle } from "./shuttle";
import { System } from "./system";






  export const getDirection = (neighbors:number, is_up:boolean) : string =>{

    var is_up_dirs =     ["ew","ew", "ns", "sw", "ew", "ew", "se", "ew", "ns", "nw", "ns", "ew", "ne", "ew", "ew", "ew"];
    var not_is_up_dirs = ["x", "x", "x",  "sw", "x",  "ew", "se", "ew", "x",  "nw", "ns", "sw", "ne", "ew", "sw", "ew"];
    
    if(is_up) return is_up_dirs[neighbors];
    else return not_is_up_dirs[neighbors];

  }




  //searches to the west (on this row only) for an interlacement
  export const hasWestNeighbor = (drawdown: Drawdown, i:number, j:number): boolean =>{

      for(var ndx = j-1; ndx >= 0; ndx--){
        if(drawdown[i][ndx].isUp()) return true;
      }
      return false;
  }


  /***
  If this doesn't have east set, then there is nothing to the west
  */
  export const setWestNeighbors = (yarnsim: YarnSim, drawdown: Drawdown, i:number, j:number) : YarnSim => {

      for(var ndx = j-1; ndx >= 0; ndx--){
        yarnsim[i][ndx] = setEast(yarnsim[i][ndx]);
        if(drawdown[i][ndx].isUp()) return;
      }

      return yarnsim;
  }

  export const unsetWestNeighbors = (yarnsim: YarnSim, drawdown: Drawdown, i:number, j:number) : YarnSim => {

      //there is something else for the western cells to reference
      if(hasEastNeighbor(drawdown, i,j)) return; 

      //unset until you find the next set cell
      for(var ndx = j-1; ndx >= 0; ndx--){
        yarnsim[i][ndx] = unsetEast(yarnsim[i][ndx]); 
        if(drawdown[i][ndx].isUp()) return;
      }

      return yarnsim;
  }


  //searches to the east (on this row only) for an interlacement
  export const hasEastNeighbor = (drawdown: Drawdown, i:number, j:number): boolean =>{
      
      for(var ndx = j+1; ndx < warps(drawdown); ndx++){
        if(drawdown[i][ndx].isUp()) return true;
      }
      return false;
  }


  //walks to the east until it hits another set cell, adds "west" to each 
  export const setEastNeighbors = (drawdown: Drawdown, yarnsim: YarnSim, i:number, j:number) : YarnSim =>{

      for(var ndx = j+1; ndx < warps(drawdown); ndx++){
        yarnsim[i][ndx] = setWest( yarnsim[i][ndx]);
        if(drawdown[i][ndx].isUp()) return;
      }

      return yarnsim;
  }

  export const unsetEastNeighbors = (drawdown: Drawdown, yarnsim: YarnSim,i:number, j:number) : YarnSim => {

      //there is something else for the western cells to reference
      if(hasWestNeighbor(drawdown, i,j)) return; 

      //unset until you find the next set cell
       for(var ndx = j+1; ndx < warps(drawdown); ndx++){
         yarnsim[i][ndx] = unsetWest( yarnsim[i][ndx]); 
        if(drawdown[i][ndx].isUp()) return;
      }

      return yarnsim;
  }

  //searches rows to the north for any interlacement on the same shuttle
  export const hasNorthNeighbor = (draft: Draft, i:number, j:number, shuttle_id: number): boolean =>{
      for(var ndx = i-1; ndx >= 0; ndx--){
        if(draft.rowShuttleMapping[ndx] === shuttle_id){
          if(draft.drawdown[ndx][j].isUp()) return true;
          if(hasWestNeighbor(draft.drawdown, ndx,j)) return true;
          if(hasEastNeighbor(draft.drawdown, ndx,j)) return true;
        }
      }
      return false;
  }

  //searches rows to the north for any interlacement on the same shuttle
  export const setNorthNeighbors = (draft: Draft, i:number, j:number, shuttle_id: number): boolean =>{

      for(var ndx = i-1; ndx >= 0; ndx--){
        if(draft.rowShuttleMapping[ndx] === shuttle_id){
          
             

          for(var col = 0; col < warps(draft.drawdown); col++){
            
          }

          if(draft.drawdown[ndx][j].isUp()) return true;
          if(hasWestNeighbor(draft.drawdown, ndx,j)) return true;
          if(hasEastNeighbor(draft.drawdown, ndx,j)) return true;
        }
      }
      return false;
  }

  //searches rows to the south for any interlacement on the same shuttle
  export const hasSouthNeighbor = (draft: Draft, i:number, j:number, shuttle_id:number): boolean =>{
      for(var ndx = i+1; ndx < wefts(draft.drawdown); ndx++){
        if(draft.rowShuttleMapping[ndx] === shuttle_id){
          if(draft.drawdown[ndx][j].isUp()) return true;
          if(hasWestNeighbor(draft.drawdown, ndx,j)) return true;
          if(hasEastNeighbor(draft.drawdown, ndx,j)) return true;
        }
      }
      return false;
  }


 

  //checks system assignments and updates visibility of systems that are being used
  // updateSystemVisibility(type:string){

  //   var mapping;
  //   var systems;

  //   if(type == "weft"){
  //     mapping = this.rowSystemMapping;
  //     systems = this.weft_systems;
  //   } else {
  //     mapping = this.colSystemMapping;
  //     systems = this.warp_systems;
  //   }


  //   for(var i =0; i < systems.length; i++){
  //     systems[i].setVisible(mapping.includes(systems[i].id));
  //   }
  // }


export const getNextPath = (paths:Array<{row:number, overs: Array<number>}>, i:number) : {row:number, overs: Array<number>} =>{
  if(i+1 < paths.length){
    return paths[i+1];
  }

  return {
    row: -1,
    overs: []
  }

}


export const setNorth = (cell: YarnCell) : YarnCell =>{
    return (cell | 0b1000);
  }

export const setEast = (cell: YarnCell) : YarnCell => {
    return (cell | 0b0100);

  }

export const setNorthSouth = (cell:YarnCell) : YarnCell => {
    cell = setNorth(cell);
    cell = setSouth(cell);
    return cell;
  }

export const setEastWest = (cell:YarnCell) : YarnCell =>{
    cell = setEast(cell);
    cell = setWest(cell);
    return cell;
  }

export const setSouth = (cell:YarnCell) : YarnCell =>{
    return (cell | 0b0010);
  }

export const setWest = (cell:YarnCell) : YarnCell =>{
   return (cell | 0b0001);
  }

  export const unsetNorth = (cell:YarnCell) : YarnCell =>{
    return (cell ^ 0b1000);
  }

  export const unsetEast = (cell:YarnCell) : YarnCell =>{
   return (cell ^ 0b010);

  }

  export const unsetSouth = (cell:YarnCell) : YarnCell => {
   return (cell ^ 0b0010);
  }

  export const unsetWest = (cell: YarnCell): YarnCell =>{
    return (cell ^ 0b0001);
  }


  export const hasNorth = (cell: YarnCell):boolean =>{
    let p:number = cell >>> 3;
    return(p === 1);
  }

  export const isEastWest = (cell: YarnCell): boolean => {
    return ((cell & 0b0101) === 0b0101);
  }

  export const isSouthEast = (cell: YarnCell) :boolean =>{
    return ((cell & 0b0110) === 0b0110);
  }

  export const isSouthWest = (cell: YarnCell):boolean =>{
    return ((cell & 0b0011) === 0b0011);
  }

  export const isNorthSouth = (cell:YarnCell):boolean =>{
    return ((cell & 0b1010) === 0b1010);
  }

  export const isNorthEast = (cell:YarnCell):boolean =>{
    return ((cell & 0b1100) === 0b1100);
  }

  export const isNorthWest = (cell:YarnCell):boolean =>{
    return ((cell & 0b1001) === 0b1001);
  }

  export const isWest = (cell: YarnCell):boolean =>{
    return ((cell & 0b0001) === 0b0001);
  }

  export const isEast = (cell:YarnCell):boolean =>{
    return ((cell & 0b0100) === 0b0100);
  }

  export const hasEast = (cell:YarnCell):boolean =>{
    let p:number = cell >>> 2;
    return((p %2)===1);
  }

  export const hasSouth = (cell:YarnCell):boolean =>{
    let p:number = cell >>> 1;
    return((p %2)===1);
  }

  export const hasWest = (cell:YarnCell):boolean =>{
    return((cell %2)===1);
  }

  export const unsetPole = (cell:YarnCell) : YarnCell => {
    return 0b0000;
  }


  export const setPoles = (cell:YarnCell, poles: number) : YarnCell =>{
     cell = poles;
     return cell;
  }

  /***
   * determines the directionality of the yarn at this particular point in the cell
   * it considers each draft cell having four poles (NESW) and determines which of those are active
   * @param i: the draft row, j: the draft column
   * @returns a bit string value created by adding a 1 on the string n,e,s,w where the direction is true
   */ 

   export const pingNeighbors = (draft: Draft, i:number, j:number): number =>{

    let cell:YarnCell = 0b0000;
    let shuttle_id: number = draft.rowShuttleMapping[i];


    if(hasNorthNeighbor(draft, i,j,shuttle_id)) cell = setNorth(cell); 
    if(hasEastNeighbor(draft.drawdown, i,j)) cell = setEast(cell);             
    if(hasSouthNeighbor(draft, i,j,shuttle_id)) cell = setSouth(cell); 
    if(hasWestNeighbor(draft.drawdown, i,j)) cell = setWest(cell);            

    return cell;
  }

  export const computeYarnPaths = (draft: Draft, shuttles: Array<Shuttle>) : YarnSim => {
    

    const pattern = draft.drawdown.slice();
    const yarnsim:YarnSim = [];

    // //unset_all
    for(let i = 0; i < pattern.length; i++){
        yarnsim.push([]);
        for(let j = 0; j < pattern[i].length; j++){
            yarnsim[i].push(0b0000);
        }
      }
  
  
      for (var l = 0; l < shuttles.length; l++) {
  
        // Draw each shuttle on by one.
        var shuttle = shuttles[l];
  
        //acc is an array of row_ids that are assigned to this shuttle
        const acc = draft.rowShuttleMapping.reduce((acc, v, idx) => v === shuttle.id ? acc.concat([idx]) : acc, []);
  
        //screen rows are reversed to go from bottom to top
        //[row index] -> (indexes where there is interlacement)
        let path:Array<{row:number, overs: Array<number>}> = [];
        for (var i = 0; i < acc.length ; i++) {
         
          //this gets the row
          const row_values = pattern[acc[i]];
  
  
          const overs = row_values.reduce((overs, v, idx) => v.isUp() ? overs.concat([idx]) : overs, []);
  
          //only push the rows with at least one interlacement     
          if(overs.length > 0 && overs.length < row_values.length){
            path.push({row: acc[i], overs:overs});
          }
        
        }
  
        var started = false;
        var last = {
          row: 0,
          ndx: 0
        };
  
        path = path.reverse();
  
  
        for(let k = 0; k < path.length; k++){
  
          let row:number = path[k].row; 
          let overs:Array<number> = path[k].overs; 
  
          let next_path = getNextPath(path, k);
  
          let min_ndx:number = overs.shift();
          let max_ndx:number = overs.pop();
          
          let next_min_ndx:number;
          let next_max_ndx:number;
          
          if(next_path.row !== -1 ){
           
            next_max_ndx = next_path.overs[next_path.overs.length-1];
            next_min_ndx = next_path.overs[0];
  
          }else{
            next_min_ndx = min_ndx;
            next_max_ndx = max_ndx;
          }  
  
  
  
          let moving_left:boolean = (k%2 === 0 && shuttle.insert) || (k%2 !== 0 && !shuttle.insert);
  
          if(moving_left){
            if(started) max_ndx = Math.max(max_ndx, last.ndx);
            min_ndx = Math.min(min_ndx, next_min_ndx);
          } else {
            max_ndx = Math.max(max_ndx, next_max_ndx);
            if(started) min_ndx = Math.min(min_ndx, last.ndx);
  
          }
         
          //draw upwards if required
          if(started){
  
            
           // console.log("row/last.row", row, last.row);
            // for(let j = last.row-1; j > row; j--){
            //  if(moving_left) this.setNorthSouth(j, last.ndx+1);
            //  else this.setNorthSouth(j, last.ndx-1);
            // }
          }
  
          //set by lookiing at the ends ends
          if(moving_left){
  
            if(started){
                yarnsim[row][max_ndx+1] = setSouth(yarnsim[row][max_ndx+1]); //set where it came from
            } 
            
            yarnsim[row][max_ndx+1] = setWest(yarnsim[row][max_ndx+1]);
            yarnsim[row][max_ndx-1] = setNorth(yarnsim[row][max_ndx-1]);
            yarnsim[row][max_ndx-1] = setEast(yarnsim[row][max_ndx-1]);
  
            last.ndx = min_ndx;
  
          }else{
  
            if(started){
                yarnsim[row][max_ndx-1] = setSouth(yarnsim[row][max_ndx-1]);
            }
  
            yarnsim[row][max_ndx-1] = setEast(yarnsim[row][max_ndx-1]);
            yarnsim[row][max_ndx+1] = setNorth(yarnsim[row][max_ndx+1]);
            yarnsim[row][max_ndx+1] = setWest(yarnsim[row][max_ndx+1]);
            
            last.ndx = max_ndx;
  
          } 
  
          //set in between
          for(i = min_ndx; i <= max_ndx; i++){
             yarnsim[row][i] = setEastWest(yarnsim[row][i]); 
          }
  
          started = true;
          last.row = row;
         
        } 
      }

      return yarnsim.slice();


  }

  /**
   * generates a list of vertices associated with the positions of this row based onl..
   * @param yarn_last_point the direction, shuttle, and posiition where the yarn left off on the last row
   * @param draft the draft to model
   */
  // export const getNextRow = (systems: SystemVerticies, yarn_last_point: any, draft: Draft) :  =>{

  //   const pts = [];
  //   if(yarn_last_point.i == -1){  
  //     pts.push({x: -1, y: 0, z: 0});
  //     yarn_last_point.i = 0;
  //   }

  // }

  // export const getPreviousInterlacementOnWarp = (drawdown: Drawdown, j: number, cur: number) : number => {

  //   const col = getCol(drawdown, j);
  //   const val = col[cur].getHeddle();
  //   const found = false;
  //   for(let i = cur; i >= 0 && !found; i--){
  //     if(col[i].getHeddle() != val){
  //       return i;
  //     }
  //   }
  //   return -1;


  // }

  // export const calculateWeftFloatPosition = (drawdown: Drawdown, i: number,  all_warps, j_reference:number) : any => {
  //   const start_pack_at = getPreviousInterlacementOnWarp(drawdown, j_reference,i);
  //   if(start_pack_at == -1){
  //     //it reached the end of the warp and didn't find anything
  //     return   {
  //       push: all_warps[j_reference][0].y.push, 
  //       pack: all_warps[j_reference][0].y.pack+i
  //     };
  //   }else{
  //     //it found an interlacement
  //     const distance_to_interlacement = i - start_pack_at;

  //     return   {
  //       push: all_warps[j_reference][start_pack_at].y.push, 
  //       pack: all_warps[j_reference][start_pack_at].y.pack+distance_to_interlacement
  //     };
  //   }

  // }



  // export const getDraftTopology = (drawdown: Drawdown) : {warps: SystemVerticies, wefts: SystemVerticies} => {

  //   const all_warps: SystemVerticies = [];
  //   const all_wefts: SystemVerticies = [];

  //   //position each warp first. 
  //   for(let j = 0; j < warps(drawdown); j++){
  //     const col = getCol(drawdown, j);
      
  //     const col_vtx: Array<YarnVertexExpression> = [];
  //     const acc_vtx: YarnVertexExpression =  {
  //       x: {push: 1.5*j, pack: 0},
  //       y: {push: 0, pack: 0},
  //       z: {push: 0, pack: 0},
  //     }
  //     let last: Cell = new Cell(false);
  //     col.forEach((cell, i) => {
        
  //       if(cell.isSet() && i > 0){

         
  //         acc_vtx.z.push = (cell.getHeddle()) ? .5  : 0;

  //         if(cell.getHeddle() != last.getHeddle()){
  //           acc_vtx.y.push++;
  //         }else{
  //           acc_vtx.y.pack++;
  //         }
  //       }
  //       //deep copy by manually assigning. 
  //       col_vtx.push({
  //         x: {push: acc_vtx.x.push, pack: acc_vtx.x.pack},
  //         y: {push: acc_vtx.y.push, pack: acc_vtx.y.pack},
  //         z: {push: acc_vtx.z.push, pack: acc_vtx.z.pack},
  //       });

  //       last = new Cell(cell.getHeddle());

  //     });

  //     all_warps.push(col_vtx.slice());

  //   }
    

  //   const weft_floats = analyzeWeftFloats(drawdown);
  //   const wefts:Array<Array<YarnVertexExpression>> = [];
   
  //   drawdown.forEach((row, i) => {
  //     const single_weft = [];
  //     row.forEach((cell, j) => {
      
  //       const warp_vtx:YarnVertexExpression = all_warps[j][i];
  //       const assoc_float = weft_floats[i].find(el => (j >= el.start && j < el.start + el.total_length));
  //       const middle = assoc_float.total_length/2;
  //       const float_position = middle - Math.abs((j - assoc_float.start) - middle);
  //       const linear_position = j - assoc_float.start;
  //       const adj_float = assoc_float.total_length -1;

  //      // need to check something here about setting a limit on how far a single warp can be pushed. 
  //       const y_start = calculateWeftFloatPosition(drawdown, i, all_warps, assoc_float.start);
  //       const y_end = calculateWeftFloatPosition(drawdown, i, all_warps, assoc_float.start + adj_float);
  //       const y_span = {push: y_end.push - y_start.push, pack: y_end.pack - y_start.pack}

  //       let vtx = {
  //         x: {push: warp_vtx.x.push, pack: warp_vtx.x.pack},
  //         y: {push: y_start.push, pack: y_start.pack},
  //         z: {push: warp_vtx.z.push, pack: warp_vtx.z.pack},
  //       }

  //       if(adj_float > 0){
  //         vtx.y.push += linear_position/adj_float*y_span.push;
  //         vtx.y.pack += linear_position/adj_float*y_span.pack;
  //       }

  //       //push z based on weft position 
  //       const ortho = (float_position+1) * .5;
  //       let layer = 0;
  //       // const layer = (i - start_pack_to > 0) ? .5 : 0;
  //       if(assoc_float.heddle == true){
  //         vtx.z.pack -= ortho;
  //         vtx.z.push -= layer;
  //         warp_vtx.z.push -= layer;
  //       }else{
  //         vtx.z.pack += ortho;
  //         vtx.z.push += layer;
  //         warp_vtx.z.push += layer;
  //       }



  //       single_weft.push(vtx);
  //     });
  //     wefts.push(single_weft.slice());
  //   });


  //   return {warps: all_warps, wefts: wefts};
  // }

  /**
   * compute based on material thicknesses and inputs of push and pack factors
   */
  // export const evaluateVerticies = (warps_exps: SystemVerticies, wefts_exps: SystemVerticies, push_factor: number, pack_factor: number) : {warps:Array<Array<YarnVertex>>,  wefts: Array<Array<YarnVertex>>}  =>  {

  //   const warps: Array<Array<YarnVertex>> = [];

  //   warps_exps.forEach((warp_exps, j) =>{
  //     const warp_vtxs: Array<YarnVertex> = [];
  //     let vtx:YarnVertex = {x: 0, y: 0, z: 0};
  //     warp_exps.forEach((exp, i) => {

  //       vtx = {
  //         x: exp.x.push * push_factor + exp.x.pack * pack_factor,
  //         y: exp.y.push * push_factor + exp.y.pack * pack_factor,
  //         z: exp.z.push * push_factor + exp.z.pack * pack_factor,
  //       }

  //       warp_vtxs.push(vtx);

  //     });
  //     warps.push(warp_vtxs.slice())
  //   });

  //   const wefts: Array<Array<YarnVertex>> = [];

  //   wefts_exps.forEach((weft_exp, i) =>{
  //     let vtx:YarnVertex = {x: 0, y: 0, z: 0};
  //     const weft_vtxs: Array<YarnVertex> = [];

  //     //console.log(weft_exp);
  //     weft_exp.forEach((exp, j) => {

  //       vtx = {
  //         x: exp.x.push * push_factor + exp.x.pack * pack_factor,
  //         y: exp.y.push * push_factor + exp.y.pack * pack_factor,
  //         z: exp.z.push * push_factor + exp.z.pack * pack_factor,
  //       }
  //       weft_vtxs.push(vtx);
  //     });
  //     wefts.push(weft_vtxs.slice())
  //   });

  //   return {warps, wefts};
  // }


  /**
   * weft forces are added by looking at the warp interlacements and seeing if they repel or attact the wefts together
   * @param fg the force graph we are calculating
   * @param i the current weft row
   * @param j the current warp col
   * @param dd the drawdown
   * @returns 
   */
  // export const addWeftForces = (fg:Array<Array<InterlacementForceVector>>, i: number, j: number, dd: Drawdown) : Array<Array<InterlacementForceVector>> => {
   
  //   if(i+1 >= wefts(dd)) return fg; 

  //   const cur_cell = dd[i][j].getHeddle();
  //   const next_cell = dd[i+1][j].getHeddle();

  //   if(cur_cell == null || next_cell) return fg;

  //   //warp interlacements repel neighboring wefts away from eachother
  //   if(cur_cell !== next_cell){
  //     fg[i][j].fweft.y += -1;
  //     fg[i+1][j].fweft.y += 1;
  //   }else{
  //   //warp floats attact 
  //   fg[i][j].fweft.y += 1;
  //   fg[i+1][j].fweft.y += -1;

  //   }

  //   return fg;

  // }

  /**
   * warp forces (e.g. forces pushing the warps apart or together) are added by looking at the WEFT interlacements and seeing if they repel or attact the warps together
   * @param fg the force graph we are calculating
   * @param i the current weft row
   * @param j the current warp col
   * @param dd the drawdown
   * @returns the modified force graph
   */
  // export const addWarpForces = (fg:Array<Array<InterlacementForceVector>>, i: number, j: number, dd: Drawdown) : Array<Array<InterlacementForceVector>> => {
   
  //   if(j+1 >= warps(dd)) return fg; 

  //   const cur_cell = dd[i][j].getHeddle();
  //   const next_cell = dd[i][j+1].getHeddle();

  //   if(cur_cell == null || next_cell) return fg;

  //   //warp interlacements repel neighboring wefts away from eachother
  //   if(cur_cell !== next_cell){
  //     fg[i][j].fwarp.x += -1;
  //     fg[i][j+1].fwarp.x += 1;
  //   }else{
  //     //warp floats attact 
  //     fg[i][j].fwarp.x += 1;
  //     fg[i][j+1].fwarp.x += -1;
  //   }

  //   return fg;

  // }

  // export const updateForces = (fg:Array<Array<InterlacementForceVector>>, i: number, j: number, material: YarnSimSettings) : Array<Array<InterlacementForceVector>> => {
   
  //   if(j+1 >= warps(dd)) return fg; 

  //   const cur_cell = dd[i][j].getHeddle();
  //   const next_cell = dd[i][j+1].getHeddle();

  //   if(cur_cell == null || next_cell) return fg;

  //   //warp interlacements repel neighboring wefts away from eachother
  //   if(cur_cell !== next_cell){
  //     fg[i][j].fwarp.x += -1;
  //     fg[i][j+1].fwarp.x += 1;
  //   }else{
  //     //warp floats attact 
  //     fg[i][j].fwarp.x += 1;
  //     fg[i][j+1].fwarp.x += -1;
  //   }

  //   return fg;

  // }



  /**
   * floats on neighboring wefts can have one of three states: 
   * a. one float is smaller than another, therefore the smaller tucks under the bigger float
   * b. the floats are the same size- and they pack towards eachother
   * c. the floats cross one another 
   */
  export const compareFloats = (a: YarnFloat, b: YarnFloat) => {



  }

  /**
   * This is a second strategy that uses interlacement data to create force vectors on any given yarn. 
   */

  // export const computeYarnForcesFromDrawdown = (dd: Drawdown) =>{

  //   let fgraph: Array<Array<InterlacementForceVector>> = [];

  //   //initialize blank vectors
  //   dd.forEach((weft, i) => {
  //     weft.forEach((warp, j) => {
  //       const vec: InterlacementForceVector = {fweft: {x: 0, y: 0, z: 0}, fwarp:  {x: 0, y: 0, z: 0}};
  //       fgraph[i].push(vec);
  //     });
  //   });

  //   //create an initial force graph based only on the values of the drawdown
  //   for(let i = 0; i < wefts(dd); i++){
  //     for(let j = 0; j < warps(dd); j++){
  //       fgraph = addWeftForces(fgraph, i, j, dd);
  //       fgraph = addWarpForces(fgraph, i, j, dd);
  //     }
  //   }

  //   //update z based on float data
  //   const float_data = createWeftFloatMap(dd);
  //   const float_list = float_data.float_list; 
  //   const float_map = float_data.float_map;

  //   float_map.forEach((row, i) => {
  //     float_map
  //   })

  // }

  
  export const areInterlacement = (a: Cell, b: Cell) : boolean => {

    if(a.getHeddle() == null || b.getHeddle() == null) return false;

    if(a.getHeddle() != b.getHeddle()) return true;

    return false;
  }


  export const getOrientation = (a: Cell, b: Cell) : boolean => {

    if(a.getHeddle() == true && b.getHeddle() == false) return true;
    return false;
  }

/**
 * analyzes the relationship between neighboring wefts to figure out where the warp travels from front to back 
 * used to determine layering 
 * @param dd drawdown
 * @returns an array of interlacements 
 */
  export const getWarpInterlacementTuples = (dd: Drawdown) : Array<WarpInterlacementTuple> => {
    const ilace_list: Array<WarpInterlacementTuple> = [];
    
    for(let i = 0; i < wefts(dd); i++){
      for(let j = 0; j < warps(dd); j++){

        let i_top = i+1;
        let i_bot = i;

        if(i_top !== wefts(dd)){

          const ilace = areInterlacement(dd[i_top][j], dd[i_bot][j]); 
          if(ilace ){

            ilace_list.push({
              i_bot: i_bot,
              i_top:i_top,
              j: j,
              orientation: getOrientation(dd[i_top][j], dd[i_bot][j])
            })
          }
        }
      }
    }
    return ilace_list;
  }



  export const getWeftInterlacementTuples = (dd: Drawdown) : Array<WeftInterlacementTuple> => {
    const ilace_list: Array<WeftInterlacementTuple> = [];

    for(let j = 0; j < warps(dd); j++){
     for(let i = 0; i < wefts(dd); i++){

        let j_left = j;
        let j_right = j+1;


        if(j_right !== warps(dd)){

          const ilace = areInterlacement(dd[i][j_left], dd[i][j_right]); 
          if(ilace ){

            ilace_list.push({
              j_left: j_left,
              j_right:j_right,
              i: i,
              orientation: getOrientation(dd[i][j_left], dd[i][j_right])
            })
          }
        }
      }
    }
    return ilace_list;
  }




  /**
   * given a list of interlacments, see if there are interlacements with opposite orientation within the list that would indicate that these two yarns cross eachother at some point.
   * @param ilaces 
   * @returns 
   */
  export const hasBarrier = (ilaces: Array<WarpInterlacementTuple> | Array<WeftInterlacementTuple>) : boolean => {

    let last = null;
    let barrier_found = false;
    ilaces.forEach(ilace => {

      if(last == null) last = ilace.orientation;
      if(last !== ilace.orientation) barrier_found = true;
    })

    return barrier_found;

  }

  /**
   * checks to see if either of the wefts we are comparing against is on the edge. 
   * @param draft 
   * @param ilaces 
   * @returns 
   */
  export const containsWeftEdge = (draft: Draft, ilaces: Array<WarpInterlacementTuple>) : boolean => {

    ilaces.forEach(ilace => {
      if(ilace.i_top == wefts(draft.drawdown)-1) return true;
      if(ilace.i_bot == 0) return true;
    })

    return false;

  }

    /**
   * given a list of interlacments, see if there are interlacements with opposite orientation within the list that would indicate that these two yarns cross eachother at some point.
   * @param ilaces 
   * @returns 
   */
  export const hasWeftBarrierInRange = (ilaces: Array<WarpInterlacementTuple>, start: number, end: number, size: number, draft: Draft) : boolean => {



    let adj_start = Math.max(start-size, 0);
    let adj_end = Math.min(end+size, warps(draft.drawdown));

    let all_relevant_interlacements = ilaces.filter(el => el.j > adj_start && el.j < adj_end);
    return  hasBarrier(all_relevant_interlacements);
    

  }

  export const hasWarpBarrierInRange = (ilaces: Array<WeftInterlacementTuple>, start: number, end: number, size: number, draft: Draft) : boolean => {



    let adj_start = Math.max(start-size, 0);
    let adj_end = Math.min(end+size, wefts(draft.drawdown));

    let all_relevant_interlacements = ilaces.filter(el => el.i > adj_start && el.i < adj_end);
    return  hasBarrier(all_relevant_interlacements);
    

  }




  /**
   * when positioning wefts, if there are interlacing wefts, always using the posiitons of the weft underneithe for positioning. 
   * @param j_active 
   * @param j_check 
   * @param i_start 
   * @param i_end 
   * @param ms 
   * @param draft 
   * @param weft_vtxs 
   * @returns 
   */
  // export const positionInterlacingWefts = (j_active: number, j_check: number, i_start: number, i_end: number, ms: MaterialsService, draft: Draft, weft_vtxs: Array<Array<YarnVertex>>) :   Array<Array<YarnVertex>> =>{
  //   let check_mat = ms.getDiameter(draft.colShuttleMapping[j_active]);
  //   let active_mat = ms.getDiameter(draft.colShuttleMapping[j_check]);
  //   for(let i =i_start; i <= i_end; i++){     
  //     weft_vtxs[i_active][j].y = weft_vtxs[i_check][j].y + (check_mat/2 + active_mat/2) + .5;  
  //   }
  //   return weft_vtxs;
  // }

  export const positionFloatingWefts = (i_active: number, i_check: number, j_start: number, j_end: number, ms: MaterialsService, draft: Draft, weft_vtxs: Array<Array<YarnVertex>>) :   Array<Array<YarnVertex>> =>{
    let check_mat = ms.getDiameter(draft.rowShuttleMapping[i_check]);
    let active_mat = ms.getDiameter(draft.rowShuttleMapping[i_active]);
    for(let j =j_start; j <= j_end; j++){     
      weft_vtxs[i_active][j].y = weft_vtxs[i_check][j].y + (check_mat/2 + active_mat/2);  
    }
    return weft_vtxs;
  }






  /**
   * given two rows (i) generate a list of all interlacments (between jstart and end) that exist between these two rows
   * @param i_active 
   * @param i_check 
   * @param j_start 
   * @param j_end 
   * @param draft 
   * @returns 
   */
  export const getInterlacementsBetweenWefts = (i_active: number, i_check: number, j_start: number, j_end: number, draft: Draft) => {

    let ilace_list: Array<WarpInterlacementTuple> = [];
    
    if(i_check < 0){
      return ilace_list;
    }

    for(let j =j_start; j <= j_end; j++){
      
    9
      const are_interlacements = areInterlacement(draft.drawdown[i_active][j], draft.drawdown[i_check][j]);
      if(are_interlacements) ilace_list.push({
        i_top: i_active,
        i_bot: i_check,
        j: j,
        orientation: getOrientation(draft.drawdown[i_active][j], draft.drawdown[i_check][j])
      })
    }
    return ilace_list;
  }


  /**
   * given two columsn/warps (j) generate a list of all interlacments (between istart and iend) that exist between these two warps
   * @param j_active 
   * @param j_check 
   * @param i_start 
   * @param i_end 
   * @param draft 
   * @returns 
   */
  export const getInterlacementsBetweenWarps = (j_active: number, j_check: number, i_start: number, i_end: number, draft: Draft) => {
    let ilace_list: Array<WeftInterlacementTuple> = [];
    for(let i =i_start; i <= i_end; i++){
      const are_interlacements = areInterlacement(draft.drawdown[i][j_active], draft.drawdown[i][j_check]);
      if(are_interlacements) ilace_list.push({
        j_left: j_check,
        j_right: j_active,
        i: i,
        orientation: getOrientation(draft.drawdown[i][j_active], draft.drawdown[i][j_check])
      })
    }
    return ilace_list;
  }


 

  export const setLayerZ = (ilace_list: Array<WarpInterlacementTuple>, count: number, layer_spacing: number, warp_vtxs: Array<Array<YarnVertex>>) :  Array<Array<YarnVertex>> => {
      if(count == 0) console.log("------COUNT 0 ", ilace_list);

    ilace_list.forEach(ilace => {

      //warp_vtxs[ilace.i_top][ilace.j].y = warp_vtxs[ilace.i_bot][ilace.j].y + 1;

      for(let i = ilace.i_bot; i <= ilace.i_top; i++){
        // console.log("writing to ", i, ilace.j, count);
        warp_vtxs[i][ilace.j].z = count*layer_spacing;
      }
    });

    return warp_vtxs;

  }

  // export const pushWeftInterlacementsToVtxList = (ilace_list: Array<WeftInterlacementTuple>, draft: Draft, ms: MaterialsService, warp_vtxs: Array<Array<YarnVertex>>, weft_vtxs: Array<Array<YarnVertex>>) :  Array<Array<YarnVertex>> => {

  //   ilace_list.forEach(ilace => {
  //     let float_length = warp_vtxs[ilace.i][ilace.j_right].x - warp_vtxs[ilace.i][ilace.j_left].x; 
  //     let x_midpoint = warp_vtxs[ilace.i][ilace.j_left].x + float_length/2;
  //     let last = weft_vtxs[ilace.i].length -1;
  //     let last_vertex:number = (last < 0) ? 0 :  weft_vtxs[ilace.i][last].x;
  //     let arch_factor = (ilace.orientation === true) ? -1 : 1;
  //     let dist_to_interlacement = 0;
  //     let offset = getWeftOffsetFromWarp(draft, ilace.i, ilace.j_left, ms);

  //     if(last_vertex == null){
  //       dist_to_interlacement = x_midpoint;
  //     }else{
  //       dist_to_interlacement = x_midpoint - last_vertex;
  //     }

  //     arch_factor *= Math.min(2, dist_to_interlacement/10);

      
  //     weft_vtxs[ilace.i].push({
  //       x: last_vertex + dist_to_interlacement/2,
  //       y: warp_vtxs[ilace.i][ilace.j_left].y, 
  //       z: warp_vtxs[ilace.i][ilace.j_left].z + offset * arch_factor
  //     });


  //     weft_vtxs[ilace.i].push({
  //       x: x_midpoint,
  //       y: warp_vtxs[ilace.i][ilace.j_left].y, 
  //       z: warp_vtxs[ilace.i][ilace.j_left].z
  //     });


  //   });


  //   return weft_vtxs;

  // }





  /**
   * a segment with no varience in interlacemetn orientations often signifies a layer. In this snippit, you continue comparing the active row with each subsequent row underneith to identify if it has a barrier. When it finds a barrier, it sets all the warps associated with teh interlacements on the barrier row to the associated layer position. 
   * @param count how many rows have been explored so far
   * @param i_active the row we are attempting to move down
   * @param i_check the row we are checking against
   * @param j_start the j position we are starting to look
   * @param j_end the j position we are ending on
   * @param draft the current draft
   * @param range the distance required from an interlacement to form a layer
   * @param warp_vtxs the warp positions
   * @returns 
   */
  export const layerWarpsInZBetweenInterlacements = (count: number, i_active:number, i_check: number, j_start: number, j_end: number, draft: Draft, range: number, layer_spacing: number,  warp_vtxs: Array<Array<YarnVertex>>) : Array<Array<YarnVertex>>=> {

    let ilace_list: Array<WarpInterlacementTuple> = getInterlacementsBetweenWefts(i_active, i_check, j_start, j_end, draft);
    //if check is 0 there are no more rows to check and we should just return where we are. 
    if(i_check < 0){
      console.log("we are at the end of the range, sending count ", count, ilace_list)
      return setLayerZ(ilace_list, count, layer_spacing, warp_vtxs);
    }

  
    // console.log("i lace list comparing", i_active, i_check, j_start, j_end, ilace_list)
    
    //if there are no interlacements on this row, it was a duplicate of the previous row, and so we couls just move
    if(ilace_list.length == 0)
      return layerWarpsInZBetweenInterlacements(count, i_active, i_check-1, j_start, j_end, draft, range, layer_spacing,  warp_vtxs);
    

    const has_barrier = hasWeftBarrierInRange(ilace_list, j_start, j_end, range, draft);
    // console.log("has barrier ", has_barrier);
    if(has_barrier){
      //set the warp positions here
      //each mark each of the barriers as a place that needs to move 
      console.log("we are at a barrier, sending count ", count, ilace_list)

      return setLayerZ(ilace_list, count, layer_spacing, warp_vtxs);

    }else{
    
      let orientation = ilace_list[0].orientation;
      if(orientation){
        count = count -1;
      }else{
        count = count + 1;
      }
      return layerWarpsInZBetweenInterlacements(count, i_active, i_check-1, j_start, j_end, draft, range, layer_spacing, warp_vtxs);
  
    } 

  }




  // export const layerWeftsInYZBetweenInterlacements = (count: number, j_active:number, j_check: number, i_start: number, i_end: number, draft: Draft, range: number, ms: MaterialsService, warp_vtxs:  Array<Array<YarnVertex>>, weft_vtxs: Array<Array<YarnVertex>>) : Array<Array<YarnVertex>>=> {

  //   //if check is 0 we don't have any interlacements to add
  //   if(j_check < 0){
  //     return weft_vtxs;
  //   } 

  //   let ilace_list: Array<WeftInterlacementTuple> = getInterlacementsBetweenWarps(j_active, j_check, i_start, i_end, draft);
    
  //   //if there are no interlacements on this row, it was a duplicate of the previous row, and so we couls just move
  //   if(ilace_list.length == 0)
  //     return layerWeftsInYZBetweenInterlacements(count, j_active, j_check-1, i_start, i_end, draft, range, ms, warp_vtxs, weft_vtxs);
    

  //   const has_barrier = hasWarpBarrierInRange(ilace_list, i_start, i_end, range, draft);
  //   if(has_barrier){
  //     return pushWeftInterlacementsToVtxList(ilace_list, draft, ms, warp_vtxs, weft_vtxs);

  //   }else{
    
  //     let orientation = ilace_list[0].orientation;
  //     if(orientation){
  //       count = count -1;
  //     }else{
  //       count = count + 1;
  //     }
  //     return layerWeftsInYZBetweenInterlacements(count, j_active, j_check-1, i_start, i_end, draft, range, ms, warp_vtxs, weft_vtxs);
  
  //   } 

  // }



  /**
   * gets the first instance of an interlacement with a different orientation to the start, returns the index at which it was found and the distance
   * @param start the first weft tuple
   * @param remaining the remaining list
   * @returns the ndx at which the segment ends (before the interlacement) or -1 if no interlacement is ever found.
   */
  export const getNonInterlacingWarpSegment = (start: WarpInterlacementTuple, remaining: Array<WarpInterlacementTuple>) : {ndx: number, dist: number} =>{
     
    let ref_orientation = start.orientation;
    let barrier_cell = remaining.findIndex(el => el.orientation !== ref_orientation);
   
    if(barrier_cell !== -1){
      let distance = Math.abs(start.j - remaining[barrier_cell].j-1);
      return {ndx:barrier_cell, dist: distance};
    }else{
      return {ndx: -1, dist:-1};
    }
  }


  export const getNonInterlacingWeftSegment = (start: WeftInterlacementTuple, all: Array<WeftInterlacementTuple>) : {ndx: number, dist: number} =>{
     

    let ref_orientation = start.orientation;
    let barrier_cell = all.findIndex(el => el.i > start.i && el.orientation !== ref_orientation);


    if(barrier_cell !== -1){
      let distance = Math.abs(start.i - all[barrier_cell].i-1);
      return {ndx:barrier_cell, dist: distance};
    }else{
      return {ndx: -1, dist:-1};
    }
  }




/**
 * when positioning warps in layers, warps close to the ends of the draft will never get a position set. For this reason, we set an unreasinable z value to flag a process after the warps are positioned to update the ends. 
 * @param i 
 * @param j 
 * @param warp_vtx 
 * @returns 
 */
export const getClosestWarpValue = (i: number, j: number, warp_vtx: Array<Array<YarnVertex>>) : number => {

  for(let x = 1; x < warp_vtx.length; x++){
    let bot = i-x;
    let top = i+x;

    if(bot >= 0 && bot <= warp_vtx.length-1 && warp_vtx[bot][j].z !== -10000000) return warp_vtx[bot][j].z;
    if(top >= 0 && top <= warp_vtx.length -1 && warp_vtx[top][j].z !== -10000000) return warp_vtx[top][j].z;
  }
  return 0;

}



  export const getWeftOffsetFromWarp = (draft: Draft, i: number, j: number, ms: MaterialsService) : number => {

    let warp_diam = ms.getDiameter(draft.colShuttleMapping[j]);
    let weft_diam = ms.getDiameter(draft.rowShuttleMapping[i]);

    return (warp_diam / 2 + weft_diam/2);

  }

  export const getMidpoint = (a: number, b: number) : number =>{
    let max = Math.max(a,b);
    let min = Math.min(a,b);
    let float = max - min;
    return min + float/2;

  }


  export const getTuplesWithinRange = (tuples: Array<WarpInterlacementTuple>, range: WarpRange) : Array<WarpInterlacementTuple> => {
    return tuples.filter(tuple => tuple.j >= range.j_left && tuple.j <= range.j_right);
  }


  /**
   * given a list of weft-oriented tuples (comapring wefts at each warp) find all the relevant interlacements
   * @param tuples 
   * @param count 
   * @returns 
   */
  export const extractInterlacementsFromTuples = (tuples: Array<WarpInterlacementTuple>, count: number) : Array<TopologyVtx> => {
    const topo: Array<TopologyVtx> = [];

    //look left to right
    for(let x = 1; x < tuples.length; x++){
      let last = x -1;
      if(tuples[last].orientation !== tuples[x].orientation){
          topo.push({
            i_top: tuples[last].i_top, 
            i_bot: tuples[last].i_bot,
            i_mid: getMidpoint(tuples[last].i_top, tuples[last].i_bot),
            j_left: tuples[last].j,
            j_right: tuples[x].j,
            j_mid: getMidpoint(tuples[last].j, tuples[x].j,),
            orientation: !tuples[last].orientation,
            z_pos: count
          });
        }
      }

      //look right to left
      // for(let x = tuples.length-2; x >=0; x--){
      //   let last = x +1;
      //   if(tuples[last].orientation !== tuples[x].orientation){
      //       topo.push({
      //         i_top: tuples[x].i_top, 
      //         i_bot: tuples[x].i_bot,
      //         i_mid: getMidpoint(tuples[x].i_top, tuples[x].i_bot),
      //         j_left: tuples[x].j,
      //         j_right: tuples[last].j,
      //         j_mid: getMidpoint(tuples[x].j, tuples[last].j,),
      //         orientation: !tuples[x].orientation,
      //         z_pos: count
      //       });
      //   }
      // }

    // return topo;

    let optimal_topo: Array<TopologyVtx> = [];
    topo.forEach(vtx => {
      let reduced = reduceInterlacement(vtx, tuples, count);
      // console.log("REDUCED ILACE ", reduced)
      if(reduced === null) optimal_topo.push(vtx);
      else optimal_topo.push(reduced);
    })

     return optimal_topo;

    
  }

  export const reduceInterlacement = (vtx: TopologyVtx, tuples: Array<WarpInterlacementTuple>, count: number) : TopologyVtx => {

    if(vtx.j_right - vtx.j_left <= 1) return null;


      let inner_tuples = getTuplesWithinRange(tuples, {j_left: vtx.j_left, j_right: vtx.j_right});
      let right_side_orientation = !vtx.orientation;

      //get the closest interlacment ot the right side
      let closest = inner_tuples.reduce((acc, val, ndx) => {
        if(val.orientation !== right_side_orientation &&  vtx.j_right - val.j < acc.dist ) return {ndx, dist:  vtx.j_right - val.j}
        return acc;
      },{ndx: -1, dist: vtx.j_right - vtx.j_left});


      //this was irreducible
      if(closest.dist == vtx.j_right - vtx.j_left || closest.dist == 0) return null;
      
      let new_vtx:TopologyVtx = {
        i_bot: vtx.i_bot, 
        i_top: vtx.i_top,
        i_mid: vtx.i_mid, 
        j_left: inner_tuples[closest.ndx].j,
        j_right: vtx.j_right,
        z_pos: count,
        j_mid: getMidpoint(vtx.j_right, inner_tuples[closest.ndx].j),
        orientation: vtx.orientation
      }

      return new_vtx;


  }

  /**
   * a recursive function that finds interlacments, returns them, and then searches remaining floating sections to see if they should push to a new layer
   * @param tuples the list of tuples to search
   * @param count  the current layer id
   * @param draft the draft in question
   * @returns 
   */
  export const getInterlacements = (tuples: Array<WarpInterlacementTuple>, range: WarpRange, count: number,  draft: Draft) : Array<TopologyVtx> => {


    let closeness_to_edge = Math.ceil(warps(draft.drawdown)/8);


    if(tuples.length < 1) return [];



    if(tuples[0].i_bot < 0) return [];



   // if(tuples[0].i_top == wefts(draft.drawdown)-1) return [];


    
    tuples = getTuplesWithinRange(tuples, range);
    const floats  = extractInterlacementsFromTuples(tuples, count);
    const topo  = extractInterlacementsFromTuples(tuples, count);

    let i_bot = tuples[0].i_bot;
    let i_top = tuples[0].i_top;
    let orientation = tuples[0].orientation

    let ilaces: Array<TopologyVtx> = [];
    let float_groups: Array<WarpRange> = splitRangeByVerticies(range , topo);
    float_groups = float_groups.filter(el => el.j_left !== el.j_right);

    //filter out groups where the last warp is included because they tend to be noisy  
    float_groups = float_groups.filter(el => !(el.j_right != warps(draft.drawdown)-1 && el.j_right - el.j_left < closeness_to_edge));

    
    // console.log("FLOAT GROUPS AT ", i_top, i_bot, range, topo, float_groups);


    float_groups.forEach((range, x) => {
      // console.log("LOOKING AT FLOAT GROUP ", x)
      count = orientation ? count + 1 : count -1;
      
      let next_row_tuple: Array<WarpInterlacementTuple> = getInterlacementsBetweenWefts(i_top, i_bot-1, range.j_left, range.j_right, draft);
      ilaces = ilaces.concat(getInterlacements(next_row_tuple.slice(), range, count,  draft));

    });
  

      
    
    return topo.concat(ilaces);

  }

  // export const extractAnyInterlacementsWithinRange = (tuples: Array<WarpInterlacementTuple>, range: WarpRange, count: number,  draft: Draft) : Array<TopologyVtx> => {
  //   const topo = [];

  //   for(let x = 0; x < range.j_right; x++){
  //     let last = x -1;
  //     if(tuples[last].orientation !== tuples[x].orientation){
  //         topo.push({
  //           i_top: tuples[last].i_top, 
  //           i_bot: tuples[last].i_bot,
  //           i_mid: getMidpoint(tuples[last].i_top, tuples[last].i_bot),
  //           j_left: tuples[last].j,
  //           j_right: tuples[x].j,
  //           j_mid: getMidpoint(tuples[last].j, tuples[x].j,),
  //           orientation: !tuples[last].orientation,
  //           z_pos: count
  //         });
        
  //     }
  //   }

  // }

  export const getFloatRanges = (draft: Draft, i: number) => {
    const ranges: Array<WarpRange> = [];
    let last_ndx = -1;
    let last_value, cur_value: boolean  = false;
    draft.drawdown[i].forEach((cell, j) => {
      if(j == 0){
        last_ndx = 0;
        last_value = cell.isSet() && cell.isUp();
      } else{
        cur_value = cell.isSet() && cell.isUp();
        if(cur_value != last_value){
          ranges.push({j_left:last_ndx, j_right:j})
        }
        last_value = cur_value;
        last_ndx = j;

      }
    })
    ranges.push({j_left: last_ndx, j_right: warps(draft.drawdown)-1});
    return ranges;
  } 


  /**
   * after you find a list of verticies between the two rows, you split the semgents of the row between the verticies 
   * @param range 
   * @param verticies 
   * @returns 
   */
  export const splitRangeByVerticies = (range:WarpRange, verticies: Array<TopologyVtx>) : Array<WarpRange> => {

    let groups:Array<WarpRange> = [];
    verticies = sortInterlacementsOnWeft(verticies);

    //this would happen if the row just checked didn't have any interlacements, 
    if(verticies.length == 0) return [range];

    for(let v = 0; v < verticies.length; v++){
      if(v == 0){
        groups.push({
          j_left: range.j_left, 
          j_right: verticies[v].j_left
        })
      }
      

      if( v > 0 && v < verticies.length-1){
        groups.push({
          j_left: verticies[v-1].j_right, 
          j_right:  verticies[v].j_left
        })
      }

      if(v == verticies.length -1){
        groups.push({
          j_left: verticies[v].j_right, 
          j_right: range.j_right
        })
      }

    }

    return groups;
  }



  



  /**
   * this function takes a draft and input variables and uses those to generate a list of vertexes between which yarns will cross on the z plane. These points are used to determine how layers are formed and how yarns will stack relative to eacother. 
   */
  export const getDraftToplogy = (draft: Draft, sim: SimulationVars) : Promise<Array<TopologyVtx>> => {
    const dd = draft.drawdown;
    const warp_tuples = getWarpInterlacementTuples(dd);
    let topology: Array<TopologyVtx> = [];


  
    //look at each weft
    for(let i = 0; i < wefts(dd); i++){

      //get the interlacements associated with this row
      let a = warp_tuples.filter(el => el.i_top == i);
      let range = {j_left: 0, j_right: warps(draft.drawdown)-1}
      let verticies = getInterlacements( a, range, 0,  draft);



      topology = topology.concat(verticies);
    }

    return  Promise.resolve( removeOutlierInterlacements(draft, topology, sim.layer_threshold));

  }


/**
 * if you render each layer as a different color, you can spot incorrect layers as those that are islands of their layer type. This function looks for neighboring cells corresponding to the layer order to develop a confidence level that this is or isn't a layer
 * @param layer_map 
 * @param draft 
 */
    // export const cleanLayers = (layer_map: Array<Array<number>>, draft: Draft, x: number) :  Array<Array<number>> =>{
      
    //   //scan warps and find all regions with count 1

    //   //COUNT HOW MANY OF EACH LAYER 
    //   for(let j =0; j < warps(draft.drawdown); j++){

    //     let counts = [];
    //     let last = layer_map[0][j];
    //     let i_start = 0;
    //     counts.push({i_start: 0, val: layer_map[0][j], count: 1});
    //     for(let i = 1; i < wefts(draft.drawdown); i++){
    //       if(last == layer_map[i][j]){
    //         let c = counts.find(el => el.i_start == i_start);
    //         c.count++;
    //       }else{
    //         i_start = i;
    //         counts.push({i_start: i, val: layer_map[i][j], count: 1});
    //       }
    //       last = layer_map[i][j];
    //     }

    //     let too_small = counts.filter(el => el.count <= x );
        
    //     //
    //     too_small.forEach(count => {
    //       let layer = Math.abs(count.val);

    //       //search the neighbors. 
    //       let ray = {n: 0, e: 0, s: 0, w: 0};

    //     })

  
  



    //   }

    //   //comapre with neighbors "n" distance away (e.g. if layer is 1, skip every other)
    //   // if no matching neighbor is found in a distance of x; 
    //   //assign this cell a very low confidence that it is indeed a layer, 
    //   //if all four neighbors are found OR its part of a very long chain, give it a high confidence 

    //   //repeats for counts of 2 etc. 

      
    //   return layer_map;
    // }


    /**
     * given a list of verticies and the number of interlacement with that same value, merge groups of size lower than size to one couup. 
     * @param counts 
     * @param size 
     * @returns 
     */
  //   export const mergeGroupsOfSize = (counts: Array<WarpWeftLayerCount>, size: number) : Promise<Array<WarpWeftLayerCount>> => {


  //     let matching_groups = counts.filter(el => el.count == size);
  //     // console.log("MERGING GROUPS OF SIZE ", counts, matching_groups);

  //     if(matching_groups.length == 0) return Promise.resolve(counts.slice());

    
  //     let merged: Array<WarpWeftLayerCount> = counts.slice();
  //     matching_groups.forEach(g => {

  //       //find this element in the count
  //       let ndx =  counts.findIndex(el => el.ndx == g.ndx);
      
  //       if(ndx == -1) {
  //         console.error("ELEMENT IN MERGE NOT FOUND, looking for", g.ndx, counts)
  //         return Promise.resolve(counts);
  //       }



  //       let before: number = (ndx == 0) ? 0 : counts[ndx-1].count;
  //       let after : number = (ndx == counts.length-1) ? 0 : counts[ndx+1].count;
  //       let before_layer:number =  (ndx == 0) ? 0 : counts[ndx-1].layer;
  //       let after_layer:number = (ndx == counts.length-1) ? 0 :  counts[ndx+1].layer;

        
  //       //get the bigger element 
  //       if(ndx -1 < 0 && (ndx + 1) < counts.length){
  //         let new_el: WarpWeftLayerCount = {
  //           ndx: counts[ndx].ndx,
  //           count: counts[ndx+1].count + counts[ndx].count,
  //           layer: counts[ndx+1].layer
  //         }

  //         merged.splice(ndx, 2, new_el);

  //       }else if(ndx -1 >= 0 && (ndx + 1) >= counts.length){
  //           //merge this into before
  //           let new_el: WarpWeftLayerCount = {
  //             ndx: counts[ndx-1].ndx,
  //             count: counts[ndx-1].count + counts[ndx].count,
  //             layer: counts[ndx-1].layer
  //           }
  
  //           merged.splice(ndx-1, 2, new_el);
    
  //       }else if(ndx -1 < 0 && (ndx + 1) >= counts.length){
  //         //do nothing, because there is nothing you could do 
  //       }else if(before > after || (before === after && before_layer < after_layer)){
  //         //merge this into before
  //         let new_el: WarpWeftLayerCount = {
  //           ndx: counts[ndx-1].ndx,
  //           count: counts[ndx-1].count + counts[ndx].count,
  //           layer: counts[ndx-1].layer
  //         }

  //         merged.splice(ndx-1, 2, new_el);

  //       }else if(after > before  || (before === after && after_layer < before_layer)){

  //         let new_el: WarpWeftLayerCount = {
  //           ndx: counts[ndx].ndx,
  //           count: counts[ndx+1].count + counts[ndx].count,
  //           layer: counts[ndx+1].layer
  //         }

  //         merged.splice(ndx, 2, new_el);

  //       }else if(after === before && counts[ndx-1].layer == counts[ndx+1].layer){
  //         //they are equal and on the same layer - merge into one big group
  //         let new_el: WarpWeftLayerCount = {
  //           ndx: counts[ndx-1].ndx,
  //           count: counts[ndx-1].count + counts[ndx].count + counts[ndx+1].count,
  //           layer: counts[ndx-1].layer
  //         }

  //         merged.splice(ndx-1, 3, new_el);

  //       }else{
  //         console.error("MERGE FAILED TO IDENTIFY CANDIDATE", before, after, counts);

  //       }

  //     });
  //     // console.log("MERGED", merged)
  //     return Promise.resolve(merged);


  //   }


   export const removeOutlierInterlacements = (draft: Draft, topo: Array<TopologyVtx>, threshold: number) : Array<TopologyVtx> => {

    return topo;


    const topo_layer_counts = [];
     topo.forEach((ilace, t) => {
      let ndx = topo_layer_counts.findIndex(el => el.layer == ilace.z_pos);
      if(ndx == -1) topo_layer_counts.push({layer: ilace.z_pos, count: 1, ilaces: [ilace]});
      else{
        topo_layer_counts[ndx].count ++;
        topo_layer_counts[ndx].ilaces.push(ilace);
      } 
    });
    // console.log("TOPO LAYER COUNTS BEFORE", topo_layer_counts);

    topo_layer_counts.forEach(topocount => {
      if(topocount.count < threshold){
        // console.log("Looking to remove ", topocount);
        topocount.ilaces.forEach(ilace => {
          let found_at = topo.findIndex(el => el.j_left == ilace.j_left && el.j_right == ilace.j_right && el.i_top == ilace.i_top && el.i_bot == ilace.i_bot);
          if(found_at !== -1){
            // console.log("REMOVED !", found_at)
            topo.splice(found_at, 1);
          }else{
            // console.log("INTERLACEMENT NOT FOUND")
          }
        })
      }
    })
  
    // console.log("TOPO LAYER COUNTS AFTER", topo.length);

    return topo; 
    // let layer_data: Array<Array<LayerData>> = [];
    // // for(let i = 0; i < wefts(draft.drawdown); i++){
    // //   for(let j = 0; j < warps(draft.drawdown); j++){

    // //     //get all the interlacements to which this cell belongs. 
    // //     let ilaces = topo.filter(el => (el.j_left == j || el.j_right == j) && (el.i_top == i || el.i_bot == i));

    // //     if(ilaces.length == 0){
    // //       let closest = getClosestInterlacementOnWarp(topo, i, j);
    // //       //this is not really mapped to any layer so give it a low confidence 
    // //       layer_data[i][j] = {
    // //         proximity_to_edge: Math.min(i, j, wefts(draft.drawdown)-i, warps(draft.drawdown)-j ),
    // //         confidence: 0,
    // //         longest_ray: -1, 
    // //         default: closest.z_pos
    // //       }
    // //     }else{

    // //       let smallest_warp_distance = ilaces.reduce((acc, val, ndx) => {
    // //         let dist = val.i_top-val.i_bot;
    // //         if(dist < acc.dist ) return {ilace: val, dist: dist};
    // //         return acc;
    // //       }, {ilace: null, dist: 1000000});

    // //       let all_smallest_warps = ilaces.filter(el => el.i_top-el.i_bot == smallest_warp_distance.dist);

    // //       let smallest_weft_distance = all_smallest_warps.reduce((acc, val, ndx) => {
    // //         let dist = val.j_right-val.j_left;
    // //         if(dist < acc.dist ) return {ilace: val, dist: dist};
    // //         return acc;
    // //       }, {ilace: null, dist: 1000000});

    // //       let all_smallest_wefts = ilaces.filter(el => el.j_right-el.j_left == smallest_weft_distance.dist);


    // //       //confidence is proportional to size - the smaller the interlacement, the more strongly it is correct
    // //       let confidence  = 1/(smallest_warp_distance.dist * smallest_weft_distance.dist * 1)

          
    // //     }

    // //   }
    // // }
    // return [];

   }




   /**
    * checks if there is the indiciated value found along a warp within the specified range
    * @param layer_map 
    * @param val 
    * @param i_min 
    * @param i_max 
    * @param j 
    * @returns 
    */
    export const warpLayerValueInRange = (layer_map: Array<Array<number>>, val: number, i_min: number, i_max: number, j: number) : number => {


      let warp:Array<number> = layer_map.reduce((acc, val)=> {
        return acc.concat(val[j])
      }, []);

      let range = warp
      .filter((el, ndx) => ndx > Math.max(0, i_min) && ndx < i_max)
  

      let has_value = range.findIndex(el => el == val);
      if(has_value !== -1) return has_value;

      if(i_min == 0) return 0;

      if(i_max == layer_map.length-1) return layer_map.length-1;

      return -1;
     
    }

   /**
    * checks if there is the indiciated value found along a warp within the specified range
    * @param layer_map 
    * @param val 
    * @param i_min 
    * @param i_max 
    * @param j 
    * @returns 
    */
   export const weftLayerValueInRange = (layer_map: Array<Array<number>>, val: number, j_min: number, j_max: number, i: number) : number => {



    let range = layer_map[i]
    .filter((el, ndx) => ndx > Math.max(0, j_min) && ndx < j_max)


    let has_value = range.findIndex(el => el == val);
    if(has_value !== -1) return has_value;

    if(j_min == 0) return 0;

    if(j_max == layer_map[0].length-1) return layer_map[0].length-1;

    return -1;
   
  }


    /**
     * takes interlacements associted with a layer and organizes them to associate each warp location with a given location
     * @param layer_map 
     * @param interlacements 
     * @param max_ilace_width how close do warps need to be in an interlacement to consider these two warps being on the same layer
     * @param max_ilace_height how close do wefts need to be in an interlacement to consider these wefts as being on the same layer
     * @returns 
     */
    export const addWarpLayerInterlacementsToMap = (layer_map: Array<Array<number>>, interlacements: Array<TopologyVtx>, max_ilace_width: number, max_ilace_height: number) : Array<Array<number>> => {


      interlacements.forEach(ilace => {
        let width = ilace.j_right-ilace.j_left;
        if(width <= max_ilace_width){

    
          //span the interlaced warps onto the same layer
         for(let i = ilace.i_bot; i <= ilace.i_top; i++){
              if(layer_map[i][ilace.j_left] == null) layer_map[i][ilace.j_left] = ilace.z_pos;
              if(layer_map[i][ilace.j_right] == null) layer_map[i][ilace.j_right] = ilace.z_pos;
            
         } 

         let i_min = Math.max(0, ilace.i_bot - max_ilace_height);
         let i_max = Math.min(ilace.i_top + max_ilace_height, layer_map.length-1);

        //reach out from all four corners and see if there is an interlacement with the same layer val in range
         let bottom_left = warpLayerValueInRange(layer_map, ilace.z_pos, i_min, ilace.i_bot, ilace.j_left);

        if(bottom_left !== -1){
         for(let i = bottom_left; i < ilace.i_bot; i++){
          if(layer_map[i][ilace.j_left] == null) layer_map[i][ilace.j_left] = ilace.z_pos;
         }
        }

        let bottom_right = warpLayerValueInRange(layer_map, ilace.z_pos, i_min, ilace.i_bot, ilace.j_right);
        if(bottom_right !== -1){
          for(let i = bottom_right; i < ilace.i_bot; i++){
           if(layer_map[i][ilace.j_right] == null) layer_map[i][ilace.j_right] = ilace.z_pos;
          }
         }
 
         let top_left = warpLayerValueInRange(layer_map, ilace.z_pos, ilace.i_top, i_max, ilace.j_left);
         if(top_left !== -1){
          for(let i = ilace.i_top; i <= top_left; i++){
            if(layer_map[i][ilace.j_left] == null) layer_map[i][ilace.j_left] = ilace.z_pos;
          }
         }

         let top_right = warpLayerValueInRange(layer_map, ilace.z_pos, ilace.i_top, i_max, ilace.j_right);
         if(top_right !== -1){
          for(let i = ilace.i_top; i <= top_right; i++){
            if(layer_map[i][ilace.j_right] == null) layer_map[i][ilace.j_right] = ilace.z_pos;
          }
         }




        }
      });

      return layer_map;
    }

    export const addWeftLayerInterlacementsToMap = (layer_map: Array<Array<number>>, interlacements: Array<TopologyVtx>, max_ilace_width: number) : Array<Array<number>> => {


      interlacements.forEach(ilace => {
        let width = ilace.j_right-ilace.j_left;
        if(width <= max_ilace_width){
    
          //span the interlaced wefts onto the same layer
         for(let j = ilace.j_left; j <= ilace.j_right; j++){
              if(layer_map[ilace.i_bot][j] == null) layer_map[ilace.i_bot][j]  = ilace.z_pos;
              if(layer_map[ilace.i_top][j] == null) layer_map[ilace.i_top][j] = ilace.z_pos;
            
         } 

         let j_min = Math.max(0, ilace.j_left - max_ilace_width);
         let j_max = Math.min(ilace.j_right + max_ilace_width, layer_map[0].length-1);

        //reach out from all four corners and see if there is an interlacement with the same layer val in range
         let bottom_left = weftLayerValueInRange(layer_map, ilace.z_pos, j_min, ilace.j_left, ilace.i_bot);

        if(bottom_left !== -1){
         for(let j = bottom_left; j < ilace.j_left; j++){
          if(layer_map[ilace.i_bot][j] == null) layer_map[ilace.i_bot][j] = ilace.z_pos;
         }
        }

        let top_left = weftLayerValueInRange(layer_map, ilace.z_pos, j_min, ilace.j_left, ilace.i_top);
        if(top_left !== -1){
          for(let j = top_left; j < ilace.j_left; j++){
            if(layer_map[ilace.i_top][j] == null) layer_map[ilace.i_top][j] = ilace.z_pos;
          }
         }
 
         let bottom_right = weftLayerValueInRange(layer_map, ilace.z_pos, ilace.j_right, j_max, ilace.i_bot);
         if(bottom_right !== -1){
          for(let j = ilace.j_right; j <= bottom_right; j++){
            if(layer_map[ilace.i_bot][j] == null) layer_map[ilace.i_bot][j] = ilace.z_pos;
          }
         }

         let top_right = weftLayerValueInRange(layer_map, ilace.z_pos, ilace.j_right, j_max, ilace.i_top);
         if(top_right !== -1){
          for(let j = ilace.j_right; j <= top_right; j++){
            if(layer_map[ilace.i_top][j] == null) layer_map[ilace.i_top][j] = ilace.z_pos;
          }
         }
        }
      });

      return layer_map;
    }

    /**
     * to create the rendering of the draft, we need to understand what is happening layer wise with the warps and wefts
     * @param draft 
     * @param topo 
     * @param layer_threshold 
     */
    export const createLayerMaps =  (draft: Draft, topo: Array<TopologyVtx>, layer_threshold: number) : 
    Promise<LayerMaps> => {

      const layer_maps = {
        weft: [], 
        warp: []
      };
      
       //let a list of all the active layers in this toplogy (as absolute vals)
       let active_layers:Array<number> = topo.reduce((acc, val) => {
         let has_elem = acc.find(el => el == Math.abs(val.z_pos))
         if(has_elem === undefined){
           return acc.concat(Math.abs(val.z_pos));
         }
         return acc;
       }, []); 
 
       //get the largest magnitude layer (e.g. farthest from zero)
       const max_layer = active_layers.reduce((acc, val) => {
         if(val > acc) return val;
         return acc;
       }, 0)

      return createWarpLayerMap(draft, topo, layer_threshold, active_layers, max_layer)
      .then(warps => {
        layer_maps.warp = warps;
        return createWeftLayerMap(draft, topo, layer_threshold, active_layers, max_layer)
      }
      ).then(wefts =>{
        layer_maps.weft = wefts;
        return layer_maps;
      });
    }

    /**
     * use the topology generated to create a map describing the relationship between warp and weft layers. assign each position along a warp with an associated layer. If a weft interlaces with that warp, it must do so on the warps associated layer
     * @param draft the draft to draw
     * @param topo the generated topography
     * @param  power if you see an interlacement at i, j, how far should its "power" extend to neighbors. 
     * @param layer_threshold how many consecutive layer assignments need to be seen in order to call it a layer
     * @returns 
     */
    export const createWarpLayerMap = (draft: Draft, topo: Array<TopologyVtx>, layer_threshold: number, active_layers: Array<number>, max_layer: number) : Promise<Array<Array<number>>> => {

      //default all layers to null
      let layer_map: Array<Array<number>> = [];
      for(let i = 0; i < wefts(draft.drawdown); i++){
        layer_map.push([]);
        for(let j = 0; j < warps(draft.drawdown); j++){
          layer_map[i][j] = null;
        }
      }
      

      //go through layers 0 -> max and push interlacements to the layer map 
      for(let i = 0; i <= max_layer; i++){
        let layers_to_check: Array<number> = []; 
        if(i !== 0){
          layers_to_check = [i, -i];
        }else{
          layers_to_check = [0]
        }


        layers_to_check.forEach(layer_id => {
          let layer_ilace = topo.filter(ilace => ilace.z_pos == layer_id);
          layer_map = addWarpLayerInterlacementsToMap(layer_map, layer_ilace, 10, 10);
        })
        

        //now scan through the layer map. Count the number of consecutive layer values on a warp. 
        //if it is larger than the layer threshold, keep them
        //if not, 
        // for(let i = 0; i < wefts(draft.drawdown); i++){
        //   for(let j = 0; j < warps(draft.drawdown); j++){
        //     if(layer_map[i][j] == null) layer_map[i][j]=0;
        //   }
        // }

      }

      // console.log("LAYER MAP", layer_map)
      return Promise.resolve(layer_map);
     
    }
  
    /**
     * use the topology generated to create a map describing the relationship between warp and weft layers. assign each position along a warp with an associated layer. If a weft interlaces with that warp, it must do so on the warps associated layer
     * @param draft the draft to draw
     * @param topo the generated topography
     * @param  power if you see an interlacement at i, j, how far should its "power" extend to neighbors. 
     * @param layer_threshold how many consecutive layer assignments need to be seen in order to call it a layer
     * @returns 
     */
    export const createWeftLayerMap = (draft: Draft, topo: Array<TopologyVtx>, layer_threshold: number, active_layers: Array<number>, max_layer: number) : Promise<Array<Array<number>>> => {

        //default all layers to null
        let layer_map: Array<Array<number>> = [];
        for(let i = 0; i < wefts(draft.drawdown); i++){
          layer_map.push([]);
          for(let j = 0; j < warps(draft.drawdown); j++){
            layer_map[i][j] = null;
          }
        }
      

      //go through layers 0 -> max and push interlacements to the layer map 
      for(let i = 0; i <= max_layer; i++){
        let layers_to_check: Array<number> = []; 
        if(i !== 0){
          layers_to_check = [i, -i];
        }else{
          layers_to_check = [0]
        }


        layers_to_check.forEach(layer_id => {
          let layer_ilace = topo.filter(ilace => ilace.z_pos == layer_id);
          layer_map = addWeftLayerInterlacementsToMap(layer_map, layer_ilace, 10);
        })
        

        //now scan through the layer map. Count the number of consecutive layer values on a warp. 
        //if it is larger than the layer threshold, keep them
        //if not, 
        // for(let i = 0; i < wefts(draft.drawdown); i++){
        //   for(let j = 0; j < warps(draft.drawdown); j++){
        //     if(layer_map[i][j] == null) layer_map[i][j]=0;
        //   }
        // }

      }

      return Promise.resolve(layer_map);

    }
  




  /**
   * converts a topology diagram to a list of vertexes to draw. It only draws key interlacements to the list
   * @param draft 
   * @param topo 
   * @param layer_map 
   * @param sim 
   * @returns 
   */
  export const translateTopologyToPoints = (draft: Draft, topo: Array<TopologyVtx>, layer_maps: {warp: Array<Array<number>>, weft: Array<Array<number>>}, sim: SimulationVars) : Promise<VertexMaps>=> {

    let weft_vtx: Array<Array<YarnVertex>> = [];
    let warp_vtx: Array<Array<YarnVertex>> = [];


    for(let i = 0; i < wefts(draft.drawdown); i++){
      weft_vtx.push([]);

      const ilaces_assoc_with_weft = topo.filter(el => el.i_bot == i || el.i_top==i);

      // if(ilaces_assoc_with_weft.length !== 0){
        weft_vtx = insertWeft(draft, ilaces_assoc_with_weft, weft_vtx,  i, sim, layer_maps).slice();
       // weft_vtx = bookendWeft(draft, weft_vtx,  i, sim, layer_map);
      // }else{
        
      //   if(i == 0){
      //     //this must have been a repeat of the first row
      //     //go across and compare layers pairwise and add interlacements
      //   }else if(i == wefts(draft.drawdown)-1){

      //   }else{

      //   }

      // }

      




    } 






    for(let j = 0; j < warps(draft.drawdown)-1; j++){
      warp_vtx.push([]);
      //get every interlacement involving this weft
      const ilaces= topo.filter(el => el.j_left == j || el.j_right == j);
      warp_vtx = insertWarp(draft, ilaces, warp_vtx,  j, sim, layer_maps.warp).slice();

    } 
    //now process the last warp
    const ilaces_right= topo.filter(el => el.j_right ==  warps(draft.drawdown)-1);
    warp_vtx.push([]);
    warp_vtx = insertWarp(draft, ilaces_right, warp_vtx,  warps(draft.drawdown)-1, sim, layer_maps.warp).slice();


    return Promise.resolve({warps: warp_vtx, wefts:weft_vtx});
  }

  export const sortInterlacementsOnWarp = (ilaces: Array<TopologyVtx>) : Array<TopologyVtx> => {

    let unsorted = ilaces.slice();
    let sorted = [];

    while(unsorted.length > 1 ){
    let bottommost = unsorted.reduce((acc, ilace, ndx) => {
      if(ilace.i_bot < acc.val) return {ndx: ndx, val: ilace.i_bot};
      return acc;
    }, {ndx: -1, val: 100000000});

    let arr_removed = unsorted.splice(bottommost.ndx, 1);
    sorted.push(arr_removed[0]);

    }

    sorted = sorted.concat(unsorted);
    return sorted;
  }


  export const sortInterlacementsOnWeft = (ilaces: Array<TopologyVtx>) : Array<TopologyVtx> => {

    let unsorted = ilaces.slice();
    let sorted = [];

    while(unsorted.length > 1 ){
    let leftmost = unsorted.reduce((acc, ilace, ndx) => {
      if(ilace.j_left < acc.val) return {ndx: ndx, val: ilace.j_left};
      return acc;
    }, {ndx: -1, val: 100000000});

    let arr_removed = unsorted.splice(leftmost.ndx, 1);
    sorted.push(arr_removed[0]);

    }

    sorted = sorted.concat(unsorted);
    return sorted;
  }



  export const calcFloatHeightAtPosition = (pos: number, total_float_len: number, max_float: number) : number => {

    let radians = pos/total_float_len * Math.PI;
    return max_float * Math.sin(radians);

  }

  export const getWeftOrientationVector = (draft: Draft, i: number, j: number) : number => {
    return (draft.drawdown[i][j].isSet() && draft.drawdown[i][j].isUp()) ? 1 : -1; 

  }


  export const insertWarp = (draft: Draft, unsorted_ilaces: Array<TopologyVtx>, warp_vtxs: Array<Array<YarnVertex>>, j: number,sim: SimulationVars, layer_map:Array<Array<number>>) :Array<Array<YarnVertex>> => {

    let ilaces = sortInterlacementsOnWarp(unsorted_ilaces);
    let diam = sim.ms.getDiameter(draft.colShuttleMapping[j]);
    let res = processWarpInterlacement(draft, j, diam, ilaces.slice(), warp_vtxs, [], sim, layer_map);

    return res;
    
  }


  /**
   * given all the interlacements involving this weft, this function returns the list of vertecies that will be uused to draw that weft on screen. 
   * @param draft 
   * @param unsorted_ilaces 
   * @param weft_vtx 
   * @param i 
   * @param sim 
   * @param layer_map 
   * @returns 
   */
  export const insertWeft = (draft: Draft, unsorted_ilaces: Array<TopologyVtx>, weft_vtx: Array<Array<YarnVertex>>, i: number, sim: SimulationVars, layer_maps: LayerMaps ) : Array<Array<YarnVertex>> => {

    
    let ilaces = sortInterlacementsOnWeft(unsorted_ilaces);
    let diam = sim.ms.getDiameter(draft.rowShuttleMapping[i]);
    return  processWeftInterlacements(draft, i, null, diam, ilaces.slice(), weft_vtx, [],sim, layer_maps);
  }

  export const bookendWeft = (draft: Draft, weft_vtx: Array<Array<YarnVertex>>, i: number, sim: SimulationVars, layer_map: Array<Array<number>> ) : Array<Array<YarnVertex>> => {

    let weft = weft_vtx[i];

    //no vertexs were added to this row
    if(weft.length == 0){
      console.error("NO VTXS on ", i);
    }else{

      let first = weft[0];
      let last = weft[weft.length-1];

      weft_vtx[i].unshift({
        x: -1*sim.warp_spacing,
        y: first.y,
        z: first.z,
        i: i,
        j: 0 
      });

      weft_vtx[i].push({
        x: (warps(draft.drawdown)) * sim.warp_spacing,
        y: last.y,
        z: last.z,
        i: i,
        j: warps(draft.drawdown) 
      })

    }

    return weft_vtx;

    
  }

  export const bookendWarp = (draft: Draft, warp_vtx: Array<Array<YarnVertex>>, j: number, sim: SimulationVars, layer_map: Array<Array<number>> ) : Array<Array<YarnVertex>> => {

    let warp = warp_vtx[j];

    //no vertexs were added 
    if(warp.length == 0){
      console.error("NO VTXS on WARP ", j);
    }else{

      let first = warp[0];
      let last = warp[warp.length-1];

      warp_vtx[j].unshift({
        x: first.x,
        y: -1 * sim.ms.getDiameter(draft.rowShuttleMapping[0]),
        z: first.z,
        i: 0,
        j: j 
      });

      let height = draft.drawdown.reduce((acc, val, i) => {
        acc += sim.ms.getDiameter(draft.rowShuttleMapping[i]);
        return acc;
      }, 0)

      warp_vtx[j].push({
        x: last.x,
        y: height,
        z: last.z,
        i: wefts(draft.drawdown)-1 ,
        j: j 
      })

    }

    return warp_vtx;

    
  }

  export const calcClothHeightOffsetFactor = (diam: number, radius: number, offset: number) : number => {
    return  diam * (radius-offset)/radius; 
  }

 

  export const addWeftInterlacement = (draft: Draft, i: number, j: number, z_pos: number, diam: number, sim: SimulationVars, weft_vtxs: Array<Array<YarnVertex>>) : Array<Array<YarnVertex>> => {
    let offset = getWeftOffsetFromWarp(draft, i, j, sim.ms);
    let orient = getWeftOrientationVector(draft, i, j);
    // weft_vtxs[i].push({
    //   x: j*warp_spacing, 
    //   y: y,
    //   z: z_pos*layer_spacing+offset*orient
    //  });
      weft_vtxs[i].push({
      x: j*sim.warp_spacing, 
      y: i*diam,
      z: z_pos*sim.layer_spacing+offset*orient,
      i: i, 
      j: j
     });



     return weft_vtxs;
     
  }


  export const addWarpInterlacement = (draft: Draft, i: number, j: number, z_pos: number, diam: number, sim: SimulationVars, warp_vtxs: Array<Array<YarnVertex>>) :  Array<Array<YarnVertex>> => {


    warp_vtxs[j].push({
      x: j*sim.warp_spacing, 
      y: i*diam,
      z: z_pos*sim.layer_spacing,
      i: i, 
      j: j
     });


     return warp_vtxs;
     
  }



  // export const areDuplicateWarps = (j: number, j_next: number, draft: Draft) : boolean => {
  //   for(let i = 0; i < wefts(draft.drawdown); i++){
  //     if(draft.drawdown[i][j].getHeddle() != draft.drawdown[i][j_next].getHeddle()) return false;
  //   }
  //   return true;
  // }


  /**
   * given a list of weft interlacements it converts
   * @param draft 
   * @param i 
   * @param ilace_last 
   * @param diam 
   * @param ilaces 
   * @param weft_vtxs 
   * @param drawn_positions 
   * @param sim 
   * @param layer_map 
   * @returns 
   */
  export const processWeftInterlacements = (draft: Draft, i: number, ilace_last: TopologyVtx, diam: number,  ilaces: Array<TopologyVtx>, weft_vtxs: Array<Array<YarnVertex>>,  drawn_positions: Array<number>, sim: SimulationVars, layer_maps:  LayerMaps) : Array<Array<YarnVertex>> => {

    let indexs_added = [];

    //look across the row and make new interlacements
    let last_layer = layer_maps.weft[i][0];
    let last_orientation = draft.drawdown[i][0].getHeddle();
    weft_vtxs = addWeftInterlacement(draft, i, 0, last_layer, diam, sim, weft_vtxs);
    indexs_added.push(0);

    for(let j = 1; j < warps(draft.drawdown); j++){

      if(layer_maps.warp[i][j]==layer_maps.weft[i][j]){

        let layer_id:number = layer_maps.weft[i][j];
        let orientation:boolean = draft.drawdown[i][j].getHeddle();
        if(layer_id == last_layer && orientation !== last_orientation){
          
          if(indexs_added.find(el => el == j-1)==undefined){
            weft_vtxs = addWeftInterlacement(draft, i, j-1, last_layer, diam, sim, weft_vtxs);
            indexs_added.push(j-1);
  
            //add mid point?
          } 
  
          weft_vtxs = addWeftInterlacement(draft, i, j, layer_id, diam, sim, weft_vtxs);
          indexs_added.push(j);
  
        }
        last_layer = layer_id;
        last_orientation = orientation;

      }


    }


    if(indexs_added.find(el => el ==warps(draft.drawdown)-1)==undefined) weft_vtxs = addWeftInterlacement(draft, i, warps(draft.drawdown)-1, last_layer, diam, sim, weft_vtxs);



    // for(let j = 0; j < warps(draft.drawdown); j++){

    //   //get the layer at this position
    //   let layer_id = layer_map[i][j];

    //   //is there a weft interlacement at this location (i and j) and associated with the same layer? 
    //   let interlacements_on_j = ilaces.filter(el => el.i_bot == i && (el.j_left == j || el.j_right ==j) && el.z_pos == layer_id);
      
    //   console.log("INTERLACEMENTS ON J", interlacements_on_j);

    //   //if yes, add only one of them to the vertex list
    //   if(interlacements_on_j.length > 0){
    //     weft_vtxs = addWeftInterlacement(draft, i, j, layer_id, diam, sim, weft_vtxs);
    //   }


    //   //else - we might still have to draw this one if it is associated with the layer, but not neeccesarily interlaced at this location 
    //   //e.g. if it is a tuck. 

    //   if(interlacements_on_j.length == 0){
    //     //scan for tuck within interlacement

    //     //look up and down the warp for the next interlacment, if its associtaed with this same layer, see if you should add its value. 
    //     let weft_ilaces_on_warp = ilaces.filter(el =>  el.j_left == j || el.j_right == j);


    //     if(weft_ilaces_on_warp.length == 0){
    //       //this warp is either just not interlaced at all or is a repeat of its neighbor to the right. 
    //       // if(layer_id == 0){
    //       //   weft_vtxs = addWeftInterlacement(draft, i, j, layer_id, diam, sim, weft_vtxs);
    //       // }
    //     }else{
    //       //get the closest warp interlacement to this i. 
    //       let closest = weft_ilaces_on_warp.reduce((acc, val) => {
    //         if(Math.abs(val.i_bot - i) < acc.dist) acc =  {ndx: val.i_bot, dist: Math.abs(val.i_bot - i)};
    //         if(Math.abs(val.i_top - i) < acc.dist) acc =  {ndx: val.i_top, dist: Math.abs(val.i_top - i)};
    //         return acc;
    //           }, {ndx: weft_ilaces_on_warp[0].i_bot, dist: Math.abs(weft_ilaces_on_warp[0].i_bot-i)});

            
    //         if(layer_map[closest.ndx][j] == layer_id){
    //           weft_vtxs = addWeftInterlacement(draft, i, j, layer_id, diam, sim, weft_vtxs);
    //         }
          
    //     }
    //   }
    // }

    return weft_vtxs;

  }

  //*just draw the layer map*/
  export const processWarpInterlacement = (draft: Draft, j: number, diam: number,  ilaces: Array<TopologyVtx>, warp_vtxs: Array<Array<YarnVertex>>, drawn_positions: Array<number>, sim: SimulationVars, layer_map: Array<Array<number>>) : Array<Array<YarnVertex>> => {

    //ilaces is all the interlacements on this warp

    let last_id = layer_map[0][j];
    let just_added = false;

    warp_vtxs = addWarpInterlacement(draft, -1, j, last_id, diam, sim, warp_vtxs);


    for(let i = 1; i < wefts(draft.drawdown); i++){
      if(last_id !== layer_map[i][j]){
        //add the top-size of the interlacement
        if(!just_added) warp_vtxs = addWarpInterlacement(draft, i-1, j, layer_map[i-1][j], diam, sim, warp_vtxs);
        warp_vtxs = addWarpInterlacement(draft, i, j, layer_map[i][j], diam, sim, warp_vtxs);
        just_added = true;
      }else{
        just_added  = false;
        
      }
      last_id = layer_map[i][j];
     
    }

    warp_vtxs = addWarpInterlacement(draft, wefts(draft.drawdown), j, last_id, diam, sim, warp_vtxs);


    return warp_vtxs;
  }


  export const relaxWefts = (draft: Draft, lm: Array<Array<number>>, sim: SimulationVars,  wefts: Array<Array<YarnVertex>>) : Array<Array<YarnVertex>> => {

  let relaxed:Array<Array<YarnVertex>> = [];
  
    wefts.forEach((weft, i) => {
      // relaxed.push(weft.slice());

      if(weft.length > 2){
        relaxed[i] = [];
        for(let x = 2; x < weft.length-1; x++){
          let last_vtx = weft[x-1];
          let last_diam = sim.ms.getDiameter(draft.colShuttleMapping[last_vtx.j]);
          let vtx = weft[x];
          let diam = sim.ms.getDiameter(draft.colShuttleMapping[vtx.j]);

          if(lm[vtx.i][vtx.j] == lm[last_vtx.i][last_vtx.j]){
            vtx.x -= diam/2;

            let dist = ((vtx.x-diam/2) - (last_vtx.x + last_diam/2));
            let arch_height = Math.min(10, dist*.2);
            let direction = (draft.drawdown[i][last_vtx.j].isUp()) ? 1 : -1;
            let new_vtx = {
              x: last_vtx.x+ dist/2,
              y: last_vtx.y,
              z: last_vtx.z + arch_height*direction,
              i: -1,
              j: -1
            }
            relaxed[i].push(new_vtx);
            relaxed[i].push(weft[x]);
          
          }else{
            relaxed[i].push(weft[x])
          }



        }
      }else{
        relaxed.push(weft.slice());
      }
    
    });
    return relaxed;

  }
  








  


  



