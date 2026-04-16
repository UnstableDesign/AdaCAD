import { type CNFloat } from "adacad-drafting-lib";
import { Color, Group, Matrix4, Mesh, MeshLambertMaterial, PlaneGeometry, SphereGeometry } from "three";
import {
  getAssignedLayerColor,
  getFloatGeometry,
  getWarpFloatLength,
  getWeftFloatLength,
} from "./floatAdapter";
import { cnKey, normalizeNdx } from "./liftMap";
import { CELL_SIZE, CN_SIZE, GAP_RATIO, VIEW_SCALE } from "./simVars";
import { type CreateLayerSetTraceState } from "./traceTypes";

const COLOR_CURRENT = new Color("#00d2ff");
const COLOR_TOUCHED = new Color("#ffbf3f");
const COLOR_PENDING = new Color("#4a4e57");
const COLOR_NOT_ADDED = new Color("#000000");
const SCORE_LOW = new Color("#22c55e");
const SCORE_HIGH = new Color("#ef4444");

const getOutcomeColor = (layerIndex: number, valid: boolean): Color => {
  if (valid) {
    return getAssignedLayerColor(layerIndex).clone();
  }
  return COLOR_NOT_ADDED.clone();
};

interface SnapshotBundle {
  group: Group;
  applyFloats: ReturnType<typeof getFloatGeometry>["applyTraceState"];
  applyFloatZOffsets: ReturnType<typeof getFloatGeometry>["applyZOffsets"];
  acnMeshes: Map<string, Mesh>;
  scoreOverlays: Map<number, Mesh>;
}

export interface CreateLayerSetGeometryBundle {
  group: Group;
  applyCreateLayerSetState: (
    state: CreateLayerSetTraceState,
    dimUntouched: boolean,
    scoreDepthEnabled: boolean,
    scoreDepthStrength: number,
  ) => void;
}

