
import { call } from '../../src/operations';
import { satin } from '../../src/operations';
import { createMaterial } from '../../src/material';
import { getDraftTopology, getNodeType, getMvZ } from '../../src/simulation/simulation';
import { parseStringToDrawdown, filterToUniqueValues } from '../../src/utils/utils';
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
    radius: 5
}

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

    const wefts = 8;
    const warps = 8;
    //get weft floats; 
    let floats = [];

    for (let i = 0; i < wefts; i++) {
        floats = floats.concat(getRowAsFloats(i, warps, cns).filter(float => !float.face));
    }

    for (let j = 0; j < warps; j++) {
        floats = floats.concat(getColAsFloats(j, wefts, warps, cns).filter(float => float.face));
    }

    const floats_with_id = floats.map((el, ndx) => { return { id: ndx, float: el, touched: false } });


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


    //get weft floats; 
    let floats = [];

    for (let i = 0; i < wefts; i++) {
        floats = floats.concat(getRowAsFloats(i, warps, cns).filter(float => !float.face));
    }

    for (let j = 0; j < warps; j++) {
        floats = floats.concat(getColAsFloats(j, wefts, warps, cns).filter(float => float.face));
    }


    floats = floats.filter(el => getMvZ(el.left, warps, cns) == 0);

    const floats_with_id = floats.map((el, ndx) => { return { id: ndx, float: el, touched: false } });
    // const lifted_floats = getFloatsAffectedByLifting(0, 8, 8, cns);

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
    cns = isolateLayers(8, 8, 1, cns, sim);

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            expect(getMvZ({ i, j, id: 0 }, 8, cns)).toBe(1);
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
    cns = isolateLayers(8, 8, 1, cns, sim);

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            expect(getMvZ({ i, j, id: 0 }, 8, cns)).not.toBe(0);
            expect(getMvZ({ i, j, id: 0 }, 8, cns)).not.toBeGreaterThan(3);
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
    cns = isolateLayers(12, 12, 1, cns, sim);

    for (let i = 0; i < 12; i++) {
        for (let j = 0; j < 12; j++) {
            expect(getMvZ({ i, j, id: 0 }, 12, cns)).not.toBe(0);
            expect(getMvZ({ i, j, id: 0 }, 12, cns)).not.toBeGreaterThan(2);
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
    cns = isolateLayers(8, 8, 1, cns, sim);

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            expect(getMvZ({ i, j, id: 0 }, 8, cns)).not.toBe(0);
            expect(getMvZ({ i, j, id: 0 }, 8, cns)).not.toBeGreaterThan(2);
        }
    }


});



const parseDrawdown = require('../../src/simulation/simulation').parseDrawdown;
test('test simulation parse drawdown', async () => {




    const waffle_draft = initDraftFromDrawdown(waffle_dd);
    const cns = await initContactNeighborhoods(waffle_dd);
    // const parsed_cns = await parseDrawdown(waffle_draft, cns, sim)


});






test('testing getDraftTopology', async () => {

    // const simVars = {
    //     pack: 10,
    //     lift_limit: 10,
    //     use_layers: false,
    //     warp_spacing: 5,
    //     layer_spacing: 5,
    //     wefts_as_written: false,
    //     simulate: false,
    //     radius: 5
    // }

    // const waffle_draft = initDraftFromDrawdown(waffle_dd)
    // const topo = await getDraftTopology(waffle_draft, simVars);
    // //expect(topo).not.toEqual([]);
});




const followTheWefts = require('../../src/simulation/simulation').followTheWefts;
test('testing compute simdata', async () => {

    const material_a = createMaterial({ id: 0 })
    const material_b = createMaterial({ id: 1 })

    const simVars = {
        pack: 10,
        lift_limit: 10,
        use_layers: false,
        warp_spacing: 5,
        layer_spacing: 5,
        wefts_as_written: false,
        simulate: false,
        radius: 5,
        ms: [material_a, material_b]
    }

    const draft_list = await call(satin, [5, 2, false]);
    const topo = await getDraftTopology(draft_list[0], simVars);
    const wefts = await followTheWefts(draft_list[0], topo, simVars)
    expect(wefts.vtxs).not.toEqual([])

})


