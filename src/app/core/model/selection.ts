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
  }


  setTarget(t){
  	this.target = t;
  }

  getTarget(){
  	return this.target;
  }
}