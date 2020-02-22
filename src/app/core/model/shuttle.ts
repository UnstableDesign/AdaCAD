/**
 * Definition of Shuttle object.
 * @class
 */
export class Shuttle {
  color: string;
  id: number;
  thickness: number;
  name: string;
  type: string;
  visible: boolean;
  insert: number;
  image?: any;
  startLabel?: string;
  endLabel?: string;

  constructor() {
    this.insert = 0;
  }

  setID(id: number) {
    this.id = id;
    if (!this.name) {
      this.name = 'Shuttle ' + (id + 1);
    }
  }

  setVisible(bool: boolean) {
    this.visible = bool;
  }

  setColor(color: string) {
    this.color = color;
  }

  setThickness(n: number) {
    this.thickness = n;
  }

  setType(type: string) {
    this.type = type;
  }

  getColor() {
    return this.color;
  }

  getThickness() {
    return this.thickness;
  }

  getType() {
    return this.type;
  }
}