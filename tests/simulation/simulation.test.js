
import { createMaterial } from '../../src/material';
import { getDraftTopology, getNodeType, getLayer, getFloats } from '../../src/simulation/simulation';
import { parseStringToDrawdown, filterToUniqueValues, printDrawdown } from '../../src/utils/utils';
import { initDraftFromDrawdown, initDraftWithParams } from '../../src/draft';


//** created a series of drafts intended to test the abilities of the simulation and layer inference.  */


const defaultSimVars = {
    pack: 10,
    lift_limit: 10,
    use_layers: false,
    warp_spacing: 5,
    layer_spacing: 5,
    wefts_as_written: false,
    simulate: false,
    radius: 5,
    mass: 5,
    time: 0.003,
    use_smoothing: true,
    repulse_force_correction: 0,
}


const tabby = `
-|-|-|-|
|-|-|-|-
-|-|-|-|
|-|-|-|-
-|-|-|-|
|-|-|-|-
-|-|-|-|
|-|-|-|-
` ;

const waffle = `---|----
--|-|---
-|-|-|--
|-|||-|-
-|||||-|
|-|||-|-
-|-|-|--
--|-|---
` ;

const basket = `
|---|---
|---|---
|---|---
-|||-|||
|---|---
|---|---
|---|---
-|||-|||
`;

const satin_drawdown = `
-----|--
--|-----
-------|
----|---
-|------
------|-
---|----
|-------
`;

const two_side_twill = `-|---|--
|-|||-||
--|---|-
||-|||-|
---|---|
||||---|
|---|---
-|||-|||
`;

const a1b2_c3_d4_tabby = `
|||||||-
|||-||--
|---|---
-|---|--
|||-||||
||--|||-
|---|---
-|---|--`;

const a1c3_b2_d4_tabby = `
-------|
|---|---
|||-|-|-
--|---|-
|||-||||
|---|---
|-|-|||-
--|---|-
`;


const a1_b2_basket = `
|||||||-|-|-
|-|-|-------
|||||||-|-|-
|-|-|-------
|||||||-|-|-
|-|-|-------
|-|-|-||||||
------|-|-|-
|-|-|-||||||
------|-|-|-
|-|-|-||||||
------|-|-|-
`;



const waffle_dd = parseStringToDrawdown(waffle);
const tabby_dd = parseStringToDrawdown(tabby);
const basket_draft = parseStringToDrawdown(basket);
const satin_draft = parseStringToDrawdown(satin_drawdown);
const two_side_twill_draft = parseStringToDrawdown(two_side_twill);
const a1b2_c3_d4_tabby_draft = parseStringToDrawdown(a1b2_c3_d4_tabby);
const a1c3_b2_d4_tabby_draft = parseStringToDrawdown(a1c3_b2_d4_tabby);
const a1_b2_basket_draft = parseStringToDrawdown(a1_b2_basket);


/**
 * TESTING FUNCTIONS RELATED TO DRAFT TOPOLOGY AND FORMATION OF INITIAL CONTACT NEIGHBORHOODS
 */

const initContactNeighborhoods = require('../../src/simulation/simulation').initContactNeighborhoods;
test('test initContactNeighborhoods', async () => {


    const cns = await initContactNeighborhoods(waffle_dd);
    expect(cns.length).toEqual(64 * 4);
    expect(cns[0].ndx.i).toEqual(0);
    expect(cns[0].ndx.j).toEqual(0);
    expect(cns[0].ndx.id).toEqual(0);
    expect(cns[cns.length - 1].ndx.i).toEqual(7)
    expect(cns[cns.length - 1].ndx.j).toEqual(7)
    expect(cns[cns.length - 1].ndx.id).toEqual(3)

});

const initWeftPaths = require('../../src/simulation/simulation').initWeftPaths;
const parseWeftPaths = require('../../src/simulation/simulation').parseWeftPaths;
test('init and parse weft paths', () => {

    const draft = initDraftWithParams({
        wefts: 12,
        warps: 12,
        drawdown: [[false]],
        rowShuttleMapping: [0, 1],
        rowSystemMapping: [0, 1, 2]
    })

    let paths = initWeftPaths(draft);
    expect(paths.length).toEqual(6);
    expect(paths[0].system).toEqual(0);
    expect(paths[0].material).toEqual(0);

    let updated = parseWeftPaths(draft, paths);
    expect(updated[0].pics).toEqual([0, 6])

    let sum = 0;
    updated.forEach(el => {
        sum += el.pics.length;
    })
    expect(sum).toEqual(12); //should total the number of wefts

});

