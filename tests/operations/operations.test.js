const { initDraftWithParams } = require('../../src/draft/index.ts');
const { Sequence, TwoD } = require('../../src/sequence/index.ts');
const { satin } = require('../../src/operations/satin/satin.ts');
const { printDrawdown } = require('../../src/utils/index.ts');

const call = require('../../src/operations/operations.ts').call;

test('testing call operation', async () => {


    const res = await call(satin, [5, 'a', false]);
    const res_comp = await call(satin, []);

    expect(res.length).toEqual(1);
    expect(res_comp.drawdown).toEqual(res.drawdown);


    const a = res[0].draft;

    const seq = new Sequence.TwoD([
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 1],
        [0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0],
        [1, 0, 0, 0, 0]
    ]);
    const b = initDraftWithParams({ drawdown: seq.export() })


    expect(a.drawdown).toEqual(b.drawdown);

});

const getOpList = require('../../src/operations/operations.ts').getOpList;

test('get op list', () => {
    const oplist = getOpList('structures');
    expect(oplist).toEqual([])

})
