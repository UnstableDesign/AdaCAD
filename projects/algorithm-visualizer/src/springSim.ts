import { getCellValue, modStrict, type CNFloat, type Drawdown } from "adacad-drafting-lib";
import { normalizeNdx } from "./liftMap";
import * as THREE from 'three';
type NodeId = string;
type SpringId = string;


export type NodeState = {
    id: NodeId;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    force: THREE.Vector3;
    mass: number;
    pinned: boolean;
};

export type SpringState = {
    id: SpringId;
    a: NodeId;
    b: NodeId;
    restLength: number;
    maxStretchFactor: number;
    stiffness: number;
    damping: number;
    type: "float" | "boundary" | "weft" | "warp";
    /** Set for boundary springs after build: sign of (b.z − a.z) at snapshot; used to forbid z crossing. */
    boundaryZOrderSign?: 1 | -1;
};

export type SpringSystem = {
    nodes: Map<NodeId, NodeState>;
    springs: Map<SpringId, SpringState>;
    nodeToSprings: Map<NodeId, SpringId[]>;
    perNodeStartingForce: Map<NodeId, THREE.Vector3>;

};

export interface SpringBuildOptions {
    perNodeForceMultiplier: number;
    floatScoreZMultiplier: number;
    floatSpringShrinkFactor: number;
}

const DEFAULT_BUILD_OPTIONS: SpringBuildOptions = {
    perNodeForceMultiplier: 1,
    floatScoreZMultiplier: 100,
    floatSpringShrinkFactor: 0,
};


const pushToSpringList = (springId: SpringId, system: SpringSystem) => {
    const spring = system.springs.get(springId);
    if (spring) {
        system.nodeToSprings.set(spring.a, [...(system.nodeToSprings.get(spring.a) ?? []), springId]);
        system.nodeToSprings.set(spring.b, [...(system.nodeToSprings.get(spring.b) ?? []), springId]);
    }
    return system;
}





const initSpringSystem = (system: SpringSystem, drawdown: Drawdown, wefts: number, warps: number): SpringSystem => {


    system.perNodeStartingForce = new Map();
    for (let i = 0; i < wefts; i++) {
        for (let j = 0; j < warps; j++) {
            system.perNodeStartingForce.set(`${i}-${j}-warp`, new THREE.Vector3(0, 0, 0));
            system.perNodeStartingForce.set(`${i}-${j}-weft`, new THREE.Vector3(0, 0, 0));
        }
    }


    //Create Two Nodes at each cell, one that will correspond to warp at this location, and one the weft 
    for (let i = 0; i < wefts; i++) {
        for (let j = 0; j < warps; j++) {
            const warpNode: NodeState = {
                id: `${i}-${j}-warp`,
                position: new THREE.Vector3(j, i, 0),
                velocity: new THREE.Vector3(0, 0, 0),
                force: new THREE.Vector3(0, 0, 0),
                mass: 1,
                pinned: false,
            };
            const weftNode: NodeState = {
                id: `${i}-${j}-weft`,
                position: new THREE.Vector3(j, i, 0),
                velocity: new THREE.Vector3(0, 0, 0),
                force: new THREE.Vector3(0, 0, 0),
                mass: 1,
                pinned: false,
            };

            //higher number = closer to viewer
            const value = getCellValue(drawdown[i][j]);
            if (value == true) {
                warpNode.position.z = 10;
                weftNode.position.z = 0;
            } else {
                warpNode.position.z = 0;
                weftNode.position.z = 10;
            }

            system.nodes.set(warpNode.id, warpNode);
            system.nodes.set(weftNode.id, weftNode);

            const spring: SpringState = {
                id: `${warpNode.id}-${weftNode.id}`,
                a: warpNode.id,
                b: weftNode.id,
                restLength: 1,
                maxStretchFactor: 1.0,
                stiffness: 1,
                damping: 0.1,
                type: "boundary",
            };

            system.springs.set(spring.id, spring);
            system = pushToSpringList(spring.id, system);


        }
    }

    //add springs between the weft nodes and the warp nodes
    for (let i = 0; i < wefts; i++) {
        for (let j = 0; j < warps - 1; j++) {
            const weftNode = system.nodes.get(`${i}-${j}-weft`);
            const nextWeftNode = system.nodes.get(`${i}-${j + 1}-weft`);
            if (weftNode && nextWeftNode) {
                const spring: SpringState = {
                    id: `${weftNode.id}-${nextWeftNode.id}`,
                    a: weftNode.id,
                    b: nextWeftNode.id,
                    restLength: 1,
                    maxStretchFactor: 1.0,
                    stiffness: 1,
                    damping: 0.1,
                    type: "weft",
                };
                system.springs.set(spring.id, spring);
                system = pushToSpringList(spring.id, system);
            }
        }
    }

    //add springs between the warp nodes 
    for (let j = 0; j < warps; j++) {
        for (let i = 0; i < wefts - 1; i++) {
            const warpNode = system.nodes.get(`${i}-${j}-warp`);
            const nextWarpNode = system.nodes.get(`${i + 1}-${j}-warp`);
            if (warpNode && nextWarpNode) {
                const spring: SpringState = {
                    id: `${warpNode.id}-${nextWarpNode.id}`,
                    a: warpNode.id,
                    b: nextWarpNode.id,
                    restLength: 1, //make this less
                    maxStretchFactor: 1.0,
                    stiffness: 1,
                    damping: 0.1,
                    type: "warp",
                };

                system.springs.set(spring.id, spring);
                system = pushToSpringList(spring.id, system);
            }
        }
    }




    return system;

}


