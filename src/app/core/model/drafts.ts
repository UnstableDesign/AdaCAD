import { drawdown } from "../operations/drawdown/drawdown";
import { createCell, getCellValue, setCellValue } from "./cell";
import { Draft, Drawdown, YarnFloat, Cell, CompressedDraft, Material } from "./datatypes";
import { defaults } from "./defaults";
import utilInstance from "./util";

/**
 * generates an empty draft with a unique id
 * @returns 
 */
 export const initDraft = () : Draft => {
  const d: Draft = {
    id: utilInstance.generateId(8),
    gen_name: defaults.draft_name,
    ud_name: "",
    drawdown: [],
    rowShuttleMapping: [],
    rowSystemMapping: [],
    colShuttleMapping: [],
    colSystemMapping: []

  };
  return d;
}


/**
 * generates a deep copy of the input draft
 * @returns 
 */
 export const copyDraft = (d: Draft) : Draft => {

  const copy_draft = initDraftWithParams({
    id: d.id,
    ud_name: d.ud_name,
    gen_name: d.gen_name,
    warps: warps(d.drawdown),
    wefts: wefts(d.drawdown),
    drawdown: d.drawdown,
    rowShuttleMapping: d.rowShuttleMapping,
    rowSystemMapping: d.rowSystemMapping,
    colShuttleMapping: d.colShuttleMapping,
    colSystemMapping: d.colSystemMapping
  });
  return copy_draft;
}

/**
 * creates a draft based on the params provided.
 * @param params allowable params are id, weft, warp, drawdown, pattern, ud_name, gen_name, rowShuttleMapping, rowSystemMapping, colShuttleMapping, colSystemMapping.
 * @returns 
 */
 export const initDraftWithParams = (params:any) : Draft => {
  const d: Draft = {
    id: utilInstance.generateId(8),
    gen_name: defaults.draft_name,
    ud_name: "",
    drawdown: [],
    rowShuttleMapping: [],
    rowSystemMapping: [],
    colShuttleMapping: [],
    colSystemMapping: []

  };


  if(params.id !== undefined ) d.id = params.id;
  if(params.gen_name !== undefined ) d.gen_name = params.gen_name;
  if(params.ud_name !== undefined ) d.ud_name = params.ud_name;
 
  //handle common error
  if(params.pattern !== undefined) params.drawdown = params.pattern;
  //start with empty draft 

  if(params.wefts === undefined ){
    if(params.drawdown == undefined) params.wefts = 1;
    else params.wefts = wefts(params.drawdown);
  }

  if(params.warps === undefined){
    if(params.drawdown == undefined)  params.warps = 1;
    else params.warps = warps(params.drawdown);
  } 
 
  for(let i = 0; i < params.wefts; i++){
    d.drawdown.push([]);
    d.rowSystemMapping.push(defaults.row_system);
    d.rowShuttleMapping.push(defaults.row_shuttle);
    for(let j = 0; j < params.warps; j++){
      d.drawdown[i][j] =  createCell(false);
    }
  }

  for(let j = 0; j < params.warps; j++){
    d.colSystemMapping.push(defaults.col_system);
    d.colShuttleMapping.push(defaults.col_shuttle);
  }

  if(params.drawdown !== undefined){
    d.drawdown.forEach((row, i) => {
      row.forEach((cell, j) => {
      cell = setCellValue(cell, getCellValue(params.drawdown[i%wefts(params.drawdown)][j%warps(params.drawdown)]));


      })
    })
  }

  if(params.rowShuttleMapping !== undefined){
    for(let i = 0; i < wefts(d.drawdown); i++){
      d.rowShuttleMapping[i] = params.rowShuttleMapping[i%params.rowShuttleMapping.length];
    }
  }

  if(params.rowSystemMapping !== undefined){
    for(let i = 0; i < wefts(d.drawdown); i++){
      d.rowSystemMapping[i] = params.rowSystemMapping[i%params.rowSystemMapping.length];
    }
  }

  if(params.colShuttleMapping !== undefined){
    for(let i = 0; i < warps(d.drawdown); i++){
      d.colShuttleMapping[i] = params.colShuttleMapping[i%params.colShuttleMapping.length];
    }
  }

  if(params.colSystemMapping !== undefined){
    for(let i = 0; i < warps(d.drawdown); i++){
      d.colSystemMapping[i] = params.colSystemMapping[i%params.colSystemMapping.length];
    }
  }


  return d;
}

