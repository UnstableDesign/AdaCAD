import { type CNFloat } from "adacad-drafting-lib";
import {
    Color,
    Group,
    Matrix4,
    Mesh,
    MeshLambertMaterial,
    SphereGeometry,
} from "three";
import { cnKey, normalizeNdx } from "./liftMap";
import { CELL_SIZE, CN_SIZE, GAP_RATIO, VIEW_SCALE } from "./simVars";
import { getAssignedLayerColor, getFloatGeometry } from "./floatAdapter";
import { type LiftMapTraceState } from "./traceTypes";

const COLOR_CURRENT = new Color("#00d2ff");
const COLOR_TOUCHED = new Color("#ffbf3f");
const COLOR_ACN_PENDING = new Color("#4a4e57");

export interface LiftMapGeometryBundle {
    group: Group;
    applyLiftMapState: (state: LiftMapTraceState, dimUntouched: boolean) => void;
}

const liftMapToFloatLayerAssignment = (
    floats: Array<CNFloat>,
    wefts: number,
    warps: number,
    assignedAcnLayer: ReadonlyMap<string, number>,
): Map<number, number> => {
    const floatLayer = new Map<number, number>();
    for (const f of floats) {
        const lk = cnKey(normalizeNdx(f.left, wefts, warps));
        const rk = cnKey(normalizeNdx(f.right, wefts, warps));
        const ll = assignedAcnLayer.get(lk);
        const rl = assignedAcnLayer.get(rk);
        const layer =
            ll !== undefined && rl !== undefined
                ? Math.min(ll, rl)
                : ll !== undefined
                  ? ll
                  : rl !== undefined
                    ? rl
                    : undefined;
        if (layer !== undefined) {
            floatLayer.set(f.id, layer);
        }
    }
    return floatLayer;
};

export const getLiftMapGeometry = (
    floats: Array<CNFloat>,
    warps: number,
    wefts: number,
): LiftMapGeometryBundle => {
    const floatBundle = getFloatGeometry(floats, warps, wefts);
    const acnMeshes = new Map<string, Mesh>();

    const CN_OFFSET = (CELL_SIZE * GAP_RATIO) / 2;
    const acnLocal = new Group();

    const placeAcnMesh = (ndx: ReturnType<typeof normalizeNdx>) => {
        const key = cnKey(ndx);
        if (acnMeshes.has(key)) {
            return;
        }
        const mesh = new Mesh(
            new SphereGeometry(CN_SIZE * 1.35, 18, 18),
            new MeshLambertMaterial({ color: COLOR_ACN_PENDING.clone() }),
        );
        let x = ndx.j * CELL_SIZE;
        let y = ndx.i * CELL_SIZE;
        switch (ndx.id) {
            case 0:
                x -= CN_OFFSET;
                break;
            case 1:
                x += CN_OFFSET;
                break;
            case 2:
                y -= CN_OFFSET;
                break;
            case 3:
                y += CN_OFFSET;
                break;
            default:
                break;
        }
        mesh.position.set(x, y, 0.14);
        acnLocal.add(mesh);
        acnMeshes.set(key, mesh);
    };

    for (const f of floats) {
        placeAcnMesh(normalizeNdx(f.left, wefts, warps));
        placeAcnMesh(normalizeNdx(f.right, wefts, warps));
    }

    const gridTransform = new Matrix4().makeScale(VIEW_SCALE, -VIEW_SCALE, VIEW_SCALE);
    acnLocal.applyMatrix4(gridTransform);

    const root = new Group();
    root.add(floatBundle.group);
    root.add(acnLocal);

    const applyLiftMapState = (state: LiftMapTraceState, dimUntouched: boolean) => {
        const floatLayer = liftMapToFloatLayerAssignment(floats, wefts, warps, state.assignedAcnLayer);

        const syntheticFloatState = {
            currentFloatId: state.currentFloatId,
            touchedIds: new Set(state.scannedFloatIds),
            assignedByLayer: floatLayer,
            assignedIds: new Set(floatLayer.keys()),
            attachedIds: new Set<number>(),
            currentLayer: state.currentLayerIndex,
            localRegionIds: new Set<number>(),
        };

        floatBundle.applyTraceState(syntheticFloatState, dimUntouched);

        for (const [key, mesh] of acnMeshes) {
            const material = mesh.material as MeshLambertMaterial;
            const layer = state.assignedAcnLayer.get(key);
            const isPrimary = state.currentAcnKey === key;
            const isSecondary = state.currentAcnKeyTo === key;
            const wasChecked = state.checkedAcnKeys.has(key);

            material.transparent = true;
            if (layer !== undefined) {
                material.color.copy(getAssignedLayerColor(layer));
                material.opacity = 0.98;
            } else if (isPrimary || isSecondary) {
                material.color.copy(COLOR_CURRENT);
                material.opacity = 1;
            } else if (wasChecked) {
                material.color.copy(COLOR_TOUCHED);
                material.opacity = dimUntouched ? 0.75 : 0.95;
            } else {
                material.color.copy(COLOR_ACN_PENDING);
                material.opacity = dimUntouched ? 0.35 : 0.88;
            }
        }
    };

    return { group: root, applyLiftMapState };
};
