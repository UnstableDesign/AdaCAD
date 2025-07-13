
import { D } from "@angular/cdk/keycodes";
import { drawdown } from "../operations/drawdown/drawdown";
import { MaterialsService } from "../provider/materials.service";
import { getCellValue } from "./cell";
import { Draft, Drawdown, CNFloat, CNIndex, CNType, Cell, ContactNeighborhood, SimulationVars, YarnVertex } from "./datatypes";
import { warps, wefts } from "./drafts";
import utilInstance from "./util";




  
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
    console.log("GET FACE OF ", ndx.i, ndx.j)
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
    console.log("INFER LEFT OF ", ndx)
    if(ndx.id == 0) console.error("inferring left index from left ACN node");

    //get all the active ACNs associated with this row. There should always be at least 2
    let active_acns = cns.filter(el => el.ndx.i == ndx.i && el.node_type == "ACN");
    let closing_acn = active_acns.pop();
    console.log("CLOSING NDX ", closing_acn)

    if(closing_acn.ndx.id == 1) console.error("found right index when searching for left");

    let dist_to_end = warps - closing_acn.ndx.j;
    return {i: closing_acn.ndx.i, j: -dist_to_end, id: closing_acn.ndx.id}
  }

  const inferRightIndex = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>) : CNIndex => {

    //should always start at a left (id: 0)
    if(ndx.id == 1) console.error("inferring right index from right-sided ACN node", ndx);

    //get all the active ACNs associated with this row. There should always be at least 2
    let active_acns = cns.filter(el => el.ndx.i == ndx.i && el.node_type == "ACN");
    let first_acn = active_acns.shift();
    console.log("FIRST ACN ", first_acn)
    if(ndx.id == 0) console.error("found left index when searching for right");
    return {i: first_acn.ndx.i, j: warps+first_acn.ndx.j, id: first_acn.ndx.id}
  }

  /**
   * searches starting at the index for begin for two nodes of type ACN, which cooresond to a float
   * @param begin 
   * @param left 
   * @param right 
   */
  export const getNextWeftFloat = (begin: CNIndex, warps: number, cns: Array<ContactNeighborhood>) : CNFloat => {

    console.log("GET NEXT ", begin)

    let float_started = false;
    let face = false;
    let l_ndx = {i: -1, j: -1, id: 0};
    let r_ndx = {i: -1, j: -1, id: 0};
    let edge = false;


      //walk the row from ACN to ACN
      for(let j = begin.j; j < warps; j++){

      //is the left hand side of this node contain an ACN?
      if(getNodeType({i:begin.i, j, id:0}, warps, cns) == 'ACN'){
        //valid floats much start on the left and end on the right
        
        if(!float_started){
          float_started = true
          face = getFace({i:begin.i, j, id: 0}, warps, cns);
          l_ndx = {i:begin.i, j, id: 0}
        }
      }
    
       //check the right side of this node
        if(getNodeType({i:begin.i, j, id:1}, warps, cns) == 'ACN'){
          if(float_started){
            r_ndx = {i:begin.i, j, id: 1};
            return {left:l_ndx, right:r_ndx, face, edge}
          }else{
            //we've reached the end of a float that began at the start of this row
            edge = true;
            face = getFace({i:begin.i, j, id: 1}, warps, cns);
            r_ndx = {i:begin.i, j, id: 1};
            l_ndx = inferLeftIndex({i:begin.i, j, id: 1}, warps, cns);
            return {left:l_ndx, right:r_ndx, face, edge}
          }
        }
      }

 
      //if we got to the end and there was a float started that isn't finished, we need to wrap around to find the finish
      if(float_started){
         edge = true;
         face = getFace({i:begin.i, j:begin.j, id: 0}, warps, cns);
         r_ndx = inferRightIndex({i:begin.i, j:begin.j, id: 0 }, warps, cns);
         l_ndx = {i:begin.i, j:begin.j, id: 0};;
         return {left:l_ndx, right:r_ndx, face, edge}
      }

    return null; //no complete float found
  } 


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
  const getAttachedFloats = (i: number, warps: number, float: CNFloat, cns: Array<ContactNeighborhood>) : Array<CNFloat> => {
    let attached = [];
    let segments = [];


    if(i < 0) return [];


    //walk along the input float and push any lower neighbors that match face
    for(let j = float.left.j; j <= float.right.j ; j++){
      let adj_j = utilInstance.mod(j,warps); //protect when float ends are out of range
      let face = getFace({i, j:adj_j, id:0}, warps, cns);
      if(float.face !== null && float.face == face){
        segments.push(j)
      }
    }

    if(segments.length == 0) return [];

    //walk left to find attached
    let edge_found = false;
    for(let count = 1; count < warps && !edge_found; count++){
       let adj_j = utilInstance.mod((segments[0] - count),warps);
      console.log("ADJ J LEFT ", adj_j, segments, (segments[0] - count), warps)

       let face = getFace({i, j: adj_j, id:0}, warps, cns);
        if(float.face !== null && float.face == face){
          segments.unshift((segments[0] - count))
        }else{
          edge_found = true;
        }
    }


    //walk right to find attached
    edge_found = false;
    for(let count = 1; count < warps && !edge_found; count++){
      let adj_j = utilInstance.mod((segments[segments.length-1] + count),warps);
       let face = getFace({i, j:adj_j, id:0}, warps, cns);
        if(float.face !== null && float.face == face){
          segments.push((segments[segments.length-1] + count));
        }else{
          edge_found = true;
        }
    }

    //SEGMENTS NOW CONTAINS A LIST OF ALL the Cells of the same face color, the left most and right most CNS in these cells should be the edges. This list may be empty if there was only the opposite color attached. 

    while(segments.length > 0){
      let extracted = extractFloat(i, warps, float.face, segments, cns);
      if(extracted.float !== null){
        attached.push(extracted.float)
      }

      segments = segments.filter((el, ndx) => ndx > extracted.last);
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

      else if(float.left.j < el.left.j && float.right.i > el.right.i){
        if(float.face == false) acc.push("SLIDE-OVER");  
        else acc.push("SLIDE-UNDER");  
      }

      else if(float.left.j > el.left.j && float.right.i < el.right.i){
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
  export const packRow = (i: number, warps: number,  cns: Array<ContactNeighborhood>, assume_repeats:boolean) : Array<ContactNeighborhood> => {


      let float:CNFloat = getNextWeftFloat({i:i,j:0, id:0}, warps, cns)

      while(float !== null ){
        //get all of the attached floats on the next row down 
        let attached: Array<CNFloat> = getAttachedFloats(i-1, warps, float, cns);

        //determine what kind of relationship the 
        let reltn = getWarpwiseRelationship(float, attached);
        //console.log(" FLOAT/Attached", float, attached, reltn)

        if(reltn.find(el => el == "BUILD") !== undefined){
          cns = setMvY(float.left, warps, cns, 0);
          cns = setMvY(float.right, warps, cns, 0);
        }else if(reltn.find(el => el == "STACK") !== undefined){
          cns = setMvY(float.left, warps, cns, -.5);
          cns = setMvY(float.right, warps, cns, -.5);
        }else{
          //SLIDE OVER OR UNDER
          let current_left_mv = getMvY(float.left, warps, cns)
          let current_left_mz = getMvZ(float.left, warps, cns)
          let current_right_mv = getMvY(float.right, warps, cns)
          let current_right_mz = getMvZ(float.right, warps, cns)
          cns = setMvY(float.left, warps, cns, current_left_mv-1);
          cns = setMvY(float.left, warps, cns, current_right_mv-1);
        
          if(reltn.find(el => el == "STACK-OVER") !== undefined){
             cns = setMvZ(float.left, warps, cns, current_left_mz+1);
             cns = setMvZ(float.right, warps, cns, current_right_mz+1);
          }
          if(reltn.find(el => el == "STACK-UNDER") !== undefined){
             cns = setMvZ(float.left, warps, cns, current_left_mz-1);
             cns = setMvZ(float.right, warps, cns, current_right_mz-1);
          } 
        }

        //the ending float should always end on a right and start on a left 
        float = getNextWeftFloat({i:i,j:float.right.j+1, id:0}, warps, cns)      
        }        
      
        return cns;

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
    for(let j = 0; j < warps(dd); j++){

      cns = setIndex({i, j, id:0}, width, cns);
      cns = setIndex({i, j, id:1}, width, cns);
      cns = setIndex({i, j, id:2}, width, cns);
      cns = setIndex({i, j, id:3}, width, cns);

      cns = setFace({i, j, id:0}, width, cns, getCellValue(dd[i][j]))
      cns = setFace({i, j, id:1}, width, cns, getCellValue(dd[i][j]))
      cns = setFace({i, j, id:2}, width, cns, getCellValue(dd[i][j]))
      cns = setFace({i, j, id:3},  width, cns, getCellValue(dd[i][j]))
     



      //check left 
      if(j == 0 && getCellValue(dd[i][j]) != getCellValue(dd[i][width-1])){
        cns = setNodeType({i, j, id:0}, width, cns, 'ACN')
      }else if(j > 0 && getCellValue(dd[i][j]) != getCellValue(dd[i][j-1])){
        cns = setNodeType({i, j, id:0}, width, cns, 'ACN')
      }else{
        cns = setNodeType({i, j, id:0}, width, cns, 'PCN')
      }

      //check right
      if(j == width -1 && getCellValue(dd[i][j]) != getCellValue(dd[i][0])){
        cns = setNodeType({i, j, id:1}, width, cns, 'ACN')
      } else if(j < width-1 && getCellValue(dd[i][j]) != getCellValue(dd[i][j+1])){
        cns = setNodeType({i, j, id:1}, width, cns, 'ACN')
      }else{
        cns = setNodeType({i, j, id:1}, width, cns, 'PCN')
      }

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



  export const parseDrawdown = (dd: Drawdown, cns: Array<ContactNeighborhood>) : Promise<Array<ContactNeighborhood>> => {
    for(let i = 0; i < wefts(dd); i++){
         cns = parseRow(i, dd, cns);
         cns = packRow(i, warps(dd), cns, true);
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
          return parseDrawdown(dd, cns);
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

    const getReferenceY = (ndx: CNIndex, i: number, vtxs:Array<YarnVertex>) : number => {



      let opts = vtxs.filter(el => el.ndx.i == i);
      if(opts.length > 0){
        //get the vertex on the reference i that is closest to this j. 
        let closest:{el: YarnVertex, dist:number} = opts.reduce((acc, el) => {
          let dist = Math.abs(el.ndx.j - ndx.j);
          if(dist < acc.dist) return {el, dist}
          return acc;
        }, {el: null, dist:10000});

        return closest.el.y;

      }
      return 0;


    }


   const createVertex = (ndx: CNIndex, d:Draft, vtxs: Array<YarnVertex>, cns:Array<ContactNeighborhood>, sim: SimulationVars) : YarnVertex =>{

    let width = warps(d.drawdown);
    let weft_material_id = d.rowShuttleMapping[ndx.i];
    let weft_diameter = sim.ms.getDiameter(weft_material_id);
    let warp_material_id = d.colShuttleMapping[ndx.j];
    let warp_diameter = sim.ms.getDiameter(warp_material_id);



    let stack = false;
    let y = ndx.i * weft_diameter; //set a baseline based on the row and material width
    let mvy = Math.abs(getMvY(ndx, width, cns));

    //handle any .5 values created to indicate a stack
    if(Math.floor(mvy) != mvy){
      stack = true;
      mvy = Math.floor(mvy);
    } 

    let reference_i = ndx.i - mvy -1; //slide values are always negative
    if(reference_i >= 0){

      let reference_y =  getReferenceY(ndx, reference_i, vtxs);
      if(stack) y = reference_y + weft_diameter/2;
      else y = reference_y + weft_diameter;
    }

    
    //let the layer first
    let z = getMvZ(ndx, width, cns) * sim.layer_spacing;
    //then adjust for which side of the warp it is sitting upon. 
    if(getFace(ndx, width, cns)) z += warp_diameter;
    else z -= warp_diameter;


    let x = sim.warp_spacing * ndx.j;
    if(ndx.id == 0) x -= warp_diameter;
    if(ndx.id == 1) x += warp_diameter;

    console.log("CREATED VERTEX AT ", ndx, getCN(ndx, width, cns), {ndx,x, y, z})

    return {ndx,x, y, z, weft_material_id}


  }

  /**
   * converts a topology diagram to a list of weft vertexes to draw. It only draws key interlacements to the list
   * @param draft 
   * @param topo 
   * @param layer_map 
   * @param sim 
   * @returns 
   */
  export const followTheWefts = (draft: Draft, cns: Array<ContactNeighborhood>, sim: SimulationVars) : Promise<Array<YarnVertex>>=> {

    let vtx_list: Array<YarnVertex> = [];
    let warpnum =  warps(draft.drawdown);

    for(let i = 0; i < wefts(draft.drawdown); i++){
      let direction = ( i % 2 == 0);  //true is left to right, false is 

      if(direction){
        for(let j = 0; j < warpnum; j++){
          if(getNodeType({i, j, id:0}, warpnum, cns) == 'ACN'){
            let vtx = createVertex({i, j, id:0}, draft, vtx_list, cns, sim);
            vtx_list.push(vtx);
          }

           if(getNodeType({i, j, id:1}, warpnum, cns) == 'ACN'){
            let vtx = createVertex({i, j, id:1}, draft, vtx_list, cns, sim);
            vtx_list.push(vtx);
          }
        }

      }else{
        for(let j = warpnum-1; j >= 0; j--){
          if(getNodeType({i, j, id:1}, warpnum, cns) == 'ACN'){
            let vtx = createVertex({i, j, id:1}, draft, vtx_list, cns, sim);
            vtx_list.push(vtx);
          }
           if(getNodeType({i, j, id:0}, warpnum, cns) == 'ACN'){
            let vtx = createVertex({i, j, id:0}, draft, vtx_list, cns, sim);
            vtx_list.push(vtx);
          }
        }
      }


    }
   
    return Promise.resolve(vtx_list);
  }

  /**
   * it is possible that some ACS, particularly those assocated with edges or segments that cross between two faces, will not get assigned move numbers. This function has these ACNS inherit their move factors 
   * @param d 
   * @param cns 
   */
  export const cleanACNs = (d: Drawdown, cns: Array<ContactNeighborhood>) : Promise<Array<ContactNeighborhood>> => {
    return Promise.resolve(cns);
  }

  export const calcClothHeightOffsetFactor = (diam: number, radius: number, offset: number) : number => {
    return  diam * (radius-offset)/radius; 
  }
 

 