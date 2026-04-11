import {
    Color,
    Group,
    InstancedMesh,
    Matrix4,
    MeshLambertMaterial,
    Object3D,
    SphereGeometry,
} from "three";
import { type ContactNeighborhood } from "adacad-drafting-lib";
import { CELL_SIZE, GAP_RATIO, VIEW_SCALE, CN_SIZE } from "./simVars";


export const createTopologyGeometry = (cns: Array<ContactNeighborhood>, warps: number, wefts: number): Group => {
    void warps;
    void wefts;
    const maxInstances = cns.length;

    const group = new Group();

    const acnMat = new MeshLambertMaterial({ color: new Color("#FF0000") });
    const pcnMat = new MeshLambertMaterial({ color: new Color("#0000FF") });
    const ecnMat = new MeshLambertMaterial({ color: new Color("#000000") });
    const vcnMat = new MeshLambertMaterial({ color: new Color("#00FF00") });


    const cnGeometry = new SphereGeometry(
        CN_SIZE
    );

    const acnMesh = new InstancedMesh(cnGeometry, acnMat, maxInstances);
    const pcnMesh = new InstancedMesh(cnGeometry, pcnMat, maxInstances);
    const ecnMesh = new InstancedMesh(cnGeometry, ecnMat, maxInstances);
    const vcnMesh = new InstancedMesh(cnGeometry, vcnMat, maxInstances);


    const helper = new Object3D();


    let acnCount = 0;
    let ecnCount = 0;
    let pcnCount = 0;
    let vcnCount = 0;

    for (let cnndx = 0; cnndx < cns.length; cnndx++) {
        const cn = cns[cnndx];
        const ndx = cn.ndx;
        const x = ndx.j * CELL_SIZE;
        const y = ndx.i * CELL_SIZE;
        const z = 0;

        helper.position.set(x, y, z);

        const CN_OFFSET = (CELL_SIZE * GAP_RATIO / 2);
        switch (cn.ndx.id) {
            case 0:
                helper.position.x = x - CN_OFFSET;
                break;
            case 1:
                helper.position.x = x + CN_OFFSET;
                break;
            case 2:
                helper.position.y = y - CN_OFFSET;
                break;
            case 3:
                helper.position.y = y + CN_OFFSET;
                break;
        }

        helper.updateMatrix();

        switch (cn.node_type) {
            case 'ACN':
                acnMesh.setMatrixAt(acnCount, helper.matrix);
                acnCount += 1;
                break;
            case 'ECN':
                ecnMesh.setMatrixAt(ecnCount, helper.matrix);
                ecnCount += 1;
                break;
            case 'PCN':
                pcnMesh.setMatrixAt(pcnCount, helper.matrix);
                pcnCount += 1;
                break;
            case 'VCN':
                vcnMesh.setMatrixAt(vcnCount, helper.matrix);
                vcnCount += 1;
                break;
        }

    }

    acnMesh.count = acnCount;
    ecnMesh.count = ecnCount;
    pcnMesh.count = pcnCount;
    vcnMesh.count = vcnCount;
    const gridTransform = new Matrix4().makeScale(VIEW_SCALE, -VIEW_SCALE, VIEW_SCALE);
    acnMesh.applyMatrix4(gridTransform);
    ecnMesh.applyMatrix4(gridTransform);
    pcnMesh.applyMatrix4(gridTransform);
    vcnMesh.applyMatrix4(gridTransform);
    group.add(acnMesh);
    group.add(ecnMesh);
    group.add(pcnMesh);
    group.add(vcnMesh);
    return group;
};