const updateCNs = require('../../src/simulation/simulation').updateCNs;
test('test update CNS', async () => {

    const sim = defaultSimVars;
    sim.use_layers = false;
    sim.wefts_as_written = false;

    const cns = await initContactNeighborhoods(waffle_dd);
    const updated = updateCNs(cns, 8, 8, sim);

    let ndx_a = { i: 2, j: 3, id: 0 } //left
    let ndx_b = { i: 2, j: 3, id: 1 } //right
    let ndx_c = { i: 2, j: 3, id: 2 } //top
    let ndx_d = { i: 2, j: 3, id: 3 } // bottom
    let ndx_e = { i: 0, j: 0, id: 0 }

    let type_a = getNodeType(ndx_a, 8, updated);
    let type_b = getNodeType(ndx_b, 8, updated);
    let type_c = getNodeType(ndx_c, 8, updated);
    let type_d = getNodeType(ndx_d, 8, updated);
    let type_e = getNodeType(ndx_e, 8, updated);

    expect(type_a).toBe('ACN');
    expect(type_b).toBe('ACN');
    expect(type_c).toBe('ACN');
    expect(type_d).toBe('PCN');
    expect(type_e).toBe('VCN');


    sim.wefts_as_written = true;
    const cns_again = await initContactNeighborhoods(waffle_dd);
    const updated_again = updateCNs(cns_again, 8, 8, sim);

    let ndx_f = { i: 0, j: 0, id: 0 } //left
    let type_f = getNodeType(ndx_f, 8, updated_again);

    expect(type_f).toBe('PCN');

});

const getNextCellOnLayer = require('../../src/simulation/simulation').getNextCellOnLayer;
test('get next cell on layer', async () => {

    //eveything should be on 0 at this point
    const cns = await initContactNeighborhoods(waffle_dd);
    const above = getNextCellOnLayer(0, 0, 8, 8, 0, 'above', cns);
    const left = getNextCellOnLayer(0, 0, 8, 8, 0, 'left', cns);
    const right = getNextCellOnLayer(0, 0, 8, 8, 0, 'right', cns);
    const below = getNextCellOnLayer(0, 0, 8, 8, 0, 'below', cns);
    const special = getNextCellOnLayer(2, 3, 8, 8, 0, 'above', cns);
    const special_b = getNextCellOnLayer(2, 3, 8, 8, 0, 'left', cns);

    expect(above.i).toEqual(7)
    expect(above.j).toEqual(0)

    expect(left.i).toEqual(0)
    expect(left.j).toEqual(7)

    expect(right.i).toEqual(0)
    expect(right.j).toEqual(1)

    expect(below.i).toEqual(1)
    expect(below.j).toEqual(0)

    expect(special.i).toEqual(1);
    expect(special.j).toEqual(3);

    expect(special_b.i).toEqual(2);
    expect(special_b.j).toEqual(2);
});

const classifyNodeTypeBasedOnFaces = require('../../src/simulation/simulation').classifyNodeTypeBasedOnFaces;
test('classify node type based of faces ', async () => {

    const cns = await initContactNeighborhoods(waffle_dd);

    const ndx_a = { i: 0, j: 0, id: 0 }
    const ndx_b = { i: 0, j: 1, id: 0 }
    const ndx_c = { i: 0, j: 2, id: 0 }
    const ndx_d = { i: 0, j: 3, id: 0 }
    const ndx_e = { i: 0, j: 4, id: 0 }

    const updated_a = classifyNodeTypeBasedOnFaces(false, false, ndx_a, 8, cns);
    const updated_b = classifyNodeTypeBasedOnFaces(false, true, ndx_b, 8, cns);
    const updated_c = classifyNodeTypeBasedOnFaces(true, false, ndx_c, 8, cns);
    const updated_d = classifyNodeTypeBasedOnFaces(null, false, ndx_d, 8, cns);
    const updated_e = classifyNodeTypeBasedOnFaces(false, null, ndx_e, 8, cns);

    const type_a = getNodeType(ndx_a, 8, updated_a);
    expect(type_a).toBe('PCN');

    const type_b = getNodeType(ndx_b, 8, updated_b);
    expect(type_b).toBe('ACN');

    const type_c = getNodeType(ndx_c, 8, updated_c);
    expect(type_c).toBe('ACN');

    const type_d = getNodeType(ndx_d, 8, updated_d);
    expect(type_d).toBe('ECN');

    const type_e = getNodeType(ndx_e, 8, updated_e);
    expect(type_e).toBe('ACN');

});


