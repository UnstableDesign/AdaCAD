import {
  CatmullRomCurve3,
  Color,
  Group,
  Mesh,
  MeshLambertMaterial,
  Matrix4,
  Object3D,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  InstancedMesh,
} from "three";
import { CELL_SIZE, VIEW_SCALE } from "./simVars";
import { type SpringSystem } from "./springSim";

export interface SpringGeometryBundle {
  group: Group;
  setNodesVisible: (visible: boolean) => void;
  updateFromSystem: (system: SpringSystem) => void;
}

export const createSpringGeometry = (
  system: SpringSystem,
  options: { nodeRadius?: number; splineSamples?: number; yarnRadiusMultiplier?: number } = {},
): SpringGeometryBundle => {
  const group = new Group();
  const nodeRadius = options.nodeRadius ?? CELL_SIZE * 0.14;
  const splineSamples = Math.max(4, options.splineSamples ?? 8);
  const yarnRadius = nodeRadius * (options.yarnRadiusMultiplier ?? 0.85);
  /** Boundary springs (warp–weft cell links): thinner tubes than float yarns. */
  const boundaryYarnRadiusFactor = 0.42;

  const nodeGeometry = new SphereGeometry(nodeRadius, 16, 16);
  const nodeMaterial = new MeshLambertMaterial({ color: new Color("#66d9ff") });
  const nodeMesh = new InstancedMesh(nodeGeometry, nodeMaterial, system.nodes.size);
  const helper = new Object3D();
  let index = 0;
  for (const node of system.nodes.values()) {
    helper.position.set(node.position.x * CELL_SIZE, node.position.y * CELL_SIZE, node.position.z * CELL_SIZE * 0.2);
    helper.updateMatrix();
    nodeMesh.setMatrixAt(index, helper.matrix);
    index += 1;
  }
  group.add(nodeMesh);

  const floatSpringColor = new Color("#7c3aed");
  const springColorByType: Record<string, Color> = {
    boundary: new Color("#8b9eb7"),
    weft: new Color("#f25f5c"),
    warp: new Color("#2ec4ff"),
  };

  const yarnBySpringId: Array<{ id: string; mesh: Mesh; tubeRadius: number }> = [];

  for (const spring of system.springs.values()) {
    const a = system.nodes.get(spring.a);
    const b = system.nodes.get(spring.b);
    if (!a || !b) continue;



    const splineColor =
      spring.type === "float"
        ? floatSpringColor
        : springColorByType[spring.type] ?? new Color("#cbd5e1");

    const p0 = new Vector3(a.position.x * CELL_SIZE, a.position.y * CELL_SIZE, a.position.z * CELL_SIZE * 0.2);
    const p2 = new Vector3(b.position.x * CELL_SIZE, b.position.y * CELL_SIZE, b.position.z * CELL_SIZE * 0.2);
    const mid = p0.clone().add(p2).multiplyScalar(0.5);
    const sag = Math.min(0.08, p0.distanceTo(p2) * 0.04);
    mid.z += sag;
    const curve = new CatmullRomCurve3([p0, mid, p2], false, "catmullrom", 0.2);
    const tubeRadius =
      spring.type === "boundary" ? yarnRadius * boundaryYarnRadiusFactor : yarnRadius;
    const geom = new TubeGeometry(curve, splineSamples * 2, tubeRadius, 12, false);
    const isBoundary = spring.type === "boundary";
    const mat = new MeshLambertMaterial({
      color: splineColor,
      transparent: !isBoundary,
      opacity: isBoundary ? 1 : 0.98,
      depthWrite: true,
    });
    const yarn = new Mesh(geom, mat);
    group.add(yarn);
    yarnBySpringId.push({ id: spring.id, mesh: yarn, tubeRadius });
  }

  group.applyMatrix4(new Matrix4().makeScale(VIEW_SCALE, -VIEW_SCALE, VIEW_SCALE));
  return {
    group,
    setNodesVisible: (visible: boolean) => {
      nodeMesh.visible = visible;
    },
    updateFromSystem: (next: SpringSystem) => {
      let idx = 0;
      for (const node of next.nodes.values()) {
        helper.position.set(
          node.position.x * CELL_SIZE,
          node.position.y * CELL_SIZE,
          node.position.z * CELL_SIZE * 0.2,
        );
        helper.updateMatrix();
        nodeMesh.setMatrixAt(idx, helper.matrix);
        idx += 1;
      }
      nodeMesh.instanceMatrix.needsUpdate = true;

      for (const entry of yarnBySpringId) {
        const spring = next.springs.get(entry.id);
        if (!spring) continue;
        const a = next.nodes.get(spring.a);
        const b = next.nodes.get(spring.b);
        if (!a || !b) continue;

        const p0 = new Vector3(
          a.position.x * CELL_SIZE,
          a.position.y * CELL_SIZE,
          a.position.z * CELL_SIZE * 0.2,
        );
        const p2 = new Vector3(
          b.position.x * CELL_SIZE,
          b.position.y * CELL_SIZE,
          b.position.z * CELL_SIZE * 0.2,
        );
        const mid = p0.clone().add(p2).multiplyScalar(0.5);
        const sag = Math.min(0.08, p0.distanceTo(p2) * 0.04);
        mid.z += sag;
        const curve = new CatmullRomCurve3([p0, mid, p2], false, "catmullrom", 0.2);

        const newGeom = new TubeGeometry(curve, splineSamples * 2, entry.tubeRadius, 12, false);
        entry.mesh.geometry.dispose();
        entry.mesh.geometry = newGeom;
      }
    },
  };
};
