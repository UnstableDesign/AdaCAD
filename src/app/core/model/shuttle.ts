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

  constructor(shuttleDict = null) {
    if (shuttleDict) this.updateVariables(shuttleDict);
    else this.insert = 0;

    this.thickness = 1;
  }

  updateVariables({color, id, thickness, name, type, visible, insert, image, startLabel, endLabel}) {
    this.color = color;
    this.id = id;
    this.thickness = thickness;
    this.name = name;
    this.type = type;
    this.visible = visible;
    this.insert = insert;
    this.image = image;
    this.startLabel = startLabel;
    this.endLabel = endLabel;
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