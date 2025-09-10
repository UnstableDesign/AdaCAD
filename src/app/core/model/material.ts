// import { Material } from "adacad-drafting-lib";
// import { defaults } from "./defaults";
// import utilInstance from "./util";



// export const createMaterial = (matDict = null): Material => {

//   const m: Material = {
//     id: -1,
//     name: '',
//     insert: true,
//     visible: true,
//     color: "#666666",
//     thickness: 100,
//     diameter: defaults.default_material_diameter,
//     type: 0,
//     notes: '',
//     rgb: { r: 102, g: 102, b: 102 }
//   }

//   if (matDict) {
//     m.id = matDict.id;
//     m.name = matDict.name;
//     m.insert = matDict.insert;
//     m.visible = matDict.visible;
//     m.color = matDict.color;
//     m.thickness = matDict.thickness;
//     m.diameter = (matDict.diameter === undefined) ? defaults.default_material_diameter : matDict.diameter;
//     m.rgb = utilInstance.hexToRgb(m.color.trim());
//     m.type = matDict.type;
//     if (matDict.type === undefined) m.type = 0;
//     // this.image = image;
//     // this.startLabel = startLabel;
//     // this.endLabel = endLabel;
//     m.notes = matDict.notes;
//   }

//   return m;

// }

// export const setMaterialID = (m: Material, id: number): Material => {
//   m.id = id;
//   if (!m.name) {
//     m.name = 'Shuttle ' + (id + 1);
//   }
//   return m;
// }

// /**
//  * given a list of material mappings, returns a list where they are all the same size, 
//  * @param systems the material mappings to compare
//  */
// export const standardizeMaterialLists = (shuttles: Array<Array<number>>): Array<Array<number>> => {

//   if (shuttles.length === 0) return [];

//   const standard = shuttles.map(el => el.slice());

//   //standardize teh lengths of all the returned arrays 
//   const max_length: number = standard.reduce((acc, el) => {
//     const len = el.length;
//     if (len > acc) return len;
//     else return acc;
//   }, 0);


//   standard.forEach((sys, ndx) => {
//     if (sys.length < max_length) {
//       for (let i = sys.length; i < max_length; i++) {
//         sys.push(sys[0]);
//       }
//     }
//   });

//   return standard;
// }