const pullRows = require('../../src/simulation/simulation').pullRows;
test('testing pull row ', async () => {

    let sim = defaultSimVars;
    sim.wefts_as_written = true;

    let draft = initDraftFromDrawdown(waffle_dd);
    let cns = await initContactNeighborhoods(waffle_dd);
    let paths = initWeftPaths(draft);
    paths = parseWeftPaths(draft, paths);
    cns = updateCNs(cns, 8, 8, sim);
    cns = pullRows(draft, paths, cns);

    // expected outcome (e signifies locations of ECN's)
    // 7 ee|-|-ee  r t l
    // ---- 
    // 0 ee-|-eee  l t r (left edge e's are based on wrapping - comparing with 7)
    // 1 e-|-|eee  r t l
    // 2 e|-|-|-e  l t r
    // 3 |-|||-|e  r t l
    // 4 -|||||-|  l t r
    // 5 |-|||-|-  r t l
    // 6 -|-|-|ee  l t r
    // 7 ee|-|-ee  r t l
    // ----
    // 0 ee-|----  (wrapping l t r)

    expect(getNodeType({ i: 0, j: 0, id: 0 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 0, j: 0, id: 1 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 0, j: 1, id: 0 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 0, j: 1, id: 1 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 0, j: 2, id: 0 }, 8, cns)).toBe('ACN');
    expect(getNodeType({ i: 0, j: 2, id: 1 }, 8, cns)).toBe('ACN');
    expect(getNodeType({ i: 0, j: 3, id: 0 }, 8, cns)).toBe('ACN');
    expect(getNodeType({ i: 0, j: 3, id: 1 }, 8, cns)).toBe('ACN');
    expect(getNodeType({ i: 0, j: 4, id: 0 }, 8, cns)).toBe('ACN');
    expect(getNodeType({ i: 0, j: 4, id: 1 }, 8, cns)).toBe('ACN');
    expect(getNodeType({ i: 0, j: 5, id: 0 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 0, j: 5, id: 1 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 0, j: 6, id: 0 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 0, j: 6, id: 1 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 0, j: 7, id: 0 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 0, j: 7, id: 1 }, 8, cns)).toBe('ECN');

    // row 1
    expect(getNodeType({ i: 1, j: 0, id: 0 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 1, j: 0, id: 1 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 1, j: 1, id: 0 }, 8, cns)).toBe('ACN');
    expect(getNodeType({ i: 1, j: 1, id: 1 }, 8, cns)).toBe('ACN');
    expect(getNodeType({ i: 1, j: 2, id: 0 }, 8, cns)).toBe('ACN');
    expect(getNodeType({ i: 1, j: 2, id: 1 }, 8, cns)).toBe('ACN');
    expect(getNodeType({ i: 1, j: 3, id: 0 }, 8, cns)).toBe('ACN');
    expect(getNodeType({ i: 1, j: 3, id: 1 }, 8, cns)).toBe('ACN');
    expect(getNodeType({ i: 1, j: 4, id: 0 }, 8, cns)).toBe('ACN');
    expect(getNodeType({ i: 1, j: 4, id: 1 }, 8, cns)).toBe('ACN');
    expect(getNodeType({ i: 1, j: 5, id: 0 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 1, j: 5, id: 1 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 1, j: 6, id: 0 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 1, j: 6, id: 1 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 1, j: 7, id: 0 }, 8, cns)).toBe('ECN');
    expect(getNodeType({ i: 1, j: 7, id: 1 }, 8, cns)).toBe('ECN');






});



