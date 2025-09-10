
import { call } from '../../src/operations';
import { satin } from '../../src/operations';
import { createMaterial } from '../../src/material';
import { getDraftTopology } from '../../src/simulation/simulation';

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


