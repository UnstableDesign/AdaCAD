/**
 * Definition of pattern object.
 * @class
 */
export class Cell {
  poles: number;
  is_up: boolean;
  mask_id: number;

  constructor() {
    this.poles = 0b0000;
    this.is_up = false;
    this.mask_id = -1;
  }

  setNorth(){
    this.poles = this.poles | 0b1000;
  }

  setEast(){
    this.poles = this.poles | 0b0100;

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
  }

  unsetPoles(){
    this.poles = 0b0000;
  }



  
  
}