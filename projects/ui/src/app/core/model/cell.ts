import { create } from "domain";
import { Cell } from "./datatypes";



export const createCell = (setting: boolean) : Cell => {
  
  if(setting !== null && typeof setting !== 'boolean') console.error("CREATE CELL GOT NON BOOLEAN VALUE", setting)


  let c:Cell = {
    is_set: false,
    is_up: false
  };

  if(setting === null || setting === undefined){
    c.is_set = false;
    c.is_up = false;
  } 
  else {
    c.is_set = true;
    c.is_up = setting;
  }
  return c;
}

export const toggleHeddle = (c:Cell) : Cell => {
  if(!c.is_set){
    c.is_set = true;
    c.is_up = true;
  }else{
    c.is_up = !c.is_up;
  }
  return c;
}


export const createCellFromSequenceVal = (val: number) : Cell => {
  

  let c:Cell = {
    is_set: false,
    is_up: false
  };

  switch(val){
    case 0:
      c.is_set = true;
      c.is_up = false;
      break;

    case 1: 
      c.is_set = true;
      c.is_up = true;
      break;

    case 2: 
      c.is_set = false;
      c.is_up = false;
    break;
  }
  return c;
}



export const setCellValue = (c: Cell, value:boolean) : Cell => {
 if(value === null){
   c.is_up = false;
   c.is_set = false;
 }else{
   c.is_up = value;
   c.is_set = true;
 }
 return c;
}

export const getCellValue = (c: Cell) : boolean => {
  if(c.is_set){
    return c.is_up;
   }
   return null;
 }
 
 





/**
 * Definition of Cell object.
 * @class Cell describes values assigned to one cell within a draft
 * @param poles describes the path of the yarn through this cell as a 4-bit number corresponding to NSEW. 
 * @params is_up describes if the heddle at this location is up or down
 * @params is_set describes if a yarn will move over this heddle (used in inlay and shape weaving to draw boundaries) 
 * @param mast_id describes the mask region for which this cell belongs (not currently used)
 */
// export class Cell {
//   is_up: boolean;
//   is_set: boolean;
  /**
   * 
   * @param setting describes if the Cell should be set to heddle up or not. Null value leaves cell unset. 
   */
  // constructor(setting: boolean) {

  //   if(setting === null || setting === undefined){
  //     this.is_set = false;
  //     this.is_up = false;
  //   } 
  //   else {
  //     this.is_set = true;
  //     this.is_up = setting;
  //   }
  // }

  /**
   * this is called from the reload file. it takes a cell in the form of a list of params and sets the variables that are present
   * @param params 
   */
  // reloadCell(params: any){

  //   if(params.is_up !== undefined){
  //     this.is_set = true;
  //     this.is_up = params.is_up;

  //   }else{
  //     this.is_set = false;
  //     this.is_up = false;
  //   }

  //   if(params.is_set !== undefined){
  //     this.is_set = params.is_set;
  //   }
  // }


  
 

  // setHeddleUp(){
  //   this.is_up = true;
  //   this.is_set = true;
  // }

  // setHeddleDown(){
  //    this.is_set = true;
  //    this.is_up = false;
  // }



  // /**
  //  * sets the value to true or false. If null, will unset the heddle
  //  * @param value 
  //  */
  // setHeddle(value:boolean){
  //   if(value === null){
  //     this.is_up = false;
  //     this.is_set = false;
  //   }else{
  //     this.is_up = value;
  //     this.is_set = true;
  //   }
  // }

  //   /**
  //  * sets the value to true or false. If null, will unset the heddle
  //  * @param value 
  //  */
  //   getHeddle():boolean{
  //      if(this.is_set){
  //       return this.is_up;
  //      }
  //      return null;
  //   }




  // unsetHeddle(){
  //   this.is_up = false;
  //   this.is_set = false;
  // }



  // isUp():boolean{
  //   return this.is_up;
  // }



  
  
// }