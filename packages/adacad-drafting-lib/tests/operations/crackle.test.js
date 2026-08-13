const { initDraftWithParams, warps, wefts } = require('../../src/draft/index.ts');
const { Sequence, TwoD } = require('../../src/sequence/index.ts');
const { crackle } = require('../../src/operations/motif_path/motif_path.ts');
const { printDrawdown } = require('../../src/utils/index.ts');

const call = require('../../src/operations/operations.ts').call;

test('testing crackle without incidental', async () => {



    const path = new Sequence.TwoD([
        [1, 0, 0, 0, 0],
        [0, 1, 1, 0, 1],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0],
        [1, 0, 0, 0, 0]
    ]);

    const path_draft = initDraftWithParams({ drawdown: path.export() });
    const op_input = {
        drafts: [path_draft],
        inlet_params: [false],
        inlet_id: 0
    }



    const res = await call(crackle, [0], [op_input]);
    printDrawdown(res[0].draft.drawdown);

    const res_warps = warps(res[0].draft.drawdown);
    const motif_warps = 4;
    const path_warps = warps(path_draft.drawdown);
    expect(res_warps).toEqual(motif_warps * path_warps);


});


test('testing crackle with incidentals', async () => {



    const path = new Sequence.TwoD([
        [1, 0, 0, 0, 0],
        [0, 1, 0, 0, 1],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0],
        [1, 0, 0, 0, 0]
    ]);

    const path_draft = initDraftWithParams({ drawdown: path.export() });
    const op_input = {
        drafts: [path_draft],
        inlet_params: [false],
        inlet_id: 0
    }



    const res = await call(crackle, [1], [op_input]);
    printDrawdown(res[0].draft.drawdown);


});

test('testing crackle with incidentals and motif', async () => {


    const motif = new Sequence.TwoD([
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ]);

    const path = new Sequence.TwoD([
        [1, 0, 0, 0, 0],
        [0, 1, 0, 0, 1],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0],
        [1, 0, 0, 0, 0]
    ]);

    const path_draft = initDraftWithParams({ drawdown: path.export() });
    const motif_draft = initDraftWithParams({ drawdown: motif.export() });
    const path_input = {
        drafts: [path_draft],
        inlet_params: [false],
        inlet_id: 0
    }

    const motif_input = {
        drafts: [motif_draft],
        inlet_params: [false],
        inlet_id: 1
    }



    const res = await call(crackle, [1], [path_input, motif_input]);
    printDrawdown(res[0].draft.drawdown);


});
