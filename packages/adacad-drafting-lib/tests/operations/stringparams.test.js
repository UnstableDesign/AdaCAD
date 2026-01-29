const { sample_width } = require('../../src/operations/sample_width/sample_width.ts');
import { initDraftWithParams } from '../../src/draft/draft.ts';
import { call } from '../../src/operations/operations.ts';

test('test param generation on variable width sampler', async () => {

    const draft = initDraftWithParams({ wefts: 10, warps: 10, pattern: [[true, false], [false, true]] });
    const inputs = [
        {
            drafts: [draft],
            inlet_params: ['x'],
            inlet_id: 1
        }
    ]

    const out = await call(sample_width, ['x20 y20'], inputs)
    expect(out.length).toBe(1);
    expect(out[0].draft.drawdown.length).toBe(10)





})