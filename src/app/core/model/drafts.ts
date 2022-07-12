import { D } from "@angular/cdk/keycodes";
import { number } from "mathjs";
import { Cell } from "./cell";
import { Draft, Drawdown } from "./datatypes";
import utilInstance from "./util";

/**
 * generates an empty draft with a unique id
 * @returns 
 */
 export const initDraft = () : Draft => {
  const d: Draft = {
    id: utilInstance.generateId(8),
    gen_name: 'draft',
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
 * creates a draft based on the params provided.
 * @param params allowable params are id, weft, warp, drawdown, pattern, ud_name, gen_name, rowShuttleMapping, rowSystemMapping, colShuttleMapping, colSystemMapping.
 * @returns 
 */
 export const initDraftWithParams = (params:any) : Draft => {
  const d: Draft = {
    id: utilInstance.generateId(8),
    gen_name: 'draft',
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
    d.rowSystemMapping.push(0);
    d.rowShuttleMapping.push(1);
    for(let j = 0; j < params.warps; j++){
      d.drawdown[i][j] = new Cell(false);
    }
  }

  for(let j = 0; j < params.warps; j++){
    d.colSystemMapping.push(0);
    d.colShuttleMapping.push(0);
  }

  if(params.drawdown !== undefined){
    d.drawdown.forEach((row, i) => {
      row.forEach((cell, j) => {
       cell.setHeddle(params.drawdown[i%wefts(params.drawdown)][j%warps(params.drawdown)].getHeddle());
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
  export const loadDraftFromFile = (data: any, version: string) : Draft => {

    const draft: Draft = initDraft();
    if(data.id !== undefined) draft.id = data.id;
    draft.gen_name = (data.gen_name === undefined) ? 'draft' : data.gen_name;
    draft.ud_name = (data.ud_name === undefined) ? '' : data.ud_name;
    
    if(version === undefined || version === null || !utilInstance.sameOrNewerVersion(version, '3.4.5')){
      draft.drawdown = parseSavedPattern(data.pattern);
    }else{
      draft.drawdown = parseSavedPattern(data.drawdown);
    }

    draft.rowShuttleMapping = (data.rowShuttleMapping === undefined) ? [] : data.rowShuttleMapping;
    draft.rowSystemMapping = (data.rowSystemMapping === undefined) ? [] : data.rowSystemMapping;
    draft.colShuttleMapping = (data.colShuttleMapping === undefined) ? [] : data.colShuttleMapping;;
    draft.colSystemMapping= (data.colSystemMapping === undefined) ? [] : data.colSystemMapping;;


    return draft;
    
  }



  /**
   * converts the saved structure of a pattern into the format used in memory
   * @param pattern the saved pattern
   * @returns the pattern in the form of a drawdown.
   */
  const parseSavedPattern = (pattern: Array<Array<boolean>>) : Drawdown => {
    const drawdown:Drawdown = [];
    if(pattern === undefined) return [];

    for(var i = 0; i < wefts(pattern); i++) {
        drawdown.push([]);
        for (var j = 0; j < warps(pattern); j++){
          drawdown[i][j]= new Cell(null);
          drawdown[i][j].reloadCell(pattern[i][j]); //this takes a cell param and updates from there
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
      return d[i][j].isUp();
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
      return d[i][j].isSet();
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
      d[i][j].setHeddle(bool);
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
    return d[i][j].getHeddle();
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
          drawdown[start_i+i][start_j+j].setHeddle(fill_pattern[i % rows][j % cols].getHeddle());
        }catch(e){
          console.error(e);
        }
      }
    }

    return drawdown;

   
  }

  /**
   * creates an empty drawdown of a given size
   * @param wefts 
   * @param warps 
   * @returns 
   */
  export const createBlankDrawdown = (wefts: number, warps: number) : Drawdown => {
    const drawdown: Drawdown = [];
    for(let i = 0; i < wefts; i++){
      drawdown.push([]);
      for(let j = 0; j < warps; j++){
        drawdown[i].push(new Cell(false));
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
        if(mask[i][j].getHeddle()){
          const set_to = pattern[i%wefts(pattern)][j%warps(pattern)].getHeddle();
          res[i][j].setHeddle(set_to);
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
        if(drawdown[i][j].isSet()){
          const set_to = !drawdown[i][j].getHeddle();
          inverted[i][j].setHeddle(set_to);
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
            if(up)  set_to = drawdown[(i+inc)%wefts(drawdown)][j].getHeddle();
            else set_to = drawdown[i][(j+inc)%warps(drawdown)].getHeddle();
            shifted[i][j].setHeddle(set_to);
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
          if(horiz)  set_to = drawdown[i][warps(drawdown)-1-j].getHeddle();
          else set_to = drawdown[wefts(drawdown)-1 - i][j].getHeddle();
          flip[i][j].setHeddle(set_to);
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
  export const generateMappingFromPattern = (drawdown: Drawdown, pattern: Array<any>, type: string) : Array<any> => {

    const mapping: Array<any> = [];
    if(type == 'row'){
      for(let i = 0; i < wefts(drawdown); i++){
        mapping[i] = pattern[i%pattern.length];
      }
    }else{
      for(let j = 0; j < warps(drawdown); j++){
        mapping[j] = pattern[j%pattern.length];
      }
    }
    return mapping;
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
        row.push(new Cell(false));
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
   * @param row the value to insert
   * @returns 
   */
  export const insertMappingRow = (m: Array<number>, i: number, row: number) : Array<number> => {
    i = i+1;
    try{
      m.splice(i,0,row);
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
    
    if(col == null){
      for(let i = 0; i < wefts(d); i++){
        col.push(new Cell(false));
      }
    }
    for (var ndx = 0; ndx < wefts(d); ndx++) {
      d[ndx].splice(j,0, col[ndx]);
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


  /**
   * gets the name of the draft. If it has a user defined name, it returns that, otherwise, it returns the generated name
   * @param draft 
   * @returns 
   */
 export const getDraftName = (draft: Draft) : string => {
  if(draft === null || draft === undefined) return "";  
  return (draft.ud_name === "") ?  draft.gen_name : draft.ud_name; 
  }




/**
* takes a draft as input, and flips the order of the rows
* used to ensure mixer calculations are oriented from bottom left
* @param draft 
*/ 
export const flipDraft = (d: Draft) : Promise<Draft> => {

  const draft = initDraftWithParams(
    {id: d.id, 
    wefts: wefts(d.drawdown),
    warps: warps(d.drawdown),
    colShuttleMapping: d.colShuttleMapping,
    colSystemMapping: d.colSystemMapping});
    draft.drawdown = createBlankDrawdown(wefts(d.drawdown), warps(d.drawdown));

  for(let i = 0; i < wefts(d.drawdown); i++){
    let flipped_i = wefts(d.drawdown) -1 -i;
    for(let j = 0; j < warps(d.drawdown); j++){
      draft.drawdown[i][j].setHeddle(d.drawdown[flipped_i][j].getHeddle()); 
    }
    draft.rowShuttleMapping[i] = d.rowShuttleMapping[flipped_i];
    draft.rowSystemMapping[i] = d.rowSystemMapping[flipped_i];
   }

  return Promise.resolve(draft);
}

  