//these will bind at x and y

export const addSpringsAtWeftFloats = (
    system: SpringSystem,
    floats: Array<CNFloat>,
    wefts: number,
    warps: number,
    options: SpringBuildOptions = DEFAULT_BUILD_OPTIONS,
) => {

    const shrinkFactor = options.floatSpringShrinkFactor;
    const weftsFloats = floats.filter(el => el.face == false);

    for (const f of weftsFloats) {


        const length = f.right.j - f.left.j;
        if (length <= 1) continue;


        const left_weft_ndx = normalizeNdx(f.left, wefts, warps);
        const right_weft_ndx = normalizeNdx(f.right, wefts, warps);
        const left_weft_node = system.nodes.get(`${left_weft_ndx.i}-${left_weft_ndx.j}-weft`);
        const right_weft_node = system.nodes.get(`${right_weft_ndx.i}-${right_weft_ndx.j}-weft`);

        if (!left_weft_node || !right_weft_node) {
            continue;
        }


        //this float wrapped around the boundary so we actually need to split it into two floats
        if (left_weft_ndx.j > right_weft_ndx.j) {

            const start_weft_node = system.nodes.get(`${left_weft_ndx.i}-0-weft`);
            const end_weft_node = system.nodes.get(`${right_weft_ndx.i}-${warps - 1}-weft`);
            if (!start_weft_node || !end_weft_node) {
                continue;
            }

            const start_len = right_weft_ndx.j;
            if (start_len > 1) {
                const spring_left: SpringState = {
                    id: `${start_weft_node.id}-${right_weft_node.id}`,
                    a: start_weft_node.id,
                    b: right_weft_node.id,
                    restLength: start_len - shrinkFactor,
                    maxStretchFactor: 1,
                    stiffness: 1,
                    damping: 0.1,
                    type: "float",
                }
                system.springs.set(spring_left.id, spring_left);
                system = pushToSpringList(spring_left.id, system);
            }



            const end_len = warps - 1 - left_weft_ndx.j;
            if (end_len > 1) {
                const spring_right: SpringState = {
                    id: `${left_weft_node.id}-${end_weft_node.id}`,
                    a: left_weft_node.id,
                    b: end_weft_node.id,
                    restLength: end_len - shrinkFactor,
                    maxStretchFactor: 1,
                    stiffness: 1,
                    damping: 0.1,
                    type: "float",
                }
                system.springs.set(spring_right.id, spring_right);
                system = pushToSpringList(spring_right.id, system);

            }

        } else {

            const float_spring: SpringState = {
                id: `${left_weft_node.id}-${right_weft_node.id}`,
                a: left_weft_node.id,
                b: right_weft_node.id,
                restLength: length - shrinkFactor,
                maxStretchFactor: 1,
                stiffness: 1,
                damping: 0.1,
                type: "float",
            };

            console.log("adding spring between left and right", float_spring.id);
            system.springs.set(float_spring.id, float_spring);
            system = pushToSpringList(float_spring.id, system);

        };






    }





    return system;

}