// WORKING TOWARDS ISOLATE LAYERS
const getRowAsFloats = require('../../src/simulation/simulation').getRowAsFloats;
test('get row as floats', async () => {
    let sim = defaultSimVars;
    sim.use_layers = true;
    let cns = await initContactNeighborhoods(waffle_dd);
    let draft = initDraftFromDrawdown(waffle_dd);

    let paths = initWeftPaths(draft);

    paths = parseWeftPaths(draft, paths);
    cns = updateCNs(cns, 8, 8, sim);


    const row_zero = getRowAsFloats(0, 8, cns);
    const row_one = getRowAsFloats(1, 8, cns);

    expect(row_zero.length).toBe(2);
    expect(row_one.length).toBe(4);

    cns = pullRows(draft, paths, cns);
    const pulled_row_zero = getRowAsFloats(0, 8, cns);

    expect(pulled_row_zero.length).toBe(3);


})


const getUntouchedFloatsInRange = require('../../src/simulation/simulation').getUntouchedFloatsInRange;
test('get untouched floats in range', async () => {
    let sim = defaultSimVars;
    sim.use_layers = true;
    sim.lift_limit = 1;
    let cns = await initContactNeighborhoods(waffle_dd);
    cns = updateCNs(cns, 8, 8, sim);

    //get weft floats; 
    let floats = getFloats(8, 8, cns);
    const floats_with_id = floats.map((el, ndx) => { return { id: ndx, float: el, touched: false } });

    printDrawdown(waffle_dd);

    let in_range = getUntouchedFloatsInRange({ l: 0, r: 0 }, { l: 0, r: 0 }, floats_with_id, 8, 8, cns);
    expect(in_range.length).toBe(1);

    let in_range_b = getUntouchedFloatsInRange({ l: 1, r: 7 }, { l: 3, r: 3 }, floats_with_id, 8, 8, cns);
    in_range_b = filterToUniqueValues(in_range_b);
    expect(in_range_b.length).toBe(3);


    let in_range_c = getUntouchedFloatsInRange({ l: 1, r: 1 }, { l: 6, r: 2 }, floats_with_id, 8, 8, cns);
    in_range_c = filterToUniqueValues(in_range_c);
    expect(in_range_c.length).toBe(2);

});


const getFloatsAffectedByLifting = require('../../src/simulation/simulation').getFloatsAffectedByLifting;
const printFloats = require('../../src/simulation/simulation').printFloats;
test('get floats affected by lifting', async () => {
    let sim = defaultSimVars;
    sim.use_layers = true;
    sim.lift_limit = 1;
    const wefts = 8;
    const warps = 8;
    let cns = await initContactNeighborhoods(waffle_dd);
    cns = updateCNs(cns, 8, 8, sim);
    let floats = getFloats(8, 8, cns);
    floats = floats.filter(el => getLayer(el.left, warps, cns) == 0);

    const floats_with_id = floats.map((el, ndx) => { return { id: ndx, float: el, touched: false } });

    //get Float 28, which should be the longest
    let float_28 = floats_with_id.find(el => el.id == 28);
    if (float_28) {
        const lifted_floats = getFloatsAffectedByLifting(float_28.id, floats_with_id, wefts, warps, sim.lift_limit, cns);
        expect(lifted_floats.length).toBe(2);

        //test case where the float + limit is larger than the draft. 
        const lifted_floats_b = getFloatsAffectedByLifting(float_28.id, floats_with_id, wefts, warps, 3, cns);
        expect(lifted_floats_b.length).toBe(3);
    }

    //test a weft float
    let float_5 = floats_with_id.find(el => el.id == 5);
    if (float_5) {
        const lifted_floats = getFloatsAffectedByLifting(float_5.id, floats_with_id, wefts, warps, sim.lift_limit, cns);
        expect(lifted_floats.length).toBe(2);
    }

    //test a weft float that wraps and touches the same warp on either sice
    let float_0 = floats_with_id.find(el => el.id == 0);
    if (float_0) {
        const lifted_floats = getFloatsAffectedByLifting(float_0.id, floats_with_id, wefts, warps, 1, cns);
        expect(lifted_floats.length).toBe(1);

    }


});

