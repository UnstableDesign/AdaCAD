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
    this.width = Math.abs(this.start.x - this.end.x);
    this.height = Math.abs(this.start.y - this.end.y);
  }

  setTarget(t){
  	this.target = t;
  }

  getTarget(){
  	return this.target;
  }
}