export const addSpringsAtWarpFloats = (
    system: SpringSystem,
    floats: Array<CNFloat>,
    wefts: number,
    warps: number,
    options: SpringBuildOptions = DEFAULT_BUILD_OPTIONS,
) => {

    const shrinkFactor = options.floatSpringShrinkFactor;
    const warpFloats = floats.filter(el => el.face == true);

    for (const f of warpFloats) {
        console.log("adding springs at warp floats", f.id);


        const length = f.right.i - f.left.i;
        if (length <= 1) continue;


        const left_warp_ndx = normalizeNdx(f.left, wefts, warps);
        const right_warp_ndx = normalizeNdx(f.right, wefts, warps);
        const left_warp_node = system.nodes.get(`${left_warp_ndx.i}-${left_warp_ndx.j}-warp`);
        const right_warp_node = system.nodes.get(`${right_warp_ndx.i}-${right_warp_ndx.j}-warp`);

        if (!left_warp_node || !right_warp_node) {
            continue;
        }


        //this float wrapped around the boundary so we actually need to split it into two floats
        if (left_warp_ndx.i > right_warp_ndx.i) {

            const start_warp_node = system.nodes.get(`0-${left_warp_ndx.j}-warp`);
            const end_warp_node = system.nodes.get(`${wefts - 1}-${left_warp_ndx.j}-warp`);
            if (!start_warp_node || !end_warp_node) {
                continue;
            }

            const start_len = right_warp_ndx.i;
            if (start_len > 1) {
                const spring_left: SpringState = {
                    id: `${start_warp_node.id}-${right_warp_node.id}`,
                    a: start_warp_node.id,
                    b: right_warp_node.id,
                    restLength: start_len - shrinkFactor,
                    maxStretchFactor: 1,
                    stiffness: 1,
                    damping: 0.1,
                    type: "float",
                }
                console.log("adding warp float spring left to start", spring_left.id);
                system.springs.set(spring_left.id, spring_left);
                system = pushToSpringList(spring_left.id, system);
            }



            const end_len = wefts - 1 - left_warp_ndx.i;
            if (end_len > 1) {
                const spring_right: SpringState = {
                    id: `${left_warp_node.id}-${end_warp_node.id}`,
                    a: left_warp_node.id,
                    b: end_warp_node.id,
                    restLength: end_len - shrinkFactor,
                    maxStretchFactor: 1,
                    stiffness: 1,
                    damping: 0.1,
                    type: "float",
                }
                console.log("adding warp float spring right to end", spring_right.id);
                system.springs.set(spring_right.id, spring_right);
                system = pushToSpringList(spring_right.id, system);

            }

        } else {

            const float_spring: SpringState = {
                id: `${left_warp_node.id}-${right_warp_node.id}`,
                a: left_warp_node.id,
                b: right_warp_node.id,
                restLength: length - shrinkFactor,
                maxStretchFactor: 1,
                stiffness: 1,
                damping: 0.1,
                type: "float",
            };

            console.log("adding warp float spring between left and right", float_spring.id);
            system.springs.set(float_spring.id, float_spring);
            system = pushToSpringList(float_spring.id, system);

        };






    }





    return system;

}


const positionFloatSpringNodes = (
    system: SpringSystem,
    float: CNFloat,
    floatScores: Map<number, number>,
    wefts: number,
    warps: number,
    options: SpringBuildOptions = DEFAULT_BUILD_OPTIONS,
) => {

    const face = float.face;
    const float_score = floatScores.get(float.id) ?? 0;
    const float_score_multiplier = options.floatScoreZMultiplier;
    const ndxList = [];

    if (face == true) {

        for (let i = float.left.i; i <= float.right.i; i++) {
            const ndx = normalizeNdx({ i: i, j: float.left.j, id: 0 }, wefts, warps);
            ndxList.push(ndx);
        }
    } else {
        for (let j = float.left.j; j <= float.right.j; j++) {
            const ndx = normalizeNdx({ i: float.left.i, j: j, id: 0 }, wefts, warps);
            ndxList.push(ndx);
        }
    }


    for (const ndx of ndxList) {
        const weft_node = system.nodes.get(`${ndx.i}-${ndx.j}-weft`);
        const warp_node = system.nodes.get(`${ndx.i}-${ndx.j}-warp`);
        if (!weft_node || !warp_node) {
            continue;
        }
        if (face) {
            warp_node.position.z = float_score * float_score_multiplier;
            system.perNodeStartingForce.set(
                weft_node.id,
                new THREE.Vector3(0, 0, -10 * options.perNodeForceMultiplier),
            );
            system.perNodeStartingForce.set(
                warp_node.id,
                new THREE.Vector3(0, 0, 10 * options.perNodeForceMultiplier),
            );
        } else {
            weft_node.position.z = float_score * float_score_multiplier;

            system.perNodeStartingForce.set(
                weft_node.id,
                new THREE.Vector3(0, 0, 10 * options.perNodeForceMultiplier),
            );
            system.perNodeStartingForce.set(
                warp_node.id,
                new THREE.Vector3(0, 0, -10 * options.perNodeForceMultiplier),
            );
        }
    }


    return system;


}





