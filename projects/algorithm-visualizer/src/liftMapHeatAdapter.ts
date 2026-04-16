import { type CNFloat } from "adacad-drafting-lib";
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
import { getWarpFloatLength, getWeftFloatLength } from "./floatAdapter";
import { CELL_SIZE, GAP_RATIO, VIEW_SCALE } from "./simVars";
import { type CreateLayerSetHeatTraceState } from "./traceTypes";

interface HeatSnapshotBundle {
  group: Group;
  floatMeshes: Map<number, Mesh>;
  floatLabels: Map<number, Sprite>;
  floats: Array<CNFloat>;
}

export interface LiftMapHeatGeometryBundle {
  group: Group;
  applyHeatState: (
    state: CreateLayerSetHeatTraceState,
    dimUntouched: boolean,
    heatGamma: number,
  ) => void;
}

const BASE_WEFT = new Color("#1a1a1a");
const BASE_WARP = new Color("#101010");
const HEAT_LOW = new Color("#1e88e5");
const HEAT_HIGH = new Color("#ff3d00");

const makeFrequencyLabel = (value: number): Sprite => {
  const canvas = document.createElement("canvas");
  canvas.width = 220;
  canvas.height = 84;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new Sprite(new SpriteMaterial({ color: new Color("#f8f8f8") }));
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f8f8f8";
  ctx.font = "bold 34px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${value}`, canvas.width / 2, canvas.height / 2);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new SpriteMaterial({ map: texture, transparent: true });
  const sprite = new Sprite(material);
  sprite.scale.set(CELL_SIZE * 1.6, CELL_SIZE * 0.62, 1);
  return sprite;
};

const updateFrequencyLabel = (sprite: Sprite, value: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = 220;
  canvas.height = 84;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f8f8f8";
  ctx.font = "bold 34px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${value}`, canvas.width / 2, canvas.height / 2);
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  sprite.material = new SpriteMaterial({ map: texture, transparent: true });
};

export const createLiftMapHeatGeometry = (
  snapshots: Array<Array<CNFloat>>,
  warps: number,
  wefts: number,
): LiftMapHeatGeometryBundle => {
  console.log("createLiftMapHeatGeometry", snapshots);
  const root = new Group();
  const bundles: HeatSnapshotBundle[] = [];

  for (const floats of snapshots) {
    const weftFloats = new Group();
    const warpFloats = new Group();
    const snapshotGroup = new Group();
    const floatMeshes = new Map<number, Mesh>();
    const floatLabels = new Map<number, Sprite>();

    for (const f of floats) {
      const x = f.left.j * CELL_SIZE;
      const y = f.left.i * CELL_SIZE;
      if (f.face) {
        const geometry = new PlaneGeometry(
          CELL_SIZE * GAP_RATIO,
          CELL_SIZE * (getWarpFloatLength(f, wefts) + 1),
        );
        const mesh = new Mesh(geometry, new MeshLambertMaterial({ color: BASE_WARP.clone() }));
        mesh.position.set(x + geometry.parameters.width / 2, y + geometry.parameters.height / 2, 0.1);
        warpFloats.add(mesh);
        floatMeshes.set(f.id, mesh);
        const label = makeFrequencyLabel(0);
        label.position.set(mesh.position.x, mesh.position.y, mesh.position.z + 0.09);
        warpFloats.add(label);
        floatLabels.set(f.id, label);
      } else {
        const geometry = new PlaneGeometry(
          CELL_SIZE * (getWeftFloatLength(f, warps) + 1),
          CELL_SIZE * GAP_RATIO,
        );
        const mesh = new Mesh(geometry, new MeshLambertMaterial({ color: BASE_WEFT.clone() }));
        mesh.position.set(x + geometry.parameters.width / 2, y + geometry.parameters.height / 2, 0.1);
        weftFloats.add(mesh);
        floatMeshes.set(f.id, mesh);
        const label = makeFrequencyLabel(0);
        label.position.set(mesh.position.x, mesh.position.y, mesh.position.z + 0.09);
        weftFloats.add(label);
        floatLabels.set(f.id, label);
      }
    }

    weftFloats.applyMatrix4(new Matrix4().makeTranslation(-(CELL_SIZE / 2), -(CELL_SIZE * GAP_RATIO / 2), 0));
    warpFloats.applyMatrix4(new Matrix4().makeTranslation(-(CELL_SIZE * GAP_RATIO / 2), -(CELL_SIZE / 2), 0.0));
    snapshotGroup.add(weftFloats);
    snapshotGroup.add(warpFloats);
    snapshotGroup.applyMatrix4(new Matrix4().makeScale(VIEW_SCALE, -VIEW_SCALE, VIEW_SCALE));
    snapshotGroup.visible = false;
    root.add(snapshotGroup);
    bundles.push({ group: snapshotGroup, floatMeshes, floatLabels, floats });
  }

  const applyHeatState = (
    state: CreateLayerSetHeatTraceState,
    dimUntouched: boolean,
    heatGamma: number,
  ) => {
    console.log("applyHeatState", state);
    const active = Math.max(0, Math.min(state.currentSnapshotIndex, bundles.length - 1));
    bundles.forEach((bundle, index) => {
      bundle.group.visible = index === active;
    });
    const bundle = bundles[active];
    if (!bundle) return;

    for (const f of bundle.floats) {
      const mesh = bundle.floatMeshes.get(f.id);
      if (!mesh) continue;
      const material = mesh.material as MeshLambertMaterial;
      const label = bundle.floatLabels.get(f.id);
      const count = state.touchedFrequencyByFloatId.get(f.id) ?? 0;
      const raw = state.maxFrequency > 0 ? count / state.maxFrequency : 0;
      const gamma = Math.max(0.05, heatGamma);
      const t = Math.pow(raw, gamma);
      material.transparent = true;
      if (count > 0) {
        material.color.copy(HEAT_LOW).lerp(HEAT_HIGH, t);
        material.opacity = 0.95;
      } else {
        material.color.copy(f.face ? BASE_WARP : BASE_WEFT);
        material.opacity = dimUntouched ? 0.22 : 0.9;
      }
      if (label) {
        label.visible = count > 0;
        label.material.opacity = count > 0 ? 0.95 : 0;
        if (count > 0) {
          updateFrequencyLabel(label, count);
        }
      }
    }
  };

  return { group: root, applyHeatState };
};