/**
 * creates a draft using only information from a drawdown (no system or column information)
 * @returns 
 */
export const initDraftFromDrawdown = (drawdown:Drawdown) : Draft => {
  const d: Draft = {
    id: utilInstance.generateId(8),
    gen_name: defaults.draft_name,
    ud_name: "",
    drawdown: [],
    rowShuttleMapping: [],
    rowSystemMapping: [],
    colShuttleMapping: [],
    colSystemMapping: []
  };

 
    drawdown.forEach((row, i) => {
      d.drawdown.push([]);
      row.forEach((cell, j) => {
      d.drawdown[i][j] = setCellValue(cell, getCellValue(drawdown[i][j]));
      })
    })

    for(let i = 0; i < wefts(d.drawdown); i++){
      d.rowShuttleMapping[i] = defaults.row_shuttle;
      d.rowSystemMapping[i] = defaults.row_system;
    }

    for(let j = 0; j < warps(d.drawdown); j++){
      d.colShuttleMapping[j] = defaults.col_shuttle;
      d.colSystemMapping[j] = defaults.col_system;
    }

    
  

  return d;
}


/**
 * generates a new draft from the paramters specified.
 * @param pattern 
 * @param gen_name 
 * @param ud_name 
 * @param rowShuttleMapping
 * @param rowSystemMapping
 * @param colShuttleMapping
 * @param colSystemMapping
 * @returns 
 */
