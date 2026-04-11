import {
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
} from "three";
import { isSet, isUp, type Draft, warps, wefts } from "adacad-drafting-lib";
import { CELL_SIZE, GAP_RATIO, VIEW_SCALE } from "./simVars";



export const createDraftGeometryGroup = (draft: Draft): Group => {
  const rows = wefts(draft.drawdown);
  const columns = warps(draft.drawdown);
  const maxInstances = rows * columns;

  const group = new Group();
  const upMaterial = new MeshLambertMaterial({ color: new Color("#000000") });
  const downMaterial = new MeshLambertMaterial({ color: new Color("#ffffff") });
  const unsetMaterial = new MeshLambertMaterial({ color: new Color("#666666") });

  const geometry = new PlaneGeometry(
    CELL_SIZE * GAP_RATIO,
    CELL_SIZE * GAP_RATIO,
  );

  const upMesh = new InstancedMesh(geometry, upMaterial, maxInstances);
  const downMesh = new InstancedMesh(geometry, downMaterial, maxInstances);
  const unsetMesh = new InstancedMesh(geometry, unsetMaterial, maxInstances);

  let upCount = 0;
  let downCount = 0;
  let unsetCount = 0;
  const helper = new Object3D();


  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = column * CELL_SIZE;
      const y = row * CELL_SIZE;

      helper.position.set(x, y, 0);

      if (!isSet(draft.drawdown, row, column)) {
        helper.updateMatrix();
        unsetMesh.setMatrixAt(unsetCount, helper.matrix);
        unsetCount += 1;
        continue;
      }

      if (isUp(draft.drawdown, row, column)) {
        helper.updateMatrix();
        upMesh.setMatrixAt(upCount, helper.matrix);
        upCount += 1;
      } else {
        helper.updateMatrix();
        downMesh.setMatrixAt(downCount, helper.matrix);
        downCount += 1;
      }
    }
  }

  upMesh.count = upCount;
  downMesh.count = downCount;
  unsetMesh.count = unsetCount;

  const gridTransform = new Matrix4().makeScale(VIEW_SCALE, -VIEW_SCALE, VIEW_SCALE);
  upMesh.applyMatrix4(gridTransform);
  downMesh.applyMatrix4(gridTransform);
  unsetMesh.applyMatrix4(gridTransform);

  group.add(upMesh);
  group.add(downMesh);
  group.add(unsetMesh);

  return group;
};
