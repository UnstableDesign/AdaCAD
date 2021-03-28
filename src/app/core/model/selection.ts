import { Point } from './point';

/**
 * Definition of selection object.
 * @class
 */
export class Selection {
  start: Point;
  end: Point;
  width: number;
  height: number;
  target: any;


  setParameters() {
    this.width = Math.abs(this.start.j - this.end.j);
    this.height = Math.abs(this.start.si - this.end.si);

    if(this.target.id == "weft-systems" || this.target.id == "weft-materials"){
      this.width = 1;
    }else if(this.target.id == "warp-systems" || this.target.id == "warp-materials"){
      this.height = 1;
    }
  }

  unsetParameters() {
    this.width = -1;
    this.height = -1;
  }

  hasSelection(){
    return (this.width >= 0 && this.height >= 0);
  }

  getTop(){
    return Math.min(this.start.si, this.end.si);
  }

  getLeft(){
    return Math.min(this.start.j, this.end.j);
  }

  setTarget(t){
  	this.target = t;
  }

  getTarget(){
  	return this.target;
  }

  getTargetId(){
    if(this.target !== undefined) return this.target.id;
    return undefined;
  }




}