export const createDraft = (
  pattern: Drawdown,
  gen_name: string,
  ud_name: string,
  rowShuttleMapping: Array<any>,
  rowSystemMapping: Array<any>,
  colShuttleMapping: Array<any>,
  colSystemMapping: Array<any>
  ) : Draft => {

    const d: Draft = {
      id: utilInstance.generateId(8),
      drawdown: pattern.slice(),
      gen_name: gen_name,
      ud_name: ud_name, 
      rowShuttleMapping: rowShuttleMapping.slice(),
      rowSystemMapping: rowSystemMapping.slice(),
      colShuttleMapping: colShuttleMapping.slice(),
      colSystemMapping: colSystemMapping.slice(),
    }

    return d;

  }

  


  /**
   * sets up the draft from the information saved in a .ada file
   * @param data 
   */
  export const loadDraftFromFile = (data: any, flips: any, version: string) : Promise<{draft: Draft, id: number}> => {

    const draft: Draft = initDraft();
    if(data.id !== undefined) draft.id = data.id;
    draft.gen_name = (data.gen_name === undefined) ? 'draft' : data.gen_name;
    draft.ud_name = (data.ud_name === undefined) ? '' : data.ud_name;
    
    if(version === undefined || version === null || !utilInstance.sameOrNewerVersion(version, '3.4.5')){
      draft.drawdown = parseSavedDrawdown(data.pattern);
    }else{
      if(data.compressed_drawdown === undefined){
      draft.drawdown = parseSavedDrawdown(data.drawdown);
      }else{
        draft.drawdown = unpackDrawdownFromArray(data.compressed_drawdown, data.warps, data.wefts)
      }
    }

    draft.rowShuttleMapping = (data.rowShuttleMapping === undefined) ? [] : data.rowShuttleMapping;
    draft.rowSystemMapping = (data.rowSystemMapping === undefined) ? [] : data.rowSystemMapping;
    draft.colShuttleMapping = (data.colShuttleMapping === undefined) ? [] : data.colShuttleMapping;;
    draft.colSystemMapping= (data.colSystemMapping === undefined) ? [] : data.colSystemMapping;;

    return Promise.resolve({draft: draft, id: draft.id}); 
    
  }




  const parseSavedDrawdown = (dd: Array<Array<Cell>>) : Drawdown => {

    const drawdown:Drawdown = [];
    if(dd === undefined) return [];

    for(var i = 0; i < wefts(dd); i++) {
        drawdown.push([]);
        for (var j = 0; j < warps(dd); j++){
          drawdown[i][j] = dd[i][j];
        }
    }

    return drawdown;
  }


  /**
   * calcualte the number of wefts (rows) in a pattern
   * @param d a drawdown or any 2D array
   * @returns the number of rows of 0 if undefined
   */
  export const wefts = (d: Drawdown | Array<Array<any>>) :  number => {
    if(d === null || d == undefined) return 0;
    return d.length;
  }


  /**
   * calcualte the number of warps (cols) in a pattern
   * @param d a drawdown or any 2D array
   * @returns the number of cols of 0 if undefined
   */
  export const warps = (d: Drawdown | Array<Array<any>>) :  number => {
    if(d === null || d == undefined) return 0;
    if(d[0] === undefined) return 0;
    return d[0].length;
  }

  /**
   * check if the giver interlacement within the size of the draft
   * @param i the selected weft
   * @param j the selected warp
   * @returns true/false
   */
  export const hasCell = (d: Drawdown, i:number, j:number) : boolean =>{
    if(i < 0 || i >= wefts(d)) return false;
    if(j < 0 || j >= warps(d)) return false;
    return true;
  }

  /**
   * checks if the cells in the provided drawdown is up
   * @param d the drawdown
   * @param i weft
   * @param j warp
   * @returns true if set and up, false if set and down or unset
   */
  export const isUp = (d: Drawdown, i:number, j:number) : boolean =>{
    //console.log("is up", i, j, wefts(d), warps(d), d[i][j]);
    if ( i > -1 && i < wefts(d) && j > -1 && j < warps(d)) {
      return d[i][j].is_set && d[i][j].is_up;
    } else {
      return false;
    }
  }

  /**
   * checks if the cells in the provided drawdown is set or unset
   * @param d the drawdown
   * @param i weft
   * @param j warp
   * @returns true if set and up or down, false if unset
   */  
  export const isSet = (d: Drawdown, i:number, j:number) : boolean => {
    if ( i > -1 && i < wefts(d) && j > -1 && j < warps(d)) {
      return d[i][j].is_set;
    } else {
      return false;
    }
  }


  /**
   * sets the heddle at the specified location to the value provided
   * @param d drawdown
   * @param i weft
   * @param j warp
   * @param bool the value (true for up, false for down, null for unset)
   * @returns 
   */
  export const setHeddle = (d:Drawdown, i:number, j:number, bool:boolean) : Drawdown => {
      d[i][j] = setCellValue( d[i][j], bool);
      return d;
  }

  /**
   * get the value of the heddle at a given location
   * @param d the drawdown
   * @param i the weft row
   * @param j the warp col
   * @returns the heddle value (true, false or null for unset)
   */
  export const getHeddle = (d: Drawdown, i: number, j: number) : boolean => {
    if(i > wefts(d) || j > warps(d)) return null;
    return getCellValue(d[i][j]);
  }


  /**
   * pasts a second drawdown representing a pattern at the specified location and size
   * @param drawdown 
   * @param fill_pattern 
   * @param start_i 
   * @param start_j 
   * @param width 
   * @param height 
   * @returns 
   */
   export const pasteIntoDrawdown = (
    drawdown: Drawdown, 
    fill_pattern: Drawdown,
    start_i: number,
    start_j: number,
    width: number,
    height: number 

  ) :  Drawdown =>  {


    let rows = wefts(fill_pattern);
    let cols = warps(fill_pattern);


    //cycle through each visible row/column of the selection
    for (var i = 0; i < height; i++ ) {
      for (var j = 0; j < width; j++ ) {
        try{
          drawdown[start_i+i][start_j+j] = createCell(getCellValue(fill_pattern[i % rows][j % cols]));
        }catch(e){
          console.error(e);
        }
      }
    }

    return drawdown;

   
  }

  export const getDraftAsImage = (draft: Draft, pix_per_cell: number, use_color: boolean, mats: Array<Material>) : ImageData => {
    pix_per_cell = Math.floor(pix_per_cell);

    let array_vals:Array<number> = [];
    for(let i = 0; i < wefts(draft.drawdown) * pix_per_cell; i++){
      for(let j = 0; j < warps(draft.drawdown) * pix_per_cell; j++){
        let adj_i = Math.floor(i / pix_per_cell);
        let adj_j = Math.floor(j / pix_per_cell);


        let cell_val = getCellValue(draft.drawdown[adj_i][adj_j]);
       
        let warp_float = false;
        if(adj_i > 0 && cell_val === getCellValue(draft.drawdown[adj_i-1][adj_j])){
          warp_float = true;
        }

        let weft_float = false;
        if(adj_j > 0 && cell_val === getCellValue(draft.drawdown[adj_i][adj_j-1])){
          weft_float = true;
        }
        

        let is_weftwise_edge = 
        (i % pix_per_cell == 0) || 
        (i ==  wefts(draft.drawdown) * pix_per_cell -1);

        let is_warpwise_edge = 
        (j % pix_per_cell == 0) ||
        (j ==  warps(draft.drawdown) * pix_per_cell -1);

        
        if((is_weftwise_edge || is_warpwise_edge) && pix_per_cell > 4 && !use_color){

            array_vals.push(150);
            array_vals.push(150);
            array_vals.push(150);
            array_vals.push(255);
          

        }else if(cell_val){
         
          let mat: Material = mats.find(el => el.id == draft.colShuttleMapping[adj_j]);
          if(mat !== undefined && use_color){
            
            if(pix_per_cell > 4 && (is_warpwise_edge || (is_weftwise_edge && !warp_float))){
              array_vals.push(150);
              array_vals.push(150);
              array_vals.push(150);
              array_vals.push(255);
            
            }else{
              array_vals.push(mat.rgb.r);
              array_vals.push(mat.rgb.g);
              array_vals.push(mat.rgb.b);
              array_vals.push(255);
            }

          }else{

            array_vals.push(0);
            array_vals.push(0);
            array_vals.push(0);
            array_vals.push(255);

          }

        }else{
          //weft over warp or weft unset
          let mat: Material = mats.find(el => el.id == draft.rowShuttleMapping[adj_i]);
          if(mat !== undefined && use_color){
             
            if(pix_per_cell > 4 && (is_weftwise_edge || (is_warpwise_edge && !weft_float))){
              array_vals.push(150);
              array_vals.push(150);
              array_vals.push(150);
              array_vals.push(255);
            
            }else{
              array_vals.push(mat.rgb.r);
              array_vals.push(mat.rgb.g);
              array_vals.push(mat.rgb.b);
              array_vals.push(255);
            }
          }else{
            array_vals.push(255);
            array_vals.push(255);
            array_vals.push(255);
            array_vals.push(255);
          }
        }
      } 
    }

    const arr = new Uint8ClampedArray(array_vals);
    let image = new ImageData(arr, warps(draft.drawdown)*pix_per_cell);
    return image;


  }



  /**
   * given a draft and a region, this function returns a new draft that only represents a segment of the original
   * @param draft 
   * @param top 
   * @param left 
   * @param width 
   * @param height 
   * @returns 
   */
  export const cropDraft = (draft: Draft, top: number, left: number, width: number, height: number) : Draft => {

    const cropped = copyDraft(draft);
    cropped.drawdown = createBlankDrawdown(height, width);
    for(let i = top; i < top + height && i < wefts(draft.drawdown); i++){
      cropped.rowShuttleMapping[i-top] = draft.rowShuttleMapping[i]; 
      cropped.rowSystemMapping[i-top] = draft.rowSystemMapping[i]; 
      for(let j = left; j < left + width && j < warps(draft.drawdown); j++){
        cropped.drawdown[i - top][j - left] = createCell(getCellValue(draft.drawdown[i][j]));
      }     
    }

    for(let j = left; j < left + width && j < warps(draft.drawdown); j++){
      cropped.rowShuttleMapping[j-left] = draft.rowShuttleMapping[j]; 
      cropped.rowSystemMapping[j-left] = draft.rowSystemMapping[j]; 
    }    

    return cropped;
  }

  export const compressDraft = (draft: Draft) : CompressedDraft => {

    let comp: CompressedDraft = {
      id: draft.id, 
      ud_name: draft.ud_name, 
      gen_name: draft.gen_name,
      warps: warps(draft.drawdown),
      wefts: wefts(draft.drawdown),
      compressed_drawdown: exportDrawdownToArray(draft.drawdown),
      rowSystemMapping: draft.rowSystemMapping.slice(),
      rowShuttleMapping: draft.rowShuttleMapping.slice(),
      colSystemMapping: draft.colSystemMapping.slice(),
      colShuttleMapping: draft.colShuttleMapping.slice(),
    }
    return comp;

  }

  export const exportDrawdownToArray = (drawdown: Drawdown) : Uint8ClampedArray => {
    let arr = [];
    for(let i = 0; i < wefts(drawdown); i++){
      for(let j = 0; j < warps(drawdown); j++){
         let val = getCellValue(drawdown[i][j]);
         switch (val){
          case null:
            arr.push(2);
            break;
          case true: 
            arr.push(1);
            break;
          case false:
            arr.push(0);
            break;
         }
      }
    }
    return new Uint8ClampedArray(arr);

  }

  export const unpackDrawdownFromArray = (compressed: Uint8ClampedArray, warps: number, wefts: number) : Drawdown => {
    let dd:Drawdown = createBlankDrawdown(wefts, warps);

    for(let n = 0; n < compressed.length; n++){
      let i = Math.floor(n / warps);
      let j = n % warps;
      let cell;
      switch(compressed[n]){
        case 0:
          cell = createCell(false);
          break;

        case 1:
          cell = createCell(true);
          break;

        case 2:
          cell = createCell(null);
          break;
      }
    
      dd[i][j] = cell;
    }
    return dd;
  }


  /**
   * creates an empty drawdown of a given size
   * @param wefts 
   * @param warps 
   * @returns a Drawdown object
   */
  export const createBlankDrawdown = (wefts: number, warps: number) : Drawdown => {
    const drawdown: Drawdown = [];
    for(let i = 0; i < wefts; i++){
      drawdown.push([]);
      for(let j = 0; j < warps; j++){
        drawdown[i].push(createCell(false));
      }
    } 
    return drawdown;
  }


  /**
   * applys a pattern only to regions where the input draft has true heddles
   * @param mask the pattern to use as a mask
   * @param pattern the pattern to fill with
   * @returns the result
   */
  export const applyMask = (mask: Drawdown, pattern: Drawdown) : Drawdown =>  {
    
    const res = createBlankDrawdown(wefts(mask), warps(mask));
    for(let i = 0; i < wefts(mask); i++){
      for(let j = 0; j < warps(mask); j++){
        if(getCellValue(mask[i][j])){
          const set_to = getCellValue(pattern[i%wefts(pattern)][j%warps(pattern)]);
          res[i][j] = createCell(set_to);
        }
        
      }
    } 
    return res;
  }

  /**
   * inverts the drawdown (e.g. sets true cells to false and vice versa)
   * @param drawdown the drawdown to invert
   * @returns the inverted drawdown 
   */
  export const invertDrawdown = (drawdown: Drawdown) : Drawdown =>  {
    
    const inverted = drawdown.slice();
    for(let i = 0; i < wefts(drawdown); i++){
      for(let j = 0; j < warps(drawdown); j++){
        if(drawdown[i][j].is_set){
          const set_to = !getCellValue(drawdown[i][j]);
          inverted[i][j] = createCell(set_to);
        }
        
      }
    } 
    return inverted;
  }

  /**
   * shifts the drawdown up or left by the amount specified.
   * @param drawdown the drawdown to shift
   * @param up shift up = true, left = false
   * @param inc the amount to shift by
   * @returns the shfited drawdown
   */
     export const shiftDrawdown = (drawdown: Drawdown, up: boolean, inc: number) : Drawdown =>  {

      const shifted = createBlankDrawdown(wefts(drawdown), warps(drawdown));
      for(let i = 0; i < wefts(drawdown); i++){
        for(let j = 0; j < warps(drawdown); j++){
            let set_to = false;
            if(up)  set_to = getCellValue(drawdown[(i+inc)%wefts(drawdown)][j]);
            else set_to = getCellValue(drawdown[i][(j+inc)%warps(drawdown)]);
            shifted[i][j] = createCell(set_to);
        }
      } 
      return shifted;
    }


   /**
   * flips the drawdown horizontally or vertically. This is different than flip draft because it only 
   * flippes teh drawdown, not any other associated information
   * @param drawdown the drawdown to shift
   * @param horiz true for horizontal flip, false for vertical
   * @returns the flipped drawdown
   */
    export const flipDrawdown = (drawdown: Drawdown, horiz: boolean) : Drawdown =>  {

    const flip = createBlankDrawdown(wefts(drawdown), warps(drawdown));
    for(let i = 0; i < wefts(drawdown); i++){
      for(let j = 0; j < warps(drawdown); j++){
          let set_to = false;
          if(horiz)  set_to = getCellValue(drawdown[i][warps(drawdown)-1-j]);
          else set_to = getCellValue(drawdown[wefts(drawdown)-1 - i][j]);
          flip[i][j] = createCell(set_to);
      }
    } 
    return flip;
  }


  /**
   * generates a system or shuttle mapping from an input pattern based on the input draft
   * @param drawdown the drawdown for which we are creating this mapping
   * @param pattern the repeating pattern to use when creating the mapping
   * @param type specify if this is a 'row'/weft or 'col'/warp mapping
   * @returns the mapping to use
   */
  export const generateMappingFromPattern = (drawdown: Drawdown, pattern: Array<number>, type: string, origin: number) : Array<any> => {

    const mapping: Array<number> = [];
    if(type == 'row'){

        if(origin == 1 || origin == 2) pattern = pattern.slice().reverse();

        for(let i = 0; i < wefts(drawdown); i++){
          mapping.push(pattern[i%pattern.length]);
        }

    }else{

        if(origin == 0 || origin == 1) pattern = pattern.slice().reverse();

        for(let j = 0; j < warps(drawdown); j++){
          mapping.push(pattern[j%pattern.length]);
        }
      
    }

    return mapping.slice();
  }


  /**
   * take the system and shuttle and 
   * @param to 
   * @param from 
   */
  export const updateWeftSystemsAndShuttles = (to: Draft, from: Draft) : Draft => {

    if(from == null || from == undefined) from = initDraftWithParams({wefts: 1, warps: 1, drawdown: [[createCell(false)]]});

    to.rowShuttleMapping =  generateMappingFromPattern(to.drawdown, from.rowShuttleMapping,'row', 3);

    to.rowSystemMapping =  generateMappingFromPattern(to.drawdown, from.rowSystemMapping,'row', 3);

    return to;
  }

  
  export const updateWarpSystemsAndShuttles = (to: Draft, from: Draft) : Draft => {

    if(from == null || from == undefined) from = initDraftWithParams({wefts: 1, warps: 1, drawdown: [[createCell(false)]]});

    to.colShuttleMapping =  generateMappingFromPattern(to.drawdown, from.colShuttleMapping,'col', 3);

    to.colSystemMapping =  generateMappingFromPattern(to.drawdown, from.colSystemMapping,'col', 3);

    return to;
  }


  



  /**
   * I DON"T THINK THIS FUNCTION WORKS OR IS BEING USED
   * removes any boundary rows from the input draft that are unset
   * @return returns the resulting draft
   */
  // export const trimUnsetRows = (d: Drawdown) : Drawdown => {

  //   const rowmap: Array<number> = [];
  //   const to_delete: Array<number> = [];

  //   //make a list of rows that contains the number of set cells
  //   d.forEach(row => {
  //     const active_cells: Array<Cell> = row.filter(cell => (cell.isSet()));
  //     rowmap.push(active_cells.length);
  //   });

  //   let delete_top: number = 0;
  //   let top_hasvalue: boolean = false;
    
  //   //scan from top and bottom to see how many rows we shoudl delete
  //   for(let ndx = 0; ndx < rowmap.length; ndx++){
  //       if(rowmap[ndx] == 0 && !top_hasvalue){
  //         delete_top++;
  //       }else{
  //         top_hasvalue = true;
  //       }
  //   }

  //   if(delete_top == rowmap.length) return []; //this is empty now
   
  //   let delete_bottom: number = 0;
  //   let bottom_hasvalue:boolean = false;
  //   for(let ndx = rowmap.length -1; ndx >= 0; ndx--){
  //     if(rowmap[ndx] == 0 && !bottom_hasvalue){
  //       delete_bottom++;
  //     }else{
  //       bottom_hasvalue = true;
  //     }
  //   }

  //   return d;
  // }

  /**
   * insert a row into the drawdown at a given location
   * @param d the drawdown
   * @param i the weft location 
   * @param row the row to insert, or null if row should be blank.
   * @returns 
   */
  export const insertDrawdownRow = (d: Drawdown, i: number, row: Array<Cell>) : Drawdown => {
    i = i+1;

    if(row === null){
      row = [];
      for (var j = 0; j < warps(d); j++) {
        row.push(createCell(false));
      }
    }
    if(row.length !== warps(d)) console.error("inserting row of incorrect length into drawdown");
   
    try{
      d.splice(i,0,row);
    }catch(e){
      console.error(e);
    }
    return d;
  }

  
  /**
   * inserts a new value into the row system/shuttle map
   * @param m the map to modify
   * @param i the place at which to add the row
   * @param val the value to insert
   * @returns 
   */
  export const insertMappingRow = (m: Array<number>, i: number, val: number) : Array<number> => {
    i = i+1;
    try{
      m.splice(i,0,val);
    }catch(e){
      console.error(e);
    }
    return m;
  }


  /**
   * deletes a row from the drawdown at the specified weft location
   * @param d drawdown
   * @param i weft location
   * @returns the modified drawdown
   */
  export const deleteDrawdownRow = (d:Drawdown, i: number) : Drawdown => {
      try{
        d.splice(i, 1);
      }catch(e){
        console.error(e);
      }
      return d;
  }


  /**
   * deletes a row from a row system/shuttle mapping at the specified weft location
   * @param m the mapping
   * @param i the weft location
   * @returns the modified 
   */
  export const deleteMappingRow = (m:Array<number>, i: number) : Array<number> => {
    try{
      m.splice(i, 1);
    }catch(e){
      console.error(e);
    }
    return m;
  }


  /**
   * inserts a column into the drawdown
   * @param d the drawdown
   * @param j the warp location at which to insert
   * @param col - the column to insert or null if it should be a blank column
   * @returns the modified drawdown
   */
  export const insertDrawdownCol = (d: Drawdown, j: number, col: Array<Cell>) : Drawdown => {
    
    const w = warps(d);

    if(j === null) j =0;

    if(col == null){
      col = [];
      for(let i = 0; i < wefts(d); i++){
        col.push(createCell(false));
      }
    }
    for (var ndx = 0; ndx < wefts(d); ndx++) {
      d[ndx].splice(j, 0, createCell(getCellValue(col[ndx])));
    }
    return d;
  }




  /**
   * inserts a value into the col system/shuttle mapping at a particular location
   * @param m the map to modify
   * @param j the location at which to add
   * @param col the value to add
   * @returns 
   */
  export const insertMappingCol = (m: Array<number>, j: number, col: number) : Array<number> => {
    m.splice(j,0, col);
    return m;
  }
  
  


