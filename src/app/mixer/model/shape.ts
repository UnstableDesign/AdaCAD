import { Cell } from "../../core/model/cell";
import { Bounds } from "../../core/model/datatypes";

/**
 * @class Shape
 * This class manages drafts that are linked to a shaped region. 
 * It offers functions to translate between shapes represented as HTML Elements 
 * and converting them into 2D array's of cells
 */
export class Shape {

  img_data: ImageData;
  scale: number;
  draft: Array<Array<Cell>>;
  filled: boolean;
 
  
/**
 * @constructor takes a canvas element and bounds and converts it to data. 
 * @param shape_canvas - a canvas with the shape on it 
 * @param bounds - the bounds of the shape we are converting
 * @param scale - the scale of each cell within the canvas. 
 */
  constructor(shape_canvas: HTMLCanvasElement, bounds:Bounds, scale:number) {
    this.scale = scale;
    const context = shape_canvas.getContext('2d');
    const download = shape_canvas.toDataURL("image/png");
    // document.write('<img src="'+download+'"/>');
    console.log("scale", this.scale);

    this.img_data = context.getImageData(bounds.topleft.x, bounds.topleft.y, bounds.width, bounds.height);
    this.draft = this.resample(Math.floor(bounds.height/scale), Math.floor(bounds.width/scale));
  };

  getImageData(){
    return this.img_data;
  }


  /**
   * rescale the draft in its current size to have this number of rows and cols
   * note: this breaks if scale is not a whole number
   * @param bounds 
   */
  resample(rows: number, cols: number):Array<Array<Cell>>{

    this.draft = [];
    //const margin: number = this.scale/2; // used to check the center of cells
    const margin = 0;
    for(let i = 0; i < rows; i++){
      this.draft.push([]);
      const row_ndx = (i * this.scale + margin) * (this.img_data.width*4);
      for(let j = 0; j < cols; j++){
        const col_ndx = (j* this.scale + margin) * 4;

        // const p_red = this.img_data.data[row_ndx + col_ndx ];
         const p_grn = this.img_data.data[row_ndx + col_ndx + 1];
        // const p_blue = this.img_data.data[row_ndx + col_ndx + 2];
        // const p = this.img_data.data[row_ndx + col_ndx + 3];
        // console.log(i, j, row_ndx, col_ndx, p_red, p_grn, p_blue,p);
        if(p_grn == 255){
          this.draft[i][j] = new Cell(false);
        }else if(p_grn == 64){
          this.draft[i][j] = new Cell(true);
        }else{
          this.draft[i][j] = new Cell(null);
        }
      }
    }
    
    return this.draft;
  }

 /**
   * rescale the draft in its current size to have this number of rows and cols
   * @param bounds 
   */
  read(){

    for(let i = 0; i < this.img_data.width; i++){
      const row_ndx = i * this.img_data.width * 4;
      for(let j = 0; j < this.img_data.height; j++){
        const col_ndx = (j * 4);
        const p_red = this.img_data.data[row_ndx + col_ndx ];
        const p_grn = this.img_data.data[row_ndx + col_ndx + 1];
        const p_blue = this.img_data.data[row_ndx + col_ndx + 2];
        const p = this.img_data.data[row_ndx + col_ndx + 3];
        console.log(i, j, p_red, p_grn, p_blue,p);

        // if(p_grn >= 150){
        //   console.log(i, j, "set");
        // }else if(p_grn < 80){
        // }else{
        // }
      }
    }
    
    return this.draft;
  }

  getDraft():Array<Array<Cell>>{
    return this.draft;
  }





}
