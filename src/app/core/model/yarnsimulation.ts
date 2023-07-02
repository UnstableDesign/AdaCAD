
import { SQRT1_2 } from "mathjs";
import { drawdown } from "../operations/drawdown/drawdown";
import { MaterialsService } from "../provider/materials.service";
import { getCellValue } from "./cell";
import {  Bounds, Cell, Deflection, Draft, Drawdown, LayerMaps, SimulationData, SimulationVars, TopologyVtx, VertexMaps, WarpHeight, WarpInterlacementTuple, WarpRange, WeftInterlacementTuple, YarnCell, YarnFloat, YarnVertex } from "./datatypes";
import {getCol, warps, wefts } from "./drafts";
import { Sequence } from "./sequence";



  
  export const areInterlacement = (a: Cell, b: Cell) : boolean => {

    if(getCellValue(a) == null || getCellValue(b) == null) return false;

    if( getCellValue(a) != getCellValue(b)) return true;

    return false;
  }


  export const getOrientation = (a: Cell, b: Cell) : boolean => {

    if(getCellValue(a) == true && getCellValue(b) == false) return true;
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
      let i_top = i+1;
      let i_bot = i;

      for(let j = 0; j < warps(dd); j++){


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
      // if(count == 0) console.log("------COUNT 0 ", ilace_list);

    ilace_list.forEach(ilace => {

      //warp_vtxs[ilace.i_top][ilace.j].y = warp_vtxs[ilace.i_bot][ilace.j].y + 1;

      for(let i = ilace.i_bot; i <= ilace.i_top; i++){
        // console.log("writing to ", i, ilace.j, count);
        warp_vtxs[i][ilace.j].z = count*layer_spacing;
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
  export const layerWarpsInZBetweenInterlacements = (count: number, i_active:number, i_check: number, j_start: number, j_end: number, draft: Draft, range: number, layer_spacing: number,  warp_vtxs: Array<Array<YarnVertex>>) : Array<Array<YarnVertex>>=> {

    let ilace_list: Array<WarpInterlacementTuple> = getInterlacementsBetweenWefts(i_active, i_check, j_start, j_end, draft);
    //if check is 0 there are no more rows to check and we should just return where we are. 
    if(i_check < 0){
      // console.log("we are at the end of the range, sending count ", count, ilace_list)
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
  export const extractInterlacementsFromTuples = (tuples: Array<WarpInterlacementTuple>, count: number, simvars: SimulationVars) : Array<TopologyVtx> => {
    const topo: Array<TopologyVtx> = [];

    //look left to right
    for(let x = 1; x < tuples.length; x++){
      let last = x -1;
      if(tuples[last].orientation !== tuples[x].orientation && (tuples[x].j - tuples[last].j) <= simvars.max_interlacement_width){
          topo.push({
            id: tuples[last].i_bot+"."+tuples[last].i_top+"."+tuples[last].j+"."+tuples[x].j+"."+count,
            i_top: tuples[last].i_top, 
            i_bot: tuples[last].i_bot,
            j_left: tuples[last].j,
            j_right: tuples[x].j,
            orientation: !tuples[last].orientation,
            z_pos: count
          });
        }
      }

    let optimal_topo: Array<TopologyVtx> = [];
    topo.forEach(vtx => {
      let reduced = reduceInterlacement(vtx, tuples, count);

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
        id: vtx.i_bot+"."+vtx.i_top+"."+vtx.j_left+"."+vtx.j_right+"."+vtx.z_pos,
        i_bot: vtx.i_bot, 
        i_top: vtx.i_top,
        j_left: inner_tuples[closest.ndx].j,
        j_right: vtx.j_right,
        z_pos: count,
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
  export const getInterlacements = (tuples: Array<WarpInterlacementTuple>, range: WarpRange, count: number,  draft: Draft, simvars: SimulationVars) : Array<TopologyVtx> => {


    let closeness_to_edge = Math.ceil(warps(draft.drawdown)/8);


    if(tuples.length < 1) return [];



    if(tuples[0].i_bot < 0) return [];



   // if(tuples[0].i_top == wefts(draft.drawdown)-1) return [];


    
    tuples = getTuplesWithinRange(tuples, range);

    const topo  = extractInterlacementsFromTuples(tuples, count, simvars);

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
      ilaces = ilaces.concat(getInterlacements(next_row_tuple.slice(), range, count,  draft, simvars));

    });
  

      
    
    return topo.concat(ilaces);

  }


  export const getFloatRanges = (draft: Draft, i: number) => {
    const ranges: Array<WarpRange> = [];
    let last_ndx = -1;
    let last_value, cur_value: boolean  = false;
    draft.drawdown[i].forEach((cell, j) => {
      if(j == 0){
        last_ndx = 0;
        last_value = cell.is_set && cell.is_up;
      } else{
        cur_value = cell.is_set && cell.is_up;
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



  export const correctInterlacementLayers = (all: Array<TopologyVtx>, weft: Array<TopologyVtx>, layer_threshold: number) : Array<TopologyVtx> => {


//this is a list of every possible interlacement between wefts but also includes sometimes more interlacements than we need. For instance, with satin, it might detect layers within float spaces. We can identify those as interlacements that share a corner. 

    let hard_overlaps = [];
    let to_check = weft.slice();
    all.forEach((topo) => {
        to_check = to_check.filter(el => el.id != topo.id);
        to_check.forEach((check) => {
          if(topo.i_bot == check.i_bot && topo.j_left == check.j_left) hard_overlaps.push({a: topo.id, b: check.id})
          if(topo.i_bot == check.i_bot && topo.j_right == check.j_right) hard_overlaps.push({a: topo.id, b: check.id})
          if(topo.i_top == check.i_top && topo.j_left == check.j_left) hard_overlaps.push({a: topo.id, b: check.id})
          if(topo.i_top == check.i_top && topo.j_right == check.j_right) hard_overlaps.push({a: topo.id, b: check.id})
        });
    })

    hard_overlaps.forEach(topo => {
      weft = weft.filter(el => el.id !== topo.b);

      // let a:TopologyVtx = all.find(el => el.id == topo.a);
      // let b:TopologyVtx = weft.find(el => el.id == topo.b);
      // if(a !== undefined && b!== undefined){
      // if(Math.abs(a.z_pos) < Math.abs(b.z_pos)) weft = weft.filter(el => el.id !== b.id);
      // else all = all.filter(el => el.id !== a.id);
      // }
    });
    all = weft.slice();


    let compressed_weft = [];
    let last = null;

    //check weft from left to right and strip out anything that seems to be an outlier
    weft.forEach(vtx => {
      
      if(vtx.z_pos == last){
         compressed_weft[compressed_weft.length-1].count++;
         compressed_weft[compressed_weft.length-1].els.push(vtx);
      }else{
        compressed_weft.push({id: vtx.z_pos, count: 1, els: [vtx]});
      }
      last = vtx.z_pos;
    });


    let mark_for_removal = [];
    compressed_weft.forEach((item, ndx) => {
      if(item.count < layer_threshold){
        //check left 
        // console.log("Removing below threshold elements")
        item.els.forEach(el => {
          mark_for_removal.push(el.id);
        })
        //let left_mag = (ndx -1 >= 0) ? compressed_weft[ndx-1].count : -1;
        //let right_mag = (ndx +1 < compressed_weft.length) ? compressed_weft[ndx+1].count : -1;

        // if(left_mag !== -1 && right_mag != -1){
        //   let new_pos = -1;
        //   if(left_mag >= right_mag){
        //     new_pos = compressed_weft[ndx-1].id;
        //   }else{
        //     new_pos = compressed_weft[ndx+1].id;
        //   }
          
         
        // }

      }
    })

    weft = weft.filter(el => mark_for_removal.find(item => item == el.id) == undefined);
    all = weft.slice();



    //check weft from top to bottom
    //this has the problem that if there is an error somewhere, it will no ripple out through the cloth. 
    weft.forEach(vtx => {

      let shares_layer = all.filter(el => 
        (el.j_left == vtx.j_right && el.i_top == vtx.i_bot) || (el.j_right == vtx.j_left && el.i_top == vtx.i_bot))

      shares_layer.forEach(topo_vtx => {
        vtx.z_pos = topo_vtx.z_pos;
      })

    });

    return weft;
  }



  /**
   * this function takes a draft and input variables and uses those to generate a list of vertexes between which yarns will cross on the z plane. These points are used to determine how layers are formed and how yarns will stack relative to eacother. 
   */
  export const getDraftTopology = (draft: Draft, sim: SimulationVars) : Promise<Array<TopologyVtx>> => {
    let dd = draft.drawdown;

    //extend the drawdown by boundary in all directions so that we can eliminate strange data that emerges from drafts that don't have enough interlacements because they are small. This artifically tiles the draft to get more fidelity. 



    const warp_tuples = getWarpInterlacementTuples(dd);
    // console.log("WARP TUPLES ", warp_tuples);
    let topology: Array<TopologyVtx> = [];

  
    //look at each weft
    for(let i = 0; i < wefts(dd); i++){

      //get the interlacements associated with this row
      let a = warp_tuples.filter(el => el.i_top == i);

      let range = {j_left: 0, j_right: warps(draft.drawdown)-1}
     // console.log("LOOKING AT ", i, " ", a)

      let verticies = getInterlacements( a, range, 0,  draft, sim);
      topology = topology.concat(verticies);


      let corrected = correctInterlacementLayers(topology, verticies, sim.layer_threshold);

      topology = topology.concat(corrected);
    }

  
    return  Promise.resolve(topology);

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
     */
    export const createLayerMaps =  (draft: Draft, topo: Array<TopologyVtx>, sim: SimulationVars) : 
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
       }, 0);




      return createWarpLayerMap(draft, topo, sim, active_layers, max_layer)
      .then(warps => {

        layer_maps.warp = warps;
        return createWeftLayerMap(draft, topo, sim, active_layers, max_layer)
      }
      ).then(wefts =>{

        layer_maps.weft = wefts;
        
        return layer_maps;
      });
    }

    /**
     * use the topology generated to create a map describing the relationship between warp and weft layers. assign each position along a warp with an associated layer. If a weft interlaces with that warp, it must do so on the warps associated layer
     */
    export const createWarpLayerMap = (draft: Draft, topo: Array<TopologyVtx>, sim: SimulationVars, active_layers: Array<number>, max_layer: number) : Promise<Array<Array<number>>> => {
    
    //get the closest weft interlacements 
    const max_height = topo.reduce((acc, val) => {
      if((val.i_top - val.i_bot) > acc) return (val.i_top - val.i_bot);
      return acc;
    }, 0);

    //start from the smallest width to the largest  
    //push interlacements to the map in this order, not adding any additional. 
    //add a "strength, field that extends out from interlacement in "
    


      // //default all layers to null
      let layer_map: Array<Array<number>> = [];
      for(let i = 0; i < wefts(draft.drawdown); i++){
        layer_map.push([]);
        for(let j = 0; j < warps(draft.drawdown); j++){
          layer_map[i][j] = null;
        }
      }
      
      //go through layers 0 -> max and push interlacements to the layer map 
      for(let i = 1; i <= max_height; i++){
          let layer_ilace = topo.filter(ilace => ilace.i_top-ilace.i_bot == i);
          layer_map = addWarpLayerInterlacementsToMap(layer_map, layer_ilace, sim.max_interlacement_width, sim.max_interlacement_height); 
      }

    
        

        //now scan through the layer map. Count the number of consecutive layer values on a warp. 
        //if it is larger than the layer threshold, keep them
        //if not, 
        for(let j = 0; j < warps(draft.drawdown); j++){

          let col = layer_map.reduce((acc,el) => {
            return acc.concat(el[j]);
          }, []);

          //find all of the non null vals
          let vals = [];
          
          col.forEach((el, ndx) => {
            if(el !== null) vals.push(ndx);
          });


          if(vals.length == 0){
            //find the first non-zero val to the columns to the right 
            //fill this with those columns 
          }else{

            vals.forEach(val => {
              //fill downwards
              let found = false;
              for(let i = val-1; i >= 0 && !found; i--){
                if(layer_map[i][j] == null) layer_map[i][j] =  layer_map[val][j];
                else found = true;
              };

              //fill upwards
               found = false;
              for(let i = val+1; i < col.length && !found; i++){
                if(layer_map[i][j] == null) layer_map[i][j] =  layer_map[val][j];
                else found = true;
              };


            });
            

          }

           
        // }

        }


  /**
   * look through rows, if you hit a null value in a row, look to the preview 
   * values it had just saw, and replace this value with those values. 
   */
    let prior_pattern = [];
    let count_null = 0;
    for(let i = 0; i < wefts(draft.drawdown); i++){
      for(let j = 0; j < warps(draft.drawdown); j++){
        if(layer_map[i][j] !== null){
          if(count_null > 0) prior_pattern = [];
          prior_pattern.push(layer_map[i][j]);
          count_null = 0;
        }else{
       //   console.log("FOUND NULL AT ", i, j, "PRIOR IS ", prior_pattern, " ", count_null);
          if(prior_pattern.length == 0) layer_map[i][j] = 0;
          else layer_map[i][j] = prior_pattern[count_null%prior_pattern.length];
          count_null++;
        }

      }
    }


      //now clean up 
      console.log("WARP LAYER MAP", layer_map)
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
    export const createWeftLayerMap = (draft: Draft, topo: Array<TopologyVtx>, sim: SimulationVars, active_layers: Array<number>, max_layer: number) : Promise<Array<Array<number>>> => {

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
          layer_map = addWeftLayerInterlacementsToMap(layer_map, layer_ilace, sim.max_interlacement_width);
        })
        
      }

        /**
       * look through rows, if you hit a null value in a row, look to the preview 
       * values it had just saw, and replace this value with those values. 
       */
      let prior_pattern = [];
      let count_null = 0;
      for(let j = 0; j < warps(draft.drawdown); j++){
        for(let i = 0; i < wefts(draft.drawdown); i++){
          if(layer_map[i][j] !== null){
            if(count_null > 0) prior_pattern = [];
            prior_pattern.push(layer_map[i][j]);
            count_null = 0;
          }else{
        //   console.log("FOUND NULL AT ", i, j, "PRIOR IS ", prior_pattern, " ", count_null);
            if(prior_pattern.length == 0) layer_map[i][j] = 0;
            else layer_map[i][j] = prior_pattern[count_null%prior_pattern.length];
            count_null++;
          }

        }
      }

    //  console.log("WEFT LAYER MAP", layer_map)
      return Promise.resolve(layer_map);

    }

    /**
     * this function calculates proximity to the place in which the interlacement crosses and then attracts the other interlacements towards it position as a function of their distance. 
     * @param inlacement_j 
     * @param interlacement_y 
     * @param cur 
     * @param mm_per_warp 
     */
    export const updateY = (interlacement_j: number, interlacement_y:number, cur: YarnVertex, mm_per_warp: number ) => {

      //calc distance in mm. the closer to the interlacement, the stronger this vertex will be pulled twoards ilace_y
      let dist = (interlacement_j-cur.j) * mm_per_warp;

      //use the function 1 / 2^x/2 to calucate the force. 
     // let displacement_factor = 1 / Math.pow(2, dist/10);
      let displacement_factor = 1;
      let y_dist = interlacement_y - cur.y;

      let new_y =  cur.y + (y_dist*displacement_factor);

      // console.log("DIST, DISP, YDIST, NEWY", dist, displacement_factor, y_dist, cur.y, new_y, interlacement_y);
      return new_y;

    
    } 

    // /**
    //  * given an distance range in mm, returns all the vtxs in that range. 
    //  * @param weft 
    //  * @param x_min 
    //  * @param x_max 
    //  * @returns 
    //  */
    // export const getVtxsInRange = (weft: Array<YarnVertex>, x_min: number, x_max:number) => {
       
    //     let range = [];
    //    for(let x = 0; x < weft.length; x++){
    //       let vtx = weft[x]; 
    //       if(vtx.x >= x_min) range.push(vtx);
    //       if(vtx.x >= x_max) return range;
    //    }
    // }


    export const setBaselineYForWeft = (i: number, weft: Array<YarnVertex>, layer_maps: LayerMaps, draft: Draft, prior_wefts:Array<Array<YarnVertex>>, sim: SimulationVars) : Array<YarnVertex> => {
        let updated_weft = [];
        let weft_diam = sim.ms.getDiameter(draft.rowShuttleMapping[i]);

        //find the y value of the same layer
        weft.forEach((vtx) => {

          let this_layer = layer_maps.weft[vtx.i][vtx.j];
          let layer_ndx_map = layer_maps.weft
          .filter((el, ndx) => ndx < i)
          .map(el => el[vtx.j])
          .map( (el, ndx) => {return {layer: el, i: ndx, j: vtx.j}});

        let prev_wefts_on_layer = layer_ndx_map.filter(el => el.layer == this_layer);
        let prev_weft = null;
        let layer_y = {y: 0, i: -1};
        
        if(prev_wefts_on_layer.length > 0){
          prev_weft = prev_wefts_on_layer.slice().pop();
          let prev_weft_vtx = prior_wefts[prev_weft.i].find(el => el.j == vtx.j);
          if(prev_weft_vtx !== undefined)
          layer_y = {y:prev_weft_vtx.y, i: prev_weft.i};
        }

        //compare the last layer y to the highest y in the set
        let non_layer_map = layer_ndx_map.filter(el => el.layer !== this_layer);
        let max_y = non_layer_map.reduce((acc, el) => {
          let max_in_weft = prior_wefts[el.i].reduce((subacc, vtx) => {
            if(vtx.y > subacc) return vtx.y;
            return subacc;
          }, 0);

          if(max_in_weft >= acc.y) return {y: max_in_weft, i: el.i};
          return acc;
        }, {y: 0, i: -1});

        let use_y = 0;

        if(max_y.i !== -1 || (max_y.i == -1 && non_layer_map.length == 0)){
          //if the layer_y is within acceptable distance from max
          let diff = (max_y.y + sim.ms.getDiameter(draft.rowShuttleMapping[max_y.i])/2)  - (layer_y.y + weft_diam/2);
          if(layer_y.i == -1 || diff > weft_diam){
            use_y = max_y.y + sim.ms.getDiameter(draft.rowShuttleMapping[max_y.i])/2 - weft_diam;
          } 
          else{
            use_y = layer_y.y + sim.ms.getDiameter(draft.rowShuttleMapping[layer_y.i])/2 + weft_diam/2;

          } 

        }

       //TECHNICALLY - WE SHOULD UPDATE WARP VTXS TOO!
        updated_weft.push({
          x: vtx.x,
          y: use_y, 
          z: vtx.z,
          i: vtx.i,
          j: vtx.j
        })
    })

    return updated_weft;
    }

    /**
     * an interlacement pushes two wefts away from eachother by an amount that depends on the sett, yarn thickness, and strength of the interlacement. This funciton radiates, and dissapates that force along the weft to ensure a smooth gradual change in position that is never out of range
     * @param weft the weft vertexes
     * @param deflections a copy of vertexes, but storing the already occured deflections
     * @param x the position of the interlacement
     * @param i the weft id
     * @param strength the strength of the interlacement (closer interlacements are stronger)
     * @param max_displacement the maximum amont of distance, in y, that this weft can be displaced
     * @param simvars the simulation variables. 
     * @returns 
     */
    export const radiateInterlacementForce = (weft: Array<YarnVertex>, deflections: Array<Deflection>, x: number, i: number, strength: number, max_displacement, simvars: SimulationVars) : Array<Deflection> => {

      let in_range = weft.map((el, ndx) => {
       if(el.x >= x - simvars.radius && el.x <= x + simvars.radius) return ndx;
       else return -1;
      });

      in_range.filter(el => el !== -1).forEach(ndx => {
        deflections[ndx].dy += strength * max_displacement;
        if(deflections[ndx].dy > max_displacement) deflections[ndx].dy = max_displacement;
      })

      return deflections;

    }

    /**
     * given the distance of this interlacement in mm, this function figures out the strength factor. Which will determine how much to push up this warp as  function of distance. Smaller widths get pushed up harder than farther widths. Max is 1 - min is very close to zero.
     * @param dist 
     */
    export const calcStrength = (dist: number) : number => {
      return 1/dist;
    }

    /**
     * how far can a strong interlacement push a weft upward in the cloth. This depends on the sett of the cloth and density of the yarns. How much distance is between these yarns? Returns the displacement in mm. 
     * @param sett_width - how many mm between the two yarns in question
     * @param max_warp_thickness - how thick is the warp at this interlacement.
     * @returns 
     */
    export const calcMaxDisplacement = (sett_width: number, max_warp_thickness: number) : number => {
      return max_warp_thickness / sett_width;
    }


    export const packWeft = (i: number, weft: Array<YarnVertex>, topo: Array<TopologyVtx>, layer_maps: LayerMaps, draft: Draft,  prior_wefts:Array<Array<YarnVertex>>, sim: SimulationVars) : Array<YarnVertex> => {

      //get the interlacements that have the current weft as the top value
      let ilaces = topo.filter(el => el.i_top === i);
      let row = draft.drawdown[i];
      let weft_diam = sim.ms.getDiameter(draft.rowShuttleMapping[i]);
      let prior_ilaces = [];


      weft = setBaselineYForWeft(i, weft, layer_maps, draft, prior_wefts, sim);
    
      let deflections: Array<Deflection> = weft.map(vtx => {return {i: vtx.i, j: vtx.j, dx: 0, dy: 0, dz: 0}});


      ilaces.forEach(ilace => {

          //assume the center point of the interlacement is where the yarn cross. 
          //figure out the strength of the interlacement and update. 



          //--- code to add the center point of this ilace as a vertex --//
          let width = (ilace.j_right - ilace.j_left)*sim.warp_spacing;
          let strength = calcStrength(width);
  
          let current_left_ndx:number = weft.findIndex(el => el.j == ilace.j_left);
          if(current_left_ndx == -1) return;
          let current_left:YarnVertex = weft[current_left_ndx];
          
          let current_right_ndx:number = weft.findIndex(el => el.j == ilace.j_right);
          if(current_right_ndx == -1) return;
          let current_right:YarnVertex = weft[current_right_ndx];


          let center_x = current_right.x + (current_right.x - current_left.x)/2;
          let left_warp_diam = sim.ms.getDiameter(draft.colShuttleMapping[ilace.j_left]);
          let right_warp_diam = sim.ms.getDiameter(draft.colShuttleMapping[ilace.j_right]);
          let between_yarns_width = width - (left_warp_diam/2 + right_warp_diam/2);
          if(between_yarns_width < 0) between_yarns_width = 0.1;
          let max_displacement = calcMaxDisplacement(between_yarns_width, Math.max(left_warp_diam, right_warp_diam));

          deflections = radiateInterlacementForce(weft, deflections, center_x, i, strength, max_displacement, sim);


          // let prior_left = prior_wefts[ilace.i_bot].find(el => el.j == ilace.j_left);
          // let prior_right = prior_wefts[ilace.i_bot].find(el => el.j == ilace.j_right);


          //this interlacement has a warp where it would otherwise overlap, figure out if we need to push it to 
          //either side of this warp. 
          // let z_pos = (ilace.orientation) ? current_left.z + weft_diam/2 : current_left.z - weft_diam/2;
          // let x_pos = current_left.x + (current_right.x - current_left.x) /2;
          // let center_j =  ilace.j_right + (width/2);

          // if(width % 2 == 0){
          //   console.log("LOOKING TO MOVE THE WARP ")
          //   if(layer_maps.warp[i][center_j] == ilace.z_pos){
          //     let warp_diam = sim.ms.getDiameter(draft.colShuttleMapping[center_j])
          //     let interlacement_side = !(draft.drawdown[i][center_j].is_set && draft.drawdown[i][center_j].is_up);
          //     z_pos =  (interlacement_side) ? z_pos += (warp_diam/2+weft_diam/2)  : z_pos -= (warp_diam/2+weft_diam/2);
          //     x_pos =  center_j * sim.warp_spacing;
          //   }
          // }
         
          // console.log("PRIOR LEFT ", prior_left, prior_right)
          // console.log("CURRENT LEFT ", current_left, current_right)
         //take the ends of the interlacements and push them up to the interlacement location

            

            //TODO, don't just pull pull these up, calculate their distance from teh interlacement and let them be affected by packing force. 
            // current_left.y = y_pos;
            // current_right.y = y_pos;

            // let isect_vtx: YarnVertex = {
            //   x: x_pos, 
            //   y: current_left.y,
            //   z: z_pos,
            //   i: i, 
            //   j: center_j 
            // };


            // let to_left = getVtxsInRange(weft, isect_vtx.x - 100, isect_vtx.x);
            // to_left.forEach(left_vtx => {
            //   left_vtx.y = updateY(isect_vtx.j, isect_vtx.y, left_vtx, sim.warp_spacing);
            // })
            
            //now, push the vertex representing the 
            //weft.splice(current_right_ndx, 0, isect_vtx);

          //}
         



      });

      for(let j = 0; j < weft.length; j++){
        weft[j].y += deflections[j].dy;
      }
      return weft;
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
      let weft = insertWeft(draft, [],  i, sim, layer_maps);
      let res = packWeft(i, weft.slice(), topo, layer_maps, draft, weft_vtx, sim);
      weft_vtx[i] = res.slice();

    } 

    for(let j = 0; j < warps(draft.drawdown); j++){
      warp_vtx.push([]);
      //get every interlacement involving this weft
      const ilaces= topo.filter(el => el.j_left == j || el.j_right == j);
      warp_vtx = insertWarp(draft, ilaces, warp_vtx,  j, sim, layer_maps.warp).slice();
    } 
   

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
    return (draft.drawdown[i][j].is_set && draft.drawdown[i][j].is_up) ? 1 : -1; 

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
  export const insertWeft 
  = (draft: Draft, 
    weft_vtx: Array<YarnVertex>, 
    i: number, 
    sim: SimulationVars, 
    layer_maps: LayerMaps
    ) 
    : Array<YarnVertex> => {

    let diam = sim.ms.getDiameter(draft.rowShuttleMapping[i]);
    return  processWeftInterlacements(draft, i, diam, weft_vtx,sim, layer_maps);
  }



  export const calcClothHeightOffsetFactor = (diam: number, radius: number, offset: number) : number => {
    return  diam * (radius-offset)/radius; 
  }
 

 

  export const addWeftInterlacement 
  =  (
    draft: Draft, 
    i: number, 
    j: number, 
    z_pos: number, 
    diam: number, 
    sim: SimulationVars, 
    weft_vtxs: Array<YarnVertex>, 
    ) 
  : Array<YarnVertex> => {
    let offset = getWeftOffsetFromWarp(draft, i, j, sim.ms);
    let orient = getWeftOrientationVector(draft, i, j);


      weft_vtxs.push({
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
  export const processWeftInterlacements 
  = (draft: Draft, 
    i: number,  
    diam: number, 
    weft_vtxs: Array<YarnVertex>,  
    sim: SimulationVars, 
    layer_maps:  LayerMaps) 
    : Array<YarnVertex> => {

    let indexs_added = [];

    //look across the row and make new interlacements
    let last_layer = layer_maps.weft[i][0];
   
    weft_vtxs = addWeftInterlacement(draft, i, 0, last_layer, diam, sim, weft_vtxs).slice();
    indexs_added.push(0);

    for(let j = 1; j < warps(draft.drawdown); j++){

       if(layer_maps.warp[i][j]==layer_maps.weft[i][j]){
        let layer_id:number = layer_maps.weft[i][j];        
        weft_vtxs = addWeftInterlacement(draft, i, j, layer_id, diam, sim, weft_vtxs).slice();
      }

    }

    return weft_vtxs;

  }

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



 








  


  



