
import { MaterialsService } from "../provider/materials.service";
import { getCellValue, setAndOpposite, setAndSame } from "./cell";
import { Draft, Drawdown, CNFloat, CNIndex, CNType, Cell, ContactNeighborhood, SimulationVars, YarnVertex, WeftPath, Particle, Spring } from "./datatypes";
import { warps, wefts } from "./drafts";
import utilInstance from "./util";
import * as THREE from 'three';


  export const areInterlacement = (a: Cell, b: Cell) : boolean => {

    if(getCellValue(a) == null || getCellValue(b) == null) return false;

    if( getCellValue(a) != getCellValue(b)) return true;

    return false;
  }


  export const getOrientation = (a: Cell, b: Cell) : boolean => {

    if(getCellValue(a) == true && getCellValue(b) == false) return true;
    return false;
  }




  export const positionFloatingWefts = (i_active: number, i_check: number, j_start: number, j_end: number, ms: MaterialsService, draft: Draft, weft_vtxs: Array<Array<YarnVertex>>) :   Array<Array<YarnVertex>> =>{
    let check_mat = ms.getDiameter(draft.rowShuttleMapping[i_check]);
    let active_mat = ms.getDiameter(draft.rowShuttleMapping[i_active]);
    for(let j =j_start; j <= j_end; j++){     
      weft_vtxs[i_active][j].y = weft_vtxs[i_check][j].y + (check_mat/2 + active_mat/2);  
    }
    return weft_vtxs;
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





  export const initContactNeighborhoods = (size: number) : Promise<Array<ContactNeighborhood>> => {
       let cns:Array<ContactNeighborhood> = new Array<ContactNeighborhood>(size);
       for(let x = 0; x < cns.length; x++){
          cns[x] = {
            ndx: {i:0, j:0, id:0},
            node_type: 'ECN',
            mv:{y:0, z:0},
            face:null, 
          }
       }
      

       return Promise.resolve(cns);
  }

  const setIndex = (ndx:CNIndex, warps: number, cns:Array<ContactNeighborhood>) : Array<ContactNeighborhood> => {
    let cn = getCN(ndx, warps, cns);
    cn.ndx = ndx;
    return cns;
  }

  const setFace = (ndx:CNIndex, warps: number, cns:Array<ContactNeighborhood>, value: boolean) : Array<ContactNeighborhood> => {
    let cn = getCN(ndx, warps, cns);
    cn.face = value;
    return cns;
  }

  const getFace = (ndx:CNIndex, warps: number, cns:Array<ContactNeighborhood>) : boolean => {
    let cn = getCN(ndx, warps, cns);
    return cn.face
  }

  const setNodeType = (ndx: CNIndex, warps: number, cns:Array<ContactNeighborhood>, type: CNType) : Array<ContactNeighborhood> => {
    let cn = getCN(ndx, warps, cns);
    cn.node_type = type;
    return cns;
  }

  const getNodeType = (ndx: CNIndex, warps: number, cns:Array<ContactNeighborhood>) : CNType => {
    let cn = getCN(ndx, warps, cns);
    return cn.node_type
  }

  const setMvY = (ndx: CNIndex, warps: number, cns:Array<ContactNeighborhood>, mv_y: number) : Array<ContactNeighborhood> => {
    if(ndx.j < 0 || ndx.j >= warps) return cns;
    let cn = getCN(ndx, warps, cns);
    cn.mv.y = mv_y;
    return cns;
  }

  const getMvY = (ndx: CNIndex, warps: number, cns:Array<ContactNeighborhood>) : number => {
    let cn = getCN(ndx, warps, cns);
    return cn.mv.y;
  }

  const setMvZ = (ndx: CNIndex, warps: number, cns:Array<ContactNeighborhood>, mv_z: number) : Array<ContactNeighborhood> => {
    if(ndx.j < 0 || ndx.j >= warps) return cns;
    let cn = getCN(ndx, warps, cns);
    cn.mv.z = mv_z;
    return cns;
  }

  const getMvZ = (ndx: CNIndex, warps: number, cns:Array<ContactNeighborhood>) : number => {
    let cn = getCN(ndx, warps, cns);
    return cn.mv.z;
  }

  const getMv = (ndx: CNIndex, warps: number, cns:Array<ContactNeighborhood>) : {y:number, z: number} => {
    let cn = getCN(ndx, warps, cns);
    return cn.mv;
  }


  export const getCN = (ndx: CNIndex, warps: number, cns:Array<ContactNeighborhood>) : ContactNeighborhood => {
    let ndx_flat = 4*(ndx.i * warps + ndx.j) + ndx.id;
    return cns[ndx_flat];
  }

  /**
   * in cases where we want to render this as though it were repeating, we do need to consider the edges and, if neccessary, set the beginning and ending indexes beyond the bounds of the cloth such that we can determine the behavior of the float. Essentially, this calculates "if this was a repeating structure, where would this weft have started"
   */
  const inferLeftIndex = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>) : CNIndex => {
    if(ndx.id == 0) console.error("inferring left index from left ACN node");

    //get all the active ACNs associated with this row. There should always be at least 2
    let active_acns = cns.filter(el => el.ndx.i == ndx.i && el.node_type == "ACN" && el.ndx.id == 0);
    if(active_acns.length == 0) console.error("no ACNS indexes found on left side nodes");
    let closing_acn = active_acns.pop();
    let dist_to_end = warps - closing_acn.ndx.j;
    return {i: closing_acn.ndx.i, j: -dist_to_end, id: closing_acn.ndx.id}
  }

  const inferRightIndex = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>) : CNIndex => {

    //should always start at a left (id: 0)
    if(ndx.id == 1) console.error("inferring right index from right-sided ACN node", ndx);

    //get all the active ACNs associated with this row. There should always be at least 2
    let active_acns = cns.filter(el => el.ndx.i == ndx.i && el.node_type == "ACN" && el.ndx.id == 1);
    if(active_acns.length == 0) console.error("no ACNS indexes found on right side nodes");
    let first_acn = active_acns.shift();
    return {i: first_acn.ndx.i, j: warps+first_acn.ndx.j, id: first_acn.ndx.id}
  }


  /**
   * uses the contact neighborhoods on this row to get a list of floats. Some floats may be out of range (> warps) so that they can readily apply to the warpwise relationships
   * @param i 
   * @param warps 
   * @param cns 
   * @returns 
   */
  export const getRowAsFloats = (i: number, warps: number, cns: Array<ContactNeighborhood>) : Array<CNFloat> => {

    let floats = [];
    let lefts = cns.filter(el => el.node_type == 'ACN' && el.ndx.i == i && el.ndx.id == 0);
    let rights = cns.filter(el => el.node_type == 'ACN' && el.ndx.i == i && el.ndx.id == 1);
    if(lefts.length !== rights.length) console.error("THIS ROW HAS AN UNEVEN NUMBER OF ACNS")


    lefts.forEach(left => {
      let found = false;
     
      for(let j = left.ndx.j; j < warps && !found; j++){
        let right = rights.find(el => el.ndx.j == j);
        if(right !== undefined){
          found = true;
          floats.push({
            left:left.ndx, 
            right: right.ndx,
            edge: false,
            face: left.face 
          })
        }
      }

      if(!found){
        let right = rights.shift();
        floats.push({
            left:left.ndx, 
            right: {i: right.ndx.i, j: warps+right.ndx.j, id:1}, //get the first in the list
            edge: false,
            face: left.face 
          })
      }


    })

    return floats;


  }

  /**
   * searches starting at the index for begin for two nodes of type ACN, which correspond to a float
   * this can return j values that are out of range since it measure how long the float would be if it repeated, not just from start to finish. 
   * @param begin 
   * @param left 
   * @param right 
   */
  // export const getNextWeftFloat = (begin: CNIndex, warps: number, cns: Array<ContactNeighborhood>) : CNFloat => {

  //   let float_started = false;
  //   let face = false;
  //   let l_ndx = {i: -1, j: -1, id: 0};
  //   let r_ndx = {i: -1, j: -1, id: 0};
  //   let edge = false;


  //     //walk the row from ACN to ACN
  //     for(let j = begin.j; j < warps; j++){

  //     //is the left hand side of this node contain an ACN?
  //     if(getNodeType({i:begin.i, j, id:0}, warps, cns) == 'ACN'){
  //       //valid floats much start on the left and end on the right
        
  //       if(!float_started){
  //         float_started = true
  //         face = getFace({i:begin.i, j, id: 0}, warps, cns);
  //         l_ndx = {i:begin.i, j, id: 0}
  //       }
  //     }
    
  //      //check the right side of this node
  //       if(getNodeType({i:begin.i, j, id:1}, warps, cns) == 'ACN'){
  //         if(float_started){
  //           console.log("end found AT ", j, " right ")

  //           r_ndx = {i:begin.i, j, id: 1};
  //           return {left:l_ndx, right:r_ndx, face, edge}
  //         }else{
  //            console.log("this float is starting on the left")

  //           //we've reached the end of a float that began at the start of this row
  //           edge = true;
  //           face = getFace({i:begin.i, j, id: 1}, warps, cns);
  //           r_ndx = {i:begin.i, j, id: 1};
  //           l_ndx = inferLeftIndex({i:begin.i, j, id: 1}, warps, cns);
  //           return {left:l_ndx, right:r_ndx, face, edge}
  //         }
  //       }
  //     }

 
  //     //if we got to the end and there was a float started that isn't finished, we need to wrap around to find the finish
  //     if(float_started){
  //        console.log("this never ended")

  //        edge = true;
  //        face = getFace({i:begin.i, j:begin.j, id: 0}, warps, cns);
  //        r_ndx = inferRightIndex({i:begin.i, j:begin.j, id: 0 }, warps, cns);
  //         console.log("this never ended, inferring end of", r_ndx.j)

  //        l_ndx = {i:begin.i, j:begin.j, id: 0};


  //        return {left:l_ndx, right:r_ndx, face, edge}
  //     }

  //   return null; //no complete float found
  // } 


  //given a list of j's that are attached under a float, this aims to make sense of those and build them into a float
  const extractFloat = (i: number, warps: number, face: boolean, segments: Array<number>, cns:Array<ContactNeighborhood>) : {float: CNFloat, last: number} => {

    //walk to the first ACN
    let start = null;
    let end = null;

    for(let s = 0; s < segments.length; s++){
     
      //check the left side
      let adj_j = utilInstance.mod(segments[s],warps);
      if(getNodeType({i, j:adj_j, id:0}, warps, cns) == 'ACN'){
        if(start == null){
          start = {i, j:segments[s], id:0}
        }
      }
      //check the right side
      if(getNodeType({i, j:adj_j, id:1}, warps, cns) == 'ACN'){
          if(start !== null){
          end = {i, j:segments[s], id:1};
          let edge = (end.j >= warps-1 || start.j <= 0);
          return {float: {left: start, right:end, face, edge}, last:segments[s]}
          }
      }

    }
      //got to the end and there was no closing this might mean we have reached the end of the row. 
      return {float: null, last:segments.length}



  }

  


  /**
   * get all the floats with teh same face value that share an edge with the input float that reside on the row indicated by i. Given that if we are assuming repeats, some indexes might be beyond or not actually existing in the cn list
   * @param i 
   * @param warps 
   * @param float 
   * @param cns 
   * @returns 
   */
  const getAttachedFloats = (i: number, wefts:number, warps: number, float: CNFloat, cns: Array<ContactNeighborhood>) : Array<CNFloat> => {
    let attached = [];
    let segments = [];



    if(i < 0) i = utilInstance.mod(i, wefts);


    //walk along the input float and push any lower neighbors that match face
    for(let j = float.left.j; j <= float.right.j; j++){
      let adj_j = utilInstance.mod(j,warps); //protect when float ends are out of range
      let face = getFace({i, j:adj_j, id:0}, warps, cns);
      if(float.face !== null && float.face == face){
        segments.push(j)
      }
    }


    if(segments.length == 0) return [];

    let left_edge = segments[0];
    let right_edge = segments[segments.length-1]


    //walk left to find attached
    let edge_found = false;
    for(let count = 1; count < warps && !edge_found; count++){
      let adj_j = utilInstance.mod((left_edge - count),warps);
       let face = getFace({i, j: adj_j, id:0}, warps, cns);
        if(float.face !== null && float.face == face){
          segments.unshift((left_edge - count))
        }else{
          edge_found = true;
        }
    }


    //walk right to find attached
    edge_found = false;
    for(let count = 1; count < warps && !edge_found; count++){
      let adj_j = utilInstance.mod((right_edge + count),warps);
       let face = getFace({i, j:adj_j, id:0}, warps, cns);
        if(float.face !== null && float.face == face){
          segments.push(right_edge + count);

        }else{
          edge_found = true;
        }
    }

    //SEGMENTS NOW CONTAINS A LIST OF ALL the Cells of the same face color, the left most and right most CNS in these cells should be the edges. This list may be empty if there was only the opposite color attached. 

    let loops = 0;
    while(segments.length > 0 && loops < 20){
      loops++;
      let extracted = extractFloat(i, warps, float.face, segments, cns);
      if(extracted.float !== null){
        attached.push(extracted.float)
      }

      segments = segments.filter(el => el > extracted.last);
    }

    return attached;
  }

  /**
   * This analyses the relationship of floats of hte same type and determines their relationship. 
   * @param float 
   * @param attached 
   * @returns 
   */
  const getWarpwiseRelationship = (float: CNFloat, attached: Array<CNFloat>) : Array<string> => {

    if(attached.length == 0) return ["BUILD"] //require different handlings
    
    let res:Array<string> = attached.reduce((acc, el) => {
      let top_length = float.right.j - float.left.j;
      let bottom_length = el.right.j - el.left.j;      
      
      if(float.right.j > el.right.j && float.left.j > el.left.j)  acc.push("BUILD");
      else if(float.right.j < el.right.j && float.left.j < el.left.j)  acc.push("BUILD");
      else if(float.right.j == el.right.j && float.left.j == el.left.j ) acc.push("STACK");
      else if(float.left.j == el.left.j || float.right.j == el.right.j){
        if(top_length > bottom_length){
          if(float.face == false) acc.push("SLIDE-OVER")
          else acc.push("SLIDE-UNDER")
        }else{
          if(float.face == false) acc.push("SLIDE-UNDER")
          else acc.push("SLIDE-OVER")
        }
      }  

      else if(float.left.j < el.left.j && float.right.j > el.right.j){
        if(float.face == false) acc.push("SLIDE-OVER");  
        else acc.push("SLIDE-UNDER");  
      }

      else if(float.left.j > el.left.j && float.right.j < el.right.j){
        if(float.face == false) acc.push("SLIDE-UNDER");  
        else acc.push("SLIDE-OVER");  
      }else{
        console.error(" UNACCOUNTED FOR RELATIONSHIP FOUND BETWEEN ", float, el)
      }
      return acc;
    }, []);


    return res;
    

 
    



  }

  /**
   * analyses the relationship between the current row's CNS and the previous rows CNS to determine if and how far the floats on this row can pack. 
   * @param i the row number
   * @param cns the list of current contact neighborhoods
   */
  export const packRow = (i: number, wefts: number, warps: number,  cns: Array<ContactNeighborhood>) : Array<ContactNeighborhood> => {

      let floats: Array<CNFloat> = getRowAsFloats(i, warps, cns);
      console.log("ANALYSING ", i)

     floats.forEach(float => {
        if(float.face != null){
          // console.log("CHECKING FLOAT ", float.left.j, float.right.j)
          let obj = calcMVValue(i-1, 0,  float, wefts, warps, cns);
          // console.log("*RETURNED ", obj)
          while(obj.next_i !== -1){
            obj = calcMVValue(obj.next_i, obj.mvy, float, wefts, warps, cns);
            // console.log("RETURNED ", obj)

          }
          cns = setMvY(float.left, warps, cns, obj.mvy);
          let adj_right: CNIndex = {
            i: float.right.i, 
            j: utilInstance.mod(float.right.j, warps), 
            id: float.right.id};
          
          cns = setMvY(adj_right, warps, cns, obj.mvy);
        }
      });
      return cns;
    }


  
   /**
    * this needs to recursively search the previous rows (and loop if needed) to determine how far this float can slide in the y direction. As it does so, it should make a note of it's pairwise relationships in z with each subsequent float. 
    * @param i the row to which we are comparing
    * @param mvy the number of rows this has already moved
    * @param float the float we are comparing to
    * @param warps the width of the cloth
    * @param cns the list of contact neighborhoods
    */ 
  const calcMVValue = (i: number, mvy: number, float: CNFloat, wefts: number, warps: number, cns: Array<ContactNeighborhood>) : {mvy: number, next_i: number} => {

      //wrap to continue search but eventually stop if we've covered the whole cloth
      let adj_i = i;
      if(i < 0) adj_i = utilInstance.mod(i, wefts);
      if(mvy >= wefts-1) return {mvy, next_i:-1}
      //get all of the attached floats on i
      let attached: Array<CNFloat> = getAttachedFloats(adj_i, wefts, warps, float, cns);
      //console.log("GOT ATTACHED ", attached)

      //determine what kind of relationship the 
      let reltn = getWarpwiseRelationship(float, attached);
      //console.log("FOUND RELATIONS ", float, reltn.map(el => String(el)))
        //adjust the right side of the float to clamp the value in: 
    
        if(reltn.find(el => el == "BUILD") !== undefined){
          return {mvy, next_i: -1}

        }else if(reltn.find(el => el == "STACK") !== undefined){
          return {mvy: mvy+.5, next_i: -1}
        }else{
          //SLIDE OVER OR UNDER
          return {mvy: mvy+1, next_i: i-1};
        
          //SLIDING OVER IS ONLY RELATIVE TO THE WEFT BELOW, not the side of the cloth
          // if(reltn.find(el => el == "SLIDE-OVER") !== undefined){
          //   let factor = (float.face) ? -1 : 1;

          //   //get the largest layer offset from the previous row's attached warps
          //   let prev_z = attached.reduce((acc, el) => {
          //     if(el.left.j >= 0 && el.left.j < warps){
          //       let left_z = getMvZ(el.left, warps, cns);
          //       if(Math.abs(left_z) > acc) acc = Math.abs(left_z);
          //     }

          //     if(el.right.j >= 0 && el.right.j < warps){
          //       let right_z = getMvZ(el.right, warps, cns);
          //       if(Math.abs(right_z) > acc) acc = Math.abs(right_z);
          //     }

          //     return acc;
          //   }, 0)

          //     cns = setMvZ(float.left, warps, cns, prev_z*factor+factor);
          //     cns = setMvZ(float.right, warps, cns, prev_z*factor+factor);

          // }


          // if(reltn.find(el => el == "SLIDE-UNDER") !== undefined){
          //   //this float is going to slide under the float before it. 

          //   //this now needs to do an ordering sequence with the wefts before it. 

          //   //the mvy factor should represent how many attached wefts this weft can float under

          //   //for each of those attached wefts, we need to figure out what their current z level is and then set them to be above this one.




          //   //if I am warp faced float, I'm going to be on the back (-) side of the cloth
          //   let factor = (float.face) ? -1 : 1;

          //     attached.forEach(attached_float => {
          //       if(attached_float.left.j >= 0){
          //          let prev_attached_left_z = getMvZ(attached_float.left, warps, cns);
          //          cns = setMvZ(attached_float.left, warps, cns, prev_attached_left_z+factor);
          //       }

          //       if(attached_float.right.j < warps){
          //         let prev_attached_right_z = getMvZ(attached_float.right, warps, cns);
          //          cns = setMvZ(attached_float.right, warps, cns, prev_attached_right_z+factor);

          //       }

          //     });
          //   } 
            
      }        
  }
    
  
  /**
   * Walks through the values in a given draft row and adds active nodes on both sides of any interlacement (shift from face a to b or b to a). It is also going to add active nodes on edges but looking at it's relationship to the start or end of the row. 
   * @param i the row id
   * @param dd the drawdown
   * @param cns the list of contact neighborhoods
   * @returns 
   */
  export const parseRow = (i:number, dd: Drawdown, cns: Array<ContactNeighborhood>) : Array<ContactNeighborhood> => {
    let width = warps(dd);
    let height = wefts(dd);

    for(let j = 0; j < width; j++){
    let cell = dd[i][j];


      cns = setIndex({i, j, id:0}, width, cns);
      cns = setIndex({i, j, id:1}, width, cns);
      cns = setIndex({i, j, id:2}, width, cns);
      cns = setIndex({i, j, id:3}, width, cns);

      let face = getCellValue(dd[i][j]);
      cns = setFace({i, j, id:0}, width, cns, face)
      cns = setFace({i, j, id:1}, width, cns, face)
      cns = setFace({i, j, id:2}, width, cns, face)
      cns = setFace({i, j, id:3},  width, cns, face)
     

      //check left 
      if(j > 0){
        let left = dd[i][j-1];
        if(setAndOpposite(cell, left)){
          cns = setNodeType({i, j, id:0}, width, cns, 'ACN')
        }else if(setAndSame(cell, left)){
          cns = setNodeType({i, j, id:0}, width, cns, 'PCN')
        }else if(cell.is_set && !left.is_set) {
          cns = setNodeType({i, j, id:0}, width, cns, 'ACN')
        }
      }else{

        if(cell.is_set){
           cns = setNodeType({i, j, id:0}, width, cns, 'VCN')//just in case rendering full width
          
           //peek around to the end of the to what the next value would be if this repeated and then add a point there if it's opposite
           if(setAndOpposite(cell, dd[i][width-1])){
              cns = setNodeType({i, j, id:0}, width, cns, 'ACN')
           }
        }
      }

      if(j < width-1){
        let right = dd[i][j+1];
        if(setAndOpposite(cell, right)){
        cns = setNodeType({i, j, id:1}, width, cns, 'ACN')
        }else if(setAndSame(cell, right)){
          cns = setNodeType({i, j, id:1}, width, cns, 'PCN')
        }else if(cell.is_set && !right.is_set) {
          cns = setNodeType({i, j, id:1}, width, cns, 'ACN')
        }
      }else{
          if(cell.is_set){
           cns = setNodeType({i, j, id:1}, width, cns, 'VCN')//just in case rendering full width
                      //peek around to the end of the to what the next value would be if this repeated and then add a point there if it's opposite
           if(setAndOpposite(cell, dd[i][0])){
              cns = setNodeType({i, j, id:1}, width, cns, 'ACN')
           }
        }
      }
   
      //MOSTLY IGNORING BELOW FOR NOW

      //check TOP 
      if(i == 0 && getCellValue(dd[i][j]) != getCellValue(dd[height-1][j])){
        cns = setNodeType({i, j, id:2}, width, cns, 'ACN')
      }else if(i > 0 && getCellValue(dd[i][j]) != getCellValue(dd[i-1][j])){
        cns = setNodeType({i, j, id:2}, width, cns, 'ACN')
      }else{
        cns = setNodeType({i, j, id:2}, width, cns, 'PCN')
      }

      //check BOTTOM
      if(i == height-1 && getCellValue(dd[i][j]) != getCellValue(dd[0][j])){
        cns = setNodeType({i, j, id:3}, width, cns, 'ACN')
      }else if(i < height-1 && getCellValue(dd[i][j]) != getCellValue(dd[i+1][j])){
        cns = setNodeType({i, j, id:3}, width, cns, 'ACN')
      }else{
        cns = setNodeType({i, j, id:3}, width, cns, 'PCN')
      }


    }
    return cns;
  }

  export const setAndOppositeFaces = (f1: boolean, f2: boolean) : boolean => {
    if(f1 == null || f2 == null) return false;
    return (f1 !== f2);
  }

  export const setAndSameFaces = (f1: boolean, f2: boolean) : boolean => {
    if(f1 == null || f2 == null) return false;
    return (f1 == f2);
  }

  const determineRightEdgeBehavior = (top: number, bottom: number, j: number, warps: number, cns: Array<ContactNeighborhood>) : {cns: Array<ContactNeighborhood>, next_j: number} => {
    let top_f = getFace({i:top, j, id: 0}, warps, cns);
    let bottom_f = getFace({i:bottom, j, id: 0}, warps, cns);


    if(setAndSameFaces(top_f, bottom_f)){
      cns = setNodeType({i:top, j, id:0}, warps, cns, 'ECN');
      cns = setNodeType({i:bottom, j, id:0}, warps, cns, 'ECN');
      cns = setNodeType({i:top, j, id:1}, warps, cns, 'ECN');
      cns = setNodeType({i:bottom, j, id:1}, warps, cns, 'ECN');
      return {cns, next_j: j-1};

    }else if(setAndOppositeFaces(top_f, bottom_f)){

      cns = setNodeType({i:top, j, id:1}, warps, cns, 'ACN');
      cns = setNodeType({i:bottom, j, id:1}, warps, cns, 'ACN');
      return {cns, next_j: -1};

    }else if(top_f == null){
      if(bottom_f == true){

        for(let search = j-1; search <= 0; search--){
          if(getFace({i:top, j:search, id:0}, warps, cns) !== null){
             cns = setNodeType({i:bottom, j:search, id:1}, warps, cns, 'ACN');
            return {cns, next_j: -1};
          }
        }
        //I got to the end and it never found anything, just stop
        return {cns, next_j:-1}
      }
      else if(bottom_f == false){

        cns = setNodeType({i:top, j, id:0}, warps, cns, 'ECN');
        cns = setNodeType({i:bottom, j, id:0}, warps, cns, 'ECN');
        cns = setNodeType({i:top, j, id:1}, warps, cns, 'ECN');
        cns = setNodeType({i:bottom, j, id:1}, warps, cns, 'ECN');
        return {cns, next_j: j-1};
      }
      else {
        return {cns, next_j: j-1};
      }
    }else if(bottom_f == null){
      if(top_f){
         cns = setNodeType({i:top, j, id:1}, warps, cns, 'ACN');
        return {cns, next_j: -1};
      }else{
        cns = setNodeType({i:top, j, id:0}, warps, cns, 'ECN');
        cns = setNodeType({i:top, j, id:1}, warps, cns, 'ECN');
        return {cns, next_j: j-1};
      }
    }else{
      console.error("UNHANDLED RIGHT EDGE BEHAVIOR", top, bottom, j, top_f, bottom_f)

    }

  }

    const determineLeftEdgeBehavior = (top: number, bottom: number, j: number, warps: number, cns: Array<ContactNeighborhood>) : {cns: Array<ContactNeighborhood>, next_j: number} => {

    let top_f = getFace({i:top, j, id: 0}, warps, cns);
    let bottom_f = getFace({i:bottom, j, id: 0}, warps, cns);


    if(setAndSameFaces(top_f, bottom_f)){
      // console.log("SET AND SAME")

      cns = setNodeType({i:top, j, id:0}, warps, cns, 'ECN');
      cns = setNodeType({i:bottom, j, id:0}, warps, cns, 'ECN');
      cns = setNodeType({i:top, j, id:1}, warps, cns, 'ECN');
      cns = setNodeType({i:bottom, j, id:1}, warps, cns, 'ECN');
      return {cns, next_j: j+1};

    }else if(setAndOppositeFaces(top_f, bottom_f)){
      // console.log("SET AND OP")

      cns = setNodeType({i:top, j, id:0}, warps, cns, 'ACN');
      cns = setNodeType({i:bottom, j, id:0}, warps, cns, 'ACN');
      return {cns, next_j: -1};

    }else if(top_f == null){

        if(bottom_f == true){
            // console.log("UNSET (top) and RAISED (bottom)")

            for(let search = j+1; search < warps; search++){
              if(getFace({i:top, j:search, id:0}, warps, cns) !== null){
                cns = setNodeType({i:bottom, j:search, id:0}, warps, cns, 'ACN');
                return {cns, next_j: -1};
              }
            }
            //I got to the end and it never found anything, just stop
            return {cns, next_j:-1}
        }
        else if(bottom_f == false){
              // console.log("UNSET (top) and Lowered (bottom)")

            cns = setNodeType({i:top, j, id:0}, warps, cns, 'ECN');
            cns = setNodeType({i:bottom, j, id:0}, warps, cns, 'ECN');
            cns = setNodeType({i:top, j, id:1}, warps, cns, 'ECN');
            cns = setNodeType({i:bottom, j, id:1}, warps, cns, 'ECN');
            return {cns, next_j: j+1};
        }
        else {
            //console.log("UNSET BOTH")
            return {cns, next_j: j+1};
          } 
    }else if(bottom_f == null){
    
      //handle if top is black or top is while
      if(top_f){
          cns = setNodeType({i:top, j, id:0}, warps, cns, 'ACN');
          return {cns, next_j: -1};
      }else{
         cns = setNodeType({i:top, j, id:0}, warps, cns, 'ECN');
         cns = setNodeType({i:bottom, j, id:0}, warps, cns, 'ECN');
         cns = setNodeType({i:top, j, id:1}, warps, cns, 'ECN');
         return {cns, next_j: j+1};
      }

      
    }else{
      console.error("UNHANDLED LEFT EDGE BEHAVIOR", top, bottom, j, top_f, bottom_f)
    }

  }

  /** checks this row against the last row of the same material and system type and sees if the edge will interlace. If not, it removes any ACNs that would be pulled out in this pic */
  export const pullRow = (i:number, warps: number, prev_i_list: Array<number>, cns: Array<ContactNeighborhood>) : Array<ContactNeighborhood> => {
   
    if(prev_i_list.length == 0) return cns;

    const last = prev_i_list[prev_i_list.length-1];
    const direction = prev_i_list.length % 2 == 1; //true means the previous row went from left to right

    if(direction){

      let obj: {cns: Array<ContactNeighborhood>, next_j: number} = determineRightEdgeBehavior(i,  last, warps-1, warps, cns);
      cns = obj.cns;


      while(obj.next_j !== -1){
        obj =  determineRightEdgeBehavior(i, last, obj.next_j, warps, cns);
        cns = obj.cns;

      }

    }else{
       let obj: {cns: Array<ContactNeighborhood>, next_j: number} = determineLeftEdgeBehavior(i, last, 0, warps, cns);
       cns = obj.cns;

      while(obj.next_j !== -1){
        obj =  determineLeftEdgeBehavior(i, last, obj.next_j, warps, cns);
        cns = obj.cns;

      }
    }
    
    return cns;
  }



  /**
   * this will read through a current drawdown and populate the information needed for the contact neighborhoods, determining if and how different wefts stack or slide, etc. This will change based on the behavior of the wefts so we do need some information here if the simulation should assume the wefts run full width or if we want to simulate as drafted (where, if there isn't a selvedge, some might pull out) 
   * @param dd 
   * @param cns 
   * @returns 
   */

  /**
   * use the a given draft into populate the contact neighborhoods. 
   * @param dd the drawdown to parse
   * @param cns the initialized contact neighborhoods
   * @param sim variables to control how the parsing takes place (e.g. specifically if you want to render the draft as it would be woven vs forcing it to go full width)
   * @returns 
   */
  export const parseDrawdown = (d: Draft, cns: Array<ContactNeighborhood>, sim:SimulationVars) : Promise<Array<ContactNeighborhood>> => {

      //create a temp list
      let paths:Array<WeftPath> = initWeftPaths(d);
      let dd = d.drawdown;

      //start by parsing the entire drawdown
      for(let i = 0; i < wefts(dd); i++){
        cns = parseRow(i, dd, cns);
      }

    
      for(let i = 0; i < wefts(dd); i++){
          //console.log("PARSING DRAWDOWN ROW ", i)

          let material = d.rowShuttleMapping[i];
          let system = d.rowSystemMapping[i];
          let path = paths.find(el => el.material == material && el.system == system);
          if(path == undefined) Promise.reject('no path found for material and system ')

          //assign each node a value based on it's relationship with its neighbor
         // cns = parseRow(i, dd, cns);

          if(sim.wefts_as_written) cns = pullRow(i, warps(dd), path.pics, cns);
          
          cns = packRow(i, wefts(dd), warps(dd), cns);
         path.pics.push(i);
      }



    return Promise.resolve(cns);
  }

  

  /**
   * update this to contact neighborhood 
   */
   export const getDraftTopology = async (draft: Draft, sim: SimulationVars) : Promise<Array<ContactNeighborhood>> => {

       let dd = draft.drawdown;
       let width = warps(dd);
       let height = wefts(dd);
       let node_num = width * height * 4;
       return initContactNeighborhoods(node_num)
       .then(cns => {
          return parseDrawdown(draft, cns, sim);
       });
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
  //  const calcMaxDisplacement = (sett_width: number, max_warp_thickness: number) : number => {
  //     return max_warp_thickness / sett_width;
  //   }

    /**
     * if every row is packed at the same packing force, then the fell line created by a straight beater would be represented by the maximum y value;  Y values represent the center of teh material. 
     * @param vtxs 
     * @returns the y value represented by the top edge of the last weft inserted and packed. 
     */
    const getFellY = (vtxs:Array<YarnVertex>, diameter: number) : number => {
      let max_y = vtxs.reduce((acc, el ) => {
        if(el.y > acc) return el.y;
        return acc;
      }, 0);
      return max_y + diameter/2;

    }

    /**
     * looks at the move number of the current node and determines, based on the nodes this is connected to, how far is should actually move from it's relationship to neighboring interlacements. This could be more sophisticated (but right now it returns the max over a window of a given size). 
     * @param ndx 
     * @param cns 
     */
    const calcYOffset = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>, simVars: SimulationVars) : number => {

      let max_dist = 10; //the distance at which one weft would NOT affect another
      let mvy = getMvY(ndx, warps, cns);

      let j_dist = simVars.warp_spacing;  //the distance traveled for each j
      let j_check = Math.floor((max_dist/j_dist)/2);
      let left = (simVars.wefts_as_written) ? ndx.j-j_check : utilInstance.mod(ndx.j-j_check, warps);
      let right = (simVars.wefts_as_written) ? ndx.j+j_check : utilInstance.mod(ndx.j+j_check, warps);
      let j_left = Math.min(left, right);
      let j_right = Math.max(left, right); 

      // console.log("J, J LEFT, J RIGHT ", ndx.j, j_left, j_right)
      let row = cns.filter(
        el => el.ndx.i == ndx.i 
        && el.node_type == "ACN"
        && el.ndx.j >= j_left
        && el.ndx.j <= j_right 
      );

      //row should have at least i
      // console.log("ROW ", row);
      
      // let sum:number = row.reduce((acc, el) => {
      //   acc += el.mv.y;
      //   return acc;
      // }, 0);

      // return sum / row.length;

      let min:number = row.reduce((acc, el) => {
        if(acc < el.mv.y) acc = el.mv.y;
        return acc;
      }, mvy);

      return min;

      

    }


    /**
     * converts the information for the CN into a vertex using the information from the CNs as well as the simulation variables. It assumes that for any pick, how far this y can travel from it's insertion point is a function of the pack force, position of fell line, and the mobility of the individual float. 
     * 
     *  
     * @param ndx 
     * @param d 
     * @param vtxs 
     * @param cns 
     * @param sim 
     * @returns 
     */
   const createVertex = (ndx: CNIndex, fell: number, d:Draft, cns:Array<ContactNeighborhood>, sim: SimulationVars) : YarnVertex =>{



    let width = warps(d.drawdown);
    let weft_material_id = d.rowShuttleMapping[ndx.i];
    let weft_diameter = sim.ms.getDiameter(weft_material_id);
    let warp_material_id = d.colShuttleMapping[ndx.j];
    let warp_diameter = sim.ms.getDiameter(warp_material_id);

    //this is a function of EPI, warp diameter and weft diameter, but for now, we'll be sloppy
    const interlacement_space = weft_diameter;

    let pack_factor = (1-sim.pack/100);
 
    let mvy = getMvY(ndx, width, cns);
    let max_row_mat_diameter = weft_diameter;

    for(let i = 0; i < mvy; i++){
      //get each material that this could theoretically slide over or under
      let row_mat_diameter = 0;
      if(ndx.i - i >= 0) row_mat_diameter = d.rowShuttleMapping[ndx.i - i];
      if(row_mat_diameter > max_row_mat_diameter) max_row_mat_diameter = row_mat_diameter;
    }


    //Each ACN has a MY number, which represents how far this weft *can* slide but not neccessarily how it does slide. This calculates how far it can slide based on it's relationships to it's neighbors and their sliding 

    let y_offset = calcYOffset(ndx, width, cns, sim);
    let mobility = (y_offset > 1 ) ? -1 : -y_offset; //clamp this value to -1

    //if pack_factor is 0 (no packing) this weft should sit at fell-line + diameter/2
    //if pack factor is 1 (max packing) this weft can sit  fell-line - max_y_displacement. Max y displacement is a function of the yarns that are stacking at this specific location. 


    let max_min = {
      max: fell + weft_diameter + interlacement_space, 
      min: fell + (max_row_mat_diameter/2)*mobility + weft_diameter/2};
      let y = utilInstance.interpolate(pack_factor, max_min);
    
    
    //let the layer first
    let z = getMvZ(ndx, width, cns) * sim.layer_spacing;
    //then adjust for which side of the warp it is sitting upon. 
    if(getFace(ndx, width, cns)) z -= warp_diameter;
    else z += warp_diameter;




    let x = sim.warp_spacing * ndx.j;
    if(ndx.id == 0) x -= warp_diameter;
    if(ndx.id == 1) x += warp_diameter;


    return {ndx,x, y, z}


  }

  /**
   * initializes a list of vertexes for every unique system-material combination used in this draft
   * @param d 
   */
  const initWeftPaths = (d: Draft) : Array<WeftPath> => {

    let weft_paths:Array<WeftPath> = [];

    for( let i = 0; i < wefts(d.drawdown); i++){
      let system = d.rowSystemMapping[i];
      let material = d.rowShuttleMapping[i];
      let path = weft_paths.find(el => el.system == system && el.material == material)
      if(path == undefined){
        weft_paths.push( {system, material, vtxs:[], pics:[]});
      }

    }
    return weft_paths;

  } 

  export const getFlatVtxList = (paths: Array<WeftPath>) : Array<YarnVertex> => {
      //collapse the paths into a flat list
    return paths.reduce((acc, el) => {
      acc = acc.concat(el.vtxs);
      return acc;
    }, []);
  }

  export const getWeftPath = (paths: Array<WeftPath>, system: number, material:number) : WeftPath =>{
    return paths.find(el => el.material == material && el.system == system);
  }



  /**
   * converts a topology diagram to a list of weft vertexes to draw. It only draws key interlacements to the list
   * @param draft 
   * @param topo 
   * @param layer_map 
   * @param sim 
   * @returns 
   */
  export const followTheWefts = (draft: Draft, cns: Array<ContactNeighborhood>, sim: SimulationVars) : Promise<Array<WeftPath>>=> {
    let warpnum =  warps(draft.drawdown);

    //get a list of the unique system-material combinations of this weft. 
    let paths:Array<WeftPath> = initWeftPaths(draft);
    let fell_y = 0;
    
    //parse row by row, then assign to the specific path to which this belongs
    for(let i = 0; i < wefts(draft.drawdown); i++){


      let system = draft.rowSystemMapping[i];
      let material = draft.rowShuttleMapping[i];
      let path = getWeftPath(paths, system, material);
      
      if(path === undefined) Promise.reject("weft path with system and material not found")
      
      let flat_vtx_list = getFlatVtxList(paths);

      let direction = ( path.pics.length % 2 == 0);  //true is left to right, false is 
        

          if(direction){
            //left to right - 
            for(let j = 0; j < warpnum; j++){

              if(getNodeType({i, j, id:0}, warpnum, cns) == 'ACN'){
                let vtx = createVertex({i, j, id:0}, fell_y, draft, cns, sim);
                path.vtxs.push(vtx);
              }
        
              if(!sim.wefts_as_written && getNodeType({i, j, id:0}, warpnum, cns) == 'VCN'){
                 let vtx = createVertex({i, j, id:0}, fell_y, draft, cns, sim);
                path.vtxs.push(vtx);
              }

              if(getNodeType({i, j, id:1}, warpnum, cns) == 'ACN'){
                let vtx = createVertex({i, j, id:1}, fell_y, draft, cns, sim);
                path.vtxs.push(vtx);
              }

              if(!sim.wefts_as_written && getNodeType({i, j, id:1}, warpnum, cns) == 'VCN'){
                 let vtx = createVertex({i, j, id:1}, fell_y, draft, cns, sim);
                path.vtxs.push(vtx);
              }
            }

          }else{

            for(let j = warpnum-1; j >= 0; j--){
              if(getNodeType({i, j, id:1}, warpnum, cns) == 'ACN'){
                let vtx = createVertex({i, j, id:1}, fell_y, draft, cns, sim);
                path.vtxs.push(vtx);
              }

            if(!sim.wefts_as_written && getNodeType({i, j, id:1}, warpnum, cns) == 'VCN'){
                let vtx = createVertex({i, j, id:1}, fell_y, draft, cns, sim);
                path.vtxs.push(vtx);
              }

              if(getNodeType({i, j, id:0}, warpnum, cns) == 'ACN'){
                let vtx = createVertex({i, j, id:0}, fell_y, draft, cns, sim);
                path.vtxs.push(vtx);
              }

              if(!sim.wefts_as_written && getNodeType({i, j, id:0}, warpnum, cns) == 'VCN'){
                let vtx = createVertex({i, j, id:0}, fell_y, draft, cns, sim);
                path.vtxs.push(vtx);
              }
            }
          }

          //update the position of the fell line now that we have added all these vertexes

          fell_y = getFellY(flat_vtx_list.concat(path.vtxs), sim.ms.getDiameter(material));
          path.pics.push(i);

    
        }



   
   
    return Promise.resolve(paths);
  }



  /**
   * it is possible that some ACS, particularly those assocated with edges or segments that cross between two faces, will not get assigned move numbers. This function has these ACNS inherit their move factors 
   * @param d 
   * @param cns 
   */
  export const cleanACNs = (d: Drawdown, cns: Array<ContactNeighborhood>, simVars: SimulationVars) : Promise<Array<ContactNeighborhood>> => {

    for(let i = 0; i < warps(d); i++){
      let row_acns = cns.filter(el => el.ndx.i == i && el.node_type == "ACN" && (el.ndx.id == 0 || el.ndx.id == 1))
      let as_string = row_acns.reduce((acc, el) => {
        //let s =  '('+el.ndx.j+','+el.mv.y+','+el.mv.z+')'
        let s =  '('+el.ndx.j+','+el.mv.y+')'
        acc = acc + s;
        return acc;
      }, "");
      console.log("ROW ", i, " - ", as_string)
    }


    return Promise.resolve(cns);
  }

  export const calcClothHeightOffsetFactor = (diam: number, radius: number, offset: number) : number => {
    return  diam * (radius-offset)/radius; 
  }

  /** CODE DEVOTED TO MASS-SPRING-CALC */
 
  export const createParticle = (x: number, y:number, z: number, pinned: boolean) : Particle => {
    let position = new THREE.Vector3(x, y, z);
    let geometry =  new THREE.SphereGeometry(0.1, 16, 16);
    let material = new THREE.MeshBasicMaterial({color: 0xff0000})

    let acceleration: THREE.Vector3 = new THREE.Vector3();


    let p = {
      position,
      previousPosition: position.clone(),
      geometry,
      material,
      mesh: new THREE.Mesh(geometry, material),
      acceleration, 
      pinned
    }

    p.mesh.position.copy(position)
    return p;
  }

  export const applyForce = (p: Particle, force: THREE.Vector3) : Particle => {
    p.acceleration.add(force);
    return p;
  } 

  export const verlet = (p: Particle, damping: number, timeStep: number) : Particle => {
    if (p.pinned) return p;

    const velocity = p.position.clone().sub(p.previousPosition).multiplyScalar(damping)

    const newPos = p.position.clone().add(velocity).add(p.acceleration.clone().multiplyScalar(timeStep ** 2));

    p.previousPosition.copy(p.position);
    p.position.copy(newPos);
    p.acceleration.set(0, 0, 0);

    return p;

  } 

  export const updateParticleMesh = (p: Particle) : Particle =>  {
    p.mesh.position.copy(p.position);
    return p;
  }

  export const createSpring = (p1: Particle, p2: Particle, restLength: number, color: number, diameter: number
  ) : Spring => {

    let spring = {
      pts: [],
      mesh: null,
      p1, p2, restLength, color, diameter
    }

    spring.pts.push(new THREE.Vector3(p1.position.x, p1.position.y, p1.position.z));
    
    spring.pts.push(new THREE.Vector3(p2.position.x,p2.position.y, p2.position.z));

    //const curve = new THREE.CatmullRomCurve3(spring.pts, false, 'catmullrom', .1);

    //const geometry = new THREE.TubeGeometry( curve, 2, 1, 8, false );
    const geometry = new THREE.BufferGeometry().setFromPoints(spring.pts);
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 }); // Green line

    // const material = new THREE.MeshPhysicalMaterial( {
    //       color: color,
    //       depthTest: true,
    //       emissive: 0x000000,
    //       metalness: 0,
    //       roughness: 0.5,
    //       clearcoat: 1.0,
    //       clearcoatRoughness: 1.0,
    //       reflectivity: 0.0
    //   } ); 
      
    spring.mesh = new THREE.Line(geometry, material)
      //spring.mesh = new THREE.Mesh(geometry, material);

      return spring;


  }

  export const satisfyConstraint = (s:Spring) : Spring => {
    const delta = s.p2.position.clone().sub(s.p1.position);
    const dist = delta.length();
    const diff = (dist - s.restLength) / dist;
    const correction = delta.multiplyScalar(0.5 * diff);

    if (!s.p1.pinned) s.p1.position.add(correction);
    if (!s.p2.pinned) s.p2.position.sub(correction);

    return s;
  }

  export const updateSpringMesh = (s: Spring) : Spring =>  {
    s.mesh.position.copy(s.p1.position);

    const vertices = s.mesh.geometry.attributes.position.array;
    vertices[0] = s.p1.position.x;
    vertices[1] = s.p1.position.y;
    vertices[2] = s.p1.position.z;

    vertices[3] = s.p2.position.x;
    vertices[4] = s.p2.position.y;
    vertices[5] = s.p2.position.z;

    s.mesh.geometry.attributes.position.needsUpdate = true; 

    return s;
  }



 