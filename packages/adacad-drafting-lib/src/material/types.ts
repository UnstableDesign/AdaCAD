
export interface Material {
  id: number;
  name: string;
  insert: boolean; //true is left, false is right
  visible: boolean;
  stretch: number; // must be between 0-1
  color: string;
  thickness: number; //percentage of base dims
  type: number;
  diameter: number;
  startLabel?: string;
  endLabel?: string;
  notes: string;
  rgb: { r: number, g: number, b: number }

}



export interface MaterialImport {
  id?: number;
  name?: string;
  insert?: boolean; //true is left, false is right
  visible?: boolean;
  color?: string;
  thickness?: number; //percentage of base dims
  type?: number;
  diameter?: number;
  startLabel?: string;
  endLabel?: string;
  notes?: string;
  rgb?: { r: number, g: number, b: number }

}


export type MaterialsList = Array<Material>;



export interface MaterialMap {
  old_id: number,
  new_id: number
}
