import { defaults } from "../utils/defaults";
import { hexToRgb } from "../utils/utils";
import { MaterialImport, Material, MaterialsList } from "./types";



export const createMaterial = (matDict: MaterialImport): Material => {

  const m: Material = {
    id: -1,
    name: '',
    stretch: 1,
    insert: true,
    visible: true,
    color: "#666666",
    thickness: 100,
    diameter: defaults.default_material_diameter,
    type: 0,
    notes: '',
    rgb: { r: 102, g: 102, b: 102 }
  }

  if (matDict) {
    m.id = matDict.id ?? -1;
    m.name = matDict.name ?? 'unnamed material';
    m.insert = matDict.insert ?? true;
    m.visible = matDict.visible ?? true;
    m.color = matDict.color ?? "#666666";
    m.thickness = matDict.thickness ?? defaults.default_material_diameter;
    m.diameter = matDict.diameter ?? defaults.default_material_diameter;
    m.rgb = hexToRgb(m.color.trim());
    m.type = matDict.type ?? defaults.material_type;
    if (matDict.type === undefined) m.type = 0;
    m.notes = matDict.notes ?? "";
  }

  return m;

}

export const setMaterialID = (m: Material, id: number): Material => {
  m.id = id;
  if (!m.name) {
    m.name = 'Material ' + (id + 1);
  }
  return m;
}

export const getMaterialStretch = (m: Material): number => {
  return m.stretch;
}

export const setMaterialStretch = (m: Material, stretch: number): Material => {
  if (stretch > 1 || stretch < 0) console.error("STRETCH IS OUT OF BOUNDS ", stretch);
  if (stretch < 0) stretch = 0;
  if (stretch > 1) stretch = 1;
  m.stretch = stretch;
  return m;
}

/**
 * given a list of material mappings, returns a list where they are all the same size, 
 * @param systems the material mappings to compare
 */
export const standardizeMaterialLists = (shuttles: Array<Array<number>>): Array<Array<number>> => {

  if (shuttles.length === 0) return [];

  const standard = shuttles.map(el => el.slice());

  //standardize teh lengths of all the returned arrays 
  const max_length: number = standard.reduce((acc, el) => {
    const len = el.length;
    if (len > acc) return len;
    else return acc;
  }, 0);


  standard.forEach((sys) => {
    if (sys.length < max_length) {
      for (let i = sys.length; i < max_length; i++) {
        sys.push(sys[0]);
      }
    }
  });

  return standard;
}


export const getDiameter = (id: number, ms: MaterialsList) => {
  const material: Material | undefined = ms.find(el => el.id == id);
  if (material === undefined) return 0;
  return material.diameter;
}


export const getColorForSim = (id: number, ms: MaterialsList) => {
  const s: Material | undefined = ms.find(el => el.id == id);
  if (s == undefined) return "0x000000"
  return parseInt(s.color.replace("#", "0x"), 16);
};






