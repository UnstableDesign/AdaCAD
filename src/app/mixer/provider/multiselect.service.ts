import { Injectable } from '@angular/core';
import { Point } from '../../core/model/datatypes';

@Injectable({
  providedIn: 'root'
})
export class MultiselectService {

  selected: Array<{id: number, topleft: Point}> = [];
  relative_position: Point; 


  constructor() { 

  }

  setRelativePosition(point: Point){
    this.relative_position = point;
  }

  getRelativePosition(): Point{
    return {x: this.relative_position.x, y: this.relative_position.y};
  }

  setPosition(id: number, tl: Point){
    const el = this.selected.find(el => el.id === id);
    if(el !== undefined){
      el.topleft = {x: tl.x, y: tl.y};
    }
  }

  removeSelection(id: number){
    if(this.selected.find(el => el.id == id) !== undefined){
      this.selected = this.selected.filter(el => el.id != id);
    }
  }

  addSelection(id: number, topleft: Point){
    if(this.selected.find(el => el.id == id) === undefined){
      this.selected.push({id, topleft});
    }
  }

  toggleSelection(id: number, topleft: Point) : boolean{
    if(this.selected.find(el => el.id == id) !== undefined){
      this.selected = this.selected.filter(el => el.id != id);
      return false;
    }else{
      this.selected.push({id, topleft});
      return true;
    }
  }

  clearSelections(){
    this.selected = [];
  }

  getSelections() : Array<number> {
    return this.selected.map(el => el.id);
  }

  getNewPosition(id: number, diff: Point){
    const f = this.selected.find(el => el.id == id);
    return {x: f.topleft.x + diff.x, y: f.topleft.y + diff.y}
  }

}
