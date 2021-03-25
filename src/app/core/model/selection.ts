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
  explicit: boolean;


  setParameters() {
    this.width = Math.abs(this.start.j - this.end.j);
    this.height = Math.abs(this.start.si - this.end.si);
  }

  unsetParameters() {
    this.width = -1;
    this.height = -1;
  }


  setTarget(t){
  	this.target = t;
  }

  getTarget(){
  	return this.target;
  }

  //was this copy implicitly created with the selectio nor explicity through the copy button
  setExplicit(){
    this.explicit = true;
  }

  unsetExplicit(){
    this.explicit = false;
  }

  getExplicit(){
    return this.explicit;
  }
}