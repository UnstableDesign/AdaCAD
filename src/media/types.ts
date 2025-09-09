
export type Img = {
  id: string,
  data: AnalyzedImage | null,
}

 /**
  * an object that is stored in memory when an image is loaded
  * @param name the file name of the uploaded file
  * @param data the raw data of the image 
  * @param colors an array of unique hex values found in this image 
  * @param colors_mapping an array that matches each index in the color array to a color index that it should be grouped with
  * @param image the HTML image object to write the data into 
  * @param image_map an 2D array associating every pixel in the image with the id of the associated color in the colors array
  * @param width 
  * @param height
  * @param type
  * @param warning a text warning is added if the image file violates rules
  */
 export interface AnalyzedImage{
    name: string,
    data: ImageData, 
    colors: Array<Color>,
    colors_mapping: Array<{from: number, to: number}>,
    proximity_map: Array<{a: number, b: number, dist: number}>,
    image: HTMLImageElement,
    image_map: Array<Array<number>>,
    width:number,
    height: number,
    type: string,
    warning: string
 }

 export interface Color{
  r: number,
  g: number,
  b: number,
  hex: string
 }


 export type DraftCellColor = {
  id: string,
  r: number,
  g: number,
  b: number,
  a: number
}

export interface SingleImage{
  name: string,
  data: ImageData, 
  image: HTMLImageElement,
  width:number,
  height: number,
  type: string,
  warning: string
}