/**
 * delete a column from the drawdown at a given location
 * @param d the drawdown
 * @param j the warp location
 * @returns the modified drawdown
 */
  export const deleteDrawdownCol = (d: Drawdown, j: number) : Drawdown => {

    for(var ndx = 0; ndx < wefts(d); ndx++){
      d[ndx].splice(j, 1);
    }
    return d;

  }

  /**
 * deletes a value into the col system/shuttle mapping at a particular location
 * @param m the mapping to modify
 * @param j the warp location
 * @returns the modified mapping
 */
  export const deleteMappingCol = (m: Array<number>, j: number) : Array<number> => {
    m.splice(j, 1);
    return m;
  }

  export const getCol = (d: Drawdown, j: number) : Array<Cell> => {

    const col = d.reduce((acc, val, i) =>{
      const cell = createCell(getCellValue(d[i][j]));
      acc.push(cell);
      return acc;
    }, []);

    return col;

  }


  /**
   * gets the name of the draft. If it has a user defined name, it returns that, otherwise, it returns the generated name
   * @param draft 
   * @returns 
   */
 export const getDraftName = (draft: Draft) : string => {
  if(draft === null || draft === undefined) return ""; 
  if(draft.ud_name == undefined){
    if(draft.gen_name == undefined) return '';
    else return draft.gen_name;
  }  

  if(draft.gen_name == undefined){
    if(draft.ud_name == undefined) return '';
    else return draft.ud_name;
  }

  return (draft.ud_name === "") ?  draft.gen_name : draft.ud_name; 
  }



