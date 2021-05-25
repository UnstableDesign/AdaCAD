/**
 * Definition of Cell object.
 * @class Cell describes values assigned to one cell within a draft
 * @param poles describes the path of the yarn through this cell as a 4-bit number corresponding to NSEW. 
 * @params is_up describes if the heddle at this location is up or down
 * @params is_set describes if a yarn will move over this heddle (used in inlay and shape weaving to draw boundaries) 
 * @param mast_id describes the mask region for which this cell belongs (not currently used)
 */
export class Cell {
  poles: number;
  is_up: boolean;
  is_set: boolean;
  mask_id: number;

  /**
   * 
   * @param setting describes if the Cell should be set to heddle up or not. Null value leaves cell unset. 
   */
  constructor(setting: boolean) {

    this.poles = 0b0000;
    this.mask_id = -1;
    if(setting === null || setting === undefined){
      this.is_set = false;
      this.is_up = false;
    } 
    else {
      this.is_set = true;
      this.is_up = setting;
    }
  }

  /**
   * this is called from the reload file. it takes a cell in the form of a list of params and sets the variables that are present
   * @param params 
   */
  reloadCell(params: any){
    this.is_up = (params.is_up === undefined) ? false : params.is_up;
    this.is_set = (params.is_set === undefined) ? false : params.is_set;
    this.mask_id = (params.mask_id === undefined) ? false : params.mask_id;
    this.poles = (params.poles === undefined) ? 0 : params.poles;

  }


  
  isSet(){
    return this.is_set;
  }

  setHeddleUp(){
    this.is_up = true;
    this.is_set = true;
  }

  setHeddleDown(){
     this.is_set = true;
     this.is_up = false;
  }

  setNorth(){
    this.poles = this.poles | 0b1000;
  }

  setEast(){
    this.poles = this.poles | 0b0100;

  }

  setNorthSouth(){
    this.setNorth();
    this.setSouth();
  }

  setEastWest(){
    this.setEast();
    this.setWest();
  }

  setSouth(){
    this.poles = this.poles | 0b0010;
  }

  setWest(){
    this.poles = this.poles | 0b0001;
  }

  unsetNorth(){
    this.poles = this.poles ^ 0b1000;
  }

  unsetEast(){
    this.poles = this.poles ^ 0b0100;

  }

  unsetSouth(){
    this.poles = this.poles ^ 0b0010;
  }

  unsetWest(){
    this.poles = this.poles ^ 0b0001;
  }


  hasNorth():boolean{
    let p:number = this.poles >>> 3;
    return(p === 1);
  }

  isEastWest():boolean{
    return (this.poles & 0b0101) === 0b0101;
  }

  isSouthEast():boolean{
    return (this.poles & 0b0110) === 0b0110;
  }

  isSouthWest():boolean{
    return (this.poles & 0b0011) === 0b0011;
  }

  isNorthSouth():boolean{
    return (this.poles & 0b1010) === 0b1010;
  }

  isNorthEast():boolean{
    return (this.poles & 0b1100) === 0b1100;
  }

  isNorthWest():boolean{
    return (this.poles & 0b1001) === 0b1001;
  }

  isWest():boolean{
    return (this.poles & 0b0001) === 0b0001;
  }

  isEast():boolean{
    return (this.poles & 0b0100) === 0b0100;
  }

  hasEast():boolean{
    let p:number = this.poles >>> 2;
    return((p %2)===1);
  }

  hasSouth():boolean{
    let p:number = this.poles >>> 1;
    return((p %2)===1);
  }

  hasWest():boolean{
    return((this.poles %2)===1);
  }

  isUp():boolean{
    return this.is_up;
  }

  getPoles(){
    return this.poles;
  }

  getMaskId(){
    return this.mask_id;
  }

  setHeddle(value:boolean){
    this.is_up = value;
    this.is_set = true;
  }

  toggleHeddle(){
    if(!this.is_set){
      this.is_set = true;
      this.is_up = true;
    }else{
      this.is_up = !this.is_up;
    }
  }

  setPoles(poles:number){
    this.poles = poles;
  }

  setMaskId(id: number){
    this.mask_id = id;
  }

  unsetMaskId(){
    this.mask_id = -1;
  }

  unsetHeddle(){
    this.is_up = false;
    this.is_set = false;
  }

  unsetPoles(){
    this.poles = 0b0000;
  }



  
  
}