const getColAsFloats = require('../../src/simulation/simulation').getColAsFloats;
test('get col as floats', async () => {
    let sim = defaultSimVars;
    sim.use_layers = true;

    let cns = await initContactNeighborhoods(waffle_dd);
    cns = updateCNs(cns, 8, 8, sim);

    const col_zero = getColAsFloats(0, 8, 8, cns);
    const col_one = getColAsFloats(1, 8, 8, cns);

    expect(col_zero.length).toBe(4);
    expect(col_one.length).toBe(6);


});

const isolateLayers = require('../../src/simulation/simulation').isolateLayers;
test('isolate layers, single layer structure', async () => {


    let sim = defaultSimVars;
    sim.use_layers = true;
    sim.lift_limit = 1;

    //TEST ON A SINGLE LAYER STRUCTURE
    let cns = await initContactNeighborhoods(waffle_dd);
    cns = updateCNs(cns, 8, 8, sim);
    const floats = getFloats(8, 8, cns);
    cns = isolateLayers(8, 8, floats, 1, cns, sim);

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            expect(getLayer({ i, j, id: 0 }, 8, cns)).toBe(1);
        }
    }





});


test('isolate layers, three layer tabby', async () => {


    let sim = defaultSimVars;
    sim.use_layers = true;
    sim.lift_limit = 1;

    //TEST ON A SINGLE LAYER STRUCTURE
    let cns = await initContactNeighborhoods(a1b2_c3_d4_tabby_draft);
    cns = updateCNs(cns, 8, 8, sim);
    const floats = getFloats(8, 8, cns);
    cns = isolateLayers(8, 8, floats, 1, cns, sim);

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            expect(getLayer({ i, j, id: 0 }, 8, cns)).not.toBe(0);
            expect(getLayer({ i, j, id: 0 }, 8, cns)).not.toBeGreaterThan(3);
        }
    }


});


test('isolate layers, double basket', async () => {


    let sim = defaultSimVars;
    sim.use_layers = true;
    sim.lift_limit = 3;


    //TEST ON A SINGLE LAYER STRUCTURE
    let cns = await initContactNeighborhoods(a1_b2_basket_draft);
    cns = updateCNs(cns, 12, 12, sim);
    const floats = getFloats(12, 12, cns);
    cns = isolateLayers(12, 12, floats, 1, cns, sim);

    for (let i = 0; i < 12; i++) {
        for (let j = 0; j < 12; j++) {
            expect(getLayer({ i, j, id: 0 }, 12, cns)).not.toBe(0);
            expect(getLayer({ i, j, id: 0 }, 12, cns)).not.toBeGreaterThan(2);
        }
    }


});



test('isolate layers, two face twill', async () => {


    let sim = defaultSimVars;
    sim.use_layers = true;
    sim.lift_limit = 1;

    //TEST ON A SINGLE LAYER STRUCTURE
    let cns = await initContactNeighborhoods(two_side_twill_draft);
    cns = updateCNs(cns, 8, 8, sim);
    const floats = getFloats(8, 8, cns);
    cns = isolateLayers(8, 8, floats, 1, cns, sim);

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            expect(getLayer({ i, j, id: 0 }, 8, cns)).not.toBe(0);
            expect(getLayer({ i, j, id: 0 }, 8, cns)).not.toBeGreaterThan(2);
        }
    }


});


