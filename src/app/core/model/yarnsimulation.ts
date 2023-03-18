import { MaterialsService } from "../provider/materials.service";
import { Cell } from "./cell";
import { Draft, Drawdown, ForceVector, InterlacementForceVector, SystemVerticies, WeftInterlacementTuple, YarnCell, YarnFloat, YarnSim, YarnSimSettings, YarnVertex, YarnVertexExpression } from "./datatypes";
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

  export const getPreviousInterlacementOnWarp = (drawdown: Drawdown, j: number, cur: number) : number => {

    const col = getCol(drawdown, j);
    const val = col[cur].getHeddle();
    const found = false;
    for(let i = cur; i >= 0 && !found; i--){
      if(col[i].getHeddle() != val){
        return i;
      }
    }
    return -1;


  }

  export const calculateWeftFloatPosition = (drawdown: Drawdown, i: number,  all_warps, j_reference:number) : any => {
    const start_pack_at = getPreviousInterlacementOnWarp(drawdown, j_reference,i);
    if(start_pack_at == -1){
      //it reached the end of the warp and didn't find anything
      return   {
        push: all_warps[j_reference][0].y.push, 
        pack: all_warps[j_reference][0].y.pack+i
      };
    }else{
      //it found an interlacement
      const distance_to_interlacement = i - start_pack_at;

      return   {
        push: all_warps[j_reference][start_pack_at].y.push, 
        pack: all_warps[j_reference][start_pack_at].y.pack+distance_to_interlacement
      };
    }

  }



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
  export const evaluateVerticies = (warps_exps: SystemVerticies, wefts_exps: SystemVerticies, push_factor: number, pack_factor: number) : {warps:Array<Array<YarnVertex>>,  wefts: Array<Array<YarnVertex>>}  =>  {

    const warps: Array<Array<YarnVertex>> = [];

    warps_exps.forEach((warp_exps, j) =>{
      const warp_vtxs: Array<YarnVertex> = [];
      let vtx:YarnVertex = {x: 0, y: 0, z: 0};
      warp_exps.forEach((exp, i) => {

        vtx = {
          x: exp.x.push * push_factor + exp.x.pack * pack_factor,
          y: exp.y.push * push_factor + exp.y.pack * pack_factor,
          z: exp.z.push * push_factor + exp.z.pack * pack_factor,
        }

        warp_vtxs.push(vtx);

      });
      warps.push(warp_vtxs.slice())
    });

    const wefts: Array<Array<YarnVertex>> = [];

    wefts_exps.forEach((weft_exp, i) =>{
      let vtx:YarnVertex = {x: 0, y: 0, z: 0};
      const weft_vtxs: Array<YarnVertex> = [];

      console.log(weft_exp);
      weft_exp.forEach((exp, j) => {

        vtx = {
          x: exp.x.push * push_factor + exp.x.pack * pack_factor,
          y: exp.y.push * push_factor + exp.y.pack * pack_factor,
          z: exp.z.push * push_factor + exp.z.pack * pack_factor,
        }
        weft_vtxs.push(vtx);
      });
      wefts.push(weft_vtxs.slice())
    });

    return {warps, wefts};
  }


  /**
   * weft forces are added by looking at the warp interlacements and seeing if they repel or attact the wefts together
   * @param fg the force graph we are calculating
   * @param i the current weft row
   * @param j the current warp col
   * @param dd the drawdown
   * @returns 
   */
  export const addWeftForces = (fg:Array<Array<InterlacementForceVector>>, i: number, j: number, dd: Drawdown) : Array<Array<InterlacementForceVector>> => {
   
    if(i+1 >= wefts(dd)) return fg; 

    const cur_cell = dd[i][j].getHeddle();
    const next_cell = dd[i+1][j].getHeddle();

    if(cur_cell == null || next_cell) return fg;

    //warp interlacements repel neighboring wefts away from eachother
    if(cur_cell !== next_cell){
      fg[i][j].fweft.y += -1;
      fg[i+1][j].fweft.y += 1;
    }else{
    //warp floats attact 
    fg[i][j].fweft.y += 1;
    fg[i+1][j].fweft.y += -1;

    }

    return fg;

  }

  /**
   * warp forces (e.g. forces pushing the warps apart or together) are added by looking at the WEFT interlacements and seeing if they repel or attact the warps together
   * @param fg the force graph we are calculating
   * @param i the current weft row
   * @param j the current warp col
   * @param dd the drawdown
   * @returns the modified force graph
   */
  export const addWarpForces = (fg:Array<Array<InterlacementForceVector>>, i: number, j: number, dd: Drawdown) : Array<Array<InterlacementForceVector>> => {
   
    if(j+1 >= warps(dd)) return fg; 

    const cur_cell = dd[i][j].getHeddle();
    const next_cell = dd[i][j+1].getHeddle();

    if(cur_cell == null || next_cell) return fg;

    //warp interlacements repel neighboring wefts away from eachother
    if(cur_cell !== next_cell){
      fg[i][j].fwarp.x += -1;
      fg[i][j+1].fwarp.x += 1;
    }else{
      //warp floats attact 
      fg[i][j].fwarp.x += 1;
      fg[i][j+1].fwarp.x += -1;
    }

    return fg;

  }

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


  export const getWeftInterlacementTuples = (dd: Drawdown) : Array<WeftInterlacementTuple> => {
    const ilace_list: Array<WeftInterlacementTuple> = [];
    for(let i = 0; i < wefts(dd); i++){
      for(let j = 0; j < warps(dd); j++){

        let i_top = i+1;
        let i_bot = i;


        if(i_top !== wefts(dd)){

       
          const ilace = areInterlacement(dd[i_top][j], dd[i_bot][j]); 
          if(ilace){

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


  export const smooshWefts = (j_start: number, j_end: number, top_weft_vtx_row: Array<YarnVertex>, top_mat: Shuttle, bot_weft_vtx_row: Array<YarnVertex>, bot_mat: Shuttle ) : Array<YarnVertex> => {
    for(let j = j_start; j <j_end; j++){
     top_weft_vtx_row[j].y = bot_weft_vtx_row[j].y + bot_mat.getThickness() + .5*top_mat.getThickness();

    }
    return top_weft_vtx_row;
  }

  export const stackUncoupledInterlacements = (ilace:WeftInterlacementTuple, ilace_next: WeftInterlacementTuple, draft: Draft, ms: MaterialsService, weft_vtxs: Array<Array<YarnVertex>>, warp_vtxs: Array<Array<YarnVertex>>) : Array<Array<YarnVertex>> => {
      //update the rest of the rest of the existing top row
      let top_mat = ms.getShuttle(draft.rowShuttleMapping[ilace.i_top]);
      let bot_mat = ms.getShuttle(draft.rowShuttleMapping[ilace.i_bot]);  
      weft_vtxs[ilace.i_top] = smooshWefts(ilace.j, warps(draft.drawdown)-1,  weft_vtxs[ilace.i_top], top_mat, weft_vtxs[ilace.i_bot], bot_mat);


      //stack yarns of floating rows in between
      for(let i = ilace.i_top; i < ilace_next.i_top; i++){
        top_mat = ms.getShuttle(draft.rowShuttleMapping[i]);
        bot_mat = ms.getShuttle(draft.rowShuttleMapping[i-1]);
        weft_vtxs[i] = smooshWefts(0, warps(draft.drawdown)-1,  weft_vtxs[i], top_mat, weft_vtxs[i-1], bot_mat);
      }

      //update the start of the next interlacement row
      top_mat = ms.getShuttle(draft.rowShuttleMapping[ilace_next.i_top]);
      bot_mat = ms.getShuttle(draft.rowShuttleMapping[ilace_next.i_bot]);  
      weft_vtxs[ilace_next.i_top] = smooshWefts(0, ilace_next.j,  weft_vtxs[ilace_next.i_top], top_mat, weft_vtxs[ilace_next.i_bot], bot_mat);

      return weft_vtxs;
      
  }

  /**
   * given a list of interlacments, see if there are interlacements with opposite orientation within the list that would indicate that these two yarns cross eachother at some point.
   * @param ilaces 
   * @returns 
   */
  export const hasBarrier = (ilaces: Array<WeftInterlacementTuple>) : boolean => {

    let last = null;
    let barrier_found = false;
    ilaces.forEach(ilace => {
      if(last == null) last = ilace.orientation;
      if(last !== ilace.orientation) barrier_found = true;
    })

    return barrier_found;

  }

    /**
   * given a list of interlacments, see if there are interlacements with opposite orientation within the list that would indicate that these two yarns cross eachother at some point.
   * @param ilaces 
   * @returns 
   */
  export const hasBarrierInRange = (ilaces: Array<WeftInterlacementTuple>, start: number, end: number, size: number, draft: Draft) : boolean => {



    let adj_start = Math.max(start-size, 0);
    let adj_end = Math.min(end+size, warps(draft.drawdown));

    let all_relevant_interlacements = ilaces.filter(el => el.j > adj_start && el.j < adj_end);
    return  hasBarrier(all_relevant_interlacements);
    

  }




  export const stackAtop = (i_active: number, i_check: number, j_start: number, j_end: number, ms: MaterialsService, draft: Draft, weft_vtxs: Array<Array<YarnVertex>>) :   Array<Array<YarnVertex>> =>{
    let check_mat = ms.getShuttle(draft.rowShuttleMapping[i_check]);
    for(let j =j_start; j <= j_end; j++){     
      weft_vtxs[i_active][j].y = weft_vtxs[i_check][j].y + check_mat.getThickness();  
    }
    return weft_vtxs;
  }



  
  // export const getBarrierInterlacementsClosetTo = (j: number, before: Array<WeftInterlacementTuple>, after:Array<WeftInterlacementTuple>) : {left: number, right: number} => {

  //   //if there is nothing before or after this j, then it can't possibly be part of an inerlacement
  //   if(before.length == 0 || after.length) return {left: -1, right: -1};

  //   const min_length = Math.min(before.length, after.length);
  //   for(let x = 0; x < min_length; x++){
  //     const compare_orientation = before[x].orientation;
  //     const opposite_orientation = after.findIndex(el => el.orientation !== compare_orientation); 
      
  //   }

  // }


  // export const howCloseIsTheClosestInterlacementBetweenTheseWefts = (i_active: number,i_check: number, j_start: number, j_end: number, orientation: boolean, draft: Draft) : number => {


  //   let ilaces_before = [];
  //   let ilaces_after = [];
  //   if(j_start-1 >= 0){
  //     ilaces_before = getInterlacementsBetweenRows(i_active, i_check, 0, j_start-1, draft);
  //   }

  //   if(j_end+1 < warps(draft.drawdown)){
  //     ilaces_after = getInterlacementsBetweenRows(i_active, i_check,  j_end+1, warps(draft.drawdown), draft);
  //   }

  //   ilaces_before = ilaces_before.reverse();

  //   if(orientation == null){


  //   }else{

  //   }


  // }


  export const getInterlacementsBetweenRows = (i_active: number, i_check: number, j_start: number, j_end: number, draft: Draft) => {
    let ilace_list: Array<WeftInterlacementTuple> = [];
    console.log("iactive, icheck", i_active, i_check);
    for(let j =j_start; j <= j_end; j++){
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



  // /**
  //  * a recursive function for setting warp positions in layered regions. 
  //  * @param i_active the current weft we are moving
  //  * @param i_check the weft we are comparing against (to see if it should layer with this weft)
  //  * @param j_start the starting warp where we are adjusting this layer
  //  * @param j_end the ending warp where we are adjusting this layer
  //  * @param draft the draft
  //  * @param warp_vtxs the current list of warp vertexes. 
  //  * @returns 
  //  */
  // export const addAnyAdditionalLayers = (i_active: number, i_check: number, j_start:number, j_end: number, draft: Draft, warp_vtxs: Array<Array<YarnVertex>>, range: number) => {
  //   if(i_check <= 0) return warp_vtxs;

  //   let ilace_list: Array<WeftInterlacementTuple> = getInterlacementsBetweenRows(i_active, i_check, j_start, j_end, draft);
  //   console.log("i lace list comparing", i_active, i_check, j_start, j_end, ilace_list)
  //   if(ilace_list.length == 0) return warp_vtxs;

  //   const has_barrier = hasBarrierInRange(ilace_list, j_start, j_end, range, draft);
  //   console.log("has barrier ", has_barrier);
  //   if(has_barrier) return warp_vtxs;

  //   let orientation = ilace_list[0].orientation;
  //   warp_vtxs = layerWarpsBetweenInterlacements(0, i_active, i_check, j_start, j_end, warp_vtxs, orientation);
  //   return addAnyAdditionalLayers(i_active, i_check-1, j_start, j_end, draft, warp_vtxs, range);
   
    
  //} 


  // export const packAsFarAsYouCan = (i_active: number, i_check: number, j_start:number, j_end: number, draft : Draft, ms: MaterialsService, weft_vtxs: Array<Array<YarnVertex>>, warp_vtxs: Array<Array<YarnVertex>>, layer_offset: number, all_ilaces: Array<WeftInterlacementTuple>) => {

  //   //COMPARE THE NEW BARINGS OF ROWS, IF THERE ARE INTERLACEMTNS, END HERE

  //   let ilace_list: Array<WeftInterlacementTuple> = getInterlacementsBetweenRows(i_active, i_check, j_start, j_end, draft);
  //   const has_barrier = hasBarrier(ilace_list);
  //     if(has_barrier){
  //       weft_vtxs = stackAtop(i_active, i_check, j_start, j_end, ms, draft, weft_vtxs);
  //     }else{
  //       //look for intelacements to the left and right of this region 
  //       const distance = howCloseIsTheClosestInterlacementOnTheseWefts(all_ilaces);
  //     }
  //     //do any of these cross - if so, its a barrier 
  //     //if not, we might need to scan left and right to see if we have any other conflicting interlacements on this row. 
    


  // }

  export const setLayerZ = (ilace_list: Array<WeftInterlacementTuple>, count: number, warp_vtxs: Array<Array<YarnVertex>>) :  Array<Array<YarnVertex>> => {


    ilace_list.forEach(ilace => {
      console.log("setting layer z for barrier between", ilace.i_top, ilace.i_bot, count)
      for(let i = ilace.i_bot; i <= ilace.i_top; i++){
        warp_vtxs[i][ilace.j].z = count;
      }
    });

    return warp_vtxs;

  }



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
  export const layerWarpsBetweenInterlacements = (count: number, i_active:number, i_check: number, j_start: number, j_end: number, draft: Draft, range: number, warp_vtxs: Array<Array<YarnVertex>>) => {


    //if check is 0 there are no more rows to check and we should just return where we are. 
    if(i_check <= 0) return warp_vtxs;

    let ilace_list: Array<WeftInterlacementTuple> = getInterlacementsBetweenRows(i_active, i_check, j_start, j_end, draft);
    // console.log("i lace list comparing", i_active, i_check, j_start, j_end, ilace_list)
    
    //if there are no interlacements on this row, it was a duplicate of the previous row, and so we couls just move
    if(ilace_list.length == 0)
      return layerWarpsBetweenInterlacements(count, i_active, i_check-1, j_start, j_end, draft, range, warp_vtxs);
    

    const has_barrier = hasBarrierInRange(ilace_list, j_start, j_end, range, draft);
    // console.log("has barrier ", has_barrier);
    if(has_barrier){
      //set the warp positions here
      //each mark each of the barriers as a place that needs to move 

      return setLayerZ(ilace_list, count, warp_vtxs);

    }else{
      let orientation = ilace_list[0].orientation;
      if(orientation){
        count = count -1;
      }else{
        count = count + 1;
      }
      return layerWarpsBetweenInterlacements(count, i_active, i_check-1, j_start, j_end, draft, range, warp_vtxs);
  
    } 

  }


  /**
   * gets the first instance of an interlacement with a different orientation to the start, returns the index at which it was found and the distance
   * @param start the first weft tuple
   * @param remaining the remaining list
   * @returns the ndx at which the segment ends (before the interlacement) or -1 if no interlacement is ever found.
   */
  export const getNonInterlacingSegment = (start: WeftInterlacementTuple, remaining: Array<WeftInterlacementTuple>) : {ndx: number, dist: number} =>{
     
    let ref_orientation = start.orientation;
    let barrier_cell = remaining.findIndex(el => el.orientation !== ref_orientation);
    if(barrier_cell !== -1){
      let distance = start.j - remaining[barrier_cell].j-1;
      return {ndx:barrier_cell-1, dist: distance};
    }else{
      return {ndx: -1, dist:-1};
    }
  }



  /**
   * use the draft to determine where layers will form and position warps accordingly
   * @param draft the draft we are working with
   * @param warp_vtxs the current warp verticies
   * @param range how close does an interlacement need to be to present a layer from forming. 
   */
  export const positionWarpsInZ = (draft: Draft, range: number) : Array<Array<YarnVertex>> => {
    const dd = draft.drawdown;
    const ilaces = getWeftInterlacementTuples(dd);
    let warp_vtxs: Array<Array<YarnVertex>> = [];

    //push initial locations
    dd.forEach((row, i) => {
      warp_vtxs.push([]);
      row.forEach((cell, j) =>{
        warp_vtxs[i].push({x: j, y: i, z: 0})
      });
    })


    for(let i = 1; i < wefts(dd); i++){
     
      //get the interlacements associated with this row
      let a = ilaces.filter(el => el.i_top == i);

      //if there is at least one interlacement 
      if(a.length > 0){  
      
        //go through each interlacement
        for(let x = 0; x < a.length; x++){

          const ilace_start: WeftInterlacementTuple = a.shift();
          const res = getNonInterlacingSegment(ilace_start, a);

          let ilace_end = null;
          if(res.dist > range || res.ndx == -1){
            
            if(res.ndx == -1){
              ilace_end = {
                i_top: ilace_start.i_top, 
                i_bot: ilace_start.i_bot,
                j: warps(draft.drawdown)-1,
                orientation: ilace_start.orientation}
            }else{
              ilace_end = a[res.ndx];
            }
           
            // console.log("found non interlacing from ", res, ilace_start, ilace_end);
  
            let orientation = ilace_start.orientation;
            let count = 0;
            if(orientation){
              count =  -1;
            }else{
              count = 1;
            }

            warp_vtxs = layerWarpsBetweenInterlacements(count, ilace_start.i_top, ilace_start.i_bot-1, ilace_start.j, ilace_end.j,draft, range, warp_vtxs);
           
          }

          x = res.ndx;
        }
      }

    }

    return warp_vtxs;

  }


 


    // for(let x = 0; x < ilaces.length; x++){
    //   const ilace = ilaces[x];
    //   const ilace_next = ilaces[x+1];

    //   if(ilace.i_top !== ilace_next.i_top){
    //     //travel the rest of the y's on each row between ilace_top and ilace_next top. 
    //     //update all the y positions assuming they are floats
    //     weft_vtxs = stackUncoupledInterlacements(ilace, ilace_next, draft, ms, weft_vtxs, warp_vtxs);

    //   }else if(ilace.j < ilace_next.j){
    //     if(ilace.orientation == ilace_next.orientation){

    //       //between these two j's lower the y, push the z and keep looking for the stopping point
    //       //next check row == i_lace.i_bot -1. If there are interlacements between j this, jnext in that row, stop
    //     }else{
    //       //it hit a boundary, do not adjust Z, offset y to boundary y. 
    //     }
    //   }else{
        
    //   }




    // }

    // //the listed ended before all rows had been considered
    // if(ilaces[ilaces.length-1].i_top != wefts(dd)){
    //   //merge all the ys on the remaning rows, as they are duplicates
    // }



    // for(let i =0; i < wefts(dd); i++){
    //   const active_row = i+1; 
    //   const check_row = i; 

    //   //while check row and active row have no conflicting interlacements
    //   //check j and j(next interlacement) - are they conflicting interlacements
    //   //if no, slide everythign between j and j(next interlacement) - adjust z based on orientation, checkrow = checkrow-1
    //   //if so, set y to checkrows y
    //   //push z of both j and j(next interlacement) - snap weft z at the interlacement points

    // }
  








  


  



