import { createCell } from "../src/objects/cell";
import { Drawdown } from "../src/objects/datatypes";

  
  
  const d1:Drawdown = [];
  const d2:Drawdown = [];
  for(let i = 0; i < 10; i++){
    d1.push([]);
    d2.push([]);
    for(let j = 0; j < 10; j++){
      if(j == 0) d1[i].push(createCell(null));
      else d1[i].push(createCell(true));
      d2[i].push(createCell(j%2 === 0));
    }
  }