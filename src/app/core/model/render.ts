/**
 * Definition of render object.
 * @class
 */
export class Render {
  cell_w: number;
  cell_h: number;
  select_offset: number;


  constructor() {
    this.cell_w = 20;
    this.cell_h = 20;
    this.select_offset = 7;

  }

  setDims(dim: number){
    this.cell_w = dim;
    this.cell_h = dim;
  }

  getDims(){
    return this.cell_w;
  }

  getOffset(type) {
    if(type ==="select") return this.select_offset;
    else return 0;
  }

}
