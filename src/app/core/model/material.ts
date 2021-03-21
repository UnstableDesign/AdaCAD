// /**
//  * Definition of Material - all shuttles are assigned to a material
//  * @class
//  */
// export class Material {
//   color: string;
//   id: number;
//   thickness: number; //percentage of base dims
//   name: string;
//   type: number;
//   notes: string;


//   constructor(materialDict = null) {

//     //defaults
//     this.id = -1;
//     this.color = "666666";
//     this.thickness = 100;
//     this.name = "New Material";
//     this.type = 0;
//     this.notes = ""; 

//     if (materialDict) this.updateVariables(materialDict);
//   }

//   updateVariables({id, color, thickness, name, type, notes, insert}) {
//     this.id = id;
//     this.color = color;
//     this.thickness = thickness;
//     this.name = name;
//     this.type = type;
//     this.notes = notes;
//     this.insert= insert;
//   }


//   //sets for associated materials as well
//   setID(id: number) {
//     this.id = id;
//   }



//   setColor(color: string) {
//     this.color = color;
//   }

//   setThickness(n: number) {
//     this.thickness = n;
//   }

//   //indexs into type list
//   setType(type: number) {
//     this.type = type;
//   }

//   getColor() {
//     return this.color;
//   }

//   getThickness() {
//     return this.thickness;
//   }

//   getType() {
//     return this.type;
//   }

//   getShuttles(){
//     return this.shuttles;
//   }
// }