const setFloatBlocking = require('../../src/simulation/simulation').setFloatBlocking;
test('set float blocking', async () => {

    //   [-  -  -]  x [ - - - -]    id: 0 (4,10)
    //   [-  - ] X [-] X [- - -]    id: 1 (3,3),  2 (5,9)
    //   [-] X [-] X [-] X [- -]    id: 3 (2,2), 4 (4, 4), 5 (6,8)
    //   X  [-] X  X  X [-] X [-]   id: 6 (1, 1), 7 (5, 5), 8 (7, 7)
    //   [-] X  X  X  X  X [-] X    id: 9 (0,0), 10 (6,6)
    //   X [-]  X  X  X [-] X [-]   id: 11 (1,1) 12 (5,5), 13 (7, 7)
    //  [-]  X [-] X [-] X [- -]    id: 14 (2,2), 15 (4, 4), 16 (6,8)
    //   [-  - ] X [-] X [- - -]    id: 17 (3,3), 18 (5,9)

    let sim = defaultSimVars;
    sim.use_layers = true;
    sim.lift_limit = 1;
    let cns = await initContactNeighborhoods(waffle_dd);
    cns = updateCNs(cns, 8, 8, sim);

    let floats = getFloats(8, 8, cns);
    //something recursive is happening in here that we need to fix! 
    floats = setFloatBlocking(8, 8, floats, cns);


    //row 0 - 4-10, slides over everything
    //TO DO: we need to consider if/how this would stack. Would it block on the row below it. It should block on 17
    //maybe we need to invert and do the same? 
    expect(floats[0].id).toBe(0);
    expect(floats[0].blocking).toStrictEqual([17])

    //row 1 - single cell at 3, blocks with float 0
    expect(floats[1].id).toBe(1);
    expect(floats[1].blocking).toStrictEqual([0])

    //row 1 - 5-9, slides under 0 and stacks/blocks on 7
    expect(floats[2].id).toBe(2);
    expect(floats[2].blocking).toStrictEqual([15, 14])

    //row 1 - 2-2 blocks on both floats 1 and 2
    expect(floats[3].id).toBe(3);
    expect(floats[3].blocking).toContain(1)
    expect(floats[3].blocking).toContain(2)



});


const getAttachedFloats = require('../../src/simulation/simulation').getAttachedFloats;
test('get attached floats', async () => {
    let sim = defaultSimVars;
    sim.use_layers = true;
    sim.lift_limit = 1;
    let cns = await initContactNeighborhoods(waffle_dd);
    cns = updateCNs(cns, 8, 8, sim);
    let floats = getFloats(8, 8, cns);

    let float_a = getWeftFloat(0, 0, 8, 8, floats);
    let attached = getAttachedFloats(6, float_a, 8, floats)
    expect(attached.length).toBe(3);

    let float_b = getWeftFloat(1, 3, 8, 8, floats);
    let attached_b = getAttachedFloats(0, float_b, 8, floats)
    expect(attached_b.length).toBe(0);

    let float_c = getWeftFloat(1, 5, 8, 8, floats);
    let attached_c = getAttachedFloats(0, float_c, 8, floats)
    expect(attached_c.length).toBe(1);



})


const getWeftFloat = require('../../src/simulation/simulation').getWeftFloat;
test('get weft float', async () => {
    let sim = defaultSimVars;
    sim.use_layers = true;
    sim.lift_limit = 1;
    let cns = await initContactNeighborhoods(waffle_dd);
    cns = updateCNs(cns, 8, 8, sim);
    let floats = getFloats(8, 8, cns);

    let float_a = getWeftFloat(0, 0, 8, 8, floats);
    expect(float_a.left.i).toBe(0);
    expect(float_a.left.j).toBe(4);

    let float_b = getWeftFloat(-1, -1, 8, 8, floats);
    expect(float_b.left.i).toBe(7);
    expect(float_b.left.j).toBe(5);


})

const getFloatRelationships = require('../../src/simulation/simulation').getFloatRelationships;
test('get float relationships', async () => {
    let sim = defaultSimVars;
    sim.use_layers = true;
    sim.lift_limit = 1;
    let cns = await initContactNeighborhoods(waffle_dd);
    cns = updateCNs(cns, 8, 8, sim);

    let floats = getFloats(8, 8, cns);
    let float = getWeftFloat(0, 0, 8, 8, floats);
    let reltns_a = getFloatRelationships(7, float, 8, 8, floats, cns);
    let reltns_a_kinds = reltns_a.map(el => el.kind);
    expect(reltns_a_kinds).toContain('BUILD')


    let float_b = getWeftFloat(3, 1, 8, 8, floats);
    let reltns_b = getFloatRelationships(2, float_b, 8, 8, floats, cns);
    let reltns_b_kinds = reltns_b.map(el => el.kind);
    expect(reltns_b_kinds).toContain('BUILD')

    let float_c = getWeftFloat(5, 5, 8, 8, floats);
    let reltns_c = getFloatRelationships(4, float_c, 8, 8, floats, cns);
    let reltns_c_kinds = reltns_c.map(el => el.kind);
    expect(reltns_c_kinds).toContain('BUILD')


});