export const createLayerSetGeometry = (
  snapshots: Array<Array<CNFloat>>,
  warps: number,
  wefts: number,
): CreateLayerSetGeometryBundle => {
  const root = new Group();
  const bundles: SnapshotBundle[] = [];
  const CN_OFFSET = (CELL_SIZE * GAP_RATIO) / 2;

  for (const floats of snapshots) {
    const floatBundle = getFloatGeometry(floats, warps, wefts);
    const acnGroup = new Group();
    const scoreOverlayLocalWeft = new Group();
    const scoreOverlayLocalWarp = new Group();
    const acnMeshes = new Map<string, Mesh>();
    const scoreOverlays = new Map<number, Mesh>();

    const placeAcn = (ndx: ReturnType<typeof normalizeNdx>) => {
      const key = cnKey(ndx);
      if (acnMeshes.has(key)) {
        return;
      }
      const mesh = new Mesh(
        new SphereGeometry(CN_SIZE * 1.35, 18, 18),
        new MeshLambertMaterial({ color: COLOR_PENDING.clone() }),
      );
      let x = ndx.j * CELL_SIZE;
      let y = ndx.i * CELL_SIZE;
      if (ndx.id === 0) x -= CN_OFFSET;
      else if (ndx.id === 1) x += CN_OFFSET;
      else if (ndx.id === 2) y -= CN_OFFSET;
      else if (ndx.id === 3) y += CN_OFFSET;
      mesh.position.set(x, y, 0.14);
      acnMeshes.set(key, mesh);
      acnGroup.add(mesh);
    };

    for (const f of floats) {
      placeAcn(normalizeNdx(f.left, wefts, warps));
      placeAcn(normalizeNdx(f.right, wefts, warps));

      const x = f.left.j * CELL_SIZE;
      const y = f.left.i * CELL_SIZE;
      const geometry = f.face
        ? new PlaneGeometry(
          CELL_SIZE * GAP_RATIO,
          CELL_SIZE * (getWarpFloatLength(f, wefts) + 1),
        )
        : new PlaneGeometry(
          CELL_SIZE * (getWeftFloatLength(f, warps) + 1),
          CELL_SIZE * GAP_RATIO,
        );

      const overlay = new Mesh(
        geometry,
        new MeshLambertMaterial({
          color: SCORE_LOW.clone(),
          transparent: true,
          opacity: 0,
        }),
      );
      overlay.position.set(
        x + (geometry.parameters.width / 2),
        y + (geometry.parameters.height / 2),
        0.16,
      );
      if (f.face) {
        scoreOverlayLocalWarp.add(overlay);
      } else {
        scoreOverlayLocalWeft.add(overlay);
      }
      scoreOverlays.set(f.id, overlay);
    }

    acnGroup.applyMatrix4(new Matrix4().makeScale(VIEW_SCALE, -VIEW_SCALE, VIEW_SCALE));
    // Match floatAdapter's pre-scale transforms so overlays align exactly with float meshes.
    scoreOverlayLocalWeft.applyMatrix4(
      new Matrix4().makeTranslation(-(CELL_SIZE / 2), -(CELL_SIZE * GAP_RATIO / 2), 0),
    );
    scoreOverlayLocalWarp.applyMatrix4(
      new Matrix4().makeTranslation(-(CELL_SIZE * GAP_RATIO / 2), -(CELL_SIZE / 2), 0.0),
    );
    const scoreOverlayLocal = new Group();
    scoreOverlayLocal.add(scoreOverlayLocalWeft);
    scoreOverlayLocal.add(scoreOverlayLocalWarp);
    scoreOverlayLocal.applyMatrix4(new Matrix4().makeScale(VIEW_SCALE, -VIEW_SCALE, VIEW_SCALE));

    const snapshotGroup = new Group();
    snapshotGroup.add(floatBundle.group);
    snapshotGroup.add(scoreOverlayLocal);
    snapshotGroup.add(acnGroup);
    snapshotGroup.visible = false;
    root.add(snapshotGroup);
    bundles.push({
      group: snapshotGroup,
      applyFloats: floatBundle.applyTraceState,
      applyFloatZOffsets: floatBundle.applyZOffsets,
      acnMeshes,
      scoreOverlays,
    });
  }

  const applyCreateLayerSetState = (
    state: CreateLayerSetTraceState,
    dimUntouched: boolean,
    scoreDepthEnabled: boolean,
    scoreDepthStrength: number,
  ) => {
    const active = Math.max(0, Math.min(state.currentSnapshotIndex, bundles.length - 1));
    bundles.forEach((bundle, index) => {
      bundle.group.visible = index === active;
    });
    const bundle = bundles[active];
    if (!bundle) return;

    bundle.applyFloats(
      {
        currentFloatId: null,
        touchedIds: new Set(state.touchedFloatIds),
        assignedByLayer: new Map<number, number>(),
        assignedIds: new Set<number>(),
        attachedIds: new Set<number>(),
        currentLayer: state.currentLayerIndex,
        localRegionIds: new Set<number>(),
      },
      dimUntouched,
    );

    const zOffsets = new Map<number, number>();
    if (scoreDepthEnabled) {
      const strength = Math.max(0, scoreDepthStrength);
      for (const [floatId, score] of state.floatScoreByFloatId.entries()) {
        const t = state.maxFloatScore > 0 ? score / state.maxFloatScore : 0;
        zOffsets.set(floatId, strength * t);
      }
    }
    bundle.applyFloatZOffsets(zOffsets);

    for (const [key, mesh] of bundle.acnMeshes) {
      const mat = mesh.material as MeshLambertMaterial;
      const outcome = state.outcomeByAcn.get(key);
      const isCurrent = state.currentAcnKey === key;
      const isTouched = state.touchedAcnKeys.has(key);
      mat.transparent = true;
      if (isCurrent) {
        mat.color.copy(COLOR_CURRENT);
        mat.opacity = 1.0;
      } else if (isTouched) {
        mat.color.copy(COLOR_TOUCHED);
        mat.opacity = 0.95;
      } else if (outcome) {
        mat.color.copy(getOutcomeColor(outcome.layerIndex, outcome.valid));
        mat.opacity = 0.98;
      } else {
        mat.color.copy(COLOR_PENDING);
        mat.opacity = dimUntouched ? 0.35 : 0.85;
      }
    }

    for (const [floatId, overlay] of bundle.scoreOverlays) {
      const material = overlay.material as MeshLambertMaterial;
      const score = state.floatScoreByFloatId.get(floatId) ?? 0;
      const t = state.maxFloatScore > 0 ? score / state.maxFloatScore : 0;
      material.transparent = true;
      if (score > 0) {
        material.color.copy(SCORE_LOW).lerp(SCORE_HIGH, t);
        material.opacity = dimUntouched ? 0.42 : 0.6;
      } else {
        material.opacity = 0;
      }
    }
  };

  return { group: root, applyCreateLayerSetState };
};