const setPositions = (
    system: SpringSystem,
    floats: Array<CNFloat>,
    floatScores: Map<number, number>,
    wefts: number,
    warps: number,
    options: SpringBuildOptions = DEFAULT_BUILD_OPTIONS,
): SpringSystem => {





    for (let i = 0; i < wefts; i++) {
        const weftFloats = floats.filter(el => modStrict(el.left.i, wefts) == i);
        for (const float of weftFloats) {
            system = positionFloatSpringNodes(system, float, floatScores, wefts, warps, options);
        }
    }

    for (let j = 0; j < warps; j++) {
        const warpFloats = floats.filter(el => modStrict(el.left.j, warps) == j);
        for (const float of warpFloats) {
            system = positionFloatSpringNodes(system, float, floatScores, wefts, warps, options);
        }
    }
    return system;
}


export const createSpringSystem = (
    system: SpringSystem,
    floats: Array<CNFloat>,
    floatScores: Map<number, number>,
    drawdown: Drawdown,
    wefts: number,
    warps: number,
    options: Partial<SpringBuildOptions> = {},
): SpringSystem => {

    const buildOptions: SpringBuildOptions = { ...DEFAULT_BUILD_OPTIONS, ...options };
    const springSystem = initSpringSystem(system, drawdown, wefts, warps);
    const positionedSpringSystem = setPositions(springSystem, floats, floatScores, wefts, warps, buildOptions);
    const weftFloatEdgesSpringSystem = addSpringsAtWeftFloats(positionedSpringSystem, floats, wefts, warps, buildOptions);
    const warpFloatEdgesSpringSystem = addSpringsAtWarpFloats(weftFloatEdgesSpringSystem, floats, wefts, warps, buildOptions);
    snapshotBoundaryZOrder(warpFloatEdgesSpringSystem);
    console.log("Float Scores", floatScores);
    console.log("perNodeStartingForce", [...system.perNodeStartingForce.entries()]);
    return warpFloatEdgesSpringSystem;
}

export interface SpringStepOptions {
    gravity: number;
    stiffnessScale: number;
    dampingScale: number;
    globalDamping: number;
    boundaryMaxStretchAdd: number;
    floatMaxStretchAdd: number;
    packStrength: number;
    /** Minimum |b.z − a.z| along the snapshot sign for boundary springs (prevents crossing in z). */
    boundaryZMinSeparation: number;
}

const DEFAULT_STEP_OPTIONS: SpringStepOptions = {
    gravity: 1.0,
    stiffnessScale: 1.0,
    dampingScale: 1.0,
    globalDamping: 0.98,
    boundaryMaxStretchAdd: 0.25,
    floatMaxStretchAdd: 0.1,
    packStrength: 1.0,
    boundaryZMinSeparation: 1,
};

const getSpringMaxLength = (spring: SpringState, options: SpringStepOptions): number => {
    const additive =
        spring.type === "boundary"
            ? options.boundaryMaxStretchAdd
            : spring.type === "float"
                ? options.floatMaxStretchAdd
                : 0;
    const stretchFactor = Math.max(0.01, spring.maxStretchFactor + additive);
    return spring.restLength * stretchFactor;
};

const resetForces = (system: SpringSystem) => {
    for (const node of system.nodes.values()) {
        node.force.set(0, 0, 0);
    }
};

const accumulateSpringForces = (system: SpringSystem, options: SpringStepOptions) => {
    const delta = new THREE.Vector3();
    const relVel = new THREE.Vector3();
    const f = new THREE.Vector3();

    for (const spring of system.springs.values()) {
        const a = system.nodes.get(spring.a);
        const b = system.nodes.get(spring.b);
        if (!a || !b) continue;

        const maxLength = getSpringMaxLength(spring, options);

        delta.subVectors(b.position, a.position);
        const dist = delta.length();
        if (dist === 0) continue;

        const dir = delta.multiplyScalar(1 / dist);
        const effectiveDistance = Math.min(dist, maxLength);
        const stretch = effectiveDistance - spring.restLength;
        const forceMag = -spring.stiffness * options.stiffnessScale * stretch;

        relVel.subVectors(b.velocity, a.velocity);
        const dampingMag = -spring.damping * options.dampingScale * relVel.dot(dir);

        f.copy(dir).multiplyScalar(forceMag + dampingMag);

        if (!a.pinned) {
            a.force.add(f);
        }
        if (!b.pinned) {
            b.force.sub(f);
        }
    }
};

