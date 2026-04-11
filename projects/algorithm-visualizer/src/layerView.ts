// import {
//     CanvasTexture,
//     Color,
//     Group,
//     Matrix4,
//     Mesh,
//     MeshLambertMaterial,
//     PlaneGeometry,
//     Sprite,
//     SpriteMaterial,
// } from "three";
// import { getLayer, layer, type CNFloat, type ContactNeighborhood } from "adacad-drafting-lib";
// import { CELL_SIZE, GAP_RATIO, LAYER_SPACING, VIEW_SCALE } from "./simVars";



// /**
//  * PRINTS THE CNS AFTER LAYERS HAVE BEEN ISOLATED
//  * @param layeredCNs 
//  * @returns 
//  */
// export const getLayerView = (layeredCNs: Array<ContactNeighborhood>): Group => {

//     const weftFloats = new Group();
//     const warpFloats = new Group();
//     const group = new Group();

//     const weftFloatMat = new MeshLambertMaterial({ color: new Color("#FFFFFF") });
//     const warpFloatMat = new MeshLambertMaterial({ color: new Color("#000000") });



//     console.log("FLOATS", floats);


//     for (let fndx = 0; fndx < floats.length; fndx++) {
//         const float = floats[fndx];
//         const ndx = float.left;
//         const x = (ndx.j * CELL_SIZE);
//         const y = (ndx.i * CELL_SIZE);



//         //warp float
//         if (float.face) {
//             const planeGeometry = new PlaneGeometry(
//                 CELL_SIZE * GAP_RATIO,
//                 CELL_SIZE * (getWarpFloatLength(float, wefts) + 1)
//             );
//             const mesh = new Mesh(planeGeometry, warpFloatMat);

//             mesh.position.set(x + (planeGeometry.parameters.width / 2), y + (planeGeometry.parameters.height / 2), 0.1);
//             warpFloats.add(mesh);

//             const idLabel = makeFloatIdLabel(float.id, "#FFFFFF");
//             idLabel.position.set(mesh.position.x, mesh.position.y, mesh.position.z + 0.05);
//             warpFloats.add(idLabel);
//         } else {
//             const planeGeometry = new PlaneGeometry(
//                 CELL_SIZE * (getWeftFloatLength(float, warps) + 1),
//                 CELL_SIZE * GAP_RATIO
//             );

//             const mesh = new Mesh(planeGeometry, weftFloatMat);
//             mesh.position.set(x + (planeGeometry.parameters.width / 2), y + (planeGeometry.parameters.height / 2), 0.1);
//             weftFloats.add(mesh);

//             const idLabel = makeFloatIdLabel(float.id, "#000000");
//             idLabel.position.set(mesh.position.x, mesh.position.y, mesh.position.z + 0.05);
//             weftFloats.add(idLabel);
//         }
//     }

//     const weftTransform = new Matrix4().makeTranslation(-(CELL_SIZE / 2), -(CELL_SIZE * GAP_RATIO / 2), 0);
//     weftFloats.applyMatrix4(weftTransform);

//     const warpTransform = new Matrix4().makeTranslation(-(CELL_SIZE * GAP_RATIO / 2), -(CELL_SIZE / 2), 0.0);
//     warpFloats.applyMatrix4(warpTransform);

//     group.add(weftFloats);
//     group.add(warpFloats);


//     const gridTransform = new Matrix4().makeScale(VIEW_SCALE, -VIEW_SCALE, VIEW_SCALE);
//     group.applyMatrix4(gridTransform);



//     return group;
// };


