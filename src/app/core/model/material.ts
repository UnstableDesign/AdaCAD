/**
 * Definition of Material
 * @class
 */
export class Material {
  color: string;
  id: number;
  thickness: number; //percentage of base dims
  name: string;
  type: number;
  notes: string;

  constructor(materialDict = null) {

  if (materialDict) {
    this.updateVariables(materialDict);
   }else{
    //this is called when the "add" - initialize defaults
    this.color = "666666";
    this.thickness = 100;
    this.name = "New Yarn";
    this.type = 0;
    this.notes = "";


   }
  }

  updateVariables({color, thickness, name, type, notes}) {
    this.color = color;
    this.thickness = thickness;
    this.name = name;
    this.type = type;
    this.notes = notes;
  }

  setID(id: number) {
    this.id = id;
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