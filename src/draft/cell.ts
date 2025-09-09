import { Cell } from "./types";

export const createCell = (setting: boolean|null) : Cell => {
  
  if(setting !== null && typeof setting !== 'boolean') console.error("CREATE CELL GOT NON BOOLEAN VALUE", setting)


  const c:Cell = {
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
  

  const c:Cell = {
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


export const setCellValue = (c: Cell, value:boolean|null) : Cell => {
 if(value === null){
   c.is_up = false;
   c.is_set = false;
 }else{
   c.is_up = value;
   c.is_set = true;
 }
 return c;
}

export const getCellValue = (c: Cell) : boolean | null => {
  if(c.is_set){
    return c.is_up;
   }
   return null;
 }
 
export const cellToSequenceVal = (c: Cell) : number => {
  if(!c.is_set) return 2;
  return c.is_up ? 1 : 0;
}

