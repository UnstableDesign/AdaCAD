export interface Material {
    id: number;
    name: string;
    insert: boolean;
    visible: boolean;
    stretch: number;
    color: string;
    thickness: number;
    type: number;
    diameter: number;
    startLabel?: string;
    endLabel?: string;
    notes: string;
    rgb: {
        r: number;
        g: number;
        b: number;
    };
}
export interface MaterialImport {
    id?: number;
    name?: string;
    insert?: boolean;
    visible?: boolean;
    color?: string;
    thickness?: number;
    type?: number;
    diameter?: number;
    startLabel?: string;
    endLabel?: string;
    notes?: string;
    rgb?: {
        r: number;
        g: number;
        b: number;
    };
}
export type MaterialsList = Array<Material>;
export interface MaterialMap {
    old_id: number;
    new_id: number;
}
