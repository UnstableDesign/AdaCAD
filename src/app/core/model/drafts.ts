import { Cell } from "./cell";
import { Drawdown } from "./datatypes";
import utilInstance from "./util";


export interface Draft{
  id: number,
  gen_name: string,
  ud_name: string,
  drawdown: Drawdown,
  rowShuttlePattern: Array<number>,
  rowSystemPattern: Array<number>,
  colShuttlePattern: Array<number>,
  colSystemPattern: Array<number>,
}



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
    rowShuttlePattern: [],
    rowSystemPattern: [],
    colShuttlePattern: [],
    colSystemPattern: []

  };
  return d;
}

export const createDraft = (
  pattern: Array<Array<boolean>>,
  gen_name: string,
  ud_name: string,
  rowShuttlePattern: Array<any>,
  rowSystemPattern: Array<any>,
  colShuttlePattern: Array<any>,
  colSystemPattern: Array<any>
  ) : Draft => {

    const d: Draft = {
      id: utilInstance.generateId(8),
      drawdown = parseSavedPattern(pattern),
      gen_name = gen_name,
      ud_name = ud_name, 
      rowShuttlePattern = rowShuttlePattern.slice(),
      rowSystemPattern = rowSystemPattern.slice(),
      colShuttlePattern = colShuttlePattern.slice(),
      colSystemPattern = colSystemPattern.slice(),
    }

    return d;

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
   * deletes a row from the drawdown at the specified weft location
   * @param d drawdown
   * @param i weft location
   * @returns the modified drawdown
   */
  export const deleteDrawdownRow = (d:Drawdown, i: number) => {
      try{
        d.splice(i, 1);
      }catch(e){
        console.error(e);
      }
      return d;
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
 * delete a column from the drawdown at a given location
 * @param d the drawdown
 * @param j the warp location
 * @returns the modified drawdown
 */
  export const deleteCol = (d: Drawdown, j: number) : Drawdown => {

    for(var ndx = 0; ndx < wefts(d); ndx++){
      d[ndx].splice(j, 1);
    }
    return d;

  }

  /**
   * takes a pattern (like rowShuttle, or colSystem, and returns the value that should appear at a given id)
   * if the index is outside of the range, it returns what the value would be if the pattern was repeated
   * @param p 
   * @param ndx 
   * @returns the assigned vale at that location
   */
  export const getIdFromSystemorShuttlePattern = (p: Array<number>, ndx: number): number => {
    return p[ndx%p.length];
  }

  /**
   * gets the name of the draft. If it has a user defined name, it returns that, otherwise, it returns the generated name
   * @param draft 
   * @returns 
   */
 export const getDraftName = (draft: Draft) : string => {
    return (draft.ud_name === "") ?  draft.gen_name : draft.ud_name; 
  }
  
  
  









// export default {
//   initDraft
// }
