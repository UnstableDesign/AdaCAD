const { initDraftWithParams, warps, wefts } = require('../../src/draft/index.ts');
const { Sequence, TwoD } = require('../../src/sequence/index.ts');
const { motif_map } = require('../../src/operations/motif_map/motif_map.ts');
const { printDrawdown } = require('../../src/utils/index.ts');

const call = require('../../src/operations/operations.ts').call;

test('testing motif_map default', async () => {



    const xspacing = 1;
    const yspacing = 1;
    const map = new Sequence.TwoD([
        [1, 0, 0, 0, 0],
        [0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1]
    ]);

    const map_draft = initDraftWithParams({ drawdown: map.export() });
    const op_input = {
        drafts: [map_draft],
        inlet_params: [false],
        inlet_id: 0
    }



    const res = await call(motif_map, [xspacing, yspacing], [op_input]);
    printDrawdown(res[0].draft.drawdown);

    const res_warps = warps(res[0].draft.drawdown);
    const motif_warps = 2;
    const map_warps = warps(map_draft.drawdown);
    expect(res_warps).toEqual((map_warps * xspacing) + (motif_warps - 1));


});

