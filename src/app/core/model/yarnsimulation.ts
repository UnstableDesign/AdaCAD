
import { drawdown } from "../operations/drawdown/drawdown";
import { MaterialsService } from "../provider/materials.service";
import { getCellValue } from "./cell";
import { Draft, Drawdown, CNFloat, CNIndex, CNType, Cell, ContactNeighborhood, SimulationVars, YarnVertex } from "./datatypes";
import { warps, wefts } from "./drafts";





  
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
    let cn = getCN(ndx, warps, cns);
    cn.mv.y = mv_y;
    return cns;
  }

  const getMvY = (ndx: CNIndex, warps: number, cns:Array<ContactNeighborhood>) : number => {
    let cn = getCN(ndx, warps, cns);
    return cn.mv.y;
  }

  const setMvZ = (ndx: CNIndex, warps: number, cns:Array<ContactNeighborhood>, mv_z: number) : Array<ContactNeighborhood> => {
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
   * searches starting at the index for begin for two nodes of type ACN, which cooresond to a float
   * @param begin 
   * @param left 
   * @param right 
   */
  export const getNextWeftFloat = (begin: CNIndex, warps: number, cns: Array<ContactNeighborhood>) : CNFloat => {

    
    let float_started = false;
    let face = false;
    let l_ndx = {i: -1, j: -1, id: 0};
    let r_ndx = {i: -1, j: -1, id: 0};


      //walk the row from float to float
      for(let j = begin.j; j < warps; j++){

        //check the left side of this node
        //if begin.id == 1 and j == 0 - don't check this
        if(begin.id == 0 || j != begin.j){
          if(getNodeType({i:begin.i, j, id:0}, warps, cns) == 'ACN'){
            if(!float_started){
              float_started = true
              face = getFace({i:begin.i, j, id: 0}, warps, cns);
              l_ndx = {i:begin.i, j, id: 0}
            }else{
              r_ndx = {i:begin.i, j, id: 0};
              return {left:l_ndx, right:r_ndx, face}
            }
          }
        }

       //check the right side of this node
        if(getNodeType({i:begin.i, j, id:1}, warps, cns) == 'ACN'){
          if(!float_started){
            float_started = true
            face = getFace({i:begin.i, j, id: 1}, warps, cns);
            l_ndx = {i:begin.i, j, id: 1}
          }else{
            r_ndx = {i:begin.i, j, id: 1};
            return {left:l_ndx, right:r_ndx, face}
          }
        }
        
      }

    return null; //no complete float found
  } 


  const extractFloat = (i: number, warps: number, face: boolean, segments: Array<number>, cns:Array<ContactNeighborhood>) : {float: CNFloat, last: number} => {

    //walk to the first ACN
    let start = null;
    let end = null;
    for(let s = 0; s < segments.length; s++){
     
      //check the left side
      if(getNodeType({i, j:segments[s], id:0}, warps, cns) == 'ACN'){
        if(start == null){
          start = {i, j:segments[s], id:0}
        }else{
          end = {i, j:segments[s], id:0};
          return {float: {left: start, right:end, face: face}, last:s}
        }
      }
      //check the right side
      if(getNodeType({i, j:segments[s], id:1}, warps, cns) == 'ACN'){
        if(start == null){
          start = {i, j:segments[s], id:0}
        }else{
          end = {i, j:segments[s], id:0};
          return {float: {left: start, right:end, face: face}, last:s}

        }
      }
      //got to the end and there was no closing this might mean we have reached the end of the row. 
      return {float: null, last:s}

    }



  }


  /**
   * get all the floats with teh same face value that share an edge with the input float that reside on the row indicated by i
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


    for(let j = float.left.j; j <= float.right.j ; j++){
      let face = getFace({i, j, id:0}, warps, cns);
      if(float.face !== null && float.face == face){
        segments.push(j)
      }
    }
    //walk left to find attached
    let edge_found = false;
    for(let j_left = segments[0]; j_left >= 0 && !edge_found; j_left--){
       let face = getFace({i, j:j_left, id:0}, warps, cns);
        if(float.face !== null && float.face == face){
          segments.unshift(j_left)
        }else{
          edge_found = true;
        }
    }

    //walk right to find attached
    edge_found = false;
    for(let j_right = segments[segments.length-1]; j_right < warps && !edge_found; j_right++){
       let face = getFace({i, j:j_right, id:0}, warps, cns);
        if(float.face !== null && float.face == face){
          segments.push(j_right);
        }else{
          edge_found;
        }
    }

    //SEGMENTS NOW CONTAINS A LIST OF ALL the Cells of the same face color, the left most and right most CNS in these cells should be the edges. This list may be empty if there was only the opposite color attached. 

    while(segments.length > 0){
      let extracted = extractFloat(i, warps, float.face, segments, cns);
      if(extracted.float !== null){
        attached.push(float)
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
      
      if(float.right.j > el.right.j && float.left.j > el.right.j)  acc.push("BUILD");
      if(float.right.j < el.right.j && float.left.j < el.right.j)  acc.push("BUILD");

      if(top_length == bottom_length) acc.push("STACK");

      if(float.left.j == el.left.j || float.right.j == el.right.j){
        if(top.length > bottom_length){
          if(float.face == false) acc.push("SLIDE-OVER")
          else acc.push("SLIDE-UNDER")
        }else{
          if(float.face == false) acc.push("SLIDE-UNDER")
          else acc.push("SLIDE-OVER")
        }
      }  

      if(float.left.j < el.left.j && float.right.i > el.right.i){
        if(float.face == false) acc.push("SLIDE-OVER");  
        else acc.push("SLIDE-UNDER");  
      }

      if(float.left.j > el.left.j && float.right.i < el.right.i){
        if(float.face == false) acc.push("SLIDE-UNDER");  
        else acc.push("SLIDE-OVER");  
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
  export const packRow = (i: number, warps: number,  cns: Array<ContactNeighborhood>) : Array<ContactNeighborhood> => {


      let float:CNFloat = getNextWeftFloat({i:i,j:0, id:0}, warps, cns)

      while(float !== null ){
        //get all of the attached floats on the next row down 
        let attached: Array<CNFloat> = getAttachedFloats(i-1, warps, float, cns);
        
        //determine what kind of relationship the 
        let reltn = getWarpwiseRelationship(float, attached);

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

        float = getNextWeftFloat({i:i,j:float.right.j, id:float.right.id}, warps, cns)      
        }        
      
        return cns;



  }

  /**
   * walks through a row of the draft and adds the heddle value and sets active nodes on interlacements
   * @param i the row id
   * @param dd the drawdown
   * @param cns the list of contact neighborhoods
   * @returns 
   */
  export const parseRow = (i:number, dd: Drawdown, cns: Array<ContactNeighborhood>) : Array<ContactNeighborhood> => {
    let width = warps(dd);
      console.log("PARSING I", i)

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
      if(j > 0 && getCellValue(dd[i][j]) != getCellValue(dd[i][j-1])){
        cns = setNodeType({i, j, id:0}, width, cns, 'ACN')
      }else{
        cns = setNodeType({i, j, id:0}, width, cns, 'PCN')
      }

      //check right
      if(j < warps(dd)-1 && getCellValue(dd[i][j]) != getCellValue(dd[i][j+1])){
        cns = setNodeType({i, j, id:1}, width, cns, 'ACN')
      }else{
        cns = setNodeType({i, j, id:1}, width, cns, 'PCN')
      }

      //check top
      if(i < wefts(dd)-1 && getCellValue(dd[i][j]) != getCellValue(dd[i+1][j])){
        cns = setNodeType({i, j, id:2}, width, cns, 'ACN')
      }else{
        cns = setNodeType({i, j, id:2}, width, cns, 'PCN')
      }

      //check bottom 
      if(i > 0 && getCellValue(dd[i][j]) != getCellValue(dd[i-1][j])){
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
         cns = packRow(i, warps(dd), cns);
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

      console.log("OPTS",opts, closest)

        return closest.el.y;

      }
      return 0;


    }


   const createVertex = (ndx: CNIndex, warps:number, vtxs: Array<YarnVertex>, cns:Array<ContactNeighborhood>, sim: SimulationVars) : YarnVertex =>{


    let stack = false;
    let y = ndx.i * sim.ms.getDiameter(0); //set a baseline based on the row and material width
    let mvy = Math.abs(getMvY(ndx, warps, cns));

    //handle any .5 values created to indicate a stack
    if(Math.floor(mvy) != mvy){
      stack = true;
      mvy = Math.ceil(mvy);
    } 

    let reference_i = ndx.i - mvy; //slide values are always negative
    console.log("**** REFERENCE I **** ", reference_i)
    if(reference_i > 0){

      let reference_y = getReferenceY(ndx, reference_i, vtxs);
      console.log("REFERENCE Y IS ", reference_y)
      if(stack) y = reference_y + sim.ms.getDiameter(0)/2;
      else y = reference_y + sim.ms.getDiameter(0);
    }

    
    //let the layer first
    let z = getMvZ(ndx, warps, cns) * sim.layer_spacing;
    //then adjust for which side of the warp it is sitting upon. 
    if(getFace(ndx, warps, cns)) z += sim.ms.getDiameter(0);
    else z -= sim.ms.getDiameter(0);


    let x = sim.warp_spacing * ndx.j;
    if(ndx.id == 0) x -= sim.ms.getDiameter(0);
    if(ndx.id == 1) x += sim.ms.getDiameter(0);

    return {ndx,x, y, z}


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
            let vtx = createVertex({i, j, id:0}, warpnum, vtx_list, cns, sim);
            vtx_list.push(vtx);
          }
           if(getNodeType({i, j, id:1}, warpnum, cns) == 'ACN'){
            let vtx = createVertex({i, j, id:0}, warpnum, vtx_list, cns, sim);
            vtx_list.push(vtx);
          }
        }

      }else{
        for(let j = warpnum-1; j >= 0; j--){
          if(getNodeType({i, j, id:1}, warpnum, cns) == 'ACN'){
            let vtx = createVertex({i, j, id:0}, warpnum, vtx_list, cns, sim);
            vtx_list.push(vtx);
          }
           if(getNodeType({i, j, id:0}, warpnum, cns) == 'ACN'){
            let vtx = createVertex({i, j, id:0}, warpnum, vtx_list, cns, sim);
            vtx_list.push(vtx);
          }
        }
      }


    }
   
    return Promise.resolve(vtx_list);
  }

  export const calcClothHeightOffsetFactor = (diam: number, radius: number, offset: number) : number => {
    return  diam * (radius-offset)/radius; 
  }
 

 