const applyExternalForces = (system: SpringSystem, _options: SpringStepOptions) => {
    for (const node of system.nodes.values()) {
        if (node.pinned) continue;

        //  node.force.addScaledVector(ThreeMFLoader., node.mass * _options.gravity);


        // per-node force
        const custom = system.perNodeStartingForce.get(node.id);
        if (custom) node.force.add(custom);
    }


};

const integrate = (system: SpringSystem, dt: number, options: SpringStepOptions) => {
    const clampedDt = Math.min(dt, 0.03);
    for (const node of system.nodes.values()) {
        if (node.pinned) continue;
        const accel = new THREE.Vector3().copy(node.force).multiplyScalar(1 / node.mass);
        node.velocity.addScaledVector(accel, clampedDt);
        node.velocity.multiplyScalar(options.globalDamping);
        node.position.addScaledVector(node.velocity, clampedDt);
    }
};

/** Snapshots sign(b.z − a.z) for each boundary spring from current positions (call after initial layout). */
export const snapshotBoundaryZOrder = (system: SpringSystem): void => {
    const snapEps = 1e-9;
    for (const spring of system.springs.values()) {
        if (spring.type !== "boundary") continue;
        const a = system.nodes.get(spring.a);
        const b = system.nodes.get(spring.b);
        if (!a || !b) continue;
        const dz = b.position.z - a.position.z;
        spring.boundaryZOrderSign = dz > snapEps ? 1 : dz < -snapEps ? -1 : 1;
    }
};

const enforceBoundaryZOrder = (system: SpringSystem, options: SpringStepOptions) => {
    const eps = options.boundaryZMinSeparation;
    for (const spring of system.springs.values()) {
        if (spring.type !== "boundary" || spring.boundaryZOrderSign === undefined) continue;
        const a = system.nodes.get(spring.a);
        const b = system.nodes.get(spring.b);
        if (!a || !b) continue;

        const dz = b.position.z - a.position.z;
        const sign0 = spring.boundaryZOrderSign;

        let correction = 0;
        if (sign0 > 0 && dz < eps) {
            correction = eps - dz;
        } else if (sign0 < 0 && dz > -eps) {
            correction = -eps - dz;
        }
        if (correction === 0) continue;

        if (!a.pinned && !b.pinned) {
            b.position.z += correction * 0.5;
            a.position.z -= correction * 0.5;
        } else if (a.pinned && !b.pinned) {
            b.position.z += correction;
        } else if (!a.pinned && b.pinned) {
            a.position.z -= correction;
        }
    }
};

const enforceMaxStretchConstraints = (system: SpringSystem, options: SpringStepOptions) => {
    const delta = new THREE.Vector3();
    for (const spring of system.springs.values()) {
        const a = system.nodes.get(spring.a);
        const b = system.nodes.get(spring.b);
        if (!a || !b) continue;

        const maxLength = getSpringMaxLength(spring, options);

        delta.subVectors(b.position, a.position);
        const dist = delta.length();
        if (dist <= maxLength || dist === 0) continue;

        const dir = delta.multiplyScalar(1 / dist);
        const correction = dist - maxLength;

        if (!a.pinned && !b.pinned) {
            a.position.addScaledVector(dir, correction * 0.5);
            b.position.addScaledVector(dir, -correction * 0.5);
        } else if (a.pinned && !b.pinned) {
            b.position.addScaledVector(dir, -correction);
        } else if (!a.pinned && b.pinned) {
            a.position.addScaledVector(dir, correction);
        }
    }
};

export const stepSpringSystem = (system: SpringSystem, dtSeconds: number, opts?: Partial<SpringStepOptions>): void => {
    const options: SpringStepOptions = { ...DEFAULT_STEP_OPTIONS, ...opts };
    resetForces(system);
    accumulateSpringForces(system, options);
    applyExternalForces(system, options);
    integrate(system, dtSeconds, options);
    enforceMaxStretchConstraints(system, options);
    enforceBoundaryZOrder(system, options);
}