const calcX = require('../../src/simulation/simulation').calcX;
test('calc x', async () => {

    const x = calcX(0, 10, 2, 2, true);
    const y = calcX(2, 10, 2, 2, false);

    expect(x).toBe(-2)
    expect(y).toBe(22);

})

const computeThetaMax = require('../../src/simulation/simulation').computeThetaMax;
test('compute theta max', async () => {
    const theta_max = computeThetaMax(1);
    expect(theta_max).toBe(Math.PI / 4);

    const theta_max_b = computeThetaMax(0);
    expect(theta_max_b).toBe(Math.PI / 24);

});

const computeThetaBetweenVertices = require('../../src/simulation/simulation').computeThetaBetweenVertices;
test('compute theta between vertices', async () => {
    const theta = computeThetaBetweenVertices({ vtx: { x: 0, y: 0 } }, { vtx: { x: 1, y: 1 } });
    expect(theta).toBe(Math.PI / 4);

    const theta_b = computeThetaBetweenVertices({ vtx: { x: 0, y: 0 } }, { vtx: { x: 1, y: -1 } });
    expect(theta_b).toBe(-Math.PI / 4);
})


const computeYAdjustment = require('../../src/simulation/simulation').computeYAdjustment;
test('compute y adjustment', async () => {
    const y_adjustment = computeYAdjustment({ vtx: { x: 0, y: 0 } }, { vtx: { x: 1, y: 1 } }, Math.PI / 8);
    expect(y_adjustment).toBe(Math.tan(Math.PI / 8));

    const y_adjustment_b = computeYAdjustment({ vtx: { x: 0, y: 0 } }, { vtx: { x: 1, y: -1 } }, Math.PI / 8);
    expect(y_adjustment_b).toBe(Math.tan(Math.PI / 8) * 1);
})


const followTheWefts = require('../../src/simulation/simulation').followTheWefts;
test('testing follow the wefts with waffle', async () => {

    const material_a = createMaterial({ id: 0 })
    material_a.diameter = 2;
    const material_b = createMaterial({ id: 1 })
    material_b.diameter = 2;

    const simVars = {
        pack: 1,
        lift_limit: 10,
        use_layers: true,
        warp_spacing: 10,
        layer_spacing: 5,
        wefts_as_written: false,
        simulate: false,
        ms: [material_a, material_b],
        use_smoothing: true,
        repulse_force_correction: 0,
        time: 0.003
    }

    const draft = initDraftFromDrawdown(waffle_dd);

    const topo = await getDraftTopology(draft, simVars);

    const vtxs = await followTheWefts(draft, topo.floats, topo.cns, simVars);


    // vtxs.forEach(el => {
    //     console.log("WEFT PATH: ", el.material, el.system, el.vtxs);
    // });

    expect(vtxs[0].vtxs).not.toEqual([])

})



test('testing follow the wefts with tabby', async () => {

    const material_a = createMaterial({ id: 0 })
    material_a.diameter = 2;
    const material_b = createMaterial({ id: 1 })
    material_b.diameter = 2;

    const simVars = {
        pack: 1,
        lift_limit: 10,
        use_layers: true,
        warp_spacing: 10,
        layer_spacing: 5,
        wefts_as_written: false,
        simulate: false,
        radius: 5,
        time: 0.003,
        mass: 5,
        ms: [material_a, material_b]
    }

    const draft = initDraftFromDrawdown(tabby_dd);

    const topo = await getDraftTopology(draft, simVars);


    // const adj_floats = topo.floats.map(el => { return { id: el.id, float: el, touched: false } });
    // printFloats(adj_floats);

    const vtxs = await followTheWefts(draft, topo.floats, topo.cns, simVars);
    let path = vtxs[0];

    expect(path.vtxs.length).toBe(72);

    let second_row = path.vtxs.filter(el => el.ndx.i == 1);
    // let first_vtx = second_row[0].vtx;
    // let second_vtx = second_row[1].vtx;
    // let third_vtx = second_row[2].vtx;
    // let fourth_vtx = second_row[3].vtx;

    // expect(third_vtx.y).toBe(second_vtx.y);


    second_row.forEach(el => {
        console.log("Second row is: ", el.ndx.j, el.vtx);
    });


})



