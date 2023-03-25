/**
 * Definition of Shuttle object.
* a shuttle inhertis from a material. 
 * @class
 */
export class Shuttle {
  id: number;
  name: string;
  insert: boolean; //true is left, false is right
  visible: boolean;
  color: string;
  thickness: number; //percentage of base dims
  type: number;
  diameter: number = 5;
  // image?: any;
  startLabel?: string;
  endLabel?: string;
  notes: string;


  constructor(shuttleDict = null) {

    //defaults
    this.id = -1;
    this.name="";
    this.insert = true;
    this.visible = true;
    this.color="#666666";
    this.thickness=100;
    this.diameter=5;
    this.type = 0;
    this.notes = "";

    if (shuttleDict) this.updateVariables(shuttleDict);

  }

  updateVariables({id, name, insert, visible, color, thickness, diameter, type, notes}) {
    
    this.id = id;
    this.name = name;
    this.insert = insert;
    this.visible = visible;
    this.color = color;
    this.thickness = thickness;
    this.diameter = (diameter === undefined) ? 5 : diameter;
    this.type = type;
    if(this.type === undefined) this.type = 0;
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

  getId(){
    return this.id;
  }

  setColor(color: string) {
    this.color = color;
  }

  setThickness(n: number) {
    this.thickness = n;
  }

  setDiameter(n: number) {
    this.diameter = n;
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

  getDiameter() {
    return this.diameter;
  }
  getType() {
    return this.type;
  }

  getName(){
    return this.name;
  }

}