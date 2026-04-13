import {
    CanvasTexture,
    Color,
    Group,
    Matrix4,
    Mesh,
    MeshLambertMaterial,
    PlaneGeometry,
    Sprite,
    SpriteMaterial,
} from "three";
import { type CNFloat } from "adacad-drafting-lib";
import { CELL_SIZE, GAP_RATIO, VIEW_SCALE } from "./simVars";
import { type FloatTraceState } from "./traceTypes";



const makeFloatIdLabel = (labelText: string, color: string): Sprite => {
    const canvas = document.createElement("canvas");
    canvas.width = 360;
    canvas.height = 84;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        const fallbackMaterial = new SpriteMaterial({ color: new Color(color) });
        return new Sprite(fallbackMaterial);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelText, canvas.width / 2, canvas.height / 2);

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new SpriteMaterial({ map: texture, transparent: true });
    const sprite = new Sprite(material);
    sprite.scale.set(CELL_SIZE * 2.1, CELL_SIZE * 0.52, 1);
    return sprite;
}

export const getWeftFloatLength = (f: CNFloat, warps: number): number => {
    if (f.right.j >= f.left.j) return f.right.j - f.left.j;
    else return warps - f.left.j + f.right.j;
}

export const getWarpFloatLength = (f: CNFloat, wefts: number): number => {
    if (f.right.i >= f.left.i) return f.right.i - f.left.i;
    else return wefts - f.left.i + f.right.i;
}

export interface FloatGeometryBundle {
    group: Group;
    applyTraceState: (state: FloatTraceState, dimUntouched: boolean) => void;
}

const BASE_WEFT = new Color("#FFFFFF");
const BASE_WARP = new Color("#000000");
const COLOR_TOUCHED = new Color("#ffbf3f");
const COLOR_ASSIGNED = new Color("#37d67a");
const COLOR_CURRENT = new Color("#00d2ff");
const COLOR_LOCAL_REGION = new Color("#8b7cf0");
const COLOR_DISCOVERED = new Color("#ff0000");
export const getAssignedLayerColor = (layerId: number): Color => {
    // Spread layer hues around the wheel so adjacent layers stay visually distinct.
    const hue = ((layerId * 0.1618) % 1 + 1) % 1;
    return new Color().setHSL(hue, 0.78, 0.52);
};

export const getFloatGeometry = (floats: Array<CNFloat>, warps: number, wefts: number): FloatGeometryBundle => {


    const weftFloats = new Group();
    const warpFloats = new Group();
    const group = new Group();

    const floatMeshes = new Map<number, Mesh>();
    const floatLabels = new Map<number, Sprite>();




    for (let fndx = 0; fndx < floats.length; fndx++) {
        const float = floats[fndx];
        const ndx = float.left;
        const x = (ndx.j * CELL_SIZE);
        const y = (ndx.i * CELL_SIZE);



        //warp float
        if (float.face) {
            const planeGeometry = new PlaneGeometry(
                CELL_SIZE * GAP_RATIO,
                CELL_SIZE * (getWarpFloatLength(float, wefts) + 1)
            );
            const mesh = new Mesh(planeGeometry, new MeshLambertMaterial({ color: BASE_WARP.clone() }));

            mesh.position.set(x + (planeGeometry.parameters.width / 2), y + (planeGeometry.parameters.height / 2), 0.1);
            warpFloats.add(mesh);
            floatMeshes.set(float.id, mesh);

            const idLabel = makeFloatIdLabel(`${float.id}`, "#FFFFFF");
            idLabel.position.set(mesh.position.x, mesh.position.y, mesh.position.z + 0.05);
            warpFloats.add(idLabel);
            floatLabels.set(float.id, idLabel);
        } else {
            const planeGeometry = new PlaneGeometry(
                CELL_SIZE * (getWeftFloatLength(float, warps) + 1),
                CELL_SIZE * GAP_RATIO
            );

            const mesh = new Mesh(planeGeometry, new MeshLambertMaterial({ color: BASE_WEFT.clone() }));
            mesh.position.set(x + (planeGeometry.parameters.width / 2), y + (planeGeometry.parameters.height / 2), 0.1);
            weftFloats.add(mesh);
            floatMeshes.set(float.id, mesh);

            const idLabel = makeFloatIdLabel(`${float.id}`, "#000000");
            idLabel.position.set(mesh.position.x, mesh.position.y, mesh.position.z + 0.05);
            weftFloats.add(idLabel);
            floatLabels.set(float.id, idLabel);
        }
    }

    const weftTransform = new Matrix4().makeTranslation(-(CELL_SIZE / 2), -(CELL_SIZE * GAP_RATIO / 2), 0);
    weftFloats.applyMatrix4(weftTransform);

    const warpTransform = new Matrix4().makeTranslation(-(CELL_SIZE * GAP_RATIO / 2), -(CELL_SIZE / 2), 0.0);
    warpFloats.applyMatrix4(warpTransform);

    group.add(weftFloats);
    group.add(warpFloats);


    const gridTransform = new Matrix4().makeScale(VIEW_SCALE, -VIEW_SCALE, VIEW_SCALE);
    group.applyMatrix4(gridTransform);

    const applyTraceState = (state: FloatTraceState, dimUntouched: boolean) => {
        for (const float of floats) {
            const mesh = floatMeshes.get(float.id);
            const label = floatLabels.get(float.id);
            if (!mesh) {
                continue;
            }

            const material = mesh.material as MeshLambertMaterial;
            const baseColor = float.face ? BASE_WARP : BASE_WEFT;
            material.color.copy(baseColor);
            material.transparent = true;
            material.opacity = dimUntouched ? 0.22 : 1.0;
            if (label) {
                label.material.opacity = dimUntouched ? 0.25 : 1.0;
            }

            if (state.assignedIds.has(float.id)) {
                const assignedLayer = state.assignedByLayer.get(float.id);
                if (assignedLayer !== undefined) {
                    material.color.copy(getAssignedLayerColor(assignedLayer));
                } else {
                    material.color.copy(COLOR_ASSIGNED);
                }
                material.opacity = 0.95;
                if (label) {

                    label.material.opacity = 0.9;
                }
            } else if (state.touchedIds.has(float.id)) {
                material.color.copy(COLOR_TOUCHED);
                material.opacity = 0.92;
                if (label) {
                    label.material.opacity = 0.9;
                }
            } else if (state.localRegionIds.has(float.id)) {
                material.color.copy(COLOR_LOCAL_REGION);
                material.opacity = dimUntouched ? 0.42 : 0.88;
                if (label) {
                    label.material.opacity = dimUntouched ? 0.35 : 0.88;
                }
            } else if (state.attachedIds.has(float.id)) {
                material.color.copy(COLOR_DISCOVERED);
                material.opacity = 0.92;
                if (label) {
                    label.material.opacity = 0.9;
                }
            }

            if (state.currentFloatId === float.id) {
                material.color.copy(COLOR_CURRENT);
                material.opacity = 1.0;
                if (label) {
                    label.material.opacity = 1.0;
                }
            }
        }
    };

    return { group, applyTraceState };
};


