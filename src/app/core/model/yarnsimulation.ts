import { Cell } from "./cell";
import { Draft, Drawdown, SystemVerticies, YarnCell, YarnSim, YarnVertex, YarnVertexExpression } from "./datatypes";
import { analyzeWeftFloats, getCol, warps, wefts } from "./drafts";
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



  export const getDraftTopology = (drawdown: Drawdown) : {warps: SystemVerticies, wefts: SystemVerticies} => {

    const all_warps: SystemVerticies = [];
    const all_wefts: SystemVerticies = [];

    //position each warp first. 
    for(let j = 0; j < warps(drawdown); j++){
      const col = getCol(drawdown, j);
      
      const col_vtx: Array<YarnVertexExpression> = [];
      const acc_vtx: YarnVertexExpression =  {
        x: {push: 1.5*j, pack: 0},
        y: {push: 0, pack: 0},
        z: {push: 0, pack: 0},
      }
      let last: Cell = new Cell(false);
      col.forEach((cell, i) => {
        
        if(cell.isSet() && i > 0){

         
          acc_vtx.z.push = (cell.getHeddle()) ? .5  : 0;

          if(cell.getHeddle() != last.getHeddle()){
            acc_vtx.y.push++;
          }else{
            acc_vtx.y.pack++;
          }
        }
        //deep copy by manually assigning. 
        col_vtx.push({
          x: {push: acc_vtx.x.push, pack: acc_vtx.x.pack},
          y: {push: acc_vtx.y.push, pack: acc_vtx.y.pack},
          z: {push: acc_vtx.z.push, pack: acc_vtx.z.pack},
        });

        last = new Cell(cell.getHeddle());

      });

      all_warps.push(col_vtx.slice());

    }
    

    const weft_floats = analyzeWeftFloats(drawdown);
    const wefts:Array<Array<YarnVertexExpression>> = [];
   
    drawdown.forEach((row, i) => {
      const single_weft = [];
      row.forEach((cell, j) => {
      
        const warp_vtx:YarnVertexExpression = all_warps[j][i];
        const assoc_float = weft_floats[i].find(el => (j >= el.start && j < el.start + el.total_length));
        const middle = assoc_float.total_length/2;
        const float_position = middle - Math.abs((j - assoc_float.start) - middle);
        const linear_position = j - assoc_float.start;
        const adj_float = assoc_float.total_length -1;

        const start_pack_to = getPreviousInterlacementOnWarp(drawdown, j,i);
        const y_start = (start_pack_to !== -1) 
        ? {push: all_warps[assoc_float.start][start_pack_to].y.push + 1, pack: all_warps[assoc_float.start][start_pack_to].y.pack}
        : {push: all_warps[assoc_float.start][i].y.push, pack: all_warps[assoc_float.start][i].y.pack};

        const end_pack_to = getPreviousInterlacementOnWarp(drawdown, assoc_float.start+adj_float,i);

        const y_end =  (end_pack_to !== -1) 
        ? {push: all_warps[assoc_float.start+adj_float][end_pack_to].y.push+1, pack: all_warps[assoc_float.start+adj_float][end_pack_to].y.pack}
        : {push: all_warps[assoc_float.start+adj_float][i].y.push, pack: all_warps[assoc_float.start+adj_float][i].y.pack}

        const y_span = {push: y_end.push - y_start.push, pack: y_end.pack - y_start.pack}

        let vtx = {
          x: {push: warp_vtx.x.push, pack: warp_vtx.x.pack},
          y: {push: y_start.push, pack: y_start.pack},
          z: {push: warp_vtx.z.push, pack: warp_vtx.z.pack},
        }

        if(adj_float > 0){
          vtx.y.push += linear_position/adj_float*y_span.push;
          vtx.y.pack += linear_position/adj_float*y_span.pack;
        }

        //push z based on weft position 
        const ortho = (float_position+1) * .5;
        const layer = (i - start_pack_to > 0) ? .5 : 0;
        if(assoc_float.heddle == true){
          vtx.z.pack -= ortho;
          vtx.z.push -= layer;
          warp_vtx.z.push -= layer;
        }else{
          vtx.z.pack += ortho;
          vtx.z.push += layer;
          warp_vtx.z.push += layer;
        }



        single_weft.push(vtx);
      });
      wefts.push(single_weft.slice());
    });


    return {warps: all_warps, wefts: wefts};
  }

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



  


  



