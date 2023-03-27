import { F } from "@angular/cdk/keycodes";
import { INITIAL_REDUCERS } from "@ngrx/store";
import { group } from "console";
import { update } from "firebase/database";
import { sin } from "mathjs";
import { arch } from "os";
import { MaterialsService } from "../provider/materials.service";
import { Cell } from "./cell";
import { ClothHeight, Draft, Drawdown, TopologyVtx, WarpInterlacementTuple, WarpRange, WeftInterlacementTuple, YarnCell, YarnFloat, YarnSim, YarnVertex } from "./datatypes";
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
        console.log("writing to ", i, ilace.j, count);
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


  /**
   * a recursive function that finds interlacments, returns them, and then searches remaining floating sections to see if they should push to a new layer
   * @param tuples the list of tuples to search
   * @param count  the current layer id
   * @param draft the draft in question
   * @returns 
   */
  export const getInterlacements = (tuples: Array<WarpInterlacementTuple>, range: WarpRange, count: number,  draft: Draft) : Array<TopologyVtx> => {

    if(tuples.length <= 1) return [];

    if(tuples[0].i_bot < 0) return [];
    
    let topo: Array<TopologyVtx> = [];

    let i_top = tuples[0].i_top;
    let i_bot = tuples[0].i_bot;
    let orientation = tuples[0].orientation;


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

    // console.log("FOUND ILACES AT ", topo, tuples);


    let ilaces: Array<TopologyVtx> = [];
    let float_groups: Array<WarpRange> = splitRangeByVerticies(range , topo);
    // console.log("SUBGROUPS",  float_groups);


    float_groups.forEach(range => {
      
      count = orientation ? count + 1 : count -1;
      
      //only search groups that are within range
      let next_row_tuple: Array<WarpInterlacementTuple> = getInterlacementsBetweenWefts(i_top, i_bot-1, range.j_left, range.j_right, draft);
      ilaces = ilaces.concat(getInterlacements(next_row_tuple.slice(), range, count,  draft));

    });
  

    topo = topo.concat(ilaces);
      
    
    return topo;

  }

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


  export const splitRangeByVerticies = (range:WarpRange, verticies: Array<TopologyVtx>) : Array<WarpRange> => {

    let groups:Array<WarpRange> = [];

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
   * use the draft to determine where layers will form and position warps accordingly
   * @param draft the draft we are working with
   * @param warp_vtxs the current warp verticies
   * @param range how close does an interlacement need to be to present a layer from forming. 
   * @param warp_spacing the distance between the center points of one warp to the next
   */
  // export const positionWarpsInZ = (draft: Draft, range: number, warp_spacing: number, layer_spacing: number, ms: MaterialsService) : Array<Array<YarnVertex>> => {
  //   const dd = draft.drawdown;
  //   const ilaces = getWarpInterlacementTuples(dd);
  //   let warp_vtxs: Array<Array<YarnVertex>> = [];

  //   let y_total = 0;
  //   //push initial locations
  //   dd.forEach((row, i) => {
  //     warp_vtxs.push([]);
  //     let weft_id = draft.rowShuttleMapping[i];
  //     let thickness = ms.getDiameter(weft_id);
  //     y_total += thickness;
  //     row.forEach((cell, j) =>{
  //       warp_vtxs[i].push({x: j*warp_spacing, y: y_total, z: -10000000 })
  //     });
  //   });


  //   //look at each weft
  //   for(let i = 0; i < wefts(dd); i++){
     
  //     //get the interlacements associated with this row
  //     let a = ilaces.filter(el => el.i_top == i);

  //     //if there is at least one interlacement 
  //     if(a.length > 0){  
      
  //       //go through each interlacement
  //       for(let x = 0; x < a.length; x++){

  //         const ilace_start: WarpInterlacementTuple = a.shift();
  //         const res = getNonInterlacingWarpSegment(ilace_start, a);
  //         let ilace_end = null;


  //         if(res.dist > range || res.ndx == -1){
          
  //           if(res.ndx == -1){
  //             ilace_end = {
  //               i_top: ilace_start.i_top, 
  //               i_bot: ilace_start.i_bot,
  //               j: warps(draft.drawdown)-1,
  //               orientation: ilace_start.orientation}
  //               x = a.length;
  //           }else{
  //             ilace_end = a[res.ndx];
  //             x = res.ndx;
  //           }

  //           const warp = layerWarpsInZBetweenInterlacements(0, ilace_start.i_top, ilace_start.i_bot, ilace_start.j, ilace_end.j,draft, range, layer_spacing,  warp_vtxs);

          
  //           warp_vtxs = warp; 

          
           
  //         }
  //       }
  //     }else{
  //       console.log("no interlacements at i", i)
        
  //     }

  //   }

  //   //check the warp vertexes. If any are -10000000, then they ahve never been set, look to the nearest warp that has a value to set it

  //   warp_vtxs.forEach((row, i) => {
  //     row.forEach((vtx, j) => {
  //       if(vtx.z == -10000000){
  //         vtx.z = getClosestWarpValue(i, j, warp_vtxs);
  //       }
  //     });
  //   })


  //   return  warp_vtxs;

  // }

    /**
   * use the draft to determine where layers will form and position warps accordingly
   * @param draft the draft we are working with
   * @param warp_vtxs the current warp verticies
   * @param range how close does an interlacement need to be to present a layer from forming. 
   * @param warp_spacing the distance between the center points of one warp to the next
   */
    export const getDraftToplogy = (draft: Draft) : Array<TopologyVtx> => {
      const dd = draft.drawdown;
      const warp_tuples = getWarpInterlacementTuples(dd);
      let topology: Array<TopologyVtx> = [];
  
   
      //look at each weft
      for(let i = 0; i < wefts(dd); i++){
        //get the interlacements associated with this row
        let a = warp_tuples.filter(el => el.i_top == i);

        let range = {j_left: 0, j_right: warps(draft.drawdown)-1}
        let verticies = getInterlacements(a, range, 0,  draft);
        topology = topology.concat(verticies);
      }

      
      return  topology;

    }

  export const translateTopologyToPoints = (draft: Draft, topo: Array<TopologyVtx>, warp_spacing: number, layer_spacing: number, ms: MaterialsService) : {warps: Array<Array<YarnVertex>>, wefts: Array<Array<YarnVertex>>}=> {

    // const warp_vtx: Array<Array<YarnVertex>> = [];
    // for(let j = 0; j < warps(draft.drawdown); j++) warp_vtx.push([]);

    let weft_vtx: Array<Array<YarnVertex>> = [];
    let warp_vtx: Array<Array<YarnVertex>> = [];

    let cloth_heights: Array<ClothHeight> = [];
    for(let j = 0; j < warps(draft.drawdown); j++){
      cloth_heights.push({front: 0, back: 0});
    }


    
    for(let i = 0; i < wefts(draft.drawdown); i++){
      weft_vtx.push([]);

      const ilaces_bot = topo.filter(el => el.i_bot == i);
      const res = insertWeft(draft, ilaces_bot, weft_vtx, cloth_heights,  i, warp_spacing, layer_spacing, ms);
      cloth_heights = res.heights.slice();
      weft_vtx = res.weft_vtxs.slice();
 
    } 

    for(let j = 0; j < warps(draft.drawdown); j++){
      warp_vtx.push([]);

       const ilaces_left = topo.filter(el => el.j_left == j);
       const res = insertWarp(draft, ilaces_left, warp_vtx, cloth_heights,  j, warp_spacing, layer_spacing, ms);
       cloth_heights = res.heights.slice();
       warp_vtx = res.warp_vtxs.slice();
      
 
    } 


    return {warps: warp_vtx, wefts:weft_vtx};
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


  export const insertWarp = (draft: Draft, unsorted_ilaces: Array<TopologyVtx>, warp_vtxs: Array<Array<YarnVertex>>, cloth_heights: Array<ClothHeight>, j: number, warp_spacing: number, layer_spacing: number, ms: MaterialsService ) : {warp_vtxs: Array<Array<YarnVertex>>, heights: Array<ClothHeight>} => {

    let ilaces = sortInterlacementsOnWarp(unsorted_ilaces);
    console.log("Sorted ", ilaces);
    let diam = ms.getDiameter(draft.colShuttleMapping[j]);
    let res = processWarpInterlacement(draft, j, diam, ilaces.slice(), warp_vtxs, cloth_heights, [], warp_spacing, layer_spacing, ms);

    return res;
    
  }


  export const insertWeft = (draft: Draft, unsorted_ilaces: Array<TopologyVtx>, weft_vtx: Array<Array<YarnVertex>>, cloth_heights: Array<ClothHeight>, i: number, warp_spacing: number, layer_spacing: number, ms: MaterialsService ) : {weft_vtxs: Array<Array<YarnVertex>>, heights: Array<ClothHeight>} => {

    let ilaces = sortInterlacementsOnWeft(unsorted_ilaces);
    let diam = ms.getDiameter(draft.rowShuttleMapping[i]);
    let res = processWeftInterlacements(draft, i, diam, ilaces.slice(), weft_vtx, cloth_heights, [], warp_spacing, layer_spacing, ms);
    //res.heights = normalizeWeftPositions(ilaces, res.heights, res.weft_vtxs, diam);


    return res;


    // if(ilaces.length == 0 && i> 0 && i !== wefts(draft.drawdown)-1){
    //   //we've reached a point where the last line is exactly the same
    //   weft_vtx[i-1].forEach(ilace => {
    //     weft_vtx[i].push({x: ilace.x, y: i*5, z: ilace.z});
    //   })
    // 
  

    
  }


  export const calcClothHeightOffsetFactor = (diam: number, radius: number, offset: number) : number => {
    return  diam * (radius-offset)/radius; 
  }

  /**
   * starting from an interlacement - span outward by radius and update the interlacements. 
   * @param cloth_heights 
   * @param j 
   * @param diam 
   * @param orient 
   * @param radius 
   * @returns 
   */
  export const updateClothHeight = (cloth_heights: Array<ClothHeight>, j: number, diam:number, orient:number) : Array<ClothHeight>=> {
    if(orient == -1 ){
      cloth_heights[j].front += diam;
    }else{
      cloth_heights[j].back += diam;

    }

    return cloth_heights;

  }

  export const getClothHeight = (cloth_heights: Array<ClothHeight>, j: number, orient:number) => {

    if(orient == -1 ){
      return cloth_heights[j].front;
    }else{
      return cloth_heights[j].back;
    }

  }

  export const addWeftInterlacement = (draft: Draft, i: number, j: number, z_pos: number, diam: number, warp_spacing: number, layer_spacing: number, ms: MaterialsService, cloth_heights: Array<ClothHeight>, weft_vtxs: Array<Array<YarnVertex>>) : {weft_vtxs: Array<Array<YarnVertex>>, heights: Array<ClothHeight>} => {
    let offset = getWeftOffsetFromWarp(draft, i, j, ms);
    let orient = getWeftOrientationVector(draft, i, j);
    let y = getClothHeight(cloth_heights,j, orient);
    // weft_vtxs[i].push({
    //   x: j*warp_spacing, 
    //   y: y,
    //   z: z_pos*layer_spacing+offset*orient
    //  });

      weft_vtxs[i].push({
      x: j*warp_spacing, 
      y: i*diam,
      z: z_pos*layer_spacing+offset*orient,
      i: i, 
      j: j
     });


     //since this is a strong interlacement on the weft, make sure to push both sides of the warp to increment
     cloth_heights = updateClothHeight(cloth_heights, j, diam, 1)
     cloth_heights = updateClothHeight(cloth_heights, j, diam, -1)

     return {weft_vtxs, heights: cloth_heights};
     
  }


  export const addWarpInterlacement = (draft: Draft, i: number, j: number, z_pos: number, diam: number, warp_spacing: number, layer_spacing: number, ms: MaterialsService, cloth_heights: Array<ClothHeight>, warp_vtxs: Array<Array<YarnVertex>>) : {warp_vtxs: Array<Array<YarnVertex>>, heights: Array<ClothHeight>} => {


    warp_vtxs[j].push({
      x: j*warp_spacing, 
      y: i*diam,
      z: z_pos*layer_spacing,
      i: i, 
      j: j
     });


     //since this is a strong interlacement on the weft, make sure to push both sides of the warp to increment
     cloth_heights = updateClothHeight(cloth_heights, j, diam, 1)
     cloth_heights = updateClothHeight(cloth_heights, j, diam, -1)

     return {warp_vtxs, heights: cloth_heights};
     
  }

  export const normalizeWeftPositions = (sorted: Array<TopologyVtx>, cloth_heights: Array<ClothHeight>, weft_vtx: Array<Array<YarnVertex>>, diam: number) => {



    if(sorted.length <= 1) return cloth_heights;

    let min = sorted.reduce((acc, val) => {
      if(val.i_top < acc) return val.i_top;
      return acc;
    }, 10000)

    let max = sorted.reduce((acc, val) => {
      if(val.i_top > acc) return val.i_top;
      return acc;
    }, 0);

    for(let x = min; x <= max; x++){
      let layer = sorted.filter(el => el.i_top == x);
      let highest_warp = layer.reduce((acc, val, ndx) => {
        let val1 = Math.max(cloth_heights[val.j_left].back, cloth_heights[val.j_left].front);
        let val2 = Math.max(cloth_heights[val.j_right].front, cloth_heights[val.j_right].back);
        let high = Math.max(val1, val2);
        if(high > acc) return high;
        return acc;
      }, 0);

      layer.forEach(ilace => {
        let comp = Math.max(cloth_heights[ilace.j_left].back, cloth_heights[ilace.j_left].front);
        if(Math.abs(comp - highest_warp) > diam){
          cloth_heights[ilace.j_left].back = highest_warp;
          cloth_heights[ilace.j_left].front = highest_warp;
        } 

        comp = Math.max(cloth_heights[ilace.j_right].back, cloth_heights[ilace.j_right].front);
        if(Math.abs(comp - highest_warp) > diam){

          cloth_heights[ilace.j_right].back = highest_warp ;
          cloth_heights[ilace.j_right].front = highest_warp;
        } 

      })

    }

    return cloth_heights;

  }


  export const processWeftInterlacements = (draft: Draft, i: number, diam: number,  ilaces: Array<TopologyVtx>, weft_vtxs: Array<Array<YarnVertex>>, cloth_heights: Array<ClothHeight>,  drawn_positions: Array<number>, warp_spacing: number, layer_spacing: number, ms: MaterialsService) : {weft_vtxs: Array<Array<YarnVertex>>, heights: Array<ClothHeight>} => {

    if(ilaces.length == 0) return {weft_vtxs, heights: cloth_heights};

    //get first interlacement; 
    let first = ilaces[0].j_left;
    let multiples = ilaces.filter(el => el.j_left == first);
    let ilace_array: Array<TopologyVtx> = [];
    let ilace: TopologyVtx;


    if(multiples.length > 0){
      let closest_weft = multiples.reduce((acc, ilace, ndx) => {
        if(ilace.i_top < acc.val) return {ndx: ndx, val: ilace.i_top}
        return acc;
      }, {ndx: -1, val: 10000000});

      ilace_array = ilaces.splice(closest_weft.ndx, 1);
      ilace = ilace_array[0];
    }else{
      ilace = ilaces.shift();
    }

    //ADD LEFT SIDE OF INTERLACEMENT
    if(drawn_positions.findIndex(el => el == ilace.j_left) == -1){
     let res = addWeftInterlacement(draft, i, ilace.j_left, ilace.z_pos, diam, warp_spacing, layer_spacing, ms, cloth_heights, weft_vtxs );
     weft_vtxs = res.weft_vtxs;
     cloth_heights = res.heights.slice();
     drawn_positions.push(ilace.j_left);
     
      //make sure the right side of the interlacement is in range of this point
     for(let x = ilace.j_left+1; x < ilace.j_right; x ++){
      cloth_heights = updateClothHeight(cloth_heights, x, diam, getWeftOrientationVector(draft, i,x));
     }
    }

 
     
     //ADD RIGHT SIDE OF INTERLACEMENT
     //if(drawn_positions.findIndex(el => el == ilace.j_right) == -1){
    //  weft_vtxs = addInterlacement(draft, i, ilace.j_right,ilace.z_pos, diam, warp_spacing, layer_spacing, ms, cloth_heights, weft_vtxs );
     //drawn_positions.push(ilace.j_right);
    //cloth_heights = updateClothHeight(cloth_heights, ilace.j_right, diam, getWeftOrientationVector(draft, i, ilace.j_left));

    // }

     let res =  processWeftInterlacements(draft, i, diam, ilaces.slice(), weft_vtxs, cloth_heights, drawn_positions, warp_spacing, layer_spacing, ms);

    return res;
  }

  export const processWarpInterlacement = (draft: Draft, j: number, diam: number,  ilaces: Array<TopologyVtx>, warp_vtxs: Array<Array<YarnVertex>>, cloth_heights: Array<ClothHeight>,  drawn_positions: Array<number>, warp_spacing: number, layer_spacing: number, ms: MaterialsService) : {warp_vtxs: Array<Array<YarnVertex>>, heights: Array<ClothHeight>} => {

    if(ilaces.length == 0) return {warp_vtxs, heights: cloth_heights};

    console.log("PROCESSING ", ilaces)
    //get first interlacement; 
    let first = ilaces[0].i_bot;
    let multiples = ilaces.filter(el => el.j_left == first);
    let ilace_array: Array<TopologyVtx> = [];
    let ilace: TopologyVtx;


    if(multiples.length > 0){
      let closest_warp = multiples.reduce((acc, ilace, ndx) => {
        if(ilace.i_top < acc.val) return {ndx: ndx, val: ilace.i_top}
        return acc;
      }, {ndx: -1, val: 10000000});

      ilace_array = ilaces.splice(closest_warp.ndx, 1);
      ilace = ilace_array[0];
    }else{
      ilace = ilaces.shift();
    }

    //ADD LEFT SIDE OF INTERLACEMENT
    if(drawn_positions.findIndex(el => el == ilace.j_left) == -1){
     let res = addWarpInterlacement(draft, ilace.i_bot, ilace.j_left,ilace.z_pos, diam, warp_spacing, layer_spacing, ms, cloth_heights, warp_vtxs.slice() );
     warp_vtxs = res.warp_vtxs;
     cloth_heights = res.heights.slice();
     drawn_positions.push(ilace.i_bot);
     
      //make sure the right side of the interlacement is in range of this point
    //  for(let x = ilace.i_bot+1; x < ilace.i_top; x ++){
    //   cloth_heights = updateClothHeight(cloth_heights, x, diam, getWeftOrientationVector(draft, i,x));
    //  }
    }



     let res =  processWarpInterlacement(draft, j, diam, ilaces.slice(), warp_vtxs, cloth_heights, drawn_positions, warp_spacing, layer_spacing, ms);

    return res;
  }


  /**
   * while warp vertexes will have a position for every cell in the drawdown (just that i, j in drawdown will always have a cooresponding warp vertex), weft vertexs will only store key points along the path of the weft, and therefore, won't add multiple points for every cell. The process starts by identifying the critical interlacements on each weft. This is becaues, if the cloth is multi-layered, not every interlacement should be interpreted as meaningful (only the interlacements binding the active layer at any lection.)
   * @param draft 
   * @param warp_vtxs 
   * @returns 
   */
  // export const positionWeftsInYZ = (draft: Draft,  range: number, warp_vtxs: Array<Array<YarnVertex>>, ms: MaterialsService) : Array<Array<YarnVertex>> => {
  //   const dd = draft.drawdown;
  //   const ilaces = getWeftInterlacementTuples(dd);
  //   let weft_vtxs: Array<Array<YarnVertex>> = [];

    
  //   //create a blank list for every row and only push the interlacements to start
  //   draft.drawdown.forEach((row, i) => {
  //     weft_vtxs.push([]);
  //   });

  //   // //look at each warp and push any interlacements you find to their respective spots in the vertex list
  //   for(let j = 0; j < warps(dd); j++){
     
  //     let a = ilaces.filter(el => el.j_right == j);
  //     console.log(a)

  //     //if there is at least one interlacement 
  //     if(a.length > 0){  
      
  //       //go through each interlacement
  //       for(let x = 0; x < a.length; x++){
          
  //         const ilace_start: WeftInterlacementTuple = a[x];
  //         const res = getNonInterlacingWeftSegment(ilace_start, a);

  //         let ilace_end: WeftInterlacementTuple = null;

  //           if(res.ndx == -1){
  //             ilace_end = {
  //               j_left: ilace_start.j_left, 
  //               j_right: ilace_start.j_right,
  //               i: wefts(draft.drawdown)-1,
  //               orientation: ilace_start.orientation}
  //               res.dist = wefts(draft.drawdown)-1-ilace_start.i;
  //               x = a.length;
  //           }else{
  //             ilace_end = a[res.ndx];
  //             x = res.ndx;
  //           }


  //           if(res.dist > range || res.ndx == -1){
            
                   
  //             const weft = layerWeftsInYZBetweenInterlacements(0, ilace_start.j_right, ilace_start.j_left, ilace_start.i, ilace_end.i,draft, range, ms, warp_vtxs, weft_vtxs);
  //             weft_vtxs = weft;             
            
  //           }else{

  //             const ilaces = getInterlacementsBetweenWarps(ilace_start.j_right, ilace_start.j_left, ilace_start.i, ilace_end.i, draft);
  //             weft_vtxs = pushWeftInterlacementsToVtxList(ilaces, draft, ms, warp_vtxs, weft_vtxs);
  //           }
  //       }
  //     }
  

  //   }

  //   //now pretend like you are weaving each row, packing y's as you go. 
  //   const y_positions: Array<number> = [];
  //   // for(let j = 0; j < warps(dd); j++){
  //   //   y_positions.push(0)
  //   // }
  //   // for(let i = 0; i < wefts(draft.drawdown); i++){
  //   //   if(weft_vtxs[i].length == 0){
  //   //     //this pic just replicates the last one. 
  //   //     if(i-1 >= 0) weft_vtxs[i] = weft_vtxs[i-1].slice();
  //   //     else{
  //   //      //we'll have to push the first row to the 
  //   //     }
  //   //   }else if(weft_vtxs[i].length == 1){

  //   //   }
      
  //   // }





  

  //   // draft.drawdown.forEach((row, i) => {
  //   //   let offset = getWeftOffsetFromWarp(draft, i, 0, ms);
  //   //   weft_vtxs[i].unshift({x: warp_vtxs[i][0].x, y: warp_vtxs[i][0].y, z: warp_vtxs[i][0].z})

    
  //   //   weft_vtxs[i].push({x: warp_vtxs[i][0].x, y: warp_vtxs[i][0].y, z: warp_vtxs[i][0].z});
  //   //   weft_vtxs[i][0].z = (row[0].getHeddle()) ? weft_vtxs[i][0].z + offset : weft_vtxs[i][0].z - offset
  //   // });

  //   // //and the ending point for each weft 
  //   // draft.drawdown.forEach((row, i) => {
      
  //   //   const last = warp_vtxs[i].length-1;
  //   //   let offset = getWeftOffsetFromWarp(draft, i, last, ms);
  //   //   let weft_vtx = {x: warp_vtxs[i][last].x, y: warp_vtxs[i][last].y, z: warp_vtxs[i][last].z};
  //   //   weft_vtx.z = (row[last].getHeddle()) ?  weft_vtx.z + offset :  weft_vtx.z - offset

  //   //   weft_vtxs[i].push(weft_vtx)
  //   // });
    

  //   return weft_vtxs;

  // }









  


  



