/**
 * Definition of Shuttle object.
* a shuttle inhertis from a material. 
 * @class
 */
export class Shuttle {
  id: number;
  name: string;
  insert: boolean;
  visible: boolean;
  color: string;
  thickness: number; //percentage of base dims
  type: number;
  // image?: any;
  // startLabel?: string;
  // endLabel?: string;
  notes: string;


  constructor(shuttleDict = null) {

    //defaults
    this.id = -1;
    this.name="new shuttle";
    this.insert = false;
    this.visible = true;
    this.color="#666666";
    this.thickness=100;
    this.type = 0;
    this.notes = "";

    if (shuttleDict) this.updateVariables(shuttleDict);

  }

  updateVariables({id, name, insert, visible, color, thickness, type, notes}) {
    this.id = id;
    this.name = name;
    this.insert = insert;
    this.visible = visible;
    this.color = color;
    this.thickness = thickness;
    this.type = type;
  // this.image = image;
    // this.startLabel = startLabel;
    // this.endLabel = endLabel;
    this.notes = notes;
  }

  setID(id: number) {
    this.id = id;
    if (!this.name) {
      this.name = 'Shuttle ' + (id + 1);
    }
  }

  setColor(color: string) {
    this.color = color;
  }

  setThickness(n: number) {
    this.thickness = n;
  }

  //indexs into type list
  setType(type: number) {
    this.type = type;
  }

  setVisible(visible:boolean){
    this.visible = visible;
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