// /**
// * takes a draft as input, and flips the order of the rows
// * @param draft 
// */ 
export const flipDraft = (d: Draft, horiz: boolean, vert: boolean) : Promise<Draft> => {
  const draft = initDraftWithParams(
    {id: d.id, 
    wefts: wefts(d.drawdown),
    warps: warps(d.drawdown),
    gen_name: d.gen_name,
    ud_name: d.ud_name,
    colShuttleMapping: d.colShuttleMapping,
    colSystemMapping: d.colSystemMapping});
    draft.drawdown = createBlankDrawdown(wefts(d.drawdown), warps(d.drawdown));

  for(let i = 0; i < wefts(d.drawdown); i++){
    let flipped_i = i;
    if(vert) flipped_i = wefts(d.drawdown) -1 -i;
    for(let j = 0; j < warps(d.drawdown); j++){
      let flipped_j = j;
      if(horiz) flipped_j = warps(d.drawdown) -1 -j;
      draft.drawdown[i][j] = createCell(getCellValue(d.drawdown[flipped_i][flipped_j])); 
    }

    draft.rowShuttleMapping[i] = d.rowShuttleMapping[flipped_i];
    draft.rowSystemMapping[i] = d.rowSystemMapping[flipped_i];
   }

   if(horiz){
    
    for(let j = 0; j < warps(d.drawdown); j++){
      let flipped_j = warps(d.drawdown) -1 -j;
      draft.colShuttleMapping[j] = d.colShuttleMapping[flipped_j];
      draft.colSystemMapping[j] = d.colSystemMapping[flipped_j];
    }
  }


  return Promise.resolve(d);
}




/**
 * this function generates a list of floats as well as a map of each cell in the draft to its associated float. This is used to compute layers within the draft 
 * @param drawdown 
 * @returns 
 */
// export const createWeftFloatMap = (drawdown: Drawdown) : {float_list: Array<{id: number, float: YarnFloat}>, float_map: Array<Array<number>>} => {

//   const float_list: Array<{id: number, float: YarnFloat}> = [] ;
//   const float_map:Array<Array<number>> = [];

//   drawdown.forEach((row, i) => {

//     let j = 0;
//     while(j < warps(drawdown)){
//       let f:YarnFloat = getFloatLength(row, j, getCellValue(row[j]));
//       let f_id = float_list.length;
//       float_list.push({id: f_id, float: f })
//       for(let x = j; x < j+f.total_length; x++){
//         float_map[i][x] = f_id;
//       }
//       j += f.total_length;
//     }

//   });

//   return {float_list, float